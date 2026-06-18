/**
 * iFood Sync Module
 * 
 * Handles publishing local menu items to iFood catalog:
 * - Publish individual products (PUT /items)
 * - Publish all products in a category
 * - Sync all products at once
 * - Auto-sync on price/status changes
 * - Product/category/complement mapping management
 */

import { v4 as uuidv4 } from "uuid";
import { ifoodApiCall } from "./ifoodInfra";
import { getAccessTokenForEstablishment } from "./ifood";
import { logger } from "./_core/logger";
import { invalidateCatalogCache } from "./ifoodCatalogCache";
import * as db from "./db";
import { getDb } from "./db";
import { 
  ifoodProductMapping, ifoodCategoryMapping, ifoodComplementMapping,
  products, complementGroups, complementItems, categories
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const IFOOD_CATALOG_BASE_URL = "https://merchant-api.ifood.com.br/catalog/v2.0";

// ==========================================
// TYPES
// ==========================================

interface IfoodItemPayload {
  item: {
    id: string;
    type: "DEFAULT";
    categoryId: string;
    status: "AVAILABLE" | "UNAVAILABLE";
    price: { value: number; originalValue?: number };
    externalCode?: string;
    index?: number;
    productId: string;
    shifts: null;
    tags: null;
  };
  products: Array<{
    id: string;
    name: string;
    description?: string;
    externalCode?: string;
    imagePath?: string;
    serving: string;
    dietaryRestrictions: string[] | null;
    ean: string;
    quantity?: null;
    optionGroups?: Array<{ id: string; min: number; max: number }> | null;
  }>;
  optionGroups?: Array<{
    id: string;
    name: string;
    externalCode?: string;
    status: "AVAILABLE" | "UNAVAILABLE";
    index: number;
    optionGroupType: "DEFAULT";
    optionIds: string[];
  }>;
  options?: Array<{
    id: string;
    status: "AVAILABLE" | "UNAVAILABLE";
    index: number;
    productId: string;
    price: { value: number; originalValue?: number };
    externalCode?: string;
    fractions?: null;
  }>;
}

interface PublishResult {
  success: boolean;
  ifoodItemId?: string;
  ifoodProductId?: string;
  error?: string;
}

interface SyncAllResult {
  total: number;
  published: number;
  updated: number;
  failed: number;
  errors: Array<{ productId: number; productName: string; error: string }>;
}

// ==========================================
// MAPPING CRUD
// ==========================================

/**
 * Get the iFood mapping for a local product
 */
export async function getProductMapping(establishmentId: number, localProductId: number) {
  const database = await getDb();
  if (!database) return null;
  
  const result = await database.select().from(ifoodProductMapping)
    .where(and(
      eq(ifoodProductMapping.establishmentId, establishmentId),
      eq(ifoodProductMapping.localProductId, localProductId)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Get the iFood mapping for a local category
 */
export async function getCategoryMapping(establishmentId: number, localCategoryId: number) {
  const database = await getDb();
  if (!database) return null;
  
  const result = await database.select().from(ifoodCategoryMapping)
    .where(and(
      eq(ifoodCategoryMapping.establishmentId, establishmentId),
      eq(ifoodCategoryMapping.localCategoryId, localCategoryId)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Get all product mappings for an establishment
 */
export async function getAllProductMappings(establishmentId: number) {
  const database = await getDb();
  if (!database) return [];
  
  return database.select().from(ifoodProductMapping)
    .where(eq(ifoodProductMapping.establishmentId, establishmentId));
}

/**
 * Get all category mappings for an establishment
 */
export async function getAllCategoryMappings(establishmentId: number) {
  const database = await getDb();
  if (!database) return [];
  
  return database.select().from(ifoodCategoryMapping)
    .where(eq(ifoodCategoryMapping.establishmentId, establishmentId));
}

/**
 * Save or update a product mapping
 */
async function upsertProductMapping(
  establishmentId: number,
  localProductId: number,
  localCategoryId: number | null,
  ifoodItemId: string,
  ifoodProductId: string,
  ifoodCategoryId: string,
  ifoodCatalogId: string,
  syncStatus: "synced" | "pending" | "error" = "synced",
  syncError?: string
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  
  const existing = await getProductMapping(establishmentId, localProductId);
  
  if (existing) {
    await database.update(ifoodProductMapping)
      .set({
        ifoodItemId,
        ifoodProductId,
        ifoodCategoryId,
        ifoodCatalogId,
        localCategoryId,
        lastSyncedAt: new Date(),
        syncStatus,
        syncError: syncError || null,
      })
      .where(eq(ifoodProductMapping.id, existing.id));
  } else {
    await database.insert(ifoodProductMapping).values({
      establishmentId,
      localProductId,
      localCategoryId,
      ifoodItemId,
      ifoodProductId,
      ifoodCategoryId,
      ifoodCatalogId,
      lastSyncedAt: new Date(),
      syncStatus,
      syncError: syncError || null,
    });
  }
}

/**
 * Save or update a category mapping
 */
async function upsertCategoryMapping(
  establishmentId: number,
  localCategoryId: number,
  ifoodCategoryId: string,
  ifoodCatalogId: string
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  
  const existing = await getCategoryMapping(establishmentId, localCategoryId);
  
  if (existing) {
    await database.update(ifoodCategoryMapping)
      .set({
        ifoodCategoryId,
        ifoodCatalogId,
        lastSyncedAt: new Date(),
      })
      .where(eq(ifoodCategoryMapping.id, existing.id));
  } else {
    await database.insert(ifoodCategoryMapping).values({
      establishmentId,
      localCategoryId,
      ifoodCategoryId,
      ifoodCatalogId,
      lastSyncedAt: new Date(),
    });
  }
}

// ==========================================
// IMAGE UPLOAD
// ==========================================

/**
 * Upload an image to iFood from a URL
 * Returns the imagePath to use in PUT /items
 */
export async function uploadImageToIfood(
  establishmentId: number,
  merchantId: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const token = await getAccessTokenForEstablishment(establishmentId);
    
    // Download the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      logger.error(`[iFood Sync] Failed to download image from ${imageUrl}: ${imageResponse.status}`);
      return null;
    }
    
    let imageBuffer: Buffer = Buffer.from(await imageResponse.arrayBuffer()) as Buffer;
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    
    // iFood only supports jpg, jpeg, png - convert webp/other formats to jpeg
    let mimeType = "image/jpeg";
    const isWebp = contentType.includes("webp") || imageUrl.toLowerCase().endsWith(".webp");
    const isSvg = contentType.includes("svg");
    const isGif = contentType.includes("gif");
    
    if (isWebp || isSvg || isGif) {
      // Convert unsupported formats to JPEG using sharp
      try {
        const sharp = (await import("sharp")).default;
        imageBuffer = await sharp(imageBuffer).jpeg({ quality: 85 }).toBuffer() as Buffer;
        mimeType = "image/jpeg";
        logger.info(`[iFood Sync] Converted ${contentType} image to JPEG`);
      } catch (convErr) {
        logger.error(`[iFood Sync] Failed to convert image format: ${convErr}`);
        return null;
      }
    } else if (contentType.includes("png")) {
      mimeType = "image/png";
    } else {
      mimeType = "image/jpeg";
    }
    
    // Check file size (5MB limit)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      // Try to compress if too large
      try {
        const sharp = (await import("sharp")).default;
        imageBuffer = await sharp(imageBuffer).jpeg({ quality: 60 }).toBuffer() as Buffer;
        mimeType = "image/jpeg";
        if (imageBuffer.length > 5 * 1024 * 1024) {
          logger.error(`[iFood Sync] Image still too large after compression (${imageBuffer.length} bytes)`);
          return null;
        }
      } catch {
        logger.error(`[iFood Sync] Image too large (${imageBuffer.length} bytes), max 5MB`);
        return null;
      }
    }
    
    // Convert to base64 data URI format as required by iFood API
    const base64Image = imageBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    const response = await ifoodApiCall(
      `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/image/upload/`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ image: dataUri }),
        headers: { "Content-Type": "application/json" },
      },
      { maxRetries: 1 }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[iFood Sync] Image upload failed: ${response.status} - ${errorText}`);
      return null;
    }
    
    const result = await response.json();
    logger.info(`[iFood Sync] Image uploaded successfully, imagePath: ${result.imagePath}`);
    return result.imagePath || null;
  } catch (error) {
    logger.error(`[iFood Sync] Image upload error: ${error}`);
    return null;
  }
}

// ==========================================
// BUILD PAYLOAD
// ==========================================

/**
 * Build the PUT /items payload from a local product.
 * Uses the iFood Catalog v2 format:
 * - item: the item entity (links product to category)
 * - products: array of product entities (main product + option products)
 * - optionGroups: array of option group entities with optionIds references
 * - options: array of option entities each referencing their own product
 */
export async function buildIfoodItemPayload(
  localProduct: any,
  ifoodCategoryId: string,
  existingMapping?: any
): Promise<IfoodItemPayload> {
  // Use existing IDs if updating, generate new ones if creating
  const itemId = existingMapping?.ifoodItemId || uuidv4();
  const productId = existingMapping?.ifoodProductId || uuidv4();
  
  // Get complement groups for this product
  const groups = await db.getComplementGroupsByProduct(localProduct.id);
  
  const price = parseFloat(String(localProduct.price)) || 0;
  const promotionalPrice = localProduct.promotionalPrice 
    ? parseFloat(String(localProduct.promotionalPrice)) 
    : undefined;
  
  // Build the products array (main product + option products)
  const productsArray: IfoodItemPayload["products"] = [];
  const optionGroupsArray: NonNullable<IfoodItemPayload["optionGroups"]> = [];
  const optionsArray: NonNullable<IfoodItemPayload["options"]> = [];
  
  // Process complement groups into iFood v2 format
  const activeGroups = groups.filter(g => g.isActive && g.items.length > 0);
  const mainProductOptionGroups: Array<{ id: string; min: number; max: number }> = [];
  
  for (let groupIndex = 0; groupIndex < activeGroups.length; groupIndex++) {
    const group = activeGroups[groupIndex];
    const groupId = uuidv4();
    const optionIds: string[] = [];
    
    const activeItems = group.items.filter(item => item.isActive);
    
    for (let itemIndex = 0; itemIndex < activeItems.length; itemIndex++) {
      const item = activeItems[itemIndex];
      const optionId = uuidv4();
      const optionProductId = uuidv4();
      
      optionIds.push(optionId);
      
      // Each option needs its own product in the products array
      productsArray.push({
        id: optionProductId,
        name: item.name,
        description: item.description || undefined,
        externalCode: `local_item_${item.id}`,
        serving: "NOT_APPLICABLE",
        dietaryRestrictions: null,
        ean: "",
        quantity: null,
        optionGroups: null,
      });
      
      // Add option to options array
      optionsArray.push({
        id: optionId,
        status: "AVAILABLE",
        index: itemIndex,
        productId: optionProductId,
        price: {
          value: parseFloat(String(item.price)) || 0,
        },
        externalCode: `local_item_${item.id}`,
        fractions: null,
      });
    }
    
    // Add option group with optionIds references
    optionGroupsArray.push({
      id: groupId,
      name: group.name,
      externalCode: `local_group_${group.id}`,
      status: "AVAILABLE",
      index: groupIndex,
      optionGroupType: "DEFAULT",
      optionIds,
    });
    
    // Reference from main product
    mainProductOptionGroups.push({
      id: groupId,
      min: group.minQuantity,
      max: group.maxQuantity,
    });
  }
  
  // Add main product to products array (first position)
  productsArray.unshift({
    id: productId,
    name: localProduct.name,
    description: localProduct.description || undefined,
    externalCode: `local_product_${localProduct.id}`,
    imagePath: "", // Will be set after image upload
    serving: "NOT_APPLICABLE",
    dietaryRestrictions: [],
    ean: "",
    quantity: null,
    optionGroups: mainProductOptionGroups.length > 0 ? mainProductOptionGroups : null,
  });
  
  return {
    item: {
      id: itemId,
      type: "DEFAULT",
      categoryId: ifoodCategoryId,
      status: localProduct.status === "active" ? "AVAILABLE" : "UNAVAILABLE",
      price: {
        value: promotionalPrice || price,
        originalValue: promotionalPrice ? price : undefined,
      },
      externalCode: `local_product_${localProduct.id}`,
      index: localProduct.sortOrder || 0,
      productId: productId,
      shifts: null,
      tags: null,
    },
    products: productsArray,
    optionGroups: optionGroupsArray.length > 0 ? optionGroupsArray : undefined,
    options: optionsArray.length > 0 ? optionsArray : undefined,
  };
}

// ==========================================
// PUBLISH FUNCTIONS
// ==========================================

/**
 * Publish a single local product to iFood
 */
export async function publishProductToIfood(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  localProductId: number,
  ifoodCategoryId: string
): Promise<PublishResult> {
  try {
    // Get the local product
    const localProduct = await db.getProductById(localProductId);
    if (!localProduct) {
      return { success: false, error: "Produto não encontrado" };
    }
    
    // Check for existing mapping
    const existingMapping = await getProductMapping(establishmentId, localProductId);
    
    // Build the payload
    const payload = await buildIfoodItemPayload(localProduct, ifoodCategoryId, existingMapping);
    
    // Upload image if available
    if (localProduct.images && localProduct.images.length > 0) {
      const imagePath = await uploadImageToIfood(establishmentId, merchantId, localProduct.images[0]);
      if (imagePath) {
        // Set imagePath on the main product (the one referenced by item.productId)
        const mainProduct = payload.products.find(p => p.id === payload.item.productId);
        if (mainProduct) {
          mainProduct.imagePath = imagePath;
        }
      }
    }
    
    // Send PUT /items to iFood
    const token = await getAccessTokenForEstablishment(establishmentId);
    const response = await ifoodApiCall(
      `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/items`,
      {
        method: "PUT",
        token,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      },
      { maxRetries: 2 }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[iFood Sync] PUT /items failed for product ${localProductId}: ${response.status} - ${errorText}`);
      
      // Handle "concurrently modified" or "not found" errors by clearing stale mapping and retrying with new IDs
      const isStaleMapping = (
        errorText.includes("concurrently modified") ||
        errorText.includes("not found") ||
        errorText.includes("does not exist") ||
        response.status === 404
      );
      
      if (isStaleMapping && existingMapping) {
        logger.info(`[iFood Sync] Stale mapping detected for product ${localProductId}. Clearing mapping and retrying with new IDs...`);
        // Remove the stale mapping
        await removeProductMapping(establishmentId, localProductId);
        // Rebuild payload with new UUIDs (no existing mapping)
        const freshPayload = await buildIfoodItemPayload(localProduct, ifoodCategoryId, undefined);
        // Re-upload image if available
        if (localProduct.images && localProduct.images.length > 0) {
          const imagePath = await uploadImageToIfood(establishmentId, merchantId, localProduct.images[0]);
          if (imagePath) {
            const mainProduct = freshPayload.products.find((p: any) => p.id === freshPayload.item.productId);
            if (mainProduct) {
              mainProduct.imagePath = imagePath;
            }
          }
        }
        // Retry with fresh IDs
        const retryResponse = await ifoodApiCall(
          `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/items`,
          {
            method: "PUT",
            token,
            body: JSON.stringify(freshPayload),
            headers: { "Content-Type": "application/json" },
          },
          { maxRetries: 2 }
        );
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          logger.error(`[iFood Sync] Retry also failed for product ${localProductId}: ${retryResponse.status} - ${retryErrorText}`);
          await upsertProductMapping(
            establishmentId,
            localProductId,
            localProduct.categoryId,
            freshPayload.item.id,
            freshPayload.item.productId,
            ifoodCategoryId,
            catalogId,
            "error",
            `${retryResponse.status}: ${retryErrorText}`
          );
          return { success: false, error: `Erro ${retryResponse.status}: ${retryErrorText}` };
        }
        // Retry succeeded - save new mapping
        await upsertProductMapping(
          establishmentId,
          localProductId,
          localProduct.categoryId,
          freshPayload.item.id,
          freshPayload.item.productId,
          ifoodCategoryId,
          catalogId,
          "synced"
        );
        invalidateCatalogCache(establishmentId);
        logger.info(`[iFood Sync] Product ${localProduct.name} (${localProductId}) re-published with fresh IDs after stale mapping`);
        return {
          success: true,
          ifoodItemId: freshPayload.item.id,
          ifoodProductId: freshPayload.item.productId,
        };
      }
      
      // Save error mapping for other errors
      await upsertProductMapping(
        establishmentId,
        localProductId,
        localProduct.categoryId,
        payload.item.id,
        payload.item.productId,
        ifoodCategoryId,
        catalogId,
        "error",
        `${response.status}: ${errorText}`
      );
      return { success: false, error: `Erro ${response.status}: ${errorText}` };
    }
    
    // Save successful mapping
    await upsertProductMapping(
      establishmentId,
      localProductId,
      localProduct.categoryId,
      payload.item.id,
      payload.item.productId,
      ifoodCategoryId,
      catalogId,
      "synced"
    );
    
    // Invalidate catalog cache
    invalidateCatalogCache(establishmentId);
    
    logger.info(`[iFood Sync] Product ${localProduct.name} (${localProductId}) published to iFood as item ${payload.item.id}`);
    
    return {
      success: true,
      ifoodItemId: payload.item.id,
      ifoodProductId: payload.item.productId,
    };
  } catch (error: any) {
    logger.error(`[iFood Sync] Error publishing product ${localProductId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Ensure a local category exists in iFood, creating it if needed
 * Returns the iFood category ID
 */
export async function ensureCategoryInIfood(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  localCategoryId: number
): Promise<string | null> {
  // Check existing mapping
  const existingMapping = await getCategoryMapping(establishmentId, localCategoryId);
  if (existingMapping) {
    // Verify the category still exists on iFood by trying to fetch it
    try {
      const token = await getAccessTokenForEstablishment(establishmentId);
      const verifyResponse = await ifoodApiCall(
        `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${existingMapping.ifoodCategoryId}`,
        { method: "GET", token },
        { maxRetries: 1 }
      );
      if (verifyResponse.ok) {
        return existingMapping.ifoodCategoryId;
      }
      // Category doesn't exist anymore on iFood - clear the stale mapping
      logger.info(`[iFood Sync] Category mapping ${existingMapping.ifoodCategoryId} is stale (status ${verifyResponse.status}). Clearing and recreating...`);
      const database = await getDb();
      if (database) {
        await database.delete(ifoodCategoryMapping)
          .where(eq(ifoodCategoryMapping.id, existingMapping.id));
      }
    } catch (error: any) {
      logger.error(`[iFood Sync] Error verifying category: ${error.message}. Will try to recreate.`);
      // Clear stale mapping on error too
      const database = await getDb();
      if (database) {
        await database.delete(ifoodCategoryMapping)
          .where(eq(ifoodCategoryMapping.id, existingMapping.id));
      }
    }
  }
  
  // Get local category
  const database = await getDb();
  if (!database) return null;
  
  const localCats = await database.select().from(categories)
    .where(eq(categories.id, localCategoryId))
    .limit(1);
  
  if (localCats.length === 0) return null;
  const localCategory = localCats[0];
  
  // Create category in iFood
  try {
    const token = await getAccessTokenForEstablishment(establishmentId);
    const response = await ifoodApiCall(
      `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories`,
      {
        method: "POST",
        token,
        body: JSON.stringify({
          name: localCategory.name,
          status: "AVAILABLE",
          template: "DEFAULT",
          sequence: localCategory.sortOrder || 0,
          externalCode: `local_cat_${localCategory.id}`,
        }),
        headers: { "Content-Type": "application/json" },
      },
      { maxRetries: 1 }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[iFood Sync] Failed to create category ${localCategory.name}: ${response.status} - ${errorText}`);
      return null;
    }
    
    const result = await response.json();
    const ifoodCategoryId = result.id;
    
    // Save mapping
    await upsertCategoryMapping(establishmentId, localCategoryId, ifoodCategoryId, catalogId);
    
    logger.info(`[iFood Sync] Category ${localCategory.name} created in iFood as ${ifoodCategoryId}`);
    return ifoodCategoryId;
  } catch (error: any) {
    logger.error(`[iFood Sync] Error creating category: ${error.message}`);
    return null;
  }
}

