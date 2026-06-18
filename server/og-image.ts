/**
 * Dynamic OG Image Generator with S3 Cache
 * 
 * Generates a 1200x630 Open Graph image for /menu/:slug pages.
 * Design: cover as full background + dark gradient bottom + circular logo + 
 *         restaurant name + location + rating + CTA "Peça online agora!"
 * 
 * Cache strategy:
 * - Images are cached in S3 under og-cache/{slug}-{hash}.jpg
 * - Hash is computed from visual data (name, coverImage, logo, city, state, rating, services)
 * - On hit: redirect to CDN URL (fast, no processing)
 * - On miss: generate image, upload to S3, return image + save URL
 * - Invalidation: call invalidateOGCache(slug) when restaurant updates visual fields
 */

import type { Express, Request, Response } from "express";
import sharp from "sharp";
import crypto from "crypto";
import { getEstablishmentBySlug } from "./db";
import { storagePut } from "./storage";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { logger } from "./_core/logger";

// ─── Constants ──────────────────────────────────────────────────────────────

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const CACHE_DURATION = 60 * 60 * 24 * 7; // 7 days
const FALLBACK_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/og-fallback-restaurant-59Pg6eq6bi2fQgZCkkFtJp.png";
const OG_CACHE_PREFIX = "og-cache";

// ─── In-memory URL cache (slug → { url, hash }) ────────────────────────────

interface CacheEntry {
  url: string;
  hash: string;
  timestamp: number;
  buffer?: Buffer;
}

const memoryCache = new Map<string, CacheEntry>();

// Persistent cache file to survive server restarts
const CACHE_FILE = join(process.cwd(), ".og-cache.json");

function loadPersistentCache(): void {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
      for (const [slug, entry] of Object.entries(data as Record<string, { url: string; hash: string; timestamp: number }>)) {
        if (Date.now() - entry.timestamp < MEMORY_CACHE_TTL) {
          memoryCache.set(slug, { url: entry.url, hash: entry.hash, timestamp: entry.timestamp });
        }
      }
      logger.info(`[OG-Image] Loaded ${memoryCache.size} entries from persistent cache`);
    }
  } catch (err) {
    logger.warn("[OG-Image] Failed to load persistent cache:", err);
  }
}

function savePersistentCache(): void {
  try {
    const data: Record<string, { url: string; hash: string; timestamp: number }> = {};
    for (const [slug, entry] of memoryCache.entries()) {
      data[slug] = { url: entry.url, hash: entry.hash, timestamp: entry.timestamp };
    }
    writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    // Silent fail - not critical
  }
}

// Load cache on module init
loadPersistentCache();
const MEMORY_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + "\u2026";
}

function buildServiceBadges(est: {
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
}): string[] {
  const types: string[] = [];
  if (est.allowsDelivery) types.push("Delivery");
  if (est.allowsPickup) types.push("Retirada");
  if (est.allowsDineIn) types.push("Consumo no local");
  return types.length > 0 ? types : ["Delivery"];
}

/**
 * Compute a hash of the visual data that affects the OG image.
 * Version bump (v:3) forces cache invalidation after redesign.
 */
function computeVisualHash(est: {
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  state: string | null;
  rating: string | null;
  reviewCount: number;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
}): string {
  const data = JSON.stringify({
    n: est.name,
    l: est.logo || "",
    c: est.coverImage || "",
    ci: est.city || "",
    st: est.state || "",
    r: est.rating || "",
    rc: est.reviewCount,
    d: est.allowsDelivery,
    p: est.allowsPickup,
    di: est.allowsDineIn,
    tmin: est.deliveryTimeMin,
    tmax: est.deliveryTimeMax,
    v: 3, // bump to invalidate old cached images
  });
  return crypto.createHash("md5").update(data).digest("hex").substring(0, 12);
}

function getCacheKey(slug: string, hash: string): string {
  return `${OG_CACHE_PREFIX}/${slug}-${hash}.jpg`;
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error("[OG-Image] Failed to fetch image:", url);
    return null;
  }
}

async function processCoverImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "center" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Process logo into a circular image with transparent background.
 */
