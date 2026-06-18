import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { categories, products, complementGroups, complementItems, complementSubstitutions } from "../../drizzle/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { logger } from "../_core/logger";

/**
 * Catalog Version Router
 * Handles Draft vs Published catalog operations
 */
export const catalogVersionRouter = router({
  /**
   * Get version stats: count of draft vs published items
   * Compares ALL relevant fields to detect ANY change as pending
   * Optimized: uses batch queries instead of N+1 loops
   */
  stats: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const estId = input.establishmentId;

      // Count draft items
      const [draftCats] = await dbInstance.select({ count: sql<number>`COUNT(*)` }).from(categories)
        .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'draft')));
      const [draftProds] = await dbInstance.select({ count: sql<number>`COUNT(*)` }).from(products)
        .where(and(eq(products.establishmentId, estId), eq(products.version, 'draft')));

      // Count published items
      const [pubCats] = await dbInstance.select({ count: sql<number>`COUNT(*)` }).from(categories)
        .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'published')));
      const [pubProds] = await dbInstance.select({ count: sql<number>`COUNT(*)` }).from(products)
        .where(and(eq(products.establishmentId, estId), eq(products.version, 'published')));

      // Quick check: if counts differ, there are pending changes
      if (draftCats.count !== pubCats.count || draftProds.count !== pubProds.count) {
        return {
          draft: { categories: draftCats.count, products: draftProds.count },
          published: { categories: pubCats.count, products: pubProds.count },
          hasPendingChanges: true,
        };
      }

      type CategorySnapshot = {
        id: number;
        publishedSourceId: number | null;
        name: string;
        sortOrder: number | null;
        isActive: boolean | null;
        description: string | null;
      };

      type ProductSnapshot = {
        id: number;
        categoryId: number | null;
        name: string;
        description: string | null;
        price: string;
        promotionalPrice: string | null;
        images: unknown;
        status: string;
        stockQuantity: number | null;
        hasStock: boolean | null;
        sortOrder: number | null;
        isCombo: boolean | null;
        isUpsellPinned: boolean | null;
      };

      type ComplementGroupSnapshot = {
        id: number;
        productId: number;
        name: string;
        minQuantity: number | null;
        maxQuantity: number | null;
        isRequired: boolean | null;
        isActive: boolean | null;
        sortOrder: number | null;
      };

      type ComplementItemSnapshot = {
        id: number;
        groupId: number;
        name: string;
        price: string;
        isActive: boolean | null;
        priceMode: string | null;
        sortOrder: number | null;
        hasStock: boolean | null;
        stockQuantity: number | null;
        freeOnDelivery: boolean | null;
        freeOnPickup: boolean | null;
        freeOnDineIn: boolean | null;
        description: string | null;
        imageUrl: string | null;
      };

      const canonicalJson = (value: unknown) => JSON.stringify(value);
      const canonicalMultiset = (items: unknown[]) => items.map(canonicalJson).sort();
      const sameCanonicalMultiset = (left: unknown[], right: unknown[]) =>
        JSON.stringify(canonicalMultiset(left)) === JSON.stringify(canonicalMultiset(right));

      const categoryContent = (category: CategorySnapshot) => ({
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        description: category.description,
      });

      const buildCategoryKeyById = (categoryList: CategorySnapshot[]) => {
        const byId = new Map<number, string>();
        for (const category of categoryList) {
          byId.set(category.id, canonicalJson(categoryContent(category)));
        }
        return byId;
      };

      const normalizeItems = (items: ComplementItemSnapshot[], substitutionsByItemId: Map<number, Array<{ name: string; additionalPrice: number; isActive: boolean }>>) =>
        items
          .map((item) => ({
            name: item.name,
            price: item.price,
            isActive: item.isActive,
            priceMode: item.priceMode,
            sortOrder: item.sortOrder,
            hasStock: item.hasStock,
            stockQuantity: item.stockQuantity,
            freeOnDelivery: item.freeOnDelivery,
            freeOnPickup: item.freeOnPickup,
            freeOnDineIn: item.freeOnDineIn,
            description: item.description,
            imageUrl: item.imageUrl,
            substitutions: (substitutionsByItemId.get(item.id) || [])
              .sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b))),
          }))
          .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));

      const normalizeGroups = (groups: ComplementGroupSnapshot[], itemsByGroupId: Map<number, ComplementItemSnapshot[]>, substitutionsByItemId: Map<number, Array<{ name: string; additionalPrice: number; isActive: boolean }>>) =>
        groups
          .map((group) => ({
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            isActive: group.isActive,
            sortOrder: group.sortOrder,
            items: normalizeItems(itemsByGroupId.get(group.id) ?? [], substitutionsByItemId),
          }))
          .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));

      const groupByNumberKey = <TItem,>(items: TItem[], getKey: (item: TItem) => number) => {
        const grouped = new Map<number, TItem[]>();
        for (const item of items) {
          const key = getKey(item);
          const current = grouped.get(key) ?? [];
          current.push(item);
          grouped.set(key, current);
        }
        return grouped;
      };

      const normalizeProducts = (
        productList: ProductSnapshot[],
        categoryKeyById: Map<number, string>,
        groupsByProductId: Map<number, ComplementGroupSnapshot[]>,
        itemsByGroupId: Map<number, ComplementItemSnapshot[]>,
        substitutionsByItemId: Map<number, Array<{ name: string; additionalPrice: number; isActive: boolean }>>,
      ) =>
        productList.map((product) => ({
          categoryKey: product.categoryId ? (categoryKeyById.get(product.categoryId) ?? null) : null,
          name: product.name,
          description: product.description,
          price: product.price,
          promotionalPrice: product.promotionalPrice,
          images: product.images,
          status: product.status,
          stockQuantity: product.stockQuantity,
          hasStock: product.hasStock,
          sortOrder: product.sortOrder,
          isCombo: product.isCombo,
          isUpsellPinned: product.isUpsellPinned,
          complementGroups: normalizeGroups(groupsByProductId.get(product.id) ?? [], itemsByGroupId, substitutionsByItemId),
        }));

      const fetchComplementSnapshot = async (productIds: number[], version: 'draft' | 'published') => {
        if (productIds.length === 0) {
          return {
            groupsByProductId: new Map<number, ComplementGroupSnapshot[]>(),
            itemsByGroupId: new Map<number, ComplementItemSnapshot[]>(),
          };
        }

        const groups = await dbInstance.select({
          id: complementGroups.id,
          productId: complementGroups.productId,
          name: complementGroups.name,
          minQuantity: complementGroups.minQuantity,
          maxQuantity: complementGroups.maxQuantity,
          isRequired: complementGroups.isRequired,
          isActive: complementGroups.isActive,
          sortOrder: complementGroups.sortOrder,
        }).from(complementGroups)
          .where(and(inArray(complementGroups.productId, productIds), eq(complementGroups.version, version)));

        const groupIds = groups.map((group) => group.id);
        let items: ComplementItemSnapshot[] = [];
        if (groupIds.length > 0) {
          items = await dbInstance.select({
            id: complementItems.id,
            groupId: complementItems.groupId,
            name: complementItems.name,
            price: complementItems.price,
            isActive: complementItems.isActive,
            priceMode: complementItems.priceMode,
            sortOrder: complementItems.sortOrder,
            hasStock: complementItems.hasStock,
            stockQuantity: complementItems.stockQuantity,
            freeOnDelivery: complementItems.freeOnDelivery,
            freeOnPickup: complementItems.freeOnPickup,
            freeOnDineIn: complementItems.freeOnDineIn,
            description: complementItems.description,
            imageUrl: complementItems.imageUrl,
          }).from(complementItems)
            .where(and(inArray(complementItems.groupId, groupIds), eq(complementItems.version, version)));
        }

        // Fetch substitutions for each complement item
        const itemIds = items.map(i => i.id);
        let substitutionsByItemId = new Map<number, Array<{ name: string; additionalPrice: number; isActive: boolean }>>();
        if (itemIds.length > 0) {
          const subs = await dbInstance.select({
            complementItemId: complementSubstitutions.complementItemId,
            name: complementSubstitutions.name,
            additionalPrice: complementSubstitutions.additionalPrice,
            isActive: complementSubstitutions.isActive,
          }).from(complementSubstitutions)
            .where(inArray(complementSubstitutions.complementItemId, itemIds));
          for (const sub of subs) {
            const existing = substitutionsByItemId.get(sub.complementItemId) || [];
            existing.push({ name: sub.name, additionalPrice: sub.additionalPrice, isActive: sub.isActive });
            substitutionsByItemId.set(sub.complementItemId, existing);
          }
        }
        return {
          groupsByProductId: groupByNumberKey(groups, (group) => group.productId),
          itemsByGroupId: groupByNumberKey(items, (item) => item.groupId),
          substitutionsByItemId,
        };
      };

      // Deep comparison: compare catalog content as canonical multisets.
      // This avoids false positives when draft and published contain duplicate product names/sort orders
      // and MySQL returns equal rows in a different physical order after publishing.
      const draftCategoriesList = await dbInstance.select({
        id: categories.id,
        publishedSourceId: categories.publishedSourceId,
        name: categories.name,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        description: categories.description,
      }).from(categories)
        .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'draft')));

      const publishedCategoriesList = await dbInstance.select({
        id: categories.id,
        publishedSourceId: categories.publishedSourceId,
        name: categories.name,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        description: categories.description,
      }).from(categories)
        .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'published')));

      const categoriesChanged = !sameCanonicalMultiset(
        draftCategoriesList.map(categoryContent),
        publishedCategoriesList.map(categoryContent),
      );

      if (categoriesChanged) {
        return {
          draft: { categories: draftCats.count, products: draftProds.count },
          published: { categories: pubCats.count, products: pubProds.count },
          hasPendingChanges: true,
        };
      }

      const draftCategoryKeyById = buildCategoryKeyById(draftCategoriesList);
      const publishedCategoryKeyById = buildCategoryKeyById(publishedCategoriesList);

      const draftProductsList = await dbInstance.select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        promotionalPrice: products.promotionalPrice,
        images: products.images,
        status: products.status,
        stockQuantity: products.stockQuantity,
        hasStock: products.hasStock,
        sortOrder: products.sortOrder,
        isCombo: products.isCombo,
        isUpsellPinned: products.isUpsellPinned,
      }).from(products)
        .where(and(eq(products.establishmentId, estId), eq(products.version, 'draft')));

      const publishedProductsList = await dbInstance.select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        promotionalPrice: products.promotionalPrice,
        images: products.images,
        status: products.status,
        stockQuantity: products.stockQuantity,
        hasStock: products.hasStock,
        sortOrder: products.sortOrder,
        isCombo: products.isCombo,
        isUpsellPinned: products.isUpsellPinned,
      }).from(products)
        .where(and(eq(products.establishmentId, estId), eq(products.version, 'published')));

      const draftComplements = await fetchComplementSnapshot(draftProductsList.map((product) => product.id), 'draft');
      const publishedComplements = await fetchComplementSnapshot(publishedProductsList.map((product) => product.id), 'published');

      const productsChanged = !sameCanonicalMultiset(
        normalizeProducts(
          draftProductsList,
          draftCategoryKeyById,
          draftComplements.groupsByProductId,
          draftComplements.itemsByGroupId,
          draftComplements.substitutionsByItemId,
        ),
        normalizeProducts(
          publishedProductsList,
          publishedCategoryKeyById,
          publishedComplements.groupsByProductId,
          publishedComplements.itemsByGroupId,
          publishedComplements.substitutionsByItemId,
        ),
      );

      return {
        draft: { categories: draftCats.count, products: draftProds.count },
        published: { categories: pubCats.count, products: pubProds.count },
        hasPendingChanges: productsChanged,
      };
    }),

  /**
   * Publish: sync published version to match current draft
   * Strategy: UPDATE existing published records, INSERT new ones, DELETE removed ones.
   * This keeps published IDs STABLE so customer carts remain valid.
   */
  publish: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const estId = input.establishmentId;
      logger.info(`[CatalogVersion] Publishing draft → published (stable IDs) for establishment ${estId}`);

      try {
        // ═══════════════════════════════════════════════════════════════
        // Step 1: Fetch all draft and published data
        // ═══════════════════════════════════════════════════════════════
        const draftCategories = await dbInstance.select().from(categories)
          .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'draft')))
          .orderBy(categories.sortOrder, categories.id);
        
        const draftProducts = await dbInstance.select().from(products)
          .where(and(eq(products.establishmentId, estId), eq(products.version, 'draft')))
          .orderBy(products.sortOrder, products.id);

        const pubCategoriesAll = await dbInstance.select().from(categories)
          .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'published')))
          .orderBy(categories.sortOrder, categories.id);

        const pubProductsAll = await dbInstance.select().from(products)
          .where(and(eq(products.establishmentId, estId), eq(products.version, 'published')))
          .orderBy(products.sortOrder, products.id);

        // ═══════════════════════════════════════════════════════════════
        // Step 2: CATEGORIES — Update/Insert/Delete
        // ═══════════════════════════════════════════════════════════════
        const categoryIdMap = new Map<number, number>(); // draftId → publishedId
        const pubCatIds = new Set(pubCategoriesAll.map(c => c.id));
        const usedPubCatIds = new Set<number>();

        for (const draftCat of draftCategories) {
          const existingPubId = draftCat.publishedSourceId;
          const { id, createdAt, updatedAt, version, publishedSourceId, ...catContentFields } = draftCat;

          if (existingPubId && pubCatIds.has(existingPubId) && !usedPubCatIds.has(existingPubId)) {
            // UPDATE existing published category (keep its ID)
            await dbInstance.update(categories).set({
              ...catContentFields,
              version: 'published',
              publishedSourceId: null,
            }).where(eq(categories.id, existingPubId));
            categoryIdMap.set(draftCat.id, existingPubId);
            usedPubCatIds.add(existingPubId);
          } else {
            // INSERT new published category
            const [result] = await dbInstance.insert(categories).values({
              ...catContentFields,
              version: 'published',
              publishedSourceId: null,
            });
            const newPubId = result.insertId;
            categoryIdMap.set(draftCat.id, newPubId);
            // Update draft's publishedSourceId to point to new published
            await dbInstance.update(categories).set({ publishedSourceId: newPubId }).where(eq(categories.id, draftCat.id));
          }
        }

        // DELETE published categories that no longer have a draft counterpart
        const orphanedPubCatIds = pubCategoriesAll
          .filter(c => !usedPubCatIds.has(c.id))
          .map(c => c.id);
        if (orphanedPubCatIds.length > 0) {
          await dbInstance.delete(categories).where(inArray(categories.id, orphanedPubCatIds));
        }

        // ═══════════════════════════════════════════════════════════════
        // Step 3: PRODUCTS — Update/Insert/Delete
        // ═══════════════════════════════════════════════════════════════
        const productIdMap = new Map<number, number>(); // draftId → publishedId
        const pubProdIds = new Set(pubProductsAll.map(p => p.id));
        const usedPubProdIds = new Set<number>();

        for (const draftProd of draftProducts) {
          const existingPubId = draftProd.publishedSourceId;
          const { id, createdAt, updatedAt, version, publishedSourceId, ...prodContentFields } = draftProd;
          // Map categoryId from draft to published
          const newCategoryId = draftProd.categoryId ? (categoryIdMap.get(draftProd.categoryId) ?? draftProd.categoryId) : draftProd.categoryId;

          if (existingPubId && pubProdIds.has(existingPubId) && !usedPubProdIds.has(existingPubId)) {
            // UPDATE existing published product (keep its ID!)
            await dbInstance.update(products).set({
              ...prodContentFields,
              categoryId: newCategoryId,
              version: 'published',
              publishedSourceId: null,
            }).where(eq(products.id, existingPubId));
            productIdMap.set(draftProd.id, existingPubId);
            usedPubProdIds.add(existingPubId);
          } else {
            // INSERT new published product
            const [result] = await dbInstance.insert(products).values({
              ...prodContentFields,
              categoryId: newCategoryId,
              version: 'published',
              publishedSourceId: null,
            });
            const newPubId = result.insertId;
            productIdMap.set(draftProd.id, newPubId);
            // Update draft's publishedSourceId
            await dbInstance.update(products).set({ publishedSourceId: newPubId }).where(eq(products.id, draftProd.id));
          }
        }

        // DELETE published products that no longer have a draft counterpart
        const orphanedPubProdIds = pubProductsAll
          .filter(p => !usedPubProdIds.has(p.id))
          .map(p => p.id);

        // ═══════════════════════════════════════════════════════════════
        // Step 4: COMPLEMENT GROUPS — Update/Insert/Delete
        // ═══════════════════════════════════════════════════════════════
        // Fetch all draft complement groups
        const draftProductIds = draftProducts.map(p => p.id);
        let draftGroups: any[] = [];
        if (draftProductIds.length > 0) {
          draftGroups = await dbInstance.select().from(complementGroups)
            .where(and(
              inArray(complementGroups.productId, draftProductIds),
              eq(complementGroups.version, 'draft')
            ));
        }

        // Fetch all published complement groups (for products that still exist AND orphaned ones)
        const allPubProdIds = pubProductsAll.map(p => p.id);
        let pubGroupsAll: any[] = [];
        if (allPubProdIds.length > 0) {
          pubGroupsAll = await dbInstance.select().from(complementGroups)
            .where(and(
              inArray(complementGroups.productId, allPubProdIds),
              eq(complementGroups.version, 'published')
            ));
        }

        const groupIdMap = new Map<number, number>(); // draftGroupId → publishedGroupId
        const usedPubGroupIds = new Set<number>();

        // For each draft group, find its corresponding published group via product mapping + name
        for (const draftGroup of draftGroups) {
          const pubProductId = productIdMap.get(draftGroup.productId);
          if (!pubProductId) continue; // shouldn't happen

          // Find existing published group for this product with same name
          const matchingPubGroup = pubGroupsAll.find(g => 
            g.productId === pubProductId && g.name === draftGroup.name && !usedPubGroupIds.has(g.id)
          );

          const { id, createdAt, updatedAt, version, ...groupContentFields } = draftGroup;

          if (matchingPubGroup) {
            // UPDATE existing published group (keep its ID)
            await dbInstance.update(complementGroups).set({
              ...groupContentFields,
              productId: pubProductId,
              version: 'published',
            }).where(eq(complementGroups.id, matchingPubGroup.id));
            groupIdMap.set(draftGroup.id, matchingPubGroup.id);
            usedPubGroupIds.add(matchingPubGroup.id);
          } else {
            // INSERT new published group
            const [result] = await dbInstance.insert(complementGroups).values({
              ...groupContentFields,
              productId: pubProductId,
              version: 'published',
            });
            groupIdMap.set(draftGroup.id, result.insertId);
          }
        }

        // DELETE orphaned published groups (from deleted products or renamed groups)
        const orphanedPubGroupIds = pubGroupsAll
          .filter(g => !usedPubGroupIds.has(g.id))
          .map(g => g.id);

        // ═══════════════════════════════════════════════════════════════
        // Step 5: COMPLEMENT ITEMS — Update/Insert/Delete
        // ═══════════════════════════════════════════════════════════════
        const draftGroupIds = draftGroups.map(g => g.id);
        let draftItems: any[] = [];
        if (draftGroupIds.length > 0) {
          draftItems = await dbInstance.select().from(complementItems)
            .where(and(
              inArray(complementItems.groupId, draftGroupIds),
              eq(complementItems.version, 'draft')
            ));
        }

        // Fetch all published complement items
        const allPubGroupIds = pubGroupsAll.map(g => g.id);
        let pubItemsAll: any[] = [];
        if (allPubGroupIds.length > 0) {
          pubItemsAll = await dbInstance.select().from(complementItems)
            .where(and(
              inArray(complementItems.groupId, allPubGroupIds),
              eq(complementItems.version, 'published')
            ));
        }

        const usedPubItemIds = new Set<number>();
        const itemIdMap = new Map<number, number>(); // draftItemId → publishedItemId

        for (const draftItem of draftItems) {
          const pubGroupId = groupIdMap.get(draftItem.groupId);
          if (!pubGroupId) continue;

          // Find existing published item for this group with same name
          const matchingPubItem = pubItemsAll.find(i =>
            i.groupId === pubGroupId && i.name === draftItem.name && !usedPubItemIds.has(i.id)
          );

          const { id, createdAt, updatedAt, version, ...itemContentFields } = draftItem;

          if (matchingPubItem) {
            // UPDATE existing published item (keep its ID)
            await dbInstance.update(complementItems).set({
              ...itemContentFields,
              groupId: pubGroupId,
              version: 'published',
            }).where(eq(complementItems.id, matchingPubItem.id));
            usedPubItemIds.add(matchingPubItem.id);
            itemIdMap.set(draftItem.id, matchingPubItem.id);
          } else {
            // INSERT new published item
            const [insertResult] = await dbInstance.insert(complementItems).values({
              ...itemContentFields,
              groupId: pubGroupId,
              version: 'published',
            });
            itemIdMap.set(draftItem.id, insertResult.insertId);
          }
        }

        // DELETE orphaned published items
        const orphanedPubItemIds = pubItemsAll
          .filter(i => !usedPubItemIds.has(i.id))
          .map(i => i.id);
        if (orphanedPubItemIds.length > 0) {
          await dbInstance.delete(complementItems).where(inArray(complementItems.id, orphanedPubItemIds));
        }

        // DELETE orphaned published groups
        if (orphanedPubGroupIds.length > 0) {
          // First delete any remaining items in orphaned groups
          await dbInstance.delete(complementItems)
            .where(and(
              inArray(complementItems.groupId, orphanedPubGroupIds),
              eq(complementItems.version, 'published')
            ));
          await dbInstance.delete(complementGroups).where(inArray(complementGroups.id, orphanedPubGroupIds));
        }

        // DELETE orphaned published products
        if (orphanedPubProdIds.length > 0) {
          // Clean up any complement groups/items for orphaned products
          const orphanedGroups = await dbInstance.select({ id: complementGroups.id }).from(complementGroups)
            .where(and(
              inArray(complementGroups.productId, orphanedPubProdIds),
              eq(complementGroups.version, 'published')
            ));
          const orphanedGroupIdsFromProds = orphanedGroups.map(g => g.id);
          if (orphanedGroupIdsFromProds.length > 0) {
            await dbInstance.delete(complementItems)
              .where(and(
                inArray(complementItems.groupId, orphanedGroupIdsFromProds),
                eq(complementItems.version, 'published')
              ));
            await dbInstance.delete(complementGroups).where(inArray(complementGroups.id, orphanedGroupIdsFromProds));
          }
          await dbInstance.delete(products).where(inArray(products.id, orphanedPubProdIds));
        }

        // ═══════════════════════════════════════════════════════════════
        // Step 6: COMPLEMENT SUBSTITUTIONS — Sync to published item IDs
        // ═══════════════════════════════════════════════════════════════
        // For each draft item that has substitutions, ensure the published item has the same
        const allDraftItemIds = draftItems.map(i => i.id);
        if (allDraftItemIds.length > 0) {
          // Fetch all substitutions for draft items
          const draftSubs = await dbInstance.select().from(complementSubstitutions)
            .where(inArray(complementSubstitutions.complementItemId, allDraftItemIds));
          
          // Get all published item IDs we mapped to
          const allPubItemIdsForSubs = Array.from(itemIdMap.values());
          
          // Delete existing substitutions for published items (we'll re-create them)
          if (allPubItemIdsForSubs.length > 0) {
            await dbInstance.delete(complementSubstitutions)
              .where(inArray(complementSubstitutions.complementItemId, allPubItemIdsForSubs));
          }
          
          // Insert substitutions for published items (mirroring draft)
          for (const draftSub of draftSubs) {
            const pubItemId = itemIdMap.get(draftSub.complementItemId);
            if (!pubItemId) continue;
            await dbInstance.insert(complementSubstitutions).values({
              complementItemId: pubItemId,
              name: draftSub.name,
              additionalPrice: draftSub.additionalPrice,
              imageUrl: draftSub.imageUrl,
              isActive: draftSub.isActive,
              sortOrder: draftSub.sortOrder,
            });
          }
        }

        // Invalidate public menu cache
        db.invalidatePublicMenuCache(estId);

        logger.info(`[CatalogVersion] Published successfully (stable IDs): ${draftCategories.length} categories, ${draftProducts.length} products, ${draftGroups.length} complement groups, ${draftItems.length} complement items`);

        return {
          success: true,
          published: {
            categories: draftCategories.length,
            products: draftProducts.length,
            complementGroups: draftGroups.length,
            complementItems: draftItems.length,
          },
        };
      } catch (error) {
        logger.error("[CatalogVersion] Publish failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao publicar catálogo" });
      }
    }),

  /**
   * Discard Draft: reset draft to match current published version
   * 1. Delete all draft items for this establishment
   * 2. Duplicate all published items as draft
   * Optimized: uses batch queries
   */
  discardDraft: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const estId = input.establishmentId;
      logger.info(`[CatalogVersion] Discarding draft for establishment ${estId}`);

      try {
        // Step 1: Get all published data
        const pubCategories = await dbInstance.select().from(categories)
          .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'published')));
        
        const pubProducts = await dbInstance.select().from(products)
          .where(and(eq(products.establishmentId, estId), eq(products.version, 'published')));

        const pubProductIds = pubProducts.map(p => p.id);
        let pubGroups: any[] = [];
        let pubItems: any[] = [];
        
        if (pubProductIds.length > 0) {
          pubGroups = await dbInstance.select().from(complementGroups)
            .where(and(
              inArray(complementGroups.productId, pubProductIds),
              eq(complementGroups.version, 'published')
            ));
          
          const pubGroupIds = pubGroups.map(g => g.id);
          if (pubGroupIds.length > 0) {
            pubItems = await dbInstance.select().from(complementItems)
              .where(and(
                inArray(complementItems.groupId, pubGroupIds),
                eq(complementItems.version, 'published')
              ));
          }
        }

        // Step 2: Delete all draft items in batch
        const draftProducts2 = await dbInstance.select({ id: products.id }).from(products)
          .where(and(eq(products.establishmentId, estId), eq(products.version, 'draft')));
        const draftProductIds = draftProducts2.map(p => p.id);

        if (draftProductIds.length > 0) {
          const draftGroups = await dbInstance.select({ id: complementGroups.id }).from(complementGroups)
            .where(and(
              inArray(complementGroups.productId, draftProductIds),
              eq(complementGroups.version, 'draft')
            ));
          const draftGroupIds = draftGroups.map(g => g.id);

          if (draftGroupIds.length > 0) {
            await dbInstance.delete(complementItems)
              .where(and(
                inArray(complementItems.groupId, draftGroupIds),
                eq(complementItems.version, 'draft')
              ));
          }

          await dbInstance.delete(complementGroups)
            .where(and(
              inArray(complementGroups.productId, draftProductIds),
              eq(complementGroups.version, 'draft')
            ));
        }
        
        await dbInstance.delete(products)
          .where(and(eq(products.establishmentId, estId), eq(products.version, 'draft')));
        await dbInstance.delete(categories)
          .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'draft')));

        // Step 3: Duplicate published as draft
        const categoryIdMap = new Map<number, number>();
        const productIdMap = new Map<number, number>();
        const groupIdMap = new Map<number, number>();

        for (const cat of pubCategories) {
          const { id, createdAt, updatedAt, ...catData } = cat;
          const [result] = await dbInstance.insert(categories).values({
            ...catData,
            version: 'draft',
            publishedSourceId: id,
          });
          categoryIdMap.set(id, result.insertId);
        }

        for (const prod of pubProducts) {
          const { id, createdAt, updatedAt, ...prodData } = prod;
          const newCategoryId = prod.categoryId ? categoryIdMap.get(prod.categoryId) ?? prod.categoryId : prod.categoryId;
          const [result] = await dbInstance.insert(products).values({
            ...prodData,
            categoryId: newCategoryId,
            version: 'draft',
            publishedSourceId: id,
          });
          productIdMap.set(id, result.insertId);
        }

        for (const group of pubGroups) {
          const { id, createdAt, updatedAt, ...groupData } = group;
          const newProductId = productIdMap.get(group.productId) ?? group.productId;
          const [result] = await dbInstance.insert(complementGroups).values({
            ...groupData,
            productId: newProductId,
            version: 'draft',
          });
          groupIdMap.set(id, result.insertId);
        }

        for (const item of pubItems) {
          const { id, createdAt, updatedAt, ...itemData } = item;
          const newGroupId = groupIdMap.get(item.groupId) ?? item.groupId;
          await dbInstance.insert(complementItems).values({
            ...itemData,
            groupId: newGroupId,
            version: 'draft',
          });
        }

        logger.info(`[CatalogVersion] Draft discarded and reset: ${pubCategories.length} categories, ${pubProducts.length} products`);

        return {
          success: true,
          restored: {
            categories: pubCategories.length,
            products: pubProducts.length,
            complementGroups: pubGroups.length,
            complementItems: pubItems.length,
          },
        };
      } catch (error) {
        logger.error("[CatalogVersion] Discard draft failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao descartar rascunho" });
      }
    }),
});
