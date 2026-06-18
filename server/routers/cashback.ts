import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney, zMoneyOptional } from "../../shared/validation";

export const cashbackRouter = router({
    // Buscar configurações de cashback do estabelecimento (admin)
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return null;
        return {
          rewardProgramType: establishment.rewardProgramType || 'none',
          cashbackEnabled: establishment.cashbackEnabled || false,
          cashbackPercent: establishment.cashbackPercent || '0',
          cashbackApplyMode: establishment.cashbackApplyMode || 'all',
          cashbackCategoryIds: establishment.cashbackCategoryIds || [],
          cashbackAllowPartialUse: establishment.cashbackAllowPartialUse ?? true,
          loyaltyEnabled: establishment.loyaltyEnabled || false,
        };
      }),

    // Salvar configurações de programa de recompensas (admin)
    saveConfig: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        rewardProgramType: z.enum(['none', 'loyalty', 'cashback']),
        cashbackPercent: zMoneyOptional,
        cashbackApplyMode: z.enum(['all', 'categories']).optional(),
        cashbackCategoryIds: z.array(z.number()).optional(),
        cashbackAllowPartialUse: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, rewardProgramType, ...cashbackSettings } = input;
        
        const updateData: any = { rewardProgramType };
        
        if (rewardProgramType === 'cashback') {
          updateData.cashbackEnabled = true;
          updateData.loyaltyEnabled = false;
          if (cashbackSettings.cashbackPercent !== undefined) updateData.cashbackPercent = cashbackSettings.cashbackPercent;
          if (cashbackSettings.cashbackApplyMode !== undefined) updateData.cashbackApplyMode = cashbackSettings.cashbackApplyMode;
          if (cashbackSettings.cashbackCategoryIds !== undefined) updateData.cashbackCategoryIds = cashbackSettings.cashbackCategoryIds;
          if (cashbackSettings.cashbackAllowPartialUse !== undefined) updateData.cashbackAllowPartialUse = cashbackSettings.cashbackAllowPartialUse;
        } else if (rewardProgramType === 'loyalty') {
          updateData.cashbackEnabled = false;
          updateData.loyaltyEnabled = true;
        } else {
          updateData.cashbackEnabled = false;
          updateData.loyaltyEnabled = false;
        }
        
        await db.updateEstablishment(establishmentId, updateData);
        return { success: true };
      }),

    // Buscar saldo de cashback do cliente (público - requer telefone)
    getBalance: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10).max(11),
      }))
      .query(async ({ input }) => {
        const balance = await db.getCashbackBalance(input.establishmentId, input.phone);
        if (!balance) return { balance: '0.00', totalEarned: '0.00', totalUsed: '0.00' };
        return {
          balance: balance.balance,
          totalEarned: balance.totalEarned,
          totalUsed: balance.totalUsed,
        };
      }),

    // Buscar histórico de transações de cashback do cliente (público)
    getTransactions: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10).max(11),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const transactions = await db.getCashbackTransactions(input.establishmentId, input.phone, input.limit || 50);
        return transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          orderNumber: tx.orderNumber,
          description: tx.description,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          createdAt: tx.createdAt,
        }));
      }),

    // Verificar se cashback está ativo no estabelecimento (público)
isEnabled: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        let categoryIds = establishment?.cashbackCategoryIds || [];
        // Se applyMode é "categories", resolver IDs de draft para published
        // O admin salva os IDs do draft, mas o menu público usa IDs do published
        if (establishment?.cashbackApplyMode === "categories" && categoryIds.length > 0) {
          const resolvedIds = await db.resolveDraftToPublishedCategoryIds(input.establishmentId, categoryIds);
          categoryIds = resolvedIds;
        }
        return {
          enabled: establishment?.cashbackEnabled && establishment?.rewardProgramType === 'cashback',
          percent: establishment?.cashbackPercent || '0',
          applyMode: establishment?.cashbackApplyMode || 'all',
          categoryIds,
          allowPartialUse: false, // Sempre exigir uso total
        };
      }),

    // Validar e aplicar cashback no pedido (público)
    validateUsage: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10).max(11),
        amount: zMoney, // Valor que o cliente quer usar
        orderTotal: z.string(), // Total do pedido
      }))
      .mutation(async ({ input }) => {
        const balance = await db.getCashbackBalance(input.establishmentId, input.phone);
        if (!balance) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Saldo de cashback não encontrado' });
        }
        
        const currentBalance = Number(balance.balance);
        const requestedAmount = Number(input.amount);
        const orderTotal = Number(input.orderTotal);
        
        // Verificar configurações
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment?.cashbackEnabled || establishment?.rewardProgramType !== 'cashback') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cashback não está ativo' });
        }
        
        // Sempre exigir uso total do saldo: o valor solicitado deve ser o saldo total
        // (o frontend envia o saldo completo, e o backend aplica no máximo o valor do pedido)
        const effectiveAmount = Math.min(currentBalance, orderTotal);
        
        return {
          valid: true,
          effectiveAmount: effectiveAmount.toFixed(2),
          remainingBalance: (currentBalance - effectiveAmount).toFixed(2),
          newOrderTotal: (orderTotal - effectiveAmount).toFixed(2),
        };
      }),

    // Calcular cashback previsto para itens do carrinho (público)
    calculatePreview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          totalPrice: zMoney,
        })),
      }))
      .query(async ({ input }) => {
        const result = await db.calculateCashbackForOrder(input.establishmentId, input.items);
        return {
          cashbackAmount: result.cashbackAmount.toFixed(2),
          eligibleTotal: result.eligibleTotal.toFixed(2),
        };
      }),

    // Métricas do programa de cashback (admin)
    getMetrics: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getCashbackMetrics(input.establishmentId);
      }),

    // Evolução do cashback nos últimos 30 dias
    getEvolution: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLoyaltyEvolution(input.establishmentId, 'cashback');
      }),

    // Lista de clientes com cashback
    getClients: protectedProcedure
      .input(z.object({ establishmentId: z.number(), limit: z.number().optional(), offset: z.number().optional(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getCashbackClients(input.establishmentId, input.limit ?? 10, input.offset ?? 0, input.search);
      }),

    // Histórico de eventos de cashback (créditos e débitos)
    getEventHistory: protectedProcedure
      .input(z.object({ establishmentId: z.number(), limit: z.number().optional(), offset: z.number().optional(), period: z.enum(['today', 'week', 'month']).optional(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getCashbackEventHistory(input.establishmentId, input.limit ?? 10, input.offset ?? 0, input.period, input.search);
      }),
  });
