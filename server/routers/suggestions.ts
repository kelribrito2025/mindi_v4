import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { z } from "zod";

export const suggestionsRouter = router({
  // List all fixed suggestions for an establishment
  listFixed: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getFixedSuggestions(input.establishmentId);
    }),

  // Add a fixed suggestion (product or category)
  addFixed: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      type: z.enum(['product', 'category']),
      productId: z.number().optional(),
      categoryId: z.number().optional(),
      categoryScopeIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

      if (input.type === 'product' && !input.productId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'productId é obrigatório para sugestões de produto' });
      }
      if (input.type === 'category' && !input.categoryId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'categoryId é obrigatório para sugestões de categoria' });
      }

      try {
        const id = await db.addFixedSuggestion({
          establishmentId: input.establishmentId,
          type: input.type,
          productId: input.productId,
          categoryId: input.categoryId,
        });
        try {
          if (input.categoryScopeIds) {
            await db.setFixedSuggestionCategoryScopes(id, input.establishmentId, input.categoryScopeIds);
          }
        } catch (scopeErr) {
          await db.removeFixedSuggestion(id, input.establishmentId).catch((rollbackErr: any) => {
            logger.error(`[Suggestions] Failed to rollback fixed suggestion after scope error: id=${id}`, rollbackErr);
          });
          throw scopeErr;
        }
        logger.info(`[Suggestions] Fixed suggestion added: ${input.type} id=${id}`);
        return { id };
      } catch (err: any) {
        if (err.message === 'Esta sugestão já existe') {
          throw new TRPCError({ code: 'CONFLICT', message: err.message });
        }
        if (err.message?.includes('categorias selecionadas') || err.message?.includes('não encontrada')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: err.message });
        }
        throw err;
      }
    }),

  // Get fixed suggestion category scopes
  getCategoryScopes: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getFixedSuggestionCategoryScopes(input.id, input.establishmentId);
    }),

  // Set fixed suggestion category scopes. Empty categoryIds keeps the suggestion global.
  setCategoryScopes: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      categoryIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      try {
        await db.setFixedSuggestionCategoryScopes(input.id, input.establishmentId, input.categoryIds);
        logger.info(`[Suggestions] Fixed suggestion category scopes updated: id=${input.id} scopes=${input.categoryIds.join(',') || 'global'}`);
        return { success: true };
      } catch (err: any) {
        if (err.message?.includes('categorias selecionadas') || err.message?.includes('não encontrada')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: err.message });
        }
        throw err;
      }
    }),

  // Remove a fixed suggestion
  removeFixed: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.removeFixedSuggestion(input.id, input.establishmentId);
      logger.info(`[Suggestions] Fixed suggestion removed: id=${input.id}`);
      return { success: true };
    }),

  // Toggle active/inactive
  toggleFixed: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.toggleFixedSuggestion(input.id, input.establishmentId, input.isActive);
      return { success: true };
    }),

  // Reorder fixed suggestions
  reorderFixed: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      orderedIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.reorderFixedSuggestions(input.establishmentId, input.orderedIds);
      return { success: true };
    }),

  // Update schedule for a fixed suggestion
  updateSchedule: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      scheduleEnabled: z.boolean(),
      scheduleDays: z.array(z.number()).optional(),
      scheduleStartTime: z.string().optional(),
      scheduleEndTime: z.string().optional(),
      scheduleLabel: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.updateFixedSuggestionSchedule(input.id, input.establishmentId, {
        scheduleEnabled: input.scheduleEnabled,
        scheduleDays: input.scheduleDays,
        scheduleStartTime: input.scheduleStartTime,
        scheduleEndTime: input.scheduleEndTime,
        scheduleLabel: input.scheduleLabel,
      });
      return { success: true };
    }),

  // Get available products to add as suggestion
  availableProducts: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getAvailableProductsForSuggestion(input.establishmentId, input.search);
    }),

  // Get available categories to add as suggestion
  availableCategories: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getAvailableCategoriesForSuggestion(input.establishmentId, input.search);
    }),

  // Get categories available as display scope for fixed suggestions
  availableScopeCategories: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getAvailableCategoriesForSuggestionScope(input.establishmentId, input.search);
    }),

  // ============ LINKED SUGGESTIONS (SUGESTÕES VINCULADAS) ============

  // List all linked suggestions for an establishment
  listLinked: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getLinkedSuggestions(input.establishmentId);
    }),

  // Add a linked suggestion (trigger product -> suggested products)
  addLinked: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      triggerProductId: z.number(),
      suggestedProductIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      try {
        const id = await db.addLinkedSuggestion({
          establishmentId: input.establishmentId,
          triggerProductId: input.triggerProductId,
          suggestedProductIds: input.suggestedProductIds,
        });
        logger.info(`[Suggestions] Linked suggestion added: trigger=${input.triggerProductId} suggested=${input.suggestedProductIds.join(',')} id=${id}`);
        return { id };
      } catch (err: any) {
        if (err.message.includes('já existe') || err.message.includes('não pode ser sugerido')) {
          throw new TRPCError({ code: 'CONFLICT', message: err.message });
        }
        throw err;
      }
    }),

  // Remove a linked suggestion
  removeLinked: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.removeLinkedSuggestion(input.id, input.establishmentId);
      logger.info(`[Suggestions] Linked suggestion removed: id=${input.id}`);
      return { success: true };
    }),

  // Toggle linked suggestion active/inactive
  toggleLinked: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.toggleLinkedSuggestion(input.id, input.establishmentId, input.isActive);
      return { success: true };
    }),

  // Update schedule for a linked suggestion
  updateLinkedSchedule: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      scheduleEnabled: z.boolean(),
      scheduleDays: z.array(z.number()).optional(),
      scheduleStartTime: z.string().optional(),
      scheduleEndTime: z.string().optional(),
      scheduleLabel: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.updateLinkedSuggestionSchedule(input.id, input.establishmentId, {
        scheduleEnabled: input.scheduleEnabled,
        scheduleDays: input.scheduleDays,
        scheduleStartTime: input.scheduleStartTime,
        scheduleEndTime: input.scheduleEndTime,
        scheduleLabel: input.scheduleLabel,
      });
      return { success: true };
    }),

  // Update suggested products for a linked suggestion
  updateLinkedItems: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      suggestedProductIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      try {
        await db.updateLinkedSuggestionItems(input.id, input.establishmentId, input.suggestedProductIds);
        logger.info(`[Suggestions] Linked suggestion items updated: id=${input.id} suggested=${input.suggestedProductIds.join(',')}`);
        return { success: true };
      } catch (err: any) {
        if (err.message.includes('não pode ser sugerido') || err.message.includes('não encontrada')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: err.message });
        }
        throw err;
      }
    }),

  // Get suggestion revenue for last 30 days
  getRevenue: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getSuggestionRevenue(input.establishmentId);
    }),

  // Get available products for linked suggestion (excludes specified products)
  availableLinkedProducts: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      excludeProductIds: z.array(z.number()).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getAvailableProductsForLinkedSuggestion(
        input.establishmentId,
        input.excludeProductIds || [],
        input.search
      );
    }),
});
