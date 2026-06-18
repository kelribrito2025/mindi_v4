/**
 * iFood Router - Endpoints para integração com iFood
 * Modelo Centralizado - Restaurante só precisa informar o Merchant ID
 * As credenciais OAuth são gerenciadas pelo sistema (variáveis de ambiente)
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import {
  getIfoodOrderDetails,
  confirmIfoodOrder,
  startIfoodOrderPreparation,
  readyToPickupIfoodOrder,
  dispatchIfoodOrder,
  verifyIfoodDeliveryCode,
  requestIfoodOrderCancellation,
  getIfoodCancellationReasons,
  acknowledgeIfoodEvent,
  validateMerchantId,
  type IfoodOrder,
  type IfoodEvent
} from "./ifood";
import {
  acceptDispute,
  rejectDispute,
  sendAlternative,
  parseDisputeDetails,
  ACCEPT_CANCELLATION_REASONS,
} from "./ifoodHandshake";
import {
  getMerchantStatus,
  getMerchantDetails,
  getMerchantAvailability,
  getOpeningHours,
  updateOpeningHours,
  listInterruptions,
  createInterruption,
  deleteInterruption,
  quickPause
} from "./ifoodMerchant";
import {
  getCatalogs,
  getCategories,
  getProducts,
  getProductDetails,
  getFullCatalog,
  updateProduct,
  updateProductStatus,
  updateProductPrice,
  updateCategoryStatus,
  updateCategory,
  syncLocalProductToIfood,
  bulkUpdateCategoryProductsStatus,
  createCategory,
  updateOptionPrice,
  updateOptionStatus,
  uploadImage
} from "./ifoodCatalog";
import { logger } from "./_core/logger";
import { ifoodCategoryMapping, ifoodProductMapping } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  publishProductToIfood,
  publishCategoryToIfood,
  syncAllToIfood,
  ensureCategoryInIfood,
  getAllProductMappings,
  getAllCategoryMappings,
  getProductMapping,
  getCategoryMapping,
} from "./ifoodSync";

export const ifoodRouter = router({
  // Buscar configuração/status do iFood do estabelecimento
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);

    if (config) {
      return {
        isConnected: config.isConnected,
        isActive: config.isActive,
        merchantId: config.merchantId,
        merchantName: config.merchantName,
        autoAcceptOrders: config.autoAcceptOrders,
        notifyOnNewOrder: config.notifyOnNewOrder,
      };
    }

    return {
      isConnected: false,
      isActive: false,
      merchantId: null,
      merchantName: null,
      autoAcceptOrders: false,
      notifyOnNewOrder: true,
    };
  }),

  // Salvar Merchant ID - Modelo Centralizado
  // O restaurante só precisa informar o Merchant ID
  // As credenciais OAuth são do sistema (IFOOD_CLIENT_ID e IFOOD_CLIENT_SECRET)
  saveMerchantId: protectedProcedure
    .input(z.object({
      merchantId: z.string().min(1, "Merchant ID é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      try {
        // Validar o Merchant ID com a API do iFood
        logger.info(`[iFood] Validando Merchant ID: ${input.merchantId}`);
        const validation = await validateMerchantId(input.merchantId);

        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.error || 'Merchant ID inválido'
          });
        }

        logger.info(`[iFood] Merchant ID válido. Nome: ${validation.merchantName}`);

        // Salvar o Merchant ID e o nome da loja
        await db.saveIfoodMerchantInfo(
          establishment.id,
          input.merchantId,
          validation.merchantName || null
        );

        // Marcar como conectado e ativo
        await db.updateIfoodConfigStatus(establishment.id, true);

        return {
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          merchantName: validation.merchantName
        };
      } catch (error) {
        logger.error("[iFood] Erro ao salvar Merchant ID:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao conectar com iFood'
        });
      }
    }),

  // Desconectar iFood
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    await db.disconnectIfood(establishment.id);

    return { success: true };
  }),

  // Ativar/desativar integração (após conectado)
  toggleActive: protectedProcedure
    .input(z.object({
      isActive: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Configure o Merchant ID primeiro'
        });
      }

      await db.updateIfoodConfigStatus(establishment.id, input.isActive);

      return { success: true };
    }),

  // Ativar/desativar aceite automático de pedidos
  updateAutoAccept: protectedProcedure
    .input(z.object({
      autoAcceptOrders: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Configure e conecte o iFood antes de alterar o aceite automático'
        });
      }

      await db.updateIfoodAutoAccept(establishment.id, input.autoAcceptOrders);

      logger.info(`[iFood] Aceite automático ${input.autoAcceptOrders ? 'ativado' : 'desativado'} para estabelecimento ${establishment.id}`);

      return { success: true, autoAcceptOrders: input.autoAcceptOrders };
    }),

  // Verificar status da integração
  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { configured: false, connected: false, active: false, error: 'Não autenticado' };
    }

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) {
      return { configured: false, connected: false, active: false, error: 'Estabelecimento não encontrado' };
    }

    const config = await db.getIfoodConfig(establishment.id);
    if (!config) {
      return { configured: false, connected: false, active: false, error: null };
    }

    return {
      configured: !!config.merchantId,
      connected: config.isConnected,
      active: config.isActive,
      merchantName: config.merchantName,
      error: null
    };
  }),

  // Listar pedidos do iFood
  listOrders: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      status: z.enum(["pending_confirmation", "new", "preparing", "ready", "completed", "cancelled"]).optional()
    }))
    .query(async ({ input }) => {
      const orders = await db.getOrdersBySource(input.establishmentId, "ifood", input.status);
      return orders;
    }),

  // Confirmar pedido no iFood
  confirmOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        await confirmIfoodOrder(input.externalId, order.establishmentId);
        await db.updateOrderStatus(input.orderId, "new");
        await db.updateOrderExternalStatus(input.orderId, "CONFIRMED");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao confirmar pedido no iFood"
        });
      }
    }),

  // Iniciar preparo no iFood
  startPreparation: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        await startIfoodOrderPreparation(input.externalId, order.establishmentId);
        await db.updateOrderStatus(input.orderId, "preparing");
        await db.updateOrderExternalStatus(input.orderId, "IN_PREPARATION");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao iniciar preparo no iFood"
        });
      }
    }),

  // Marcar como pronto no iFood
  readyToPickup: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        await readyToPickupIfoodOrder(input.externalId, order.establishmentId);
        await db.updateOrderStatus(input.orderId, "ready");
        await db.updateOrderExternalStatus(input.orderId, "READY_TO_PICKUP");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao marcar pronto no iFood"
        });
      }
    }),

  // Despachar pedido no iFood
  dispatch: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        await dispatchIfoodOrder(input.externalId, order.establishmentId);
        await db.updateOrderExternalStatus(input.orderId, "DISPATCHED");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao despachar pedido no iFood"
        });
      }
    }),

  // Validar código de confirmação de entrega própria no iFood
  validateDeliveryCode: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string().min(1),
      code: z.string().trim().min(3, "Informe o código de confirmação").max(12, "Código de confirmação inválido")
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const order = await db.getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      if (order.establishmentId !== establishment.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a este pedido" });
      }
      if (order.source !== 'ifood' || order.externalId !== input.externalId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido iFood inválido para validação de entrega" });
      }

      try {
        const result = await verifyIfoodDeliveryCode(input.externalId, order.establishmentId, input.code.trim());

        if (result.valid) {
          await db.updateOrderStatus(input.orderId, "completed");
          await db.updateOrderExternalStatus(input.orderId, "CONCLUDED");
        }

        return { success: result.valid, valid: result.valid };
      } catch (error) {
        logger.error("[iFood] Erro ao validar código de entrega:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao validar código de entrega no iFood"
        });
      }
    }),

  // Buscar motivos de cancelamento
  getCancellationReasons: protectedProcedure
    .input(z.object({
      externalId: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const order = await db.getOrderByExternalId(input.externalId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido iFood não encontrado" });
        const reasons = await getIfoodCancellationReasons(input.externalId, order.establishmentId);
        return reasons;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar motivos de cancelamento"
        });
      }
    }),

  // Cancelar pedido no iFood
  cancelOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string(),
      cancellationCode: z.string(),
      cancellationReason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      try {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        if (order.establishmentId !== establishment.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a este pedido" });
        }
        if (order.source !== 'ifood' || order.externalId !== input.externalId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido iFood inválido para cancelamento" });
        }

        await requestIfoodOrderCancellation(input.externalId, input.cancellationCode, order.establishmentId, input.cancellationReason);
        await db.updateOrderStatus(input.orderId, "cancelled", input.cancellationReason);
        await db.updateOrderExternalStatus(input.orderId, "CANCELLED");
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao cancelar pedido no iFood"
        });
      }
    }),

  // ==========================================
  // FASE 2: MÓDULO MERCHANT
  // ==========================================

  // Buscar status operacional do merchant no iFood
  merchantStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);
    if (!config?.merchantId || !config.isConnected) {
      return { connected: false, available: false, operations: [], interruptions: [] };
    }

    try {
      const availability = await getMerchantAvailability(establishment.id, config.merchantId);
      return {
        connected: true,
        ...availability
      };
    } catch (error) {
      logger.error("[iFood] Erro ao buscar status do merchant:", error);
      return {
        connected: true,
        available: false,
        operations: [],
        interruptions: [],
        error: error instanceof Error ? error.message : "Erro ao buscar status"
      };
    }
  }),

  // Buscar detalhes completos do merchant
  merchantDetails: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);
    if (!config?.merchantId || !config.isConnected) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
    }

    try {
      const details = await getMerchantDetails(establishment.id, config.merchantId);
      return details;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao buscar detalhes do merchant'
      });
    }
  }),

  // Buscar horários de funcionamento do iFood
  getOpeningHours: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);
    if (!config?.merchantId || !config.isConnected) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
    }

    try {
      const hours = await getOpeningHours(establishment.id, config.merchantId);
      return hours;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao buscar horários'
      });
    }
  }),

  // Atualizar horários de funcionamento no iFood
  updateOpeningHours: protectedProcedure
    .input(z.object({
      shifts: z.array(z.object({
        dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
        start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora inválido (HH:mm ou HH:mm:ss)"),
        duration: z.number().min(1, "Duração mínima: 1 minuto").max(1440, "Duração máxima: 24 horas")
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        // Normalizar formato de hora para HH:mm:ss
        const normalizedShifts = input.shifts.map(s => ({
          ...s,
          start: s.start.length === 5 ? `${s.start}:00` : s.start
        }));

        const result = await updateOpeningHours(establishment.id, config.merchantId, normalizedShifts);
        return { success: true, data: result };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao atualizar horários'
        });
      }
    }),

  // Listar interrupções (pausas) ativas
  listInterruptions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);
    if (!config?.merchantId || !config.isConnected) {
      return [];
    }

    try {
      return await listInterruptions(establishment.id, config.merchantId);
    } catch (error) {
      logger.error("[iFood] Erro ao listar interrupções:", error);
      return [];
    }
  }),

  // Pausar loja no iFood (criar interrupção)
  pauseStore: protectedProcedure
    .input(z.object({
      durationMinutes: z.number().min(1).max(10080), // 1 min a 7 dias
      description: z.string().max(255).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        const interruption = await quickPause(
          establishment.id,
          config.merchantId,
          input.durationMinutes,
          input.description || "Pausa temporária"
        );
        return { success: true, interruption };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao pausar loja'
        });
      }
    }),

  // Retomar loja no iFood (deletar interrupção)
  resumeStore: protectedProcedure
    .input(z.object({
      interruptionId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        await deleteInterruption(establishment.id, config.merchantId, input.interruptionId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao retomar loja'
        });
      }
    }),

  // ==========================================
  // CATÁLOGO - FASE 3
  // ==========================================

  // Listar catálogos disponíveis
  getCatalogs: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);
    if (!config?.merchantId || !config.isConnected) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
    }

    try {
      return await getCatalogs(establishment.id, config.merchantId);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao listar catálogos'
      });
    }
  }),

  // DEBUG: Endpoint temporário para inspecionar resposta raw do sellableItems
  debugSellableItems: protectedProcedure
    .input(z.object({ catalogId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }
      const { getAccessTokenForEstablishment } = await import("./ifood");
      const { ifoodApiCall } = await import("./ifoodInfra");
      const token = await getAccessTokenForEstablishment(establishment.id);

      // 1. Buscar catálogos
      const catalogsRes = await ifoodApiCall(
        `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${config.merchantId}/catalogs`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const catalogsRaw = catalogsRes.ok ? await catalogsRes.json() : await catalogsRes.text();

      // 2. Buscar categorias do catálogo especificado
      const categoriesRes = await ifoodApiCall(
        `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${config.merchantId}/catalogs/${input.catalogId}/categories`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const categoriesRaw = categoriesRes.ok ? await categoriesRes.json() : await categoriesRes.text();

      // 3. Buscar sellableItems
      const sellableRes = await ifoodApiCall(
        `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${config.merchantId}/catalogs/${input.catalogId}/sellableItems`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const sellableRaw = sellableRes.ok ? await sellableRes.json() : await sellableRes.text();

      // 4. Tentar endpoint /products como fallback
      const productsRes = await ifoodApiCall(
        `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${config.merchantId}/products`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const productsRaw = productsRes.ok ? await productsRes.json() : await productsRes.text();

      // 5. Tentar unsellableItems
      const unsellableRes = await ifoodApiCall(
        `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${config.merchantId}/catalogs/${input.catalogId}/unsellableItems`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const unsellableRaw = unsellableRes.ok ? await unsellableRes.json() : await unsellableRes.text();

      return {
        establishmentId: establishment.id,
        merchantId: config.merchantId,
        catalogId: input.catalogId,
        catalogs: { status: catalogsRes.status, ok: catalogsRes.ok, data: catalogsRaw },
        categories: { status: categoriesRes.status, ok: categoriesRes.ok, data: categoriesRaw },
        sellableItems: { status: sellableRes.status, ok: sellableRes.ok, data: sellableRaw },
        products: { status: productsRes.status, ok: productsRes.ok, data: productsRaw },
        unsellableItems: { status: unsellableRes.status, ok: unsellableRes.ok, data: unsellableRaw },
      };
    }),

  // Buscar catálogo completo (catálogos > categorias > produtos) com cache
  getFullCatalog: protectedProcedure
    .input(z.object({ forceRefresh: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

    const config = await db.getIfoodConfig(establishment.id);
    if (!config?.merchantId || !config.isConnected) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
    }

    try {
      return await getFullCatalog(establishment.id, config.merchantId, input?.forceRefresh ?? false);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao buscar catálogo completo'
      });
    }
  }),

  // Listar categorias de um catálogo
  getIfoodCategories: protectedProcedure
    .input(z.object({ catalogId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        return await getCategories(establishment.id, config.merchantId, input.catalogId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao listar categorias'
        });
      }
    }),

  // Listar produtos de um catálogo
  getIfoodProducts: protectedProcedure
    .input(z.object({ catalogId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        return await getProducts(establishment.id, config.merchantId, input.catalogId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao listar produtos'
        });
      }
    }),

  // Buscar detalhes de um produto
  getIfoodProductDetails: protectedProcedure
    .input(z.object({ catalogId: z.string(), productId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        return await getProductDetails(establishment.id, config.merchantId, input.catalogId, input.productId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao buscar detalhes do produto'
        });
      }
    }),

  // Atualizar produto no iFood
  updateIfoodProduct: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      productId: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        price: z.object({
          value: z.number(),
          originalValue: z.number().optional()
        }).optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        return await updateProduct(establishment.id, config.merchantId, input.catalogId, input.productId, input.data);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao atualizar produto'
        });
      }
    }),

  // Toggle disponibilidade de produto
  toggleProductAvailability: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      productId: z.string(),
      available: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        const status = input.available ? "AVAILABLE" : "UNAVAILABLE";
        await updateProductStatus(establishment.id, config.merchantId, input.catalogId, input.productId, status);
        return { success: true, status };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao alterar disponibilidade'
        });
      }
    }),

  // Atualizar preço de produto no iFood
  updateIfoodProductPrice: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      productId: z.string(),
      price: z.number().positive(),
      originalPrice: z.number().positive().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        await updateProductPrice(establishment.id, config.merchantId, input.catalogId, input.productId, input.price, input.originalPrice);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao atualizar preço'
        });
      }
    }),

  // Toggle disponibilidade de categoria
  toggleCategoryAvailability: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      categoryId: z.string(),
      available: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        const status = input.available ? "AVAILABLE" : "UNAVAILABLE";
        await updateCategoryStatus(establishment.id, config.merchantId, input.catalogId, input.categoryId, status);
        return { success: true, status };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao alterar disponibilidade da categoria'
        });
      }
    }),

  // Bulk: pausar/ativar todos os produtos de uma categoria
  bulkToggleCategoryProducts: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      categoryId: z.string(),
      available: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      try {
        const status = input.available ? "AVAILABLE" : "UNAVAILABLE";
        const result = await bulkUpdateCategoryProductsStatus(
          establishment.id, config.merchantId, input.catalogId, input.categoryId, status
        );
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao atualizar produtos da categoria'
        });
      }
    }),

  // Sincronizar produto local para o iFood
  syncProductToIfood: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      ifoodProductId: z.string(),
      localProductId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId || !config.isConnected) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não está conectado' });
      }

      // Buscar produto local
      const localProduct = await db.getProductById(input.localProductId);
      if (!localProduct || localProduct.establishmentId !== establishment.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto local não encontrado' });
      }

      try {
        const result = await syncLocalProductToIfood(
          establishment.id,
          config.merchantId,
          input.catalogId,
          input.ifoodProductId,
          {
            name: localProduct.name,
            description: localProduct.description || undefined,
            price: parseFloat(localProduct.price),
            status: localProduct.status,
            images: localProduct.images || undefined
          }
        );
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao sincronizar produto'
        });
      }
    }),

  // ═══ HANDSHAKE / DISPUTES ═══════════════════════════════════════════

  listDisputes: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.isConnected || !config.merchantId) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'iFood não conectado' });
      }
      const disputes = await db.listIfoodDisputes(establishment.id, input?.status);
      return disputes.map(parseDisputeDetails);
    }),

  getPendingDisputes: protectedProcedure
    .query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const disputes = await db.getPendingIfoodDisputes(establishment.id);
      return disputes.map(parseDisputeDetails);
    }),

  getDispute: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const dispute = await db.getIfoodDisputeByDisputeId(input.disputeId);
      if (!dispute) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Disputa não encontrada' });
      }
      if (dispute.establishmentId !== establishment.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
      }
      return parseDisputeDetails(dispute);
    }),

  acceptDispute: protectedProcedure
    .input(z.object({
      disputeId: z.string(),
      orderId: z.string(),
      reasonCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const dispute = await db.getIfoodDisputeByDisputeId(input.disputeId);
      if (!dispute) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Disputa não encontrada' });
      }
      if (dispute.establishmentId !== establishment.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
      }
      if (dispute.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Disputa já foi respondida' });
      }
      if (new Date(dispute.expiresAt) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Disputa expirada' });
      }
      await acceptDispute(establishment.id, input.orderId, input.disputeId, input.reasonCode);
      return { success: true };
    }),

  rejectDispute: protectedProcedure
    .input(z.object({
      disputeId: z.string(),
      orderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const dispute = await db.getIfoodDisputeByDisputeId(input.disputeId);
      if (!dispute) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Disputa não encontrada' });
      }
      if (dispute.establishmentId !== establishment.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
      }
      if (dispute.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Disputa já foi respondida' });
      }
      if (new Date(dispute.expiresAt) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Disputa expirada' });
      }
      await rejectDispute(establishment.id, input.orderId, input.disputeId);
      return { success: true };
    }),

  sendAlternative: protectedProcedure
    .input(z.object({
      disputeId: z.string(),
      orderId: z.string(),
      alternativeId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const dispute = await db.getIfoodDisputeByDisputeId(input.disputeId);
      if (!dispute) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Disputa não encontrada' });
      }
      if (dispute.establishmentId !== establishment.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
      }
      if (dispute.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Disputa já foi respondida' });
      }
      if (new Date(dispute.expiresAt) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Disputa expirada' });
      }
      await sendAlternative(establishment.id, input.orderId, input.disputeId, input.alternativeId);
      return { success: true };
    }),

  disputeCancellationReasons: protectedProcedure
    .query(() => {
      return ACCEPT_CANCELLATION_REASONS;
    }),
  getDisputesByOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const disputes = await db.getIfoodDisputesByOrderId(input.orderId);
      const filtered = disputes.filter(d => d.establishmentId === establishment.id);
      return filtered.map(parseDisputeDetails);
    }),
  // ─── Catalog: Homologação - Funções adicionais ──────────────────────

  // Criar categoria no catálogo iFood
  createCategory: protectedProcedure
    .input(z.object({
      catalogId: z.string(),
      name: z.string().min(1),
      externalCode: z.string().optional(),
      status: z.enum(["AVAILABLE", "UNAVAILABLE"]).optional(),
      template: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });
      const { catalogId, ...data } = input;
      return await createCategory(establishment.id, config.merchantId, catalogId, data);
    }),

  // Atualizar preço de opção/complemento
  updateOptionPrice: protectedProcedure
    .input(z.object({
      optionId: z.string(),
      price: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });
      await updateOptionPrice(establishment.id, config.merchantId, input.optionId, input.price);
      return { success: true };
    }),

  // Atualizar status de opção/complemento
  updateOptionStatus: protectedProcedure
    .input(z.object({
      optionId: z.string(),
      status: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });
      await updateOptionStatus(establishment.id, config.merchantId, input.optionId, input.status);
      return { success: true };
    }),

  // Upload de imagem para o iFood
  uploadImage: protectedProcedure
    .input(z.object({
      imageUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });
      return await uploadImage(establishment.id, config.merchantId, input.imageUrl);
    }),

   // ─── Phase 5: Homologation ────────────────────────────────────────────

  healthStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const { getIfoodHealthStatus } = await import('./ifoodHomologation');
      return getIfoodHealthStatus(establishment.id);
    }),

  homologationChecklist: protectedProcedure
    .query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const { runHomologationChecklist } = await import('./ifoodHomologation');
      return runHomologationChecklist(establishment.id);
    }),

  // ─── Sync: Local Menu → iFood ────────────────────────────────────────

  // Get all product and category mappings for the establishment
  getSyncMappings: protectedProcedure
    .query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const productMappings = await getAllProductMappings(establishment.id);
      const categoryMappings = await getAllCategoryMappings(establishment.id);

      return { productMappings, categoryMappings };
    }),

  // Publish a single product to iFood
  publishProduct: protectedProcedure
    .input(z.object({
      localProductId: z.number(),
      ifoodCategoryId: z.string().optional(),
      localCategoryId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });

      // Get catalog ID
      const catalogs = await getCatalogs(establishment.id, config.merchantId);
      if (!catalogs || catalogs.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum catálogo encontrado no iFood' });
      const catalogId = catalogs[0].catalogId;

      // Determine iFood category ID
      let ifoodCategoryId = input.ifoodCategoryId;
      if (!ifoodCategoryId && input.localCategoryId) {
        ifoodCategoryId = await ensureCategoryInIfood(
          establishment.id, config.merchantId, catalogId, input.localCategoryId
        ) || undefined;
      }
      if (!ifoodCategoryId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria do iFood não especificada' });
      }

      const result = await publishProductToIfood(
        establishment.id, config.merchantId, catalogId, input.localProductId, ifoodCategoryId
      );

      if (!result.success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error || 'Erro ao publicar produto' });
      }

      return result;
    }),

  // Publish all products in a category to iFood
  publishCategory: protectedProcedure
    .input(z.object({
      localCategoryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });

      const catalogs = await getCatalogs(establishment.id, config.merchantId);
      if (!catalogs || catalogs.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum catálogo encontrado no iFood' });
      const catalogId = catalogs[0].catalogId;

      return await publishCategoryToIfood(
        establishment.id, config.merchantId, catalogId, input.localCategoryId
      );
    }),

  // Sync ALL local products to iFood
  syncAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });

      const catalogs = await getCatalogs(establishment.id, config.merchantId);
      if (!catalogs || catalogs.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum catálogo encontrado no iFood' });
      const catalogId = catalogs[0].catalogId;

      // Clear previous error mappings so new UUIDs are generated on retry
      const database = await db.getDb();
      if (database) {
        await database.delete(ifoodProductMapping)
          .where(and(
            eq(ifoodProductMapping.establishmentId, establishment.id),
            eq(ifoodProductMapping.syncStatus, 'error')
          ));
      }

      return await syncAllToIfood(establishment.id, config.merchantId, catalogId);
    }),

  // Map a local category to an existing iFood category
  mapCategory: protectedProcedure
    .input(z.object({
      localCategoryId: z.number(),
      ifoodCategoryId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'iFood não configurado' });

      const catalogs = await getCatalogs(establishment.id, config.merchantId);
      if (!catalogs || catalogs.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum catálogo encontrado no iFood' });

      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const existing = await database.select().from(ifoodCategoryMapping)
        .where(and(
          eq(ifoodCategoryMapping.establishmentId, establishment.id),
          eq(ifoodCategoryMapping.localCategoryId, input.localCategoryId)
        ))
        .limit(1);

      if (existing.length > 0) {
        await database.update(ifoodCategoryMapping)
          .set({
            ifoodCategoryId: input.ifoodCategoryId,
            ifoodCatalogId: catalogs[0].catalogId,
            lastSyncedAt: new Date(),
          })
          .where(eq(ifoodCategoryMapping.id, existing[0].id));
      } else {
        await database.insert(ifoodCategoryMapping).values({
          establishmentId: establishment.id,
          localCategoryId: input.localCategoryId,
          ifoodCategoryId: input.ifoodCategoryId,
          ifoodCatalogId: catalogs[0].catalogId,
          lastSyncedAt: new Date(),
        });
      }

      return { success: true };
    }),
});
