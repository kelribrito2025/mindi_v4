/**
 * Cancel Retention Router
 * 
 * Handles the multi-step cancellation flow with retention offers:
 * 1. initCancel - User selects reason, system checks eligibility and returns offer
 * 2. acceptRetentionOffer - User accepts discount offer
 * 3. confirmCancel - User confirms cancellation (plano fica ativo até fim do período)
 * 4. getRetentionEligibility - Check if user can receive retention offer (1x/ano)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import * as db from "../db";
import { getDb } from "../db";
import * as planSubDb from "../planSubscriptionDb";
import { cancelRetentionOffers, planSubscriptions } from "../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";

const CANCEL_REASONS = ["too_expensive", "not_using", "missing_features", "found_alternative", "technical_issues", "other"] as const;

// Offer configuration
const RETENTION_OFFERS = {
  too_expensive: { discountPercent: 30, discountMonths: 2, offerType: "discount_30_2m" },
  default: { discountPercent: 20, discountMonths: 1, offerType: "discount_20_1m" },
} as const;

export const cancelRetentionRouter = router({
  /**
   * Step 1: Initialize cancellation flow
   * Returns eligibility for retention offer based on reason and history
   */
  initCancel: protectedProcedure
    .input(z.object({
      reason: z.enum(CANCEL_REASONS),
      reasonText: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      
      const subscription = await planSubDb.getActiveSubscription(establishment.id);
      if (!subscription || subscription.status === "canceled" || subscription.status === "expired") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma assinatura ativa encontrada" });
      }
      
      // Check if user already used retention offer in the last 12 months
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const eligible = !subscription.lastRetentionOfferAt || 
        new Date(subscription.lastRetentionOfferAt) < oneYearAgo;
      
      // Determine offer based on reason
      const offerConfig = input.reason === "too_expensive" 
        ? RETENTION_OFFERS.too_expensive 
        : RETENTION_OFFERS.default;
      
      // Calculate discounted price
      const currentAmountCents = subscription.amountCents;
      const discountedAmountCents = Math.round(currentAmountCents * (1 - offerConfig.discountPercent / 100));
      
      logger.info(`[CancelRetention] initCancel: est=${establishment.id}, reason=${input.reason}, eligible=${eligible}, offer=${offerConfig.offerType}`);
      
      return {
        eligible,
        subscriptionId: subscription.id,
        currentAmountCents,
        discountedAmountCents,
        discountPercent: offerConfig.discountPercent,
        discountMonths: offerConfig.discountMonths,
        offerType: offerConfig.offerType,
        // Info for confirmation step
        currentPeriodEnd: subscription.currentPeriodEnd || subscription.nextRenewalAt,
        planName: subscription.planId,
      };
    }),

  /**
   * Step 2: Accept retention offer (apply discount)
   */
  acceptRetentionOffer: protectedProcedure
    .input(z.object({
      subscriptionId: z.number(),
      reason: z.enum(CANCEL_REASONS),
      reasonText: z.string().optional(),
      offerType: z.string(),
      discountPercent: z.number(),
      discountMonths: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      
      const subscription = await planSubDb.getSubscriptionById(input.subscriptionId);
      if (!subscription || subscription.establishmentId !== establishment.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada" });
      }
      
      // Check eligibility again
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (subscription.lastRetentionOfferAt && new Date(subscription.lastRetentionOfferAt) >= oneYearAgo) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Oferta de retenção já utilizada nos últimos 12 meses" });
      }
      
      // Calculate discount end date
      const discountUntil = new Date();
      discountUntil.setMonth(discountUntil.getMonth() + input.discountMonths);
      
      // Apply discount to subscription
      await planSubDb.updateSubscriptionById(subscription.id, {
        discountPercent: input.discountPercent,
        discountUntil,
        discountMonthsRemaining: input.discountMonths,
        lastRetentionOfferAt: new Date(),
      });
      
      // Save retention offer record
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance.insert(cancelRetentionOffers).values({
          establishmentId: establishment.id,
          subscriptionId: subscription.id,
          cancelReason: input.reason,
          cancelReasonText: input.reasonText || null,
          offerType: input.offerType,
          offerAccepted: true,
          discountPercent: input.discountPercent,
          discountMonths: input.discountMonths,
        });
      }
      
      logger.info(`[CancelRetention] Offer accepted: est=${establishment.id}, sub=${subscription.id}, discount=${input.discountPercent}% for ${input.discountMonths} months`);
      
      return { 
        success: true,
        discountPercent: input.discountPercent,
        discountMonths: input.discountMonths,
        discountUntil,
      };
    }),

  /**
   * Step 3: Confirm cancellation (user rejected the offer)
   * Plan stays active until end of current period
   */
  confirmCancel: protectedProcedure
    .input(z.object({
      subscriptionId: z.number(),
      reason: z.enum(CANCEL_REASONS),
      reasonText: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      
      const subscription = await planSubDb.getSubscriptionById(input.subscriptionId);
      if (!subscription || subscription.establishmentId !== establishment.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada" });
      }
      
      if (subscription.status === "canceled" || subscription.status === "expired") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Assinatura já está cancelada" });
      }
      
      // Set cancelAt to end of current period (plan stays active until then)
      const cancelAt = subscription.currentPeriodEnd || subscription.nextRenewalAt || new Date();
      
      // Update subscription to "canceling" status
      await planSubDb.updateSubscriptionById(subscription.id, {
        status: "canceling",
        cancelReason: input.reason + (input.reasonText ? `: ${input.reasonText}` : ""),
        cancelAt,
        canceledAt: new Date(),
      });
      
      // Save retention offer record (rejected)
      const dbInstance = await getDb();
      if (dbInstance) {
        const offerConfig = input.reason === "too_expensive" 
          ? RETENTION_OFFERS.too_expensive 
          : RETENTION_OFFERS.default;
        
        await dbInstance.insert(cancelRetentionOffers).values({
          establishmentId: establishment.id,
          subscriptionId: subscription.id,
          cancelReason: input.reason,
          cancelReasonText: input.reasonText || null,
          offerType: offerConfig.offerType,
          offerAccepted: false,
          discountPercent: offerConfig.discountPercent,
          discountMonths: offerConfig.discountMonths,
        });
      }
      
      logger.info(`[CancelRetention] Cancellation confirmed: est=${establishment.id}, sub=${subscription.id}, cancelAt=${cancelAt.toISOString()}`);
      
      // Send cancellation confirmation email
      try {
        const { sendEmail } = await import("../email");
        const userEmail = ctx.user.email;
        if (userEmail) {
          const cancelDate = cancelAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
          await sendEmail({
            to: [{ email: userEmail }],
            subject: "Confirmação de cancelamento - Mindi",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Cancelamento confirmado</h2>
                <p>Olá ${ctx.user.name || ''},</p>
                <p>Confirmamos o cancelamento da sua assinatura.</p>
                <p><strong>Seu plano permanecerá ativo até ${cancelDate}.</strong></p>
                <p>Após essa data, seu cardápio sairá do ar e o acesso ao painel será limitado.</p>
                <p>Você pode reativar sua assinatura a qualquer momento antes dessa data.</p>
                <br/>
                <p style="color: #666; font-size: 12px;">Se você mudar de ideia, basta acessar a página de Planos e escolher um novo plano.</p>
                <p>Equipe Mindi</p>
              </div>
            `,
            tags: ["cancel-confirmation"],
          });
        }
      } catch (emailErr: any) {
        logger.warn(`[CancelRetention] Failed to send cancel confirmation email: ${emailErr.message}`);
      }
      
      return { 
        success: true,
        cancelAt,
        message: `Seu plano ficará ativo até ${cancelAt.toLocaleDateString('pt-BR')}.`,
      };
    }),

  /**
   * Check retention eligibility (used by frontend to show/hide offer)
   */
  getRetentionEligibility: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return { eligible: false, reason: "no_establishment" };
      
      const subscription = await planSubDb.getActiveSubscription(establishment.id);
      if (!subscription) return { eligible: false, reason: "no_subscription" };
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const eligible = !subscription.lastRetentionOfferAt || 
        new Date(subscription.lastRetentionOfferAt) < oneYearAgo;
      
      return { 
        eligible,
        reason: eligible ? "eligible" : "used_recently",
        lastOfferAt: subscription.lastRetentionOfferAt,
      };
    }),
});
