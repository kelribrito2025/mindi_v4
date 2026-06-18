/**
 * SEO Module - Dynamic meta tags, Schema.org, and OpenGraph for public menus
 * 
 * Intercepts /menu/:slug requests and injects SEO-optimized HTML head content
 * before the SPA takes over rendering.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { getEstablishmentBySlug, getDb, getProductById } from "./db";
import { categories, products } from "../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { getOGImageUrl } from "./og-image";
import { logger } from "./_core/logger";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EstablishmentSEO {
  id: number;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  street: string | null;
  number: string | null;
  whatsapp: string | null;
  menuSlug: string | null;
  rating: string | null;
  reviewCount: number;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  latitude: string | null;
  longitude: string | null;
}

interface ProductSEO {
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  categoryName: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Default OG image for restaurants without a cover photo or logo */
const DEFAULT_OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/og-fallback-restaurant-59Pg6eq6bi2fQgZCkkFtJp.png";

const PRODUCT_PLACEHOLDER_OG_PATH = "/og-product-placeholder.png";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildFullAddress(est: EstablishmentSEO): string {
  const parts: string[] = [];
  if (est.street) parts.push(est.street);
  if (est.number) parts.push(est.number);
  if (est.neighborhood) parts.push(est.neighborhood);
  if (est.city) parts.push(est.city);
  if (est.state) parts.push(est.state);
  return parts.join(", ");
}

function buildServiceTypes(est: EstablishmentSEO): string[] {
  const types: string[] = [];
  if (est.allowsDelivery) types.push("Delivery");
  if (est.allowsPickup) types.push("Retirada");
  if (est.allowsDineIn) types.push("Consumo no local");
  return types.length > 0 ? types : ["Delivery"];
}

function formatPhone(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `+55${digits}`;
  }
  return null;
}

