import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { complementSubstitutions, complementItems, complementGroups, products } from "../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import { getDb } from "../db";

export const substitutionRouter = router({
  // List substitutions for a specific complement item
  listByItem: protectedProcedure
    .input(z.object({ complementItemId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const subs = await db.select().from(complementSubstitutions)
        .where(eq(complementSubstitutions.complementItemId, input.complementItemId))
        .orderBy(asc(complementSubstitutions.sortOrder));
      return subs;
    }),

  // List all substitutions for a product (used by public menu)
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // Get all included groups for this product
      const groups = await db.select().from(complementGroups)
        .where(and(
          eq(complementGroups.productId, input.productId),
          eq(complementGroups.groupType, "included")
        ));
      if (groups.length === 0) return [];
      
      // Get all items from included groups
      const allItems: number[] = [];
      for (const group of groups) {
        const items = await db.select({ id: complementItems.id }).from(complementItems)
          .where(eq(complementItems.groupId, group.id));
        allItems.push(...items.map(i => i.id));
      }
      if (allItems.length === 0) return [];

      // Get all substitutions for those items
      const results: Array<{
        complementItemId: number;
        substitutions: Array<{
          id: number;
          name: string;
          additionalPrice: number;
          imageUrl: string | null;
          isActive: boolean;
          sortOrder: number;
        }>;
      }> = [];

      for (const itemId of allItems) {
        const subs = await db.select().from(complementSubstitutions)
          .where(and(
            eq(complementSubstitutions.complementItemId, itemId),
            eq(complementSubstitutions.isActive, true)
          ))
          .orderBy(asc(complementSubstitutions.sortOrder));
        if (subs.length > 0) {
          results.push({
            complementItemId: itemId,
            substitutions: subs,
          });
        }
      }
      return results;
    }),

  // Create a new substitution
  create: protectedProcedure
    .input(z.object({
      complementItemId: z.number(),
      name: z.string().min(1),
      additionalPrice: z.number().min(0), // em centavos
      imageUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get current max sortOrder
      const existing = await db.select().from(complementSubstitutions)
        .where(eq(complementSubstitutions.complementItemId, input.complementItemId))
        .orderBy(asc(complementSubstitutions.sortOrder));
      const maxSort = existing.length > 0 ? Math.max(...existing.map(s => s.sortOrder)) : -1;

      const result = await db.insert(complementSubstitutions).values({
        complementItemId: input.complementItemId,
        name: input.name,
        additionalPrice: input.additionalPrice,
        imageUrl: input.imageUrl || null,
        sortOrder: maxSort + 1,
      });
      return { id: result[0].insertId };
    }),

  // Update a substitution
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      additionalPrice: z.number().min(0).optional(),
      imageUrl: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      await db.update(complementSubstitutions).set(data).where(eq(complementSubstitutions.id, id));
      return { success: true };
    }),

  // Delete a substitution
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(complementSubstitutions).where(eq(complementSubstitutions.id, input.id));
      return { success: true };
    }),

  // Reorder substitutions
  reorder: protectedProcedure
    .input(z.object({
      items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      for (const item of input.items) {
        await db.update(complementSubstitutions)
          .set({ sortOrder: item.sortOrder })
          .where(eq(complementSubstitutions.id, item.id));
      }
      return { success: true };
    }),
});