async function processLogoCircular(buffer: Buffer, size: number): Promise<Buffer> {
  const resized = await sharp(buffer)
    .resize(size, size, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
  );

  return sharp(resized)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

// ─── S3 Cache Operations ────────────────────────────────────────────────────

function getFromMemoryCache(slug: string, hash: string): string | null {
  const entry = memoryCache.get(slug);
  if (!entry) return null;
  if (entry.hash !== hash) {
    memoryCache.delete(slug);
    return null;
  }
  if (Date.now() - entry.timestamp > MEMORY_CACHE_TTL) {
    memoryCache.delete(slug);
    return null;
  }
  return entry.url;
}

async function uploadToS3Cache(slug: string, hash: string, imageBuffer: Buffer): Promise<string> {
  const cacheKey = getCacheKey(slug, hash);
  try {
    const { url } = await storagePut(cacheKey, imageBuffer, "image/jpeg");
    memoryCache.set(slug, { url, hash, timestamp: Date.now(), buffer: imageBuffer });
    savePersistentCache();
    logger.info(`[OG-Image] Cached to S3: ${cacheKey} \u2192 ${url}`);
    return url;
  } catch (error) {
    logger.error("[OG-Image] Failed to upload to S3:", error);
    return "";
  }
}

export function invalidateOGCache(slug: string): void {
  const deleted = memoryCache.delete(slug);
  if (deleted) {
    logger.info(`[OG-Image] Memory cache invalidated for slug: ${slug}`);
  }
}

export function getOGImageUrl(slug: string, baseUrl: string): string {
  const entry = memoryCache.get(slug);
  if (entry && (Date.now() - entry.timestamp < MEMORY_CACHE_TTL) && entry.url) {
    return entry.url;
  }
  // Always return the direct endpoint URL - it will serve the image directly (no redirect)
  return `${baseUrl}/api/og-image/${slug}`;
}

// ─── SVG Overlay (Premium Design with Cover) ───────────────────────────────

function generateOverlaySVG(params: {
  name: string;
  location: string;
  services: string[];
  rating: string | null;
  reviewCount: number;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  hasLogo: boolean;
}): string {
  const { name, location, rating, reviewCount, hasLogo } = params;

  const displayName = escapeXml(truncate(name, 35));
  const displayLocation = location ? escapeXml(truncate(location, 50)) : "";

  // Rating: "★ 4.7 • 287 avaliações"
  let ratingText = "";
  if (rating && parseFloat(rating) > 0 && reviewCount > 0) {
    const ratingNum = parseFloat(rating).toFixed(1);
    const reviewWord = reviewCount === 1 ? "avalia\u00e7\u00e3o" : "avalia\u00e7\u00f5es";
    ratingText = `\u2605 ${ratingNum} \u2022 ${reviewCount} ${reviewWord}`;
  }

  // Layout positions
  const logoSize = 130;
  const logoX = 50;
  const logoY = 330;
  const textX = hasLogo ? logoX + logoSize + 25 : 60;
  const nameY = 420;
  const locationY = nameY + 40;
  const ratingY = displayLocation ? locationY + 35 : nameY + 40;

  // CTA bar
  const ctaBarHeight = 55;
  const ctaBarY = OG_HEIGHT - ctaBarHeight;

  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="darkOverlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="35%" stop-color="rgba(0,0,0,0.05)" />
      <stop offset="55%" stop-color="rgba(0,0,0,0.35)" />
      <stop offset="75%" stop-color="rgba(0,0,0,0.7)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.92)" />
    </linearGradient>
    <linearGradient id="ctaBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(30,30,30,0.9)" />
      <stop offset="100%" stop-color="rgba(40,40,40,0.85)" />
    </linearGradient>
    <filter id="textShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.6)" />
    </filter>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.4)" />
    </filter>
    ${hasLogo ? `<clipPath id="logoCircle"><circle cx="${logoX + logoSize / 2}" cy="${logoY + logoSize / 2}" r="${logoSize / 2}" /></clipPath>` : ""}
  </defs>

  <!-- Dark gradient overlay -->
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#darkOverlay)" />

  <!-- Logo white border ring -->
  ${hasLogo ? `<circle cx="${logoX + logoSize / 2}" cy="${logoY + logoSize / 2}" r="${logoSize / 2 + 5}" fill="white" opacity="0.95" filter="url(#softShadow)" />` : ""}

  <!-- Restaurant name -->
  <text x="${textX}" y="${nameY}" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="bold" fill="white" filter="url(#textShadow)">${displayName}</text>

  <!-- Location -->
  ${displayLocation ? `<text x="${textX}" y="${locationY}" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="rgba(255,255,255,0.85)" filter="url(#textShadow)">${displayLocation}</text>` : ""}

  <!-- Rating -->
  ${ratingText ? `<text x="${textX}" y="${ratingY}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#fbbf24" filter="url(#textShadow)">${escapeXml(ratingText)}</text>` : ""}

  <!-- CTA bar at bottom -->
  <rect x="0" y="${ctaBarY}" width="${OG_WIDTH}" height="${ctaBarHeight}" fill="url(#ctaBar)" />
  <rect x="0" y="${ctaBarY}" width="${OG_WIDTH}" height="3" fill="#dc2626" />

  <!-- CTA icon + text -->
  <circle cx="${OG_WIDTH / 2 - 140}" cy="${ctaBarY + 28}" r="14" fill="#dc2626" />
  <text x="${OG_WIDTH / 2 - 140}" y="${ctaBarY + 34}" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="bold">!</text>
  <text x="${OG_WIDTH / 2}" y="${ctaBarY + 36}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">Pe\u00e7a online agora!</text>

  <!-- Branding -->
  <text x="${OG_WIDTH - 30}" y="35" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="end">mindi.com.br</text>
</svg>`;
}

// ─── No-Cover SVG (full design without background image) ────────────────────

function generateNoCoverSVG(params: {
  name: string;
  location: string;
  services: string[];
  rating: string | null;
  reviewCount: number;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
}): string {
  const { name, location, rating, reviewCount } = params;

  const displayName = escapeXml(truncate(name, 30));
  const displayLocation = location ? escapeXml(truncate(location, 50)) : "";

  let ratingText = "";
  if (rating && parseFloat(rating) > 0 && reviewCount > 0) {
    const ratingNum = parseFloat(rating).toFixed(1);
    const reviewWord = reviewCount === 1 ? "avalia\u00e7\u00e3o" : "avalia\u00e7\u00f5es";
    ratingText = `\u2605 ${ratingNum} \u2022 ${reviewCount} ${reviewWord}`;
  }

  const ctaBarHeight = 55;
  const ctaBarY = OG_HEIGHT - ctaBarHeight;

  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e" />
      <stop offset="50%" stop-color="#16213e" />
      <stop offset="100%" stop-color="#0f3460" />
    </linearGradient>
  </defs>

  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bgGrad)" />
  <circle cx="100" cy="100" r="200" fill="rgba(220,38,38,0.08)" />
  <circle cx="1100" cy="500" r="250" fill="rgba(220,38,38,0.06)" />

  <text x="${OG_WIDTH / 2}" y="280" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle">${displayName}</text>
  <text x="${OG_WIDTH / 2}" y="330" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" text-anchor="middle">Card\u00e1pio Digital</text>

  ${displayLocation ? `<text x="${OG_WIDTH / 2}" y="375" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="rgba(255,255,255,0.6)" text-anchor="middle">${displayLocation}</text>` : ""}

  ${ratingText ? `<text x="${OG_WIDTH / 2}" y="${displayLocation ? 415 : 375}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#fbbf24" text-anchor="middle">${escapeXml(ratingText)}</text>` : ""}

  <!-- CTA bar -->
  <rect x="0" y="${ctaBarY}" width="${OG_WIDTH}" height="${ctaBarHeight}" fill="rgba(30,30,30,0.6)" />
  <rect x="0" y="${ctaBarY}" width="${OG_WIDTH}" height="3" fill="#dc2626" />
  <circle cx="${OG_WIDTH / 2 - 140}" cy="${ctaBarY + 28}" r="14" fill="#dc2626" />
  <text x="${OG_WIDTH / 2 - 140}" y="${ctaBarY + 34}" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="bold">!</text>
  <text x="${OG_WIDTH / 2}" y="${ctaBarY + 36}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">Pe\u00e7a online agora!</text>

  <text x="${OG_WIDTH - 30}" y="35" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="end">mindi.com.br</text>
</svg>`;
}