function getFirstProductImage(images: string[] | null | undefined): string | null {
  if (!Array.isArray(images)) return null;
  const image = images.find((item) => typeof item === "string" && item.trim().length > 0);
  return image ? image.trim() : null;
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function getProductPlaceholderUrl(productUrl: string): string {
  return toAbsoluteUrl(PRODUCT_PLACEHOLDER_OG_PATH, productUrl);
}

// ─── Meta Tags Generator ─────────────────────────────────────────────────────

function generateMetaTags(est: EstablishmentSEO, menuUrl: string): string {
  const name = escapeHtml(est.name);
  const city = est.city ? escapeHtml(est.city) : "";
  const state = est.state ? escapeHtml(est.state) : "";
  const location = [city, state].filter(Boolean).join(" - ");
  const serviceTypes = buildServiceTypes(est).join(", ");

  // Title: "Nome do Restaurante | Cardápio Digital | Cidade - UF"
  const title = location
    ? `${name} | Cardápio Digital | ${location}`
    : `${name} | Cardápio Digital`;

  // Description: "Faça seu pedido online no Nome. Delivery, Retirada em Cidade. Cardápio completo com preços atualizados."
  const description = location
    ? `Faça seu pedido online no ${name}. ${serviceTypes} em ${city || location}. Cardápio completo com preços atualizados. Peça agora!`
    : `Faça seu pedido online no ${name}. ${serviceTypes}. Cardápio completo com preços atualizados. Peça agora!`;

  // Use cached S3 URL if available, otherwise fallback to dynamic endpoint
  const baseUrl = menuUrl.replace(/\/menu\/.*$/, '');
  const ogImage = getOGImageUrl(est.menuSlug || '', baseUrl);

  const tags: string[] = [
    // Basic SEO
    `<title>${title}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeHtml(menuUrl)}" />`,

    // OpenGraph (WhatsApp, Facebook, etc.)
    `<meta property="og:type" content="restaurant" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(menuUrl)}" />`,
    `<meta property="og:site_name" content="${name}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
  ];

  // og:image is always present (uses restaurant cover, logo, or platform default)
  tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
  tags.push(`<meta property="og:image:type" content="image/jpeg" />`);
  tags.push(`<meta property="og:image:width" content="1200" />`);
  tags.push(`<meta property="og:image:height" content="630" />`);
  tags.push(`<meta property="og:image:alt" content="${name}" />`);

  // Twitter Card
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${title}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);

  // Geo tags
  if (est.latitude && est.longitude) {
    tags.push(`<meta name="geo.position" content="${est.latitude};${est.longitude}" />`);
    tags.push(`<meta name="ICBM" content="${est.latitude}, ${est.longitude}" />`);
  }
  if (location) {
    tags.push(`<meta name="geo.placename" content="${location}" />`);
    tags.push(`<meta name="geo.region" content="BR${est.state ? `-${escapeHtml(est.state)}` : ""}" />`);
  }

  return tags.join("\n    ");
}

// ─── Schema.org JSON-LD Generator ────────────────────────────────────────────

function generateSchemaOrg(
  est: EstablishmentSEO,
  menuUrl: string,
  productsList: ProductSEO[]
): string {
  const address = buildFullAddress(est);
  const phone = formatPhone(est.whatsapp);

  // Main Restaurant schema
  const restaurant: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: est.name,
    url: menuUrl,
  };

  if (est.logo) {
    restaurant.image = est.logo;
  }
  if (est.coverImage) {
    restaurant.photo = est.coverImage;
  }

  if (address) {
    restaurant.address = {
      "@type": "PostalAddress",
      streetAddress: [est.street, est.number].filter(Boolean).join(", ") || undefined,
      addressLocality: est.city || undefined,
      addressRegion: est.state || undefined,
      addressCountry: "BR",
    };
  }

  if (est.latitude && est.longitude) {
    restaurant.geo = {
      "@type": "GeoCoordinates",
      latitude: parseFloat(est.latitude),
      longitude: parseFloat(est.longitude),
    };
  }

  if (phone) {
    restaurant.telephone = phone;
  }

  // Rating
  if (est.rating && parseFloat(est.rating) > 0 && est.reviewCount > 0) {
    restaurant.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(est.rating),
      reviewCount: est.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Service types
  const serviceTypes = buildServiceTypes(est);
  if (serviceTypes.length > 0) {
    restaurant.servesCuisine = serviceTypes;
  }

  // Menu with products
  if (productsList.length > 0) {
    const menuSections: Record<string, any[]> = {};
    for (const p of productsList) {
      if (!menuSections[p.categoryName]) {
        menuSections[p.categoryName] = [];
      }
      const menuItem: Record<string, any> = {
        "@type": "MenuItem",
        name: p.name,
        offers: {
          "@type": "Offer",
          price: parseFloat(p.price).toFixed(2),
          priceCurrency: "BRL",
        },
      };
      if (p.description) {
        menuItem.description = p.description;
      }
      if (p.image) {
        menuItem.image = p.image;
      }
      menuSections[p.categoryName].push(menuItem);
    }

    restaurant.hasMenu = {
      "@type": "Menu",
      name: `Cardápio ${est.name}`,
      hasMenuSection: Object.entries(menuSections).map(([name, items]) => ({
        "@type": "MenuSection",
        name,
        hasMenuItem: items,
      })),
    };
  }

  return `<script type="application/ld+json">${JSON.stringify(restaurant)}</script>`;
}

// ─── Product List Fetcher ────────────────────────────────────────────────────

async function getProductsForSEO(establishmentId: number): Promise<ProductSEO[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const cats = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.establishmentId, establishmentId))
      .orderBy(asc(categories.sortOrder));

    const catMap = new Map<number, string>();
    for (const c of cats) {
      catMap.set(c.id, c.name);
    }

    const prods = await db
      .select({
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        categoryId: products.categoryId,
        status: products.status,
      })
      .from(products)
      .where(eq(products.establishmentId, establishmentId));

    return prods
      .filter((p) => p.status === "active" && p.categoryId)
      .map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.images && p.images.length > 0 ? p.images[0] : null,
        categoryName: catMap.get(p.categoryId!) || "Outros",
      }));
  } catch (error) {
    logger.error("[SEO] Error fetching products:", error);
    return [];
  }
}

// ─── HTML Injector ───────────────────────────────────────────────────────────

/**
 * Injects SEO meta tags into the HTML template for /menu/:slug routes.
 * Replaces the static <title> and adds meta tags, OpenGraph, and Schema.org JSON-LD.
 */
export function injectSEOIntoHTML(
  html: string,
  metaTags: string,
  schemaOrg: string
): string {
  // Find the title block to replace
  const titleEndIndex = html.indexOf("</title>");
  if (titleEndIndex === -1) return html;
  const titleStartIndex = html.indexOf("<title>");
  if (titleStartIndex === -1) return html;

  let modified = html;

  // STEP 1: Remove any existing OG/Twitter meta tags FIRST (before injecting ours)
  // These may come from the hosting platform or previous static tags
  modified = modified.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, "");
  modified = modified.replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, "");
  modified = modified.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, "");

  // STEP 2: Remove old static description meta tag
  modified = modified.replace(
    /<meta name="description" content="Sistema de gerenciamento de pedidos e card[^"]*" \/>/,
    ""
  );

  // STEP 3: Replace old title with new meta tags (which include title + OG + Twitter + canonical)
  // Need to re-find title position after removals above
  const newTitleEnd = modified.indexOf("</title>");
  const newTitleStart = modified.indexOf("<title>");
  if (newTitleStart !== -1 && newTitleEnd !== -1) {
    const oldTitleBlock = modified.substring(newTitleStart, newTitleEnd + "</title>".length);
    modified = modified.replace(oldTitleBlock, metaTags);
  }

  // STEP 4: Inject Schema.org JSON-LD before closing </head>
  modified = modified.replace("</head>", `    ${schemaOrg}\n  </head>`);

  return modified;
}

// ─── Express Middleware ──────────────────────────────────────────────────────

/**
 * Creates an Express middleware that intercepts /menu/:slug requests
 * and generates SEO-optimized HTML with dynamic meta tags.
 */
export function createSEOMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;

    // Only intercept /menu/:slug routes (not API, not assets)
    const menuMatch = url.match(/^\/menu\/([a-zA-Z0-9_-]+)(?:\?.*)?$/);
    if (!menuMatch) {
      return next();
    }

    const slug = menuMatch[1];

    try {
      const establishment = await getEstablishmentBySlug(slug);
      if (!establishment) {
        return next(); // Let the SPA handle 404
      }

      // Build the canonical URL
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "";
      const menuUrl = `${protocol}://${host}/menu/${slug}`;

      const produtoParam = req.query.produto || req.query.product;
      const productId = produtoParam ? parseInt(String(produtoParam), 10) : undefined;
      const validProductId = productId && !isNaN(productId) ? productId : undefined;

      // Fetch products for Schema.org
      const productsList = await getProductsForSEO(establishment.id);

      let metaTags = generateMetaTags(establishment as any, menuUrl);
      if (validProductId) {
        const product = await getProductById(validProductId);
        if (product && product.establishmentId === establishment.id) {
          const productUrl = `${menuUrl}?produto=${validProductId}`;
          metaTags = generateProductMetaTags(product as any, establishment as any, productUrl);
        }
      }
      const schemaOrg = generateSchemaOrg(establishment as any, menuUrl, productsList);

      // Store SEO data for the HTML transformer to use
      (req as any).__seoData = { metaTags, schemaOrg };

      next();
    } catch (error) {
      logger.error("[SEO] Error generating meta tags:", error);
      next(); // Fallback to default HTML
    }
  };
}

