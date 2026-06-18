import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { mindiStoragePut } from "../mindiStorage";
import { nanoid } from "nanoid";
import { processImage, processSingleImage, generateBlurPlaceholder } from "../imageProcessor";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { sendMenuPublicEvent } from "../_core/sse";
import { z } from "zod";

export const storiesRouter = router({
    // Listar stories do estabelecimento (admin)
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getStoriesByEstablishment(input.establishmentId);
      }),

    // Criar story (admin) — upload com compressão + tipos de venda
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        base64: z.string(),
        mimeType: z.string(),
        type: z.enum(["simple", "product", "promo"]).default("simple"),
        productId: z.number().optional(),
        promoTitle: z.string().max(120).optional(),
        promoText: z.string().max(255).optional(),
        promoPrice: z.string().max(20).optional(),
        promoExpiresAt: z.date().optional(),
        actionLabel: z.string().max(40).optional(),
        priceBadgeStyle: z.enum(["circle", "ribbon", "top-center"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        // Verificar limite de 5 stories ativos
        const activeCount = await db.countActiveStories(input.establishmentId);
        if (activeCount >= 5) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Limite de 5 stories atingido. Exclua um story antes de adicionar outro.",
          });
        }

        // Validar campos obrigatórios por tipo
        if (input.type === "product" && !input.productId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selecione um produto para o story do tipo 'Destacar produto'.",
          });
        }
        if (input.type === "promo" && !input.promoTitle) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Informe o título da promoção.",
          });
        }

        // Processar imagem (max 1080px, WebP)
        const buffer = Buffer.from(input.base64, "base64");
        const processed = await processSingleImage(buffer, 1080, 80);
        const id = nanoid();
        const fileKey = `stories/${input.establishmentId}/${id}.webp`;

        // Upload para S3
        const { url } = await mindiStoragePut(fileKey, processed.buffer, "image/webp");

        // Expiração em 24h
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Salvar no banco
        const result = await db.createStory({
          establishmentId: input.establishmentId,
          imageUrl: url,
          fileKey,
          expiresAt,
          type: input.type,
          productId: input.productId ?? null,
          promoTitle: input.promoTitle ?? null,
          promoText: input.promoText ?? null,
          promoPrice: input.promoPrice ?? null,
          promoExpiresAt: input.promoExpiresAt ?? null,
          actionLabel: input.actionLabel ?? null,
          priceBadgeStyle: input.priceBadgeStyle ?? null,
        });

        // Emitir evento SSE para menu público
        sendMenuPublicEvent(input.establishmentId, 'story_created', {
          id: result.id,
          establishmentId: input.establishmentId,
          type: input.type,
          imageUrl: url,
          expiresAt: expiresAt.toISOString(),
        });

        return { id: result.id, imageUrl: url, expiresAt, type: input.type };
      }),

    // Deletar story (admin)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership antes de deletar
        const story = await db.getStoryById(input.id);
        if (!story) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Story não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, story.establishmentId);
        const deleted = await db.deleteStory(input.id);
        if (!deleted) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Story não encontrado" });
        }
        // Deletar do S3
        try {
          const { mindiStorageDelete } = await import("../mindiStorage");
          await mindiStorageDelete(deleted.fileKey);
        } catch (e) {
          logger.error("[Stories] Erro ao deletar imagem do S3:", e);
        }
        // Emitir evento SSE para menu público
        sendMenuPublicEvent(deleted.establishmentId, 'story_deleted', {
          id: deleted.id,
          establishmentId: deleted.establishmentId,
        });

        return { success: true };
      }),

    // Analytics: obter contagem de views por story do estabelecimento
    viewsAnalytics: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.countViewsByEstablishment(input.establishmentId);
      }),

    // Analytics: métricas de conversão por story (clicks, carrinho, pedidos, receita)
    conversionAnalytics: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getStoryAnalytics(input.establishmentId);
      }),

    // Analytics: gráfico de vendas geradas por stories (últimos N dias)
    salesChart: protectedProcedure
      .input(z.object({ establishmentId: z.number(), days: z.number().min(1).max(90).default(7) }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getStorySalesChart(input.establishmentId, input.days);
      }),

    // Analytics: story mais performático da semana
    topPerforming: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getTopPerformingStory(input.establishmentId);
      }),

    // Analytics: percentual de vendas geradas por stories hoje
    revenuePercent: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getStoryRevenuePercentToday(input.establishmentId);
      }),
  });
