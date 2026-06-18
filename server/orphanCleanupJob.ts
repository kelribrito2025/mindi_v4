/**
 * Orphan Image Cleanup Job
 * 
 * Identifies and removes images in S3 that are no longer referenced
 * by any database record. Supports dry-run mode for safe previewing.
 * 
 * Image fields scanned:
 * - establishments: logo, coverImage
 * - products: images (JSON array)
 * - complementItems: imageUrl
 * - printerSettings: logoUrl, qrCodeUrl
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  establishments,
  products,
  complementItems,
  printerSettings,
} from "../drizzle/schema";
import { logger } from "./_core/logger";
import { mindiStorageList, mindiStorageDelete } from "./mindiStorage";

export interface OrphanCleanupResult {
  totalS3Objects: number;
  totalReferencedUrls: number;
  orphanCount: number;
  orphanKeys: Array<{ key: string; size: number; lastModified: Date | undefined }>;
  totalOrphanSizeBytes: number;
  totalOrphanSizeMB: string;
  deletedCount: number;
  errors: string[];
}

/**
 * Extract the S3 key from a full URL.
 * Handles both formats:
 * - https://bucket.s3.region.amazonaws.com/key
 * - https://files.manus.im/key (CDN)
 */
function extractKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    const parsed = new URL(url);
    // Remove leading slash from pathname
    const key = parsed.pathname.replace(/^\/+/, "");
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Collect all image URLs referenced in the database.
 * Returns a Set of S3 keys (extracted from URLs).
 */
async function collectReferencedKeys(): Promise<Set<string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const referencedKeys = new Set<string>();

  // 1. Establishments: logo, coverImage
  const allEstablishments = await db
    .select({
      logo: establishments.logo,
      coverImage: establishments.coverImage,
    })
    .from(establishments);

  for (const est of allEstablishments) {
    if (est.logo) {
      const key = extractKeyFromUrl(est.logo);
      if (key) referencedKeys.add(key);
    }
    if (est.coverImage) {
      const key = extractKeyFromUrl(est.coverImage);
      if (key) referencedKeys.add(key);
    }
  }

  // 2. Products: images (JSON array of URLs)
  const allProducts = await db
    .select({
      images: products.images,
    })
    .from(products);

  for (const prod of allProducts) {
    if (prod.images) {
      const imageList = Array.isArray(prod.images) ? prod.images : [];
      for (const imgUrl of imageList) {
        if (typeof imgUrl === "string") {
          const key = extractKeyFromUrl(imgUrl);
          if (key) referencedKeys.add(key);
        }
      }
    }
  }

  // 3. ComplementItems: imageUrl
  const allComplements = await db
    .select({
      imageUrl: complementItems.imageUrl,
    })
    .from(complementItems);

  for (const comp of allComplements) {
    if (comp.imageUrl) {
      const key = extractKeyFromUrl(comp.imageUrl);
      if (key) referencedKeys.add(key);
    }
  }

  // 4. PrinterSettings: logoUrl, qrCodeUrl
  const allPrinterSettings = await db
    .select({
      logoUrl: printerSettings.logoUrl,
      qrCodeUrl: printerSettings.qrCodeUrl,
    })
    .from(printerSettings);

  for (const ps of allPrinterSettings) {
    if (ps.logoUrl) {
      const key = extractKeyFromUrl(ps.logoUrl);
      if (key) referencedKeys.add(key);
    }
    if (ps.qrCodeUrl) {
      const key = extractKeyFromUrl(ps.qrCodeUrl);
      if (key) referencedKeys.add(key);
    }
  }

  // Also add thumb variants for all referenced keys
  // If "path/image.webp" is referenced, "path/image_thumb.webp" is also valid
  const thumbKeys: string[] = [];
  referencedKeys.forEach((key) => {
    const lastDot = key.lastIndexOf(".");
    if (lastDot > 0) {
      const thumbKey = key.substring(0, lastDot) + "_thumb" + key.substring(lastDot);
      thumbKeys.push(thumbKey);
    }
  });
  for (const tk of thumbKeys) {
    referencedKeys.add(tk);
  }

  return referencedKeys;
}

/**
 * Filter S3 objects to only include image files.
 * Excludes non-image files like JSON, HTML, etc.
 */
function isImageKey(key: string): boolean {
  const imageExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff", ".avif",
  ];
  const lowerKey = key.toLowerCase();
  return imageExtensions.some((ext) => lowerKey.endsWith(ext));
}

