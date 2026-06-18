/**
 * Migration script: Create draft copies of all existing published catalog data
 * 
 * This script:
 * 1. Sets all existing records to version='published' (they should already be, but ensure)
 * 2. For each establishment, duplicates categories, products, complementGroups, and complementItems as version='draft'
 * 3. Maps IDs so draft products point to draft categories, draft complementGroups point to draft products, etc.
 * 4. Sets publishedSourceId on draft records to track the correspondence
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL + '&multipleStatements=true');
  
  try {
    console.log('Starting draft/published migration...');
    
    // Step 1: Ensure all existing records are marked as 'published'
    console.log('Step 1: Marking all existing records as published...');
    await connection.execute("UPDATE categories SET version = 'published' WHERE version IS NULL OR version = ''");
    await connection.execute("UPDATE products SET version = 'published' WHERE version IS NULL OR version = ''");
    await connection.execute("UPDATE complementGroups SET version = 'published' WHERE version IS NULL OR version = ''");
    await connection.execute("UPDATE complementItems SET version = 'published' WHERE version IS NULL OR version = ''");
    
    // Step 2: Get all establishments that have categories or products
    const [establishments] = await connection.execute(`
      SELECT DISTINCT establishmentId FROM categories WHERE version = 'published'
      UNION
      SELECT DISTINCT establishmentId FROM products WHERE version = 'published'
    `);
    
    console.log(`Found ${establishments.length} establishments to migrate`);
    
    for (const est of establishments) {
      const estId = est.establishmentId;
      console.log(`\nMigrating establishment ${estId}...`);
      
      // Check if draft data already exists for this establishment
      const [existingDraft] = await connection.execute(
        "SELECT COUNT(*) as cnt FROM categories WHERE establishmentId = ? AND version = 'draft'",
        [estId]
      );
      if (existingDraft[0].cnt > 0) {
        console.log(`  Skipping - draft data already exists (${existingDraft[0].cnt} draft categories)`);
        continue;
      }
      
      await connection.beginTransaction();
      
      try {
        // Maps: publishedId -> draftId
        const categoryIdMap = new Map();
        const productIdMap = new Map();
        const groupIdMap = new Map();
        
        // Step 2a: Duplicate categories
        const [pubCategories] = await connection.execute(
          "SELECT * FROM categories WHERE establishmentId = ? AND version = 'published'",
          [estId]
        );
        
        for (const cat of pubCategories) {
          const [result] = await connection.execute(
            `INSERT INTO categories (establishmentId, name, description, sortOrder, isActive, availabilityType, availableDays, availableHours, isUpsell, version, publishedSourceId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
            [cat.establishmentId, cat.name, cat.description, cat.sortOrder, cat.isActive, cat.availabilityType, 
             cat.availableDays ? JSON.stringify(cat.availableDays) : null,
             cat.availableHours ? JSON.stringify(cat.availableHours) : null,
             cat.isUpsell, cat.id]
          );
          categoryIdMap.set(cat.id, result.insertId);
        }
        console.log(`  Duplicated ${pubCategories.length} categories`);
        
        // Step 2b: Duplicate products (mapping categoryId to draft category)
        const [pubProducts] = await connection.execute(
          "SELECT * FROM products WHERE establishmentId = ? AND version = 'published'",
          [estId]
        );
        
        for (const prod of pubProducts) {
          const draftCategoryId = prod.categoryId ? (categoryIdMap.get(prod.categoryId) || prod.categoryId) : null;
          const [result] = await connection.execute(
            `INSERT INTO products (establishmentId, categoryId, name, description, price, images, enhancedImages, blurPlaceholder, status, stockQuantity, hasStock, sortOrder, salesCount, printerId, isCombo, cost, isUpsellPinned, promotionalPrice, version, publishedSourceId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
            [prod.establishmentId, draftCategoryId, prod.name, prod.description, prod.price,
             prod.images ? JSON.stringify(prod.images) : null,
             prod.enhancedImages ? JSON.stringify(prod.enhancedImages) : null,
             prod.blurPlaceholder, prod.status, prod.stockQuantity, prod.hasStock, prod.sortOrder,
             prod.salesCount, prod.printerId, prod.isCombo, prod.cost, prod.isUpsellPinned,
             prod.promotionalPrice, prod.id]
          );
          productIdMap.set(prod.id, result.insertId);
        }
        console.log(`  Duplicated ${pubProducts.length} products`);
        
        // Step 2c: Duplicate complement groups (mapping productId to draft product)
        const [pubGroups] = await connection.execute(
          `SELECT cg.* FROM complementGroups cg
           INNER JOIN products p ON cg.productId = p.id
           WHERE p.establishmentId = ? AND cg.version = 'published'`,
          [estId]
        );
        
        for (const grp of pubGroups) {
          const draftProductId = productIdMap.get(grp.productId) || grp.productId;
          const [result] = await connection.execute(
            `INSERT INTO complementGroups (productId, name, minQuantity, maxQuantity, isRequired, isActive, sortOrder, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [draftProductId, grp.name, grp.minQuantity, grp.maxQuantity, grp.isRequired, grp.isActive, grp.sortOrder]
          );
          groupIdMap.set(grp.id, result.insertId);
        }
        console.log(`  Duplicated ${pubGroups.length} complement groups`);
        
        // Step 2d: Duplicate complement items (mapping groupId to draft group)
        const [pubItems] = await connection.execute(
          `SELECT ci.* FROM complementItems ci
           INNER JOIN complementGroups cg ON ci.groupId = cg.id
           INNER JOIN products p ON cg.productId = p.id
           WHERE p.establishmentId = ? AND ci.version = 'published'`,
          [estId]
        );
        
        for (const item of pubItems) {
          const draftGroupId = groupIdMap.get(item.groupId) || item.groupId;
          // Map exclusiveProductId to draft product if set
          const draftExclusiveProductId = item.exclusiveProductId ? (productIdMap.get(item.exclusiveProductId) || item.exclusiveProductId) : null;
          await connection.execute(
            `INSERT INTO complementItems (groupId, name, price, imageUrl, isActive, priceMode, sortOrder, availabilityType, availableDays, availableHours, badgeText, freeOnDelivery, freeOnPickup, freeOnDineIn, description, exclusiveProductId, hasStock, stockQuantity, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [draftGroupId, item.name, item.price, item.imageUrl, item.isActive, item.priceMode, item.sortOrder,
             item.availabilityType,
             item.availableDays ? JSON.stringify(item.availableDays) : null,
             item.availableHours ? JSON.stringify(item.availableHours) : null,
             item.badgeText, item.freeOnDelivery, item.freeOnPickup, item.freeOnDineIn,
             item.description, draftExclusiveProductId, item.hasStock, item.stockQuantity]
          );
        }
        console.log(`  Duplicated ${pubItems.length} complement items`);
        
        await connection.commit();
        console.log(`  ✓ Establishment ${estId} migrated successfully`);
        
      } catch (err) {
        await connection.rollback();
        console.error(`  ✗ Error migrating establishment ${estId}:`, err.message);
      }
    }
    
    // Step 3: Summary
    const [catCount] = await connection.execute("SELECT version, COUNT(*) as cnt FROM categories GROUP BY version");
    const [prodCount] = await connection.execute("SELECT version, COUNT(*) as cnt FROM products GROUP BY version");
    const [grpCount] = await connection.execute("SELECT version, COUNT(*) as cnt FROM complementGroups GROUP BY version");
    const [itemCount] = await connection.execute("SELECT version, COUNT(*) as cnt FROM complementItems GROUP BY version");
    
    console.log('\n=== Migration Summary ===');
    console.log('Categories:', catCount);
    console.log('Products:', prodCount);
    console.log('Complement Groups:', grpCount);
    console.log('Complement Items:', itemCount);
    console.log('\n✓ Migration complete!');
    
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