/**
 * Publish all products in a local category to iFood
 */
export async function publishCategoryToIfood(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  localCategoryId: number
): Promise<SyncAllResult> {
  const result: SyncAllResult = { total: 0, published: 0, updated: 0, failed: 0, errors: [] };
  
  // Ensure category exists in iFood
  const ifoodCategoryId = await ensureCategoryInIfood(establishmentId, merchantId, catalogId, localCategoryId);
  if (!ifoodCategoryId) {
    return { ...result, errors: [{ productId: 0, productName: "", error: "Falha ao criar/encontrar categoria no iFood" }] };
  }
  
  // Get all active products in this category
  // Use draft version since the UI displays draft categories and their IDs
  const { products: localProducts } = await db.getProductsByEstablishment(establishmentId, {
    categoryId: localCategoryId,
    status: "active",
    version: "draft",
  });
  
  result.total = localProducts.length;
  
  for (const product of localProducts) {
    const existingMapping = await getProductMapping(establishmentId, product.id);
    const publishResult = await publishProductToIfood(
      establishmentId, merchantId, catalogId, product.id, ifoodCategoryId
    );
    
    if (publishResult.success) {
      if (existingMapping) {
        result.updated++;
      } else {
        result.published++;
      }
    } else {
      result.failed++;
      result.errors.push({
        productId: product.id,
        productName: product.name,
        error: publishResult.error || "Erro desconhecido",
      });
    }
  }
  
  return result;
}

