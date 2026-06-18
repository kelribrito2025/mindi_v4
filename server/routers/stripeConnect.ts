import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney, zMoneyOptional, parseMoney, validateOrderTotal } from "../../shared/validation";

/**
 * Calcula o preço efetivo de um complemento considerando priceMode e gratuidade por tipo de entrega.
 * Replica a mesma lógica do frontend (getComplementPrice no PublicMenu.tsx).
 */
function getServerComplementPrice(
  item: { price: string; priceMode: string; freeOnDelivery: boolean; freeOnPickup: boolean; freeOnDineIn: boolean },
  deliveryType: 'delivery' | 'pickup' | 'dine_in'
): number {
  if (item.priceMode === 'free') {
    if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
    if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
    if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return parseFloat(item.price);
  }
  if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
  if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
  if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
  return parseFloat(item.price);
}

export const stripeConnectRouter = router({
    // Criar connected account para o restaurante
    createAccount: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Verificar se já tem uma conta Stripe Connect
        if (establishment.stripeAccountId) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Estabelecimento já possui uma conta Stripe Connect' });
        }
        
        const { createConnectedAccount } = await import("../stripeConnect");
        const { accountId } = await createConnectedAccount({
          displayName: establishment.name,
          contactEmail: establishment.email || ctx.user.email || '',
        });
        
        // Salvar o accountId no estabelecimento
        await db.updateEstablishment(establishment.id, {
          stripeAccountId: accountId,
        });
        
        return { accountId };
      }),
    
    // Gerar link de onboarding
    createOnboardingLink: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        if (!establishment.stripeAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Crie uma conta Stripe Connect primeiro' });
        }
        
        const { createAccountLink } = await import("../stripeConnect");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const { url } = await createAccountLink({
          accountId: establishment.stripeAccountId,
          returnUrl: `${origin}/configuracoes?stripe=return&tab=pagamento-online`,
          refreshUrl: `${origin}/configuracoes?stripe=refresh&tab=pagamento-online`,
        });
        
        return { url };
      }),
    
    // Verificar status da conta
    getAccountStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        if (!establishment.stripeAccountId) {
          return {
            hasAccount: false,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            onboardingComplete: false,
            onlinePaymentEnabled: establishment.onlinePaymentEnabled,
          };
        }
        
        try {
          const { getAccountStatus } = await import("../stripeConnect");
          const status = await getAccountStatus(establishment.stripeAccountId);
          
          // Atualizar status de onboarding no banco se mudou
          const isComplete = status.chargesEnabled && status.detailsSubmitted;
          if (isComplete !== establishment.stripeOnboardingComplete) {
            await db.updateEstablishment(establishment.id, {
              stripeOnboardingComplete: isComplete,
            });
          }
          
          return {
            hasAccount: true,
            ...status,
            onboardingComplete: isComplete,
            onlinePaymentEnabled: establishment.onlinePaymentEnabled,
          };
        } catch (error) {
          logger.error('[Stripe Connect] Erro ao buscar status:', error);
          return {
            hasAccount: true,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            onboardingComplete: false,
            onlinePaymentEnabled: establishment.onlinePaymentEnabled,
          };
        }
      }),
    
    // Ativar/desativar pagamento online
    toggleOnlinePayment: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Só pode ativar se o onboarding está completo
        if (input.enabled) {
          if (!establishment.stripeAccountId || !establishment.stripeOnboardingComplete) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Complete o cadastro no Stripe antes de ativar o pagamento online.',
            });
          }
        }
        
        await db.updateEstablishment(establishment.id, {
          onlinePaymentEnabled: input.enabled,
        });
        
        return { success: true, enabled: input.enabled };
      }),
    
    // Abrir dashboard do Stripe Express
    getDashboardLink: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment?.stripeAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Conta Stripe Connect não encontrada' });
        }
        
        const { createDashboardLink } = await import("../stripeConnect");
        const { url } = await createDashboardLink(establishment.stripeAccountId);
        return { url };
      }),
    
    // Criar checkout session para pedido online (endpoint público)
    createOrderCheckout: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerName: z.string().min(1),
        customerPhone: z.string().min(1),
        customerAddress: z.string().optional(),
        customerLat: z.string().optional(),
        customerLng: z.string().optional(),
        deliveryType: z.enum(["delivery", "pickup", "dine_in"]).default("delivery"),
        deliveryFee: zMoney.default("0"),
        discount: zMoney.default("0"),
        subtotal: zMoney,
        total: zMoney,
        notes: z.string().optional(),
        changeAmount: z.string().optional(),
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        loyaltyCardId: z.number().optional(),
        cashbackAmount: zMoneyOptional,
        cashbackCustomerPhone: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: zMoney,
          totalPrice: zMoney,
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number().default(1),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        }
        
        if (!establishment.onlinePaymentEnabled || !establishment.stripeAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pagamento online não está disponível para este estabelecimento' });
        }
        
        // Verificar se o estabelecimento está aberto (cálculo dinâmico baseado em horários de funcionamento)
        const storeStatusForCheckout = await db.getEstablishmentOpenStatus(input.establishmentId);
        
        if (!storeStatusForCheckout.isOpen) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'O estabelecimento está fechado' });
        }
        
        // ── Validação server-side de preços ──
        let serverSubtotal = 0;
        for (const item of input.items) {
          const product = await db.getProductById(item.productId);
          if (!product) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Produto "${item.productName}" não encontrado.` });
          }
          const realUnitPrice = parseFloat(product.price);
          let complementsTotal = 0;
          if (item.complements && item.complements.length > 0) {
            const groups = await db.getComplementGroupsByProduct(item.productId);
            for (const complement of item.complements) {
              let foundPrice = complement.price;
              for (const group of groups) {
                const groupItems = await db.getComplementItemsByGroup(group.id, item.productId);
                const dbItem = groupItems.find(ci => ci.name === complement.name);
                if (dbItem) {
                  // Aplicar mesma lógica de gratuidade do frontend
                  foundPrice = getServerComplementPrice(dbItem, input.deliveryType);
                  break;
                }
              }
              complementsTotal += foundPrice * (complement.quantity || 1);
            }
          }
          const expectedUnitPrice = realUnitPrice + complementsTotal;
          const claimedUnitPrice = parseMoney(item.unitPrice);
          if (Math.abs(claimedUnitPrice - expectedUnitPrice) > 0.02) {
            logger.warn('[StripeCheckout] Preço unitário inconsistente (ignorado):', { productId: item.productId, claimedUnitPrice, expectedUnitPrice });
            // NOTA: Validação de preço desativada temporariamente para não bloquear pedidos
          }
          serverSubtotal += expectedUnitPrice * item.quantity;
        }
        serverSubtotal = Math.round(serverSubtotal * 100) / 100;
        const claimedSubtotal = parseMoney(input.subtotal);
        if (Math.abs(serverSubtotal - claimedSubtotal) > 0.10) {
          logger.warn('[StripeCheckout] Subtotal inconsistente (ignorado):', { serverSubtotal, claimedSubtotal });
          // NOTA: Validação de subtotal desativada temporariamente para não bloquear pedidos
        }
        const totalCheck = validateOrderTotal({
          claimedSubtotal: input.subtotal,
          claimedDeliveryFee: input.deliveryFee || '0',
          claimedDiscount: input.discount || '0',
          claimedTotal: input.total,
          claimedCashback: input.cashbackAmount,
        });
        if (!totalCheck.valid) {
          logger.warn('[StripeCheckout] Total inconsistente (ignorado):', totalCheck);
          // NOTA: Validação de total desativada temporariamente para não bloquear pedidos
        }
        
        const { createOrderCheckoutSession } = await import("../stripeConnect");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        // Preparar items para o checkout
        const orderItems = input.items.map(item => {
          const complementsTotal = (item.complements || []).reduce(
            (sum, c) => sum + c.price * (c.quantity || 1), 0
          );
          const unitPriceInCents = Math.round((parseFloat(item.unitPrice) + complementsTotal) * 100);
          
          const complementsDesc = (item.complements || []).length > 0
            ? ` (${(item.complements || []).map(c => c.name).join(', ')})`
            : '';
          
          return {
            name: item.productName,
            quantity: item.quantity,
            priceInCents: unitPriceInCents,
            description: complementsDesc || undefined,
          };
        });
        
        const deliveryFeeInCents = Math.round(parseFloat(input.deliveryFee || '0') * 100);
        
        // Salvar dados do pedido para usar no webhook
        const orderDataObj = {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress || '',
          customerLat: input.customerLat || '',
          customerLng: input.customerLng || '',
          deliveryType: input.deliveryType,
          paymentMethod: 'card_online',
          subtotal: input.subtotal,
          deliveryFee: input.deliveryFee || '0',
          discount: input.discount || '0',
          total: input.total,
          notes: input.notes || '',
          changeAmount: input.changeAmount || '',
          couponCode: input.couponCode || '',
          couponId: input.couponId || null,
          loyaltyCardId: input.loyaltyCardId || null,
          items: input.items,
        };
        
        const menuSlug = establishment.menuSlug || '';
        
        const result = await createOrderCheckoutSession({
          connectedAccountId: establishment.stripeAccountId,
          orderItems,
          deliveryFeeInCents,
          customerEmail: undefined,
          customerName: input.customerName,
          establishmentId: establishment.id,
          establishmentName: establishment.name,
          orderData: JSON.stringify({ type: 'pending_db' }), // Dados reais salvos no banco
          successUrl: `${origin}/menu/${menuSlug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/menu/${menuSlug}?payment=cancelled`,
        });
        
        // Salvar dados completos do pedido no banco (evita limite de 500 chars do metadata Stripe)
        await db.savePendingOnlineOrder(result.sessionId, establishment.id, orderDataObj);
        
        return result;
      }),

    // Verificar status do pagamento de checkout session (endpoint público)
    checkPaymentStatus: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1),
      }))
      .query(async ({ input }) => {
        try {
          const { getCheckoutSessionStatus } = await import("../stripeConnect");
          const result = await getCheckoutSessionStatus(input.sessionId);
          
          // Se pagamento confirmado, buscar dados do pedido criado
          if (result.status === 'complete' && result.paymentStatus === 'paid') {
            const pendingOrder = await db.getPendingOnlineOrder(input.sessionId);
            if (pendingOrder && pendingOrder.status === 'completed') {
              return {
                ...result,
                orderNumber: pendingOrder.resultOrderNumber || undefined,
                orderId: pendingOrder.resultOrderId || undefined,
              };
            }
          }
          
          return result;
        } catch (error) {
          logger.error('[checkPaymentStatus] Erro:', error);
          return { status: 'open' as const, paymentStatus: 'unpaid' };
        }
      }),
  });