/**
 * Run the orphan cleanup job.
 * 
 * @param dryRun - If true, only identifies orphans without deleting them
 * @param batchSize - Number of deletions per batch (default: 10)
 * @returns Cleanup result with statistics
 */
export async function runOrphanCleanup(
  dryRun = true,
  batchSize = 10
): Promise<OrphanCleanupResult> {
  logger.info(`[OrphanCleanup] Starting ${dryRun ? "DRY-RUN" : "DELETION"} mode...`);

  const result: OrphanCleanupResult = {
    totalS3Objects: 0,
    totalReferencedUrls: 0,
    orphanCount: 0,
    orphanKeys: [],
    totalOrphanSizeBytes: 0,
    totalOrphanSizeMB: "0",
    deletedCount: 0,
    errors: [],
  };

  try {
    // Step 1: List all objects in S3
    logger.info("[OrphanCleanup] Listing all S3 objects...");
    const allObjects = await mindiStorageList();
    
    // Filter to only image files
    const imageObjects = allObjects.filter((obj) => isImageKey(obj.key));
    result.totalS3Objects = imageObjects.length;
    logger.info(`[OrphanCleanup] Found ${imageObjects.length} image files in S3 (${allObjects.length} total objects)`);

    // Step 2: Collect all referenced keys from database
    logger.info("[OrphanCleanup] Collecting referenced image URLs from database...");
    const referencedKeys = await collectReferencedKeys();
    result.totalReferencedUrls = referencedKeys.size;
    logger.info(`[OrphanCleanup] Found ${referencedKeys.size} referenced image keys in database`);

    // Step 3: Find orphans (in S3 but not in database)
    const orphans: Array<{ key: string; size: number; lastModified: Date | undefined }> = [];
    for (const obj of imageObjects) {
      if (!referencedKeys.has(obj.key)) {
        orphans.push(obj);
      }
    }

    result.orphanCount = orphans.length;
    result.orphanKeys = orphans;
    result.totalOrphanSizeBytes = orphans.reduce((sum, o) => sum + o.size, 0);
    result.totalOrphanSizeMB = (result.totalOrphanSizeBytes / (1024 * 1024)).toFixed(2);

    logger.info(`[OrphanCleanup] Found ${orphans.length} orphan images (${result.totalOrphanSizeMB} MB)`);

    // Step 4: Delete orphans if not dry-run
    if (!dryRun && orphans.length > 0) {
      logger.info(`[OrphanCleanup] Deleting ${orphans.length} orphan images in batches of ${batchSize}...`);
      
      for (let i = 0; i < orphans.length; i += batchSize) {
        const batch = orphans.slice(i, i + batchSize);
        const deletePromises = batch.map(async (orphan) => {
          try {
            await mindiStorageDelete(orphan.key);
            result.deletedCount++;
            logger.info(`[OrphanCleanup] Deleted: ${orphan.key} (${(orphan.size / 1024).toFixed(1)} KB)`);
          } catch (err: any) {
            const errorMsg = `Failed to delete ${orphan.key}: ${err.message}`;
            result.errors.push(errorMsg);
            logger.error(`[OrphanCleanup] ${errorMsg}`);
          }
        });
        await Promise.all(deletePromises);
      }

      logger.info(`[OrphanCleanup] Deleted ${result.deletedCount}/${orphans.length} orphan images`);
    } else if (dryRun && orphans.length > 0) {
      logger.info("[OrphanCleanup] DRY-RUN mode - no files were deleted. Orphan list:");
      for (const orphan of orphans.slice(0, 20)) {
        logger.info(`  - ${orphan.key} (${(orphan.size / 1024).toFixed(1)} KB)`);
      }
      if (orphans.length > 20) {
        logger.info(`  ... and ${orphans.length - 20} more`);
      }
    }
  } catch (err: any) {
    const errorMsg = `Orphan cleanup failed: ${err.message}`;
    result.errors.push(errorMsg);
    logger.error(`[OrphanCleanup] ${errorMsg}`);
  }

  logger.info(`[OrphanCleanup] Complete. Summary:
    S3 images: ${result.totalS3Objects}
    DB references: ${result.totalReferencedUrls}
    Orphans: ${result.orphanCount} (${result.totalOrphanSizeMB} MB)
    Deleted: ${result.deletedCount}
    Errors: ${result.errors.length}`);

  return result;
}

// Export for testing
export { extractKeyFromUrl, collectReferencedKeys, isImageKey };
