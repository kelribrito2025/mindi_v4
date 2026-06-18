import * as db from "../db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const loyaltyRouter = router({
    // Configurações de fidelidade do estabelecimento (admin)
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return null;
        return {
          loyaltyEnabled: establishment.loyaltyEnabled,
          loyaltyStampsRequired: establishment.loyaltyStampsRequired,
          loyaltyCouponType: establishment.loyaltyCouponType,
          loyaltyCouponValue: establishment.loyaltyCouponValue,
          loyaltyMinOrderValue: establishment.loyaltyMinOrderValue,
        };
      }),
    
    // Salvar configurações de fidelidade (admin)
    saveSettings: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        loyaltyEnabled: z.boolean(),
        loyaltyStampsRequired: z.number().min(1).max(20),
        loyaltyCouponType: z.enum(["fixed", "percentage", "free_delivery"]),
        loyaltyCouponValue: z.string(),
        loyaltyMinOrderValue: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { establishmentId, ...settings } = input;
        
        // Verificar que o utilizador é dono deste estabelecimento
        await assertEstablishmentOwnership(ctx.user.id, establishmentId);
        
        await db.updateEstablishment(establishmentId, settings);
        return { success: true };
      }),
    
    // Login/Cadastro do cliente no cartão fidelidade (público)
    customerLogin: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10).max(11),
        password4: z.string().length(4),
      }))
      .mutation(async ({ input }) => {
        // Normalizar telefone para busca
        const normalizedPhone = input.phone.replace(/[^0-9]/g, '');
        logger.info(`[Fidelidade Login] Tentando login: ${input.phone} -> ${normalizedPhone}`);
        
        const card = await db.getLoyaltyCardByPhone(input.establishmentId, normalizedPhone);
        
        if (!card) {
          logger.info(`[Fidelidade Login] Cartão não encontrado para ${normalizedPhone}`);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cartão não encontrado. Cadastre-se primeiro.",
          });
        }
        
        logger.info(`[Fidelidade Login] Cartão encontrado: ID ${card.id}, telefone ${card.customerPhone}`);
        
        // Verificar senha
        const isValid = await bcrypt.compare(input.password4, card.password4Hash);
        logger.info(`[Fidelidade Login] Senha válida: ${isValid}`);
        
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha incorreta.",
          });
        }
        
        return { success: true, cardId: card.id };
      }),
    
    // Cadastro do cliente no cartão fidelidade (público)
    customerRegister: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10).max(11),
        password4: z.string().length(4),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se já existe cartão
        const existingCard = await db.getLoyaltyCardByPhone(input.establishmentId, input.phone);
        
        if (existingCard) {
          // Se já existe mas não tem senha, atualizar com a senha
          if (!existingCard.password4Hash) {
            const hash = await bcrypt.hash(input.password4, 10);
            await db.updateLoyaltyCard(existingCard.id, {
              password4Hash: hash,
              customerName: input.name || existingCard.customerName,
            });
            return { success: true, cardId: existingCard.id };
          }
          
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este telefone já possui um cartão fidelidade.",
          });
        }
        
        // Criar novo cartão
        const hash = await bcrypt.hash(input.password4, 10);
        const cardId = await db.createLoyaltyCard({
          establishmentId: input.establishmentId,
          customerPhone: input.phone,
          customerName: input.name,
          password4Hash: hash,
        });
        
        return { success: true, cardId };
      }),
    
    // Buscar dados do cartão do cliente (público)
    getCustomerCard: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10).max(11),
      }))
      .query(async ({ input }) => {
        const card = await db.getLoyaltyCardByPhone(input.establishmentId, input.phone);
        if (!card) return null;
        
        // Buscar configurações do estabelecimento
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) return null;
        
        // Buscar histórico de carimbos
        const stamps = await db.getLoyaltyStamps(card.id);
        
        // Buscar múltiplos cupons ativos se houver
        let activeCoupons: Array<{
          id: number;
          code: string;
          type: string;
          value: string;
          expiresAt: string | null;
        }> = [];
        
        // Primeiro verificar o novo campo activeCouponIds (array)
        if (card.activeCouponIds && Array.isArray(card.activeCouponIds) && card.activeCouponIds.length > 0) {
          for (const couponId of card.activeCouponIds) {
            const coupon = await db.getCouponById(couponId);
            if (coupon && coupon.status === 'active') {
              activeCoupons.push({
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                expiresAt: coupon.endDate ? coupon.endDate.toISOString() : null,
              });
            }
          }
        } else if (card.activeCouponId) {
          // Fallback para o campo legado (single coupon)
          const coupon = await db.getCouponById(card.activeCouponId);
          if (coupon && coupon.status === 'active') {
            activeCoupons.push({
              id: coupon.id,
              code: coupon.code,
              type: coupon.type,
              value: coupon.value,
              expiresAt: coupon.endDate ? coupon.endDate.toISOString() : null,
            });
          }
        }
        
        return {
          card: {
            id: card.id,
            customerName: card.customerName,
            stamps: card.stamps,
            totalStampsEarned: card.totalStampsEarned,
            couponsEarned: card.couponsEarned,
          },
          settings: {
            stampsRequired: establishment.loyaltyStampsRequired || 6,
            couponType: establishment.loyaltyCouponType,
            couponValue: establishment.loyaltyCouponValue,
          },
          stamps: stamps.map(s => ({
            id: s.id,
            orderNumber: s.orderNumber,
            orderTotal: s.orderTotal,
            createdAt: s.createdAt,
          })),
          // Manter compatibilidade com o campo antigo (primeiro cupom)
          activeCoupon: activeCoupons.length > 0 ? {
            id: activeCoupons[0].id,
            code: activeCoupons[0].code,
            type: activeCoupons[0].type,
            value: activeCoupons[0].value,
            expiresAt: activeCoupons[0].expiresAt,
          } : null,
          // Novo campo com todos os cupons
          activeCoupons: activeCoupons,
        };
      }),
    
    // Verificar se fidelidade está ativa no estabelecimento (público)
    isEnabled: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        return {
          enabled: establishment?.loyaltyEnabled || false,
          stampsRequired: establishment?.loyaltyStampsRequired || 6,
        };
      }),
    
    // Listar todos os cartões do estabelecimento (admin)
    listCards: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLoyaltyCardsByEstablishment(input.establishmentId);
      }),
    
    // Resetar carimbos quando usuário visualiza o cupom ganho (público)
    viewCouponAndResetStamps: publicProcedure
      .input(z.object({ 
        establishmentId: z.number(), 
        phone: z.string(),
        password: z.string()
      }))
      .mutation(async ({ input }) => {
        logger.info(`[Fidelidade] viewCouponAndResetStamps chamado - phone: ${input.phone}, establishmentId: ${input.establishmentId}`);
        
        // Verificar login do cliente
        const card = await db.getLoyaltyCardByPhone(input.establishmentId, input.phone);
        logger.info(`[Fidelidade] Cartão encontrado:`, card ? { id: card.id, stamps: card.stamps, activeCouponId: card.activeCouponId } : 'NÃO ENCONTRADO');
        
        if (!card) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cartão não encontrado' });
        }
        
        // Verificar senha
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(input.password, card.password4Hash);
        logger.info(`[Fidelidade] Senha válida: ${isValid}`);
        
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta' });
        }
        
        // Verificar se tem cupom ativo (cartão foi completado)
        logger.info(`[Fidelidade] activeCouponId: ${card.activeCouponId}`);
        if (!card.activeCouponId) {
          logger.info(`[Fidelidade] Nenhum cupom ativo - não vai resetar`);
          return { success: false, message: 'Nenhum cupom disponível para visualizar' };
        }
        
        // Resetar os carimbos e deletar histórico de carimbos
        logger.info(`[Fidelidade] Chamando resetLoyaltyStampsOnCouponView para cartão ${card.id}`);
        await db.resetLoyaltyStampsOnCouponView(card.id);
        
        logger.info(`[Fidelidade] Carimbos resetados com sucesso para cliente ${input.phone}`);
        
        return { success: true, message: 'Carimbos resetados com sucesso' };
      }),

    // Métricas do programa de fidelidade (admin)
    getMetrics: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLoyaltyMetrics(input.establishmentId);
      }),

    // Evolução da fidelização nos últimos 30 dias
    getEvolution: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLoyaltyEvolution(input.establishmentId, 'loyalty');
      }),

    // Lista de clientes com cartão fidelidade
    getClients: protectedProcedure
      .input(z.object({ establishmentId: z.number(), limit: z.number().optional(), offset: z.number().optional(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLoyaltyCardClients(input.establishmentId, input.limit ?? 10, input.offset ?? 0, input.search);
      }),

    // Histórico de eventos (carimbos ganhos, cartões completados)
    getEventHistory: protectedProcedure
      .input(z.object({ establishmentId: z.number(), limit: z.number().optional(), offset: z.number().optional(), period: z.enum(['today', 'week', 'month']).optional(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLoyaltyEventHistory(input.establishmentId, input.limit ?? 10, input.offset ?? 0, input.period, input.search);
      }),
  });
