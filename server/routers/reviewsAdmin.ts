import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const reviewsAdminRouter = router({
    // Métricas de avaliações
    metrics: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getReviewMetrics(input.establishmentId);
      }),

    // Listar avaliações com filtro
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        filter: z.enum(['all', 'pending', 'responded']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getReviewsAdmin(input.establishmentId, {
          filter: input.filter || 'all',
          limit: input.limit,
          offset: input.offset,
        });
      }),

    // Contar total de avaliações (para paginação)
    count: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        filter: z.enum(['all', 'pending', 'responded']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getReviewsAdminCount(input.establishmentId, input.filter || 'all');
      }),

    // Responder avaliação
    respond: protectedProcedure
      .input(z.object({
        reviewId: z.number(),
        establishmentId: z.number(),
        responseText: z.string().min(1, "Resposta não pode ser vazia").max(1000, "Resposta muito longa"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.respondToReview(input.reviewId, input.establishmentId, input.responseText);
        return { success: true };
      }),

    // Marcar como lidas
    markAsRead: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        reviewIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.markReviewsAsRead(input.establishmentId, input.reviewIds);
        return { success: true };
      }),

    // Contar não lidas (para badge)
    unreadCount: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getUnreadReviewCount(input.establishmentId);
      }),
  });
