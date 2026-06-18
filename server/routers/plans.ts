import * as db from "../db";
import * as adminDb from "../adminDb";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const plansRouter = router({
    /** Busca dados dinâmicos de planos (preços + features) para exibição pública */
    getData: publicProcedure.query(async () => {
      return adminDb.getAllPlanData();
    }),

    // Downgrade para plano gratuito (cancela subscription ativa quando existir)
    downgradeToFree: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

        if (establishment.planType === 'free' || establishment.planType === 'trial') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Você já está no plano gratuito.' });
        }

        if (establishment.stripeSubscriptionId) {
          try {
            const stripe = (await import('stripe')).default;
            const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || '');
            await stripeClient.subscriptions.cancel(establishment.stripeSubscriptionId);
            logger.info(`[Plans] Stripe subscription ${establishment.stripeSubscriptionId} cancelada para estabelecimento ${establishment.id}`);
          } catch (err: any) {
            logger.warn(`[Plans] Erro ao cancelar subscription Stripe: ${err?.message || err}`);
          }
        }

        await db.deactivatePlan(establishment.id);
        logger.info(`[Plans] Estabelecimento ${establishment.id} fez downgrade para plano gratuito`);

        return { success: true };
      }),

    // Criar sessão de checkout Stripe para upgrade de plano
    createCheckout: protectedProcedure
      .input(z.object({
        planId: z.string(),
        isAnnual: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Buscar preço dinâmico do banco
        const planPrice = await adminDb.getPlanPrice(input.planId);
        
        const { createPlanCheckoutSession } = await import("../stripe");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const result = await createPlanCheckoutSession({
          planId: input.planId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          establishmentId: establishment.id,
          origin,
          isAnnual: input.isAnnual,
          stripeCustomerId: establishment.stripeCustomerId,
          // Passar preço dinâmico se existir no DB
          dynamicPriceCents: planPrice ? (input.isAnnual ? planPrice.annualPriceCents : planPrice.monthlyPriceCents) : undefined,
        });
        
        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado.' });
        }
        
        return result;
      }),
  });