/**
 * Sync ALL local products to iFood (all categories)
 */
export async function syncAllToIfood(
  establishmentId: number,
  merchantId: string,
  catalogId: string
): Promise<SyncAllResult> {
  const result: SyncAllResult = { total: 0, published: 0, updated: 0, failed: 0, errors: [] };
  
  // Get all local categories for this establishment
  const database = await getDb();
  if (!database) return result;
  
  // Use draft categories since the UI displays draft version by default
  const localCategories = await database.select().from(categories)
    .where(and(
      eq(categories.establishmentId, establishmentId),
      eq(categories.version, 'draft')
    ));
  
  for (const category of localCategories) {
    const categoryResult = await publishCategoryToIfood(
      establishmentId, merchantId, catalogId, category.id
    );
    
    result.total += categoryResult.total;
    result.published += categoryResult.published;
    result.updated += categoryResult.updated;
    result.failed += categoryResult.failed;
    result.errors.push(...categoryResult.errors);
  }
  
  // Also handle products without a category
  const { products: uncategorizedProducts } = await db.getProductsByEstablishment(establishmentId, {
    status: "active",
    version: "draft",
  });
  
  const uncategorized = uncategorizedProducts.filter(p => !p.categoryId);
  if (uncategorized.length > 0) {
    // Create a "Outros" category in iFood for uncategorized products
    const token = await getAccessTokenForEstablishment(establishmentId);
    let othersCategoryId: string | null = null;
    
    try {
      const response = await ifoodApiCall(
        `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            name: "Outros",
            status: "AVAILABLE",
            template: "DEFAULT",
            sequence: 999,
          }),
          headers: { "Content-Type": "application/json" },
        },
        { maxRetries: 1 }
      );
      
      if (response.ok) {
        const cat = await response.json();
        othersCategoryId = cat.id;
      }
    } catch (error) {
      logger.error(`[iFood Sync] Error creating 'Outros' category: ${error}`);
    }
    
    if (othersCategoryId) {
      for (const product of uncategorized) {
        result.total++;
        const existingMapping = await getProductMapping(establishmentId, product.id);
        const publishResult = await publishProductToIfood(
          establishmentId, merchantId, catalogId, product.id, othersCategoryId
        );
        
        if (publishResult.success) {
          if (existingMapping) result.updated++;
          else result.published++;
        } else {
          result.failed++;
          result.errors.push({
            productId: product.id,
            productName: product.name,
            error: publishResult.error || "Erro desconhecido",
          });
        }
      }
    }
  }
  
  return result;
}

// ==========================================
// AUTO-SYNC HOOKS
// ==========================================

/**
 * Auto-sync product price to iFood when changed locally
 * Call this after updating a product's price in the local database
 */
export async function autoSyncPrice(
  establishmentId: number,
  merchantId: string,
  localProductId: number,
  newPrice: number,
  originalPrice?: number
): Promise<boolean> {
  const mapping = await getProductMapping(establishmentId, localProductId);
  if (!mapping || mapping.syncStatus === "error") {
    logger.info(`[iFood Sync] No mapping for product ${localProductId}, skipping auto-sync price`);
    return false;
  }
  
  try {
    const token = await getAccessTokenForEstablishment(establishmentId);
    
    const pricePayload: any = {
      value: newPrice,
    };
    if (originalPrice && originalPrice !== newPrice) {
      pricePayload.originalValue = originalPrice;
    }
    
    const response = await ifoodApiCall(
      `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${mapping.ifoodCatalogId}/products/${mapping.ifoodProductId}/price`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify(pricePayload),
        headers: { "Content-Type": "application/json" },
      },
      { maxRetries: 1 }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[iFood Sync] Auto-sync price failed for product ${localProductId}: ${response.status} - ${errorText}`);
      return false;
    }
    
    // Update mapping timestamp
    const database = await getDb();
    if (database) {
      await database.update(ifoodProductMapping)
        .set({ lastSyncedAt: new Date(), syncStatus: "synced" })
        .where(eq(ifoodProductMapping.id, mapping.id));
    }
    
    invalidateCatalogCache(establishmentId);
    logger.info(`[iFood Sync] Auto-synced price for product ${localProductId}: R$ ${newPrice}`);
    return true;
  } catch (error: any) {
    logger.error(`[iFood Sync] Auto-sync price error: ${error.message}`);
    return false;
  }
}