// ─── Full HTML Page Generator for Crawlers ──────────────────────────────────


// ─── Product-specific Meta Tags Generator ────────────────────────────────────

function generateProductMetaTags(
  product: { name: string; description: string | null; price: string; images: string[] | null },
  est: EstablishmentSEO,
  productUrl: string
): string {
  const productName = escapeHtml(product.name);
  const estName = escapeHtml(est.name);
  const price = parseFloat(product.price).toFixed(2).replace(".", ",");
  const title = `${productName} - ${estName}`;

  const descParts: string[] = [];
  if (product.description) {
    const desc = product.description.length > 120
      ? `${product.description.substring(0, 117)}...`
      : product.description;
    descParts.push(desc);
  }
  descParts.push(`A partir de R$ ${price}`);
  descParts.push(`Peça agora no ${est.name}!`);
  const description = escapeHtml(descParts.join(". "));

  const productImage = getFirstProductImage(product.images);
  const ogImage = productImage
    ? toAbsoluteUrl(productImage, productUrl)
    : getProductPlaceholderUrl(productUrl);

  const tags: string[] = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeHtml(productUrl)}" />`,

    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(productUrl)}" />`,
    `<meta property="og:site_name" content="${estName}" />`,
    `<meta property="og:locale" content="pt_BR" />`,

    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:image:alt" content="${productName}" />`,
  ];

  if (productImage) {
    tags.push(`<meta property="og:image:width" content="800" />`);
    tags.push(`<meta property="og:image:height" content="800" />`);
  } else {
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
  }

  tags.push(`<meta property="product:price:amount" content="${parseFloat(product.price).toFixed(2)}" />`);
  tags.push(`<meta property="product:price:currency" content="BRL" />`);

  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  tags.push(`<meta name="twitter:description" content="${description}" />`);
  tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);

  return tags.join("\n    ");
}

