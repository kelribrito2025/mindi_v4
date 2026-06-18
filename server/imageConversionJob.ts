/**
 * Background Image Conversion Job
 * 
 * Detecta imagens legacy (PNG, JPG, JPEG, GIF) no banco de dados
 * e converte automaticamente para WebP com duas versões:
 * - Principal (main): max 1200px, WebP q80
 * - Miniatura (thumb): max 400px, WebP q75
 * 
 * Tabelas processadas:
 * - products.images (JSON array de URLs)
 * - establishments.logo, establishments.coverImage
 * - complementItems.imageUrl
 * 
 * O job é idempotente: imagens já em .webp são ignoradas.
 * Processa em lotes para não sobrecarregar o servidor.
 */

import { getDb } from "./db";
import { products, establishments, complementItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { processImage, generateBlurPlaceholder, processSingleImage } from "./imageProcessor";
import { mindiStoragePut } from "./mindiStorage";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 500;

interface ConversionStats {
  totalScanned: number;
  totalConverted: number;
  totalSkipped: number;
  totalErrors: number;
  bytesSaved: number;
  details: {
    products: { scanned: number; converted: number; errors: number };
    establishments: { scanned: number; converted: number; errors: number };
    complements: { scanned: number; converted: number; errors: number };
  };
}

export function isLegacyImage(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.includes(".png?") ||
    lower.includes(".jpg?") ||
    lower.includes(".jpeg?") ||
    lower.includes(".gif?")
  );
}

function generateS3Key(originalUrl: string, suffix = ""): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const urlParts = originalUrl.split("/");
  const filename = urlParts[urlParts.length - 1].split("?")[0].split(".")[0];
  return `converted/${filename}_${timestamp}_${random}${suffix}.webp`;
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converte imagens de produtos (products.images)
 */