/**
 * Auto-sync product status to iFood when changed locally
 * Call this after toggling a product's status in the local database
 */
export async function autoSyncStatus(
  establishmentId: number,
  merchantId: string,
  localProductId: number,
  newStatus: "active" | "paused" | "archived"
): Promise<boolean> {
  const mapping = await getProductMapping(establishmentId, localProductId);
  if (!mapping || mapping.syncStatus === "error") {
    logger.info(`[iFood Sync] No mapping for product ${localProductId}, skipping auto-sync status`);
    return false;
  }
  
  try {
    const token = await getAccessTokenForEstablishment(establishmentId);
    const ifoodStatus = newStatus === "active" ? "AVAILABLE" : "UNAVAILABLE";
    
    const response = await ifoodApiCall(
      `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${mapping.ifoodCatalogId}/products/${mapping.ifoodProductId}/status`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: ifoodStatus }),
        headers: { "Content-Type": "application/json" },
      },
      { maxRetries: 1 }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[iFood Sync] Auto-sync status failed for product ${localProductId}: ${response.status} - ${errorText}`);
      return false;
    }
    
    // Update mapping timestamp
    const database = await getDb();
    if (database) {
      await database.update(ifoodProductMapping)
        .set({ lastSyncedAt: new Date(), syncStatus: "synced" })
        .where(eq(ifoodProductMapping.id, mapping.id));
    }
    
    invalidateCatalogCache(establishmentId);
    logger.info(`[iFood Sync] Auto-synced status for product ${localProductId}: ${ifoodStatus}`);
    return true;
  } catch (error: any) {
    logger.error(`[iFood Sync] Auto-sync status error: ${error.message}`);
    return false;
  }
}

/**
 * Remove a product mapping (when product is deleted locally)
 */
export async function removeProductMapping(establishmentId: number, localProductId: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  
  await database.delete(ifoodProductMapping)
    .where(and(
      eq(ifoodProductMapping.establishmentId, establishmentId),
      eq(ifoodProductMapping.localProductId, localProductId)
    ));
}