/**
 * Generates a complete HTML page with proper OG meta tags for crawlers.
 * This is served from /api/menu/:slug to bypass the Manus proxy
 * which overwrites OG tags on non-API routes.
 * 
 * Real users are redirected to /menu/:slug via meta refresh + JS redirect.
 * Crawlers (WhatsApp, Facebook, Twitter, Google) don't execute JS,
 * so they see the OG tags and use them for link previews.
 */
export async function generateMenuPageHTML(
  slug: string,
  baseUrl: string,
  menuUrl: string,
  productId?: number,
  isCrawler?: boolean
): Promise<string | null> {
  try {
    const establishment = await getEstablishmentBySlug(slug);
    if (!establishment) return null;

    let metaTags: string;
    let title: string;
    let redirectUrl: string;

    const apiMenuUrl = `${baseUrl}/api/menu/${slug}`;

    if (productId) {
      const product = await getProductById(productId);
      if (product && product.establishmentId === establishment.id) {
        const productUrl = `${baseUrl}/api/menu/${slug}?produto=${productId}`;
        redirectUrl = `${baseUrl}/menu/${slug}?produto=${productId}`;
        metaTags = generateProductMetaTags(product as any, establishment as any, productUrl);
        title = `${escapeHtml(product.name)} - ${escapeHtml(establishment.name)}`;
      } else {
        redirectUrl = menuUrl;
        metaTags = generateMetaTags(establishment as any, apiMenuUrl);
        const name = escapeHtml(establishment.name);
        const city = establishment.city ? escapeHtml(establishment.city) : "";
        const state = establishment.state ? escapeHtml(establishment.state) : "";
        const location = [city, state].filter(Boolean).join(" - ");
        title = location
          ? `${name} | Cardápio Digital | ${location}`
          : `${name} | Cardápio Digital`;
      }
    } else {
      redirectUrl = menuUrl;
      metaTags = generateMetaTags(establishment as any, apiMenuUrl);
      const name = escapeHtml(establishment.name);
      const city = establishment.city ? escapeHtml(establishment.city) : "";
      const state = establishment.state ? escapeHtml(establishment.state) : "";
      const location = [city, state].filter(Boolean).join(" - ");
      title = location
        ? `${name} | Cardápio Digital | ${location}`
        : `${name} | Cardápio Digital`;
    }

    const productsList = await getProductsForSEO(establishment.id);
    const schemaOrg = generateSchemaOrg(establishment as any, menuUrl, productsList);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${metaTags}
    ${schemaOrg}
    ${isCrawler ? "" : `<meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" />`}
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; color: #333; text-align: center; }
      .container { padding: 2rem; }
      h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      p { color: #666; margin-bottom: 1rem; }
      a { color: #dc2626; text-decoration: none; font-weight: 600; }
      a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
      <h1>${title}</h1>
      <p>Redirecionando...</p>
      <p><a href="${escapeHtml(redirectUrl)}">Clique aqui se não for redirecionado automaticamente</a></p>
    </div>
    ${isCrawler ? "" : `<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>`}
</body>
</html>`;
  } catch (error) {
    logger.error("[SEO] Error generating menu page HTML:", error);
    return null;
  }
}

// ─── Sitemap Generator ───────────────────────────────────────────────────────

export async function generateSitemap(baseUrl: string): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return generateEmptySitemap(baseUrl);

    const { establishments } = await import("../drizzle/schema");

    const allEstablishments = await db
      .select({
        menuSlug: establishments.menuSlug,
        updatedAt: establishments.updatedAt,
        name: establishments.name,
      })
      .from(establishments);

    const activeEstablishments = allEstablishments.filter(
      (e) => e.menuSlug && e.menuSlug.length > 0
    );

    const urls: string[] = [
      `  <url>`,
      `    <loc>${baseUrl}/</loc>`,
      `    <changefreq>weekly</changefreq>`,
      `    <priority>1.0</priority>`,
      `  </url>`,
    ];

    for (const est of activeEstablishments) {
      const lastmod = est.updatedAt
        ? new Date(est.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      urls.push(`  <url>`);
      urls.push(`    <loc>${baseUrl}/menu/${est.menuSlug}</loc>`);
      urls.push(`    <lastmod>${lastmod}</lastmod>`);
      urls.push(`    <changefreq>daily</changefreq>`);
      urls.push(`    <priority>0.8</priority>`);
      urls.push(`  </url>`);
    }

    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join("\n");
  } catch (error) {
    logger.error("[SEO] Error generating sitemap:", error);
    return generateEmptySitemap(baseUrl);
  }
}

function generateEmptySitemap(baseUrl: string): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <url>`,
    `    <loc>${baseUrl}/</loc>`,
    `    <changefreq>weekly</changefreq>`,
    `    <priority>1.0</priority>`,
    `  </url>`,
    `</urlset>`,
  ].join("\n");
}

// ─── Robots.txt Generator ────────────────────────────────────────────────────

export function generateRobotsTxt(baseUrl: string): string {
  return [
    `User-agent: *`,
    `Allow: /menu/`,
    `Allow: /$`,
    `Allow: /api/og-image/`,
    `Allow: /api/menu/`,
    `Disallow: /api/`,
    `Disallow: /dashboard`,
    `Disallow: /pedidos`,
    `Disallow: /catalogo`,
    `Disallow: /complementos`,
    `Disallow: /configuracoes`,
    `Disallow: /financas`,
    `Disallow: /clientes`,
    `Disallow: /cupons`,
    `Disallow: /stories`,
    `Disallow: /entregadores`,
    `Disallow: /mesas`,
    `Disallow: /avaliacoes`,
    `Disallow: /admin`,
    `Disallow: /login`,
    `Disallow: /register`,
    `Disallow: /printer-app`,
    `Disallow: /estoque`,
    `Disallow: /whatsapp`,
    `Disallow: /bot-whatsapp`,
    `Disallow: /planos`,
    `Disallow: /checkout`,
    `Crawl-delay: 2`,
    ``,
    `# Block aggressive AI/scraper bots`,
    `User-agent: GPTBot`,
    `Disallow: /`,
    ``,
    `User-agent: CCBot`,
    `Disallow: /`,
    ``,
    `User-agent: ChatGPT-User`,
    `Disallow: /`,
    ``,
    `User-agent: anthropic-ai`,
    `Disallow: /`,
    ``,
    `User-agent: ClaudeBot`,
    `Disallow: /`,
    ``,
    `User-agent: Bytespider`,
    `Disallow: /`,
    ``,
    `User-agent: AhrefsBot`,
    `Disallow: /`,
    ``,
    `User-agent: SemrushBot`,
    `Disallow: /`,
    ``,
    `User-agent: MJ12bot`,
    `Disallow: /`,
    ``,
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join("\n");
}