// ─── Image Composer ─────────────────────────────────────────────────────────

async function composeOGImage(est: {
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  state: string | null;
  rating: string | null;
  reviewCount: number;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  menuSlug: string | null;
}): Promise<Buffer> {
  const city = est.city || "";
  const state = est.state || "";
  const location = [city, state].filter(Boolean).join(" - ");
  const services = buildServiceBadges(est);

  // Try to fetch cover image
  let coverBuffer: Buffer | null = null;
  if (est.coverImage) {
    coverBuffer = await fetchImageBuffer(est.coverImage);
    if (coverBuffer) {
      coverBuffer = await processCoverImage(coverBuffer);
    }
  }

  // Try to fetch logo and make it circular
  let logoCircularBuffer: Buffer | null = null;
  let rawLogoBuffer: Buffer | null = null;
  if (est.logo) {
    rawLogoBuffer = await fetchImageBuffer(est.logo);
    if (rawLogoBuffer) {
      logoCircularBuffer = await processLogoCircular(rawLogoBuffer, 130);
    }
  }

  const hasCover = !!coverBuffer;
  const hasLogo = !!logoCircularBuffer;

  if (hasCover) {
    const overlaySVG = generateOverlaySVG({
      name: est.name,
      location,
      services,
      rating: est.rating,
      reviewCount: est.reviewCount,
      deliveryTimeMin: est.deliveryTimeMin,
      deliveryTimeMax: est.deliveryTimeMax,
      hasLogo,
    });

    const composites: sharp.OverlayOptions[] = [
      { input: Buffer.from(overlaySVG), top: 0, left: 0 },
    ];

    if (logoCircularBuffer) {
      // Place circular logo at the position matching the SVG white ring
      composites.push({ input: logoCircularBuffer, top: 330, left: 50 });
    }

    return sharp(coverBuffer!)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
      .composite(composites)
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    const svgContent = generateNoCoverSVG({
      name: est.name,
      location,
      services,
      rating: est.rating,
      reviewCount: est.reviewCount,
      deliveryTimeMin: est.deliveryTimeMin,
      deliveryTimeMax: est.deliveryTimeMax,
    });

    const baseImage = sharp(Buffer.from(svgContent))
      .resize(OG_WIDTH, OG_HEIGHT);

    if (rawLogoBuffer) {
      const logoSmall = await processLogoCircular(rawLogoBuffer, 100);
      return baseImage
        .composite([{ input: logoSmall, top: 100, left: Math.floor((OG_WIDTH - 100) / 2) }])
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    return baseImage.jpeg({ quality: 90 }).toBuffer();
  }
}

// ─── Route Registration ─────────────────────────────────────────────────────

export function registerOGImageRoute(app: Express): void {
  app.get("/api/og-image/:slug", async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      const establishment = await getEstablishmentBySlug(slug);
      if (!establishment) {
        res.status(404).send("Not found");
        return;
      }

      const est = establishment as any;
      const hash = computeVisualHash(est);

      // 1. Check memory cache first
      const cachedEntry = memoryCache.get(slug);
      if (cachedEntry && cachedEntry.hash === hash && (Date.now() - cachedEntry.timestamp < MEMORY_CACHE_TTL)) {
        logger.info(`[OG-Image] Memory cache HIT for ${slug} (hash: ${hash})`);
        // Serve buffer directly if available (avoids redirect which WhatsApp doesn't follow)
        if (cachedEntry.buffer) {
          res.set({
            "Content-Type": "image/jpeg",
            "Cache-Control": `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
            "CDN-Cache-Control": `public, max-age=${CACHE_DURATION}`,
          });
          res.send(cachedEntry.buffer);
          return;
        }
        // Fallback to redirect if buffer was garbage collected
        res.set({
          "Cache-Control": `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
          "CDN-Cache-Control": `public, max-age=${CACHE_DURATION}`,
        });
        res.redirect(301, cachedEntry.url);
        return;
      }

      // 2. Cache miss - generate image
      logger.info(`[OG-Image] Cache MISS for ${slug} (hash: ${hash}), generating...`);
      const imageBuffer = await composeOGImage(est);
      // Cache buffer in memory immediately (regardless of S3)
      memoryCache.set(slug, { url: "", hash, timestamp: Date.now(), buffer: imageBuffer });
      savePersistentCache();

      // 3. Upload to S3 in background
      uploadToS3Cache(slug, hash, imageBuffer).catch((err) => {
        logger.warn("[OG-Image] S3 upload skipped:", (err as Error).message);
      });

      // 4. Return the generated image directly
      res.set({
        "Content-Type": "image/jpeg",
        "Cache-Control": `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
        "CDN-Cache-Control": `public, max-age=${CACHE_DURATION}`,
      });

      res.send(imageBuffer);
    } catch (error) {
      logger.error("[OG-Image] Error generating image for slug:", slug, error);
      res.redirect(302, FALLBACK_IMAGE);
    }
  });
}