async function convertProductImages(stats: ConversionStats, onProgress?: (msg: string) => void): Promise<void> {
  const db = await getDb();
  if (!db) { onProgress?.("[Products] Database not available, skipping"); return; }

  const allProducts = await db
    .select({ id: products.id, images: products.images, blurPlaceholder: products.blurPlaceholder })
    .from(products);

  stats.details.products.scanned = allProducts.length;

  const productsToConvert = allProducts.filter((p: { images: unknown }) => {
    if (!p.images || !Array.isArray(p.images)) return false;
    return p.images.some((img: string) => isLegacyImage(img));
  });

  onProgress?.(`[Products] ${productsToConvert.length} produtos com imagens legacy de ${allProducts.length} total`);

  for (let i = 0; i < productsToConvert.length; i += BATCH_SIZE) {
    const batch = productsToConvert.slice(i, i + BATCH_SIZE);

    for (const product of batch) {
      try {
        const currentImages = (product.images || []) as string[];
        const newImages: string[] = [];
        let converted = false;
        let blurDataUrl = product.blurPlaceholder || "";

        for (const imageUrl of currentImages) {
          if (!isLegacyImage(imageUrl)) {
            newImages.push(imageUrl);
            continue;
          }

          const originalBuffer = await downloadImage(imageUrl);
          const originalSize = originalBuffer.length;
          const processed = await processImage(originalBuffer);

          const mainKey = generateS3Key(imageUrl);
          const { url: mainUrl } = await mindiStoragePut(mainKey, processed.mainBuffer, "image/webp");

          const thumbKey = generateS3Key(imageUrl, "_thumb");
          await mindiStoragePut(thumbKey, processed.thumbBuffer, "image/webp");

          newImages.push(mainUrl);
          blurDataUrl = processed.blurDataUrl;
          converted = true;

          stats.bytesSaved += originalSize - processed.mainSize - processed.thumbSize;
          onProgress?.(`  [Product #${product.id}] Convertido: ${originalSize} → ${processed.mainSize} bytes (main) + ${processed.thumbSize} bytes (thumb)`);
        }

        if (converted) {
          await db
            .update(products)
            .set({
              images: newImages,
              blurPlaceholder: blurDataUrl,
            })
            .where(eq(products.id, product.id));

          stats.totalConverted++;
          stats.details.products.converted++;
        } else {
          stats.totalSkipped++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onProgress?.(`  [Product #${product.id}] ERRO: ${msg}`);
        stats.totalErrors++;
        stats.details.products.errors++;
      }
    }

    if (i + BATCH_SIZE < productsToConvert.length) {
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
}

/**
 * Converte imagens de estabelecimentos (logo e coverImage)
 */
async function convertEstablishmentImages(stats: ConversionStats, onProgress?: (msg: string) => void): Promise<void> {
  const db = await getDb();
  if (!db) { onProgress?.("[Establishments] Database not available, skipping"); return; }

  const allEstablishments = await db
    .select({
      id: establishments.id,
      logo: establishments.logo,
      logoBlur: establishments.logoBlur,
      coverImage: establishments.coverImage,
      coverBlur: establishments.coverBlur,
    })
    .from(establishments);

  stats.details.establishments.scanned = allEstablishments.length;

  const toConvert = allEstablishments.filter(
    (e: { logo: string | null; coverImage: string | null }) =>
      (e.logo && isLegacyImage(e.logo)) || (e.coverImage && isLegacyImage(e.coverImage))
  );

  onProgress?.(`[Establishments] ${toConvert.length} estabelecimentos com imagens legacy de ${allEstablishments.length} total`);

  for (let i = 0; i < toConvert.length; i += BATCH_SIZE) {
    const batch = toConvert.slice(i, i + BATCH_SIZE);

    for (const est of batch) {
      try {
        const updates: Record<string, unknown> = {};
        let converted = false;

        if (est.logo && isLegacyImage(est.logo)) {
          const originalBuffer = await downloadImage(est.logo);
          const originalSize = originalBuffer.length;
          const processed = await processSingleImage(originalBuffer, 1200, 80);

          const logoKey = generateS3Key(est.logo);
          const { url: logoUrl } = await mindiStoragePut(logoKey, processed.buffer, "image/webp");

          updates.logo = logoUrl;
          updates.logoBlur = processed.blurDataUrl;
          converted = true;
          stats.bytesSaved += originalSize - processed.size;
          onProgress?.(`  [Establishment #${est.id}] Logo: ${originalSize} → ${processed.size} bytes`);
        }

        if (est.coverImage && isLegacyImage(est.coverImage)) {
          const originalBuffer = await downloadImage(est.coverImage);
          const originalSize = originalBuffer.length;
          const processed = await processSingleImage(originalBuffer, 1200, 80);

          const coverKey = generateS3Key(est.coverImage);
          const { url: coverUrl } = await mindiStoragePut(coverKey, processed.buffer, "image/webp");

          updates.coverImage = coverUrl;
          updates.coverBlur = processed.blurDataUrl;
          converted = true;
          stats.bytesSaved += originalSize - processed.size;
          onProgress?.(`  [Establishment #${est.id}] Cover: ${originalSize} → ${processed.size} bytes`);
        }

        if (converted) {
          await db
            .update(establishments)
            .set(updates)
            .where(eq(establishments.id, est.id));

          stats.totalConverted++;
          stats.details.establishments.converted++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onProgress?.(`  [Establishment #${est.id}] ERRO: ${msg}`);
        stats.totalErrors++;
        stats.details.establishments.errors++;
      }
    }

    if (i + BATCH_SIZE < toConvert.length) {
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
}

/**
 * Converte imagens de complementos (complementItems.imageUrl)
 */
async function convertComplementImages(stats: ConversionStats, onProgress?: (msg: string) => void): Promise<void> {
  const db = await getDb();
  if (!db) { onProgress?.("[Complements] Database not available, skipping"); return; }

  const allComplements = await db
    .select({ id: complementItems.id, imageUrl: complementItems.imageUrl })
    .from(complementItems);

  stats.details.complements.scanned = allComplements.length;

  const toConvert = allComplements.filter((c: { imageUrl: string | null }) => c.imageUrl && isLegacyImage(c.imageUrl));

  onProgress?.(`[Complements] ${toConvert.length} complementos com imagens legacy de ${allComplements.length} total`);

  for (let i = 0; i < toConvert.length; i += BATCH_SIZE) {
    const batch = toConvert.slice(i, i + BATCH_SIZE);

    for (const comp of batch) {
      try {
        if (!comp.imageUrl) continue;

        const originalBuffer = await downloadImage(comp.imageUrl);
        const originalSize = originalBuffer.length;
        const processed = await processImage(originalBuffer);

        const mainKey = generateS3Key(comp.imageUrl);
        const { url: mainUrl } = await mindiStoragePut(mainKey, processed.mainBuffer, "image/webp");

        const thumbKey = generateS3Key(comp.imageUrl, "_thumb");
        await mindiStoragePut(thumbKey, processed.thumbBuffer, "image/webp");

        await db
          .update(complementItems)
          .set({ imageUrl: mainUrl })
          .where(eq(complementItems.id, comp.id));

        stats.totalConverted++;
        stats.details.complements.converted++;
        stats.bytesSaved += originalSize - processed.mainSize - processed.thumbSize;
        onProgress?.(`  [Complement #${comp.id}] ${originalSize} → ${processed.mainSize} bytes`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onProgress?.(`  [Complement #${comp.id}] ERRO: ${msg}`);
        stats.totalErrors++;
        stats.details.complements.errors++;
      }
    }

    if (i + BATCH_SIZE < toConvert.length) {
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
}

/**
 * Executa o job completo de conversão de imagens legacy.
 * Idempotente: imagens já em WebP são ignoradas.
 */
export async function runImageConversionJob(onProgress?: (msg: string) => void): Promise<ConversionStats> {
  const stats: ConversionStats = {
    totalScanned: 0,
    totalConverted: 0,
    totalSkipped: 0,
    totalErrors: 0,
    bytesSaved: 0,
    details: {
      products: { scanned: 0, converted: 0, errors: 0 },
      establishments: { scanned: 0, converted: 0, errors: 0 },
      complements: { scanned: 0, converted: 0, errors: 0 },
    },
  };

  const startTime = Date.now();
  onProgress?.("=== Início do Job de Conversão de Imagens Legacy ===");

  await convertProductImages(stats, onProgress);
  await convertEstablishmentImages(stats, onProgress);
  await convertComplementImages(stats, onProgress);

  stats.totalScanned =
    stats.details.products.scanned +
    stats.details.establishments.scanned +
    stats.details.complements.scanned;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const savedMB = (stats.bytesSaved / 1024 / 1024).toFixed(1);

  onProgress?.(`\n=== Conversão Concluída em ${elapsed}s ===`);
  onProgress?.(`Registros analisados: ${stats.totalScanned}`);
  onProgress?.(`Imagens convertidas: ${stats.totalConverted}`);
  onProgress?.(`Erros: ${stats.totalErrors}`);
  onProgress?.(`Espaço economizado: ${savedMB} MB`);

  return stats;
}

/**
 * Conta quantas imagens legacy existem no banco sem converter.
 */
export async function countLegacyImages(): Promise<{
  products: number;
  establishments: number;
  complements: number;
  total: number;
}> {
  const db = await getDb();
  if (!db) return { products: 0, establishments: 0, complements: 0, total: 0 };

  const allProducts = await db
    .select({ images: products.images })
    .from(products);

  const legacyProducts = allProducts.filter((p: { images: unknown }) => {
    if (!p.images || !Array.isArray(p.images)) return false;
    return p.images.some((img: string) => isLegacyImage(img));
  }).length;

  const allEstablishments = await db
    .select({ logo: establishments.logo, coverImage: establishments.coverImage })
    .from(establishments);

  const legacyEstablishments = allEstablishments.filter(
    (e: { logo: string | null; coverImage: string | null }) =>
      (e.logo && isLegacyImage(e.logo)) || (e.coverImage && isLegacyImage(e.coverImage))
  ).length;

  const allComplements = await db
    .select({ imageUrl: complementItems.imageUrl })
    .from(complementItems);

  const legacyComplements = allComplements.filter(
    (c: { imageUrl: string | null }) => c.imageUrl && isLegacyImage(c.imageUrl)
  ).length;

  return {
    products: legacyProducts,
    establishments: legacyEstablishments,
    complements: legacyComplements,
    total: legacyProducts + legacyEstablishments + legacyComplements,
  };
}
