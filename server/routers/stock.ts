import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

/**
 * Stock router — agora vinculado diretamente aos produtos do catálogo.
 * Usa products.hasStock e products.stockQuantity em vez de tabelas separadas.
 * As categorias são as mesmas do catálogo (categories).
 */
export const stockRouter = router({
  /**
   * Lista produtos com controle de estoque ativado (hasStock = true)
   * Agrupa por categoria do catálogo
   */
  listItems: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      search: z.string().optional(),
      categoryId: z.number().optional(),
      status: z.enum(["ok", "low", "critical", "out_of_stock"]).optional(),
      page: z.number().min(1).default(1),
      perPage: z.number().min(1).max(100).default(25),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      const thresholds = {
        low: est?.stockLowThreshold ?? 10,
        critical: est?.stockCriticalThreshold ?? 3,
        out: est?.stockOutThreshold ?? 0,
      };
      return db.getStockProductsByEstablishment(input.establishmentId, input, thresholds);
    }),

  /**
   * Atualiza a quantidade de estoque de um produto
   */
  updateQuantity: protectedProcedure
    .input(z.object({
      productId: z.number(),
      stockQuantity: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const product = await db.getProductById(input.productId);
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
      await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
      
      await db.updateProduct(input.productId, { stockQuantity: input.stockQuantity });
      // Sincronizar stockItem vinculado
      try {
        const existingStockItem = await db.getStockItemByLinkedProductId(input.productId);
        if (existingStockItem) {
          await db.updateStockItem(existingStockItem.id, {
            currentQuantity: String(input.stockQuantity),
          });
          logger.info(`[Estoque] StockItem sincronizado para produto ${input.productId}: qty=${input.stockQuantity}`);
        }
      } catch (e) {
        logger.error("Erro ao sincronizar stockItem:", e);
      }
      // Sincronizar estoque entre versões draft/published, incluindo stockItems vinculados
      try {
        if (product.version === 'draft' && product.publishedSourceId) {
          await db.updateProduct(product.publishedSourceId, { stockQuantity: input.stockQuantity });
          const publishedStockItem = await db.getStockItemByLinkedProductId(product.publishedSourceId);
          if (publishedStockItem) {
            await db.updateStockItem(publishedStockItem.id, { currentQuantity: String(input.stockQuantity) });
            logger.info(`[Estoque] StockItem do published (ID=${publishedStockItem.id}) sincronizado para qty=${input.stockQuantity}`);
          }
          logger.info(`[Estoque] Sincronizado published ID=${product.publishedSourceId} para qty=${input.stockQuantity}`);
        } else if (product.version === 'published') {
          const draftProduct = await db.getDraftProductByPublishedSourceId(input.productId, product.establishmentId);
          if (draftProduct) {
            await db.updateProduct(draftProduct.id, { stockQuantity: input.stockQuantity });
            const draftStockItem = await db.getStockItemByLinkedProductId(draftProduct.id);
            if (draftStockItem) {
              await db.updateStockItem(draftStockItem.id, { currentQuantity: String(input.stockQuantity) });
              logger.info(`[Estoque] StockItem do draft (ID=${draftStockItem.id}) sincronizado para qty=${input.stockQuantity}`);
            }
            logger.info(`[Estoque] Sincronizado draft ID=${draftProduct.id} para qty=${input.stockQuantity}`);
          }
        }
      } catch (e) {
        logger.error("Erro ao sincronizar estoque entre versões:", e);
      }
      // Invalidar cache do menu público
      db.invalidatePublicMenuCache(product.establishmentId);
      logger.info(`[Estoque] Quantidade do produto "${product.name}" atualizada para ${input.stockQuantity}`);
      return { success: true };
    }),

  /**
   * Ativa/desativa controle de estoque para um produto
   */
  toggleStock: protectedProcedure
    .input(z.object({
      productId: z.number(),
      hasStock: z.boolean(),
      stockQuantity: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const product = await db.getProductById(input.productId);
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
      await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
      
      const updateData: any = { hasStock: input.hasStock };
      if (input.stockQuantity !== undefined && input.stockQuantity !== null) {
        updateData.stockQuantity = input.stockQuantity;
      }
      if (!input.hasStock) {
        updateData.stockQuantity = null;
      }
      
      await db.updateProduct(input.productId, updateData);
      // Sincronizar stockItem vinculado
      if (input.hasStock && input.stockQuantity !== undefined && input.stockQuantity !== null) {
        try {
          const existingStockItem = await db.getStockItemByLinkedProductId(input.productId);
          if (existingStockItem) {
            await db.updateStockItem(existingStockItem.id, { currentQuantity: String(input.stockQuantity) });
          }
        } catch (e) {
          logger.error("Erro ao sincronizar stockItem:", e);
        }
      }
      if (!input.hasStock) {
        try {
          const existingStockItem = await db.getStockItemByLinkedProductId(input.productId);
          if (existingStockItem) {
            await db.deleteStockItem(existingStockItem.id);
            logger.info(`[Estoque] Removido stockItem vinculado ao produto ${input.productId}`);
          }
        } catch (e) {
          logger.error("Erro ao remover stockItem:", e);
        }
      }
      db.invalidatePublicMenuCache(product.establishmentId);
      logger.info(`[Estoque] Controle de estoque ${input.hasStock ? 'ativado' : 'desativado'} para "${product.name}"`);
      return { success: true };
    }),

  /**
   * Marca produto como sem estoque (stockQuantity = 0)
   */
  markOutOfStock: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const product = await db.getProductById(input.productId);
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
      await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
      
      await db.updateProduct(input.productId, { stockQuantity: 0 });
      // Sincronizar stockItem vinculado
      try {
        const existingStockItem = await db.getStockItemByLinkedProductId(input.productId);
        if (existingStockItem) {
          await db.updateStockItem(existingStockItem.id, { currentQuantity: "0" });
        }
      } catch (e) {
        logger.error("Erro ao sincronizar stockItem:", e);
      }
      // Sincronizar estoque entre versões draft/published, incluindo stockItems vinculados
      try {
        if (product.version === 'draft' && product.publishedSourceId) {
          await db.updateProduct(product.publishedSourceId, { stockQuantity: 0 });
          const publishedStockItem = await db.getStockItemByLinkedProductId(product.publishedSourceId);
          if (publishedStockItem) {
            await db.updateStockItem(publishedStockItem.id, { currentQuantity: "0" });
          }
        } else if (product.version === 'published') {
          const draftProduct = await db.getDraftProductByPublishedSourceId(input.productId, product.establishmentId);
          if (draftProduct) {
            await db.updateProduct(draftProduct.id, { stockQuantity: 0 });
            const draftStockItem = await db.getStockItemByLinkedProductId(draftProduct.id);
            if (draftStockItem) {
              await db.updateStockItem(draftStockItem.id, { currentQuantity: "0" });
            }
          }
        }
      } catch (e) {
        logger.error("Erro ao sincronizar estoque entre versões (markOutOfStock):", e);
      }
      db.invalidatePublicMenuCache(product.establishmentId);
      logger.info(`[Estoque] Produto "${product.name}" marcado como sem estoque`);
      return { success: true };
    }),

  /**
   * Resumo do estoque: total, ok, baixo, sem estoque
   */
  summary: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      const thresholds = {
        low: est?.stockLowThreshold ?? 10,
        critical: est?.stockCriticalThreshold ?? 3,
        out: est?.stockOutThreshold ?? 0,
      };
      return db.getStockProductsSummary(input.establishmentId, thresholds);
    }),

  /**
   * Contagem de itens sem estoque (para badge no menu lateral)
   */
  outOfStockCount: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getProductsOutOfStockCount(input.establishmentId);
    }),

  /**
   * Retorna os thresholds de estoque do estabelecimento
   */
  getThresholds: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      return {
        stockLowThreshold: est?.stockLowThreshold ?? 10,
        stockCriticalThreshold: est?.stockCriticalThreshold ?? 3,
        stockOutThreshold: est?.stockOutThreshold ?? 0,
      };
    }),

  /**
   * Atualiza os thresholds de estoque do estabelecimento
   */
  updateThresholds: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      stockLowThreshold: z.number().min(0),
      stockCriticalThreshold: z.number().min(0),
      stockOutThreshold: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      // Validar: low > critical > out
      if (input.stockLowThreshold <= input.stockCriticalThreshold) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'O limite "Baixo" deve ser maior que o limite "Crítico".' });
      }
      if (input.stockCriticalThreshold <= input.stockOutThreshold) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'O limite "Crítico" deve ser maior que o limite "Em falta".' });
      }
      await db.updateEstablishment(input.establishmentId, {
        stockLowThreshold: input.stockLowThreshold,
        stockCriticalThreshold: input.stockCriticalThreshold,
        stockOutThreshold: input.stockOutThreshold,
      });
      logger.info(`[Estoque] Thresholds atualizados para estabelecimento ${input.establishmentId}: low=${input.stockLowThreshold}, critical=${input.stockCriticalThreshold}, out=${input.stockOutThreshold}`);
      return { success: true };
    }),

  // Manter listCategories para compatibilidade (usa categorias do catálogo)
  listCategories: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getCategoriesByEstablishment(input.establishmentId);
    }),
});
