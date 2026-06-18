/**
 * Plan Paytime Router
 * Endpoints para checkout de planos via Paytime (PIX e Cartão).
 */
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import * as db from "../db";
import * as adminDb from "../adminDb";
import * as planSubDb from "../planSubscriptionDb";
import { createPixTransaction, createCardTransaction, getTransaction, sendAntifraudAuth } from "../paytime";
import type { PaytimeCardClient, PaytimeCardData } from "../paytime";
import type { PlanSubscription } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { sendPlatformWhatsappMessage } from "../platformWhatsappDb";

type BillingOverviewState =
  | "no_subscription"
  | "active"
  | "pending"
  | "past_due_pix"
  | "past_due"
  | "canceled"
  | "expired"
  | "canceling";

const PLAN_PIX_PENDING_EXPIRATION_MINUTES = 120;
const PAYTIME_PLAN_SUB_ESTABLISHMENT_ID = "366140";

function getGatewayLabel(gateway?: string | null): string | null {
  if (!gateway) return null;
  if (gateway === "paytime_pix") return "PIX";
  if (gateway === "paytime_card") return "Cartão de crédito";
  if (gateway === "stripe_card") return "Cartão de crédito (Stripe)";
  return gateway;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function asValidDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildPendingPixExpiration(generatedAt?: Date | string | null, now = new Date()) {
  const validGeneratedAt = asValidDate(generatedAt);
  if (!validGeneratedAt) {
    return {
      pendingPixGeneratedAt: null,
      pendingPixExpiresAt: null,
      pendingPixExpired: false,
      pendingPixExpirationMinutes: PLAN_PIX_PENDING_EXPIRATION_MINUTES,
    };
  }

  const expiresAt = addMinutes(validGeneratedAt, PLAN_PIX_PENDING_EXPIRATION_MINUTES);
  return {
    pendingPixGeneratedAt: validGeneratedAt,
    pendingPixExpiresAt: expiresAt,
    pendingPixExpired: expiresAt.getTime() <= now.getTime(),
    pendingPixExpirationMinutes: PLAN_PIX_PENDING_EXPIRATION_MINUTES,
  };
}

function isPaidPaytimeStatus(status?: string | null): boolean {
  return status === "PAID" || status === "APPROVED";
}

function isFailedPaytimeStatus(status?: string | null): boolean {
  return status === "FAILED" || status === "CANCELLED";
}

function buildPlanPixReferenceId(establishmentId: number, planId: string, suffix = "checkout"): string {
  return `plan_${establishmentId}_${planId}_${suffix}_${Date.now()}`;
}

function getPaytimeGeneratedAt(transactionCreatedAt?: string | null): Date {
  return asValidDate(transactionCreatedAt) || new Date();
}

async function activatePaidPlanSubscription(subscription: PlanSubscription, transactionId: string) {
  const now = new Date();
  const periodEnd = new Date(now);
  if (subscription.billingPeriod === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await planSubDb.activateSubscription(subscription.id, {
    paytimeTransactionId: transactionId,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    nextRenewalAt: periodEnd,
  });

  await db.activatePlan(subscription.establishmentId, subscription.planId as "lite" | "basic" | "pro", {
    billingPeriod: subscription.billingPeriod,
    planExpiresAt: periodEnd,
  });

  notifyPlanPaymentWhatsApp(subscription.establishmentId, subscription.planId, subscription.billingPeriod, subscription.gateway || "paytime_pix");

  return { now, periodEnd };
}

function buildBillingOverview(
  subscription: PlanSubscription | null,
  establishment: {
    planType?: string | null;
    billingPeriod?: string | null;
    planExpiresAt?: Date | null;
    planActivatedAt?: Date | null;
  } | null,
  planName?: string | null,
  planAmountCents?: number | null,
) {
  if (!subscription) {
    const paidPlanTypes = new Set(["lite", "basic", "pro"]);
    const establishmentPlanType = establishment?.planType ?? null;
    const establishmentPlanExpiresAt = establishment?.planExpiresAt ?? null;
    const now = new Date();
    const hasActiveLegacyPaidPlan = Boolean(
      establishmentPlanType &&
      paidPlanTypes.has(establishmentPlanType) &&
      establishmentPlanExpiresAt &&
      new Date(establishmentPlanExpiresAt).getTime() > now.getTime(),
    );

    if (hasActiveLegacyPaidPlan) {
      return {
        state: "active" as BillingOverviewState,
        displayTitle: "Próximo pagamento",
        displaySubtitle: "Cobrança programada para a próxima renovação.",
        displayAmountCents: planAmountCents ?? 0,
        displayDueDate: establishmentPlanExpiresAt,
        subscriptionId: null,
        planId: establishmentPlanType,
        planName: planName || establishmentPlanType,
        billingPeriod: establishment?.billingPeriod ?? "monthly",
        gateway: null,
        gatewayLabel: null,
        status: "active",
        hasPendingPix: false,
        pixTransactionId: null,
        pixEmv: null,
        gracePeriodEnd: null,
        establishmentPlanExpiresAt,
        nextRenewalAt: establishmentPlanExpiresAt,
        currentPeriodEnd: establishmentPlanExpiresAt,
        ...buildPendingPixExpiration(null),
        source: "establishments.legacy_paid_plan",
      };
    }

    return {
      state: "no_subscription" as BillingOverviewState,
      displayTitle: "Sem cobranças",
      displaySubtitle: "Escolha um plano para começar",
      displayAmountCents: 0,
      displayDueDate: null,
      subscriptionId: null,
      planId: null,
      planName: null,
      billingPeriod: null,
      gateway: null,
      gatewayLabel: null,
      status: null,
      hasPendingPix: false,
      pixTransactionId: null,
      pixEmv: null,
      gracePeriodEnd: null,
      establishmentPlanExpiresAt,
      nextRenewalAt: null,
      currentPeriodEnd: null,
      ...buildPendingPixExpiration(null),
      source: "none",
    };
  }

  const hasPendingRenewalPix = Boolean(
    subscription.status === "past_due" && subscription.renewalPixTransactionId,
  );
  const gatewayLabel = getGatewayLabel(subscription.gateway);
  const fallbackDueDate = subscription.nextRenewalAt || subscription.currentPeriodEnd || establishment?.planExpiresAt || null;
  const now = new Date();
  if (subscription.status === "canceling") {
    return {
      state: "canceling" as BillingOverviewState,
      displayTitle: "Cancelamento agendado",
      displaySubtitle: subscription.cancelAt
        ? `Seu plano ficará ativo até ${new Date(subscription.cancelAt).toLocaleDateString("pt-BR")}.`
        : "Seu plano será cancelado ao fim do período atual.",
      displayAmountCents: planAmountCents ?? subscription.amountCents,
      displayDueDate: subscription.cancelAt || fallbackDueDate,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      planName: planName || subscription.planId,
      billingPeriod: subscription.billingPeriod,
      gateway: subscription.gateway,
      gatewayLabel,
      status: subscription.status,
      hasPendingPix: false,
      pixTransactionId: null,
      pixEmv: null,
      gracePeriodEnd: subscription.gracePeriodEnd,
      establishmentPlanExpiresAt: establishment?.planExpiresAt ?? null,
      nextRenewalAt: subscription.nextRenewalAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAt: subscription.cancelAt,
      ...buildPendingPixExpiration(null),
      source: "plan_subscriptions.canceling",
    };
  }

  if (hasPendingRenewalPix) {
    const pendingPixMeta = buildPendingPixExpiration(
      subscription.renewalNotifiedAt || subscription.updatedAt || subscription.nextRenewalAt || fallbackDueDate,
      now,
    );
    return {
      state: "past_due_pix" as BillingOverviewState,
      displayTitle: "PIX de renovação pendente",
      displaySubtitle: pendingPixMeta.pendingPixExpired
        ? "Este QR Code PIX expirou. Gere uma nova cobrança para pagar com segurança."
        : subscription.gracePeriodEnd
          ? "Pague até a data de carência para evitar suspensão do plano."
          : "A cobrança PIX de renovação já foi gerada e aguarda pagamento.",
      displayAmountCents: planAmountCents ?? subscription.amountCents,
      displayDueDate: subscription.renewalNotifiedAt || subscription.nextRenewalAt || subscription.updatedAt || fallbackDueDate,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      planName: planName || subscription.planId,
      billingPeriod: subscription.billingPeriod,
      gateway: subscription.gateway,
      gatewayLabel,
      status: subscription.status,
      hasPendingPix: true,
      pixTransactionId: subscription.renewalPixTransactionId,
      pixEmv: subscription.renewalPixEmv,
      gracePeriodEnd: subscription.gracePeriodEnd,
      establishmentPlanExpiresAt: establishment?.planExpiresAt ?? null,
      nextRenewalAt: subscription.nextRenewalAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      ...pendingPixMeta,
      source: "plan_subscriptions.renewal_pix",
    };
  }

  if (subscription.status === "past_due") {
    return {
      state: "past_due" as BillingOverviewState,
      displayTitle: "Pagamento pendente",
      displaySubtitle: subscription.gracePeriodEnd
        ? "Regularize o pagamento até a data de carência para evitar suspensão."
        : "Existe uma cobrança pendente para esta assinatura.",
      displayAmountCents: planAmountCents ?? subscription.amountCents,
      displayDueDate: fallbackDueDate,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      planName: planName || subscription.planId,
      billingPeriod: subscription.billingPeriod,
      gateway: subscription.gateway,
      gatewayLabel,
      status: subscription.status,
      hasPendingPix: false,
      pixTransactionId: null,
      pixEmv: null,
      gracePeriodEnd: subscription.gracePeriodEnd,
      establishmentPlanExpiresAt: establishment?.planExpiresAt ?? null,
      nextRenewalAt: subscription.nextRenewalAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      ...buildPendingPixExpiration(null),
      source: "plan_subscriptions",
    };
  }

  if (subscription.status === "pending") {
    const pendingPixMeta = subscription.gateway === "paytime_pix" && subscription.paytimeTransactionId
      ? buildPendingPixExpiration(subscription.createdAt, now)
      : buildPendingPixExpiration(null, now);
    return {
      state: "pending" as BillingOverviewState,
      displayTitle: "Pagamento em processamento",
      displaySubtitle: pendingPixMeta.pendingPixExpired
        ? "Este QR Code PIX expirou. Gere uma nova cobrança para pagar com segurança."
        : gatewayLabel ? `Aguardando confirmação via ${gatewayLabel}.` : "Aguardando confirmação do pagamento.",
      displayAmountCents: planAmountCents ?? subscription.amountCents,
      displayDueDate: subscription.createdAt,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      planName: planName || subscription.planId,
      billingPeriod: subscription.billingPeriod,
      gateway: subscription.gateway,
      gatewayLabel,
      status: subscription.status,
      hasPendingPix: subscription.gateway === "paytime_pix" && Boolean(subscription.paytimeTransactionId),
      pixTransactionId: subscription.gateway === "paytime_pix" ? subscription.paytimeTransactionId : null,
      pixEmv: subscription.gateway === "paytime_pix" ? subscription.renewalPixEmv : null,
      gracePeriodEnd: subscription.gracePeriodEnd,
      establishmentPlanExpiresAt: establishment?.planExpiresAt ?? null,
      nextRenewalAt: subscription.nextRenewalAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      ...pendingPixMeta,
      source: "plan_subscriptions.pending_checkout",
    };
  }

  return {
    state: subscription.status as BillingOverviewState,
    displayTitle: subscription.status === "active" ? "Próximo pagamento" : subscription.status === "canceled" ? "Plano cancelado" : "Plano expirado",
    displaySubtitle: subscription.status === "active"
      ? "Cobrança programada para a próxima renovação."
      : "Escolha um plano para continuar usando os recursos pagos.",
    displayAmountCents: planAmountCents ?? subscription.amountCents,
    displayDueDate: fallbackDueDate,
    subscriptionId: subscription.id,
    planId: subscription.planId,
    planName: planName || subscription.planId,
    billingPeriod: subscription.billingPeriod,
    gateway: subscription.gateway,
    gatewayLabel,
    status: subscription.status,
    hasPendingPix: false,
    pixTransactionId: null,
    pixEmv: null,
    gracePeriodEnd: subscription.gracePeriodEnd,
    establishmentPlanExpiresAt: establishment?.planExpiresAt ?? null,
    nextRenewalAt: subscription.nextRenewalAt,
    currentPeriodEnd: subscription.currentPeriodEnd,
    ...buildPendingPixExpiration(null),
    source: "plan_subscriptions",
  };
}

/**
 * Envia notificação WhatsApp quando um pagamento de plano é confirmado.
 * Prioridade: responsiblePhone (Dados do Responsável) > whatsapp (Configurações básicas do estabelecimento)
 */
async function notifyPlanPaymentWhatsApp(establishmentId: number, planId: string, billingPeriod: string, gateway: string) {
  try {
    const establishment = await db.getEstablishmentById(establishmentId);
    if (!establishment) return;

    // Prioridade: celular do responsável > whatsapp do estabelecimento
    const phone = establishment.responsiblePhone || establishment.whatsapp;
    if (!phone) {
      logger.info(`[PlanPaytime] Sem número para notificação WhatsApp: est=${establishmentId}`);
      return;
    }

    // Buscar nome do plano do banco de dados (plan_prices.displayName)
    const planPriceRow = await adminDb.getPlanPrice(planId);
    const planName = planPriceRow?.displayName || planId;
    const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";
    const gatewayLabel = gateway.includes("pix") ? "PIX" : "Cartão de Crédito";
    const estName = establishment.name || "Seu estabelecimento";

    const message = `✅ *Pagamento Confirmado!*\n\nOlá! O pagamento do plano *${planName} (${periodLabel})* do estabelecimento *${estName}* foi confirmado com sucesso via *${gatewayLabel}*.\n\n🎉 Seu plano já está ativo! Aproveite todos os recursos.\n\nQualquer dúvida, estamos à disposição!\n\n*Mindi - Cardápio Digital*`;

    const result = await sendPlatformWhatsappMessage(phone, message);
    if (result.success) {
      logger.info(`[PlanPaytime] Notificação WhatsApp enviada: est=${establishmentId}, phone=${phone}`);
    } else {
      logger.warn(`[PlanPaytime] Falha ao enviar WhatsApp: est=${establishmentId}, msg=${result.message}`);
    }
  } catch (err: any) {
    logger.warn(`[PlanPaytime] Erro ao enviar notificação WhatsApp: ${err.message}`);
  }
}

export const planPaytimeRouter = router({
  /** Busca gateways habilitados para exibir no checkout do restaurante */
  getEnabledGateways: publicProcedure.query(async () => {
    return planSubDb.getEnabledGateways();
  }),

  /** Busca a assinatura ativa do estabelecimento do usuário */
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const est = await db.getEstablishmentByUserId(ctx.user.id);
    if (!est) return null;
    return planSubDb.getActiveSubscription(est.id);
  }),

  /** Resumo normalizado da cobrança atual para a página Planos e Assinatura */
  getBillingOverview: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const est = await db.getEstablishmentByUserId(ctx.user.id);
    if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

    const subscription = await planSubDb.getActiveSubscription(est.id);
    const paidPlanTypes = new Set(["lite", "basic", "pro"]);
    // Prioritize establishment.planType (admin may have changed it) over subscription.planId
    const overviewPlanId = paidPlanTypes.has(est.planType) ? est.planType : (subscription?.planId ?? null);
    const planPrice = overviewPlanId ? await adminDb.getPlanPrice(overviewPlanId) : null;
    const overviewBillingPeriod = subscription?.billingPeriod ?? est.billingPeriod ?? "monthly";
    const overviewAmountCents = overviewBillingPeriod === "annual"
      ? planPrice?.annualPriceCents
      : planPrice?.monthlyPriceCents;

    if (
      subscription?.status === "pending" &&
      subscription.gateway === "paytime_pix" &&
      subscription.paytimeTransactionId &&
      !subscription.renewalPixEmv
    ) {
      try {
        const paytimeTx = await getTransaction(subscription.paytimeTransactionId, PAYTIME_PLAN_SUB_ESTABLISHMENT_ID);
        if (paytimeTx.emv) {
          await planSubDb.updateSubscriptionById(subscription.id, {
            renewalPixEmv: paytimeTx.emv,
          });
          subscription.renewalPixEmv = paytimeTx.emv;
        }
      } catch (err) {
        logger.warn(`[PlanPaytime] Não foi possível recuperar EMV do PIX pendente: ${err}`);
      }
    }

    return buildBillingOverview(subscription, est, planPrice?.displayName || null, overviewAmountCents ?? null);
  }),

  /** Cria checkout PIX para assinatura de plano */
  createPixCheckout: protectedProcedure
    .input(z.object({
      planId: z.string(),
      isAnnual: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      // Verificar se gateway PIX está habilitado
      const gateways = await planSubDb.getEnabledGateways();
      const pixGateway = gateways.find(g => g.gateway === "paytime_pix");
      if (!pixGateway) throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento via PIX não está habilitado." });

      // Buscar preço do plano
      const planPrice = await adminDb.getPlanPrice(input.planId);
      if (!planPrice) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado." });

      const amountCents = input.isAnnual ? planPrice.annualPriceCents : planPrice.monthlyPriceCents;
      if (!amountCents || amountCents <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Preço do plano inválido." });

      const billingPeriod = input.isAnnual ? "annual" : "monthly";
      const referenceId = buildPlanPixReferenceId(establishment.id, input.planId);

      // Criar transação PIX na Paytime (usando estabelecimento Bigteck 366140 - limites 3DS mais altos)
      const pixTransaction = await createPixTransaction({
        amount: amountCents,
        interest: "STORE",
        reference_id: referenceId,
        sub_establishment_id: PAYTIME_PLAN_SUB_ESTABLISHMENT_ID,
        client: {
          first_name: ctx.user.name?.split(" ")[0] || "Cliente",
          last_name: ctx.user.name?.split(" ").slice(1).join(" ") || "",
          email: ctx.user.email || undefined,
        },
        info_additional: [
          { key: "plan_id", value: input.planId },
          { key: "establishment_id", value: String(establishment.id) },
          { key: "billing_period", value: billingPeriod },
          { key: "type", value: "plan_subscription" },
        ],
      });

      // Criar registro de subscription no banco
      const subscriptionId = await planSubDb.createPlanSubscription({
        establishmentId: establishment.id,
        planId: input.planId,
        billingPeriod,
        gateway: "paytime_pix",
        status: "pending",
        paytimeTransactionId: pixTransaction._id,
        renewalPixEmv: pixTransaction.emv || null,
        amountCents,
      });

      logger.info(`[PlanPaytime] Checkout PIX criado: sub=${subscriptionId}, tx=${pixTransaction._id}, est=${establishment.id}, plan=${input.planId}`);

      const generatedAt = getPaytimeGeneratedAt(pixTransaction.created_at);

      return {
        subscriptionId,
        transactionId: pixTransaction._id,
        emv: pixTransaction.emv, // QR Code string para gerar imagem no frontend
        amount: amountCents,
        planId: input.planId,
        billingPeriod,
        generatedAt,
        expiresAt: addMinutes(generatedAt, PLAN_PIX_PENDING_EXPIRATION_MINUTES),
        expirationMinutes: PLAN_PIX_PENDING_EXPIRATION_MINUTES,
      };
    }),

  /** Reemite com segurança um PIX pendente antigo antes de mostrar novo QR Code */
  replacePendingPix: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      const subscription = await planSubDb.getSubscriptionById(input.subscriptionId);
      if (!subscription || subscription.establishmentId !== establishment.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cobrança PIX não encontrada." });
      }

      const existingTransactionId = subscription.status === "past_due"
        ? subscription.renewalPixTransactionId
        : subscription.paytimeTransactionId;

      if (subscription.gateway !== "paytime_pix" || !existingTransactionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta cobrança não possui PIX pendente para reemissão." });
      }

      try {
        const paytimeTx = await getTransaction(existingTransactionId, PAYTIME_PLAN_SUB_ESTABLISHMENT_ID);
        if (isPaidPaytimeStatus(paytimeTx.status)) {
          const activated = await activatePaidPlanSubscription(subscription, existingTransactionId);
          logger.info(`[PlanPaytime] PIX antigo já estava pago antes da reemissão: sub=${subscription.id}, tx=${existingTransactionId}`);
          return {
            status: "paid" as const,
            subscriptionId: subscription.id,
            transactionId: existingTransactionId,
            planId: subscription.planId,
            billingPeriod: subscription.billingPeriod,
            lastPaymentAt: activated.now,
            nextRenewalAt: activated.periodEnd,
          };
        }

        if (isFailedPaytimeStatus(paytimeTx.status) && subscription.status === "pending") {
          await planSubDb.updateSubscriptionStatus(subscription.id, "canceled", {
            canceledAt: new Date(),
            lastRenewalError: `Transação PIX anterior retornou ${paytimeTx.status} antes da reemissão.`,
          });
        }
      } catch (err) {
        logger.warn(`[PlanPaytime] Não foi possível consultar PIX antigo antes da reemissão: sub=${subscription.id}, tx=${existingTransactionId}, err=${err}`);
      }

      const gateways = await planSubDb.getEnabledGateways();
      const pixGateway = gateways.find(g => g.gateway === "paytime_pix");
      if (!pixGateway) throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento via PIX não está habilitado." });

      const planPrice = await adminDb.getPlanPrice(subscription.planId);
      if (!planPrice) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado." });

      const amountCents = subscription.amountCents || (subscription.billingPeriod === "annual"
        ? planPrice.annualPriceCents
        : planPrice.monthlyPriceCents);
      if (!amountCents || amountCents <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Preço do plano inválido." });

      const pixTransaction = await createPixTransaction({
        amount: amountCents,
        interest: "STORE",
        reference_id: buildPlanPixReferenceId(establishment.id, subscription.planId, "retry"),
        sub_establishment_id: PAYTIME_PLAN_SUB_ESTABLISHMENT_ID,
        client: {
          first_name: ctx.user.name?.split(" ")[0] || "Cliente",
          last_name: ctx.user.name?.split(" ").slice(1).join(" ") || "",
          email: ctx.user.email || undefined,
        },
        info_additional: [
          { key: "plan_id", value: subscription.planId },
          { key: "establishment_id", value: String(establishment.id) },
          { key: "billing_period", value: subscription.billingPeriod },
          { key: "type", value: subscription.status === "past_due" ? "plan_subscription_renewal_retry" : "plan_subscription_retry" },
          { key: "replaced_transaction_id", value: existingTransactionId },
        ],
      });

      const generatedAt = getPaytimeGeneratedAt(pixTransaction.created_at);

      if (subscription.status === "past_due") {
        await planSubDb.updateSubscriptionById(subscription.id, {
          renewalPixTransactionId: pixTransaction._id,
          renewalPixEmv: pixTransaction.emv || null,
          renewalNotifiedAt: generatedAt,
          amountCents,
          lastRenewalError: null,
        });

        logger.info(`[PlanPaytime] PIX de renovação reemitido: sub=${subscription.id}, oldTx=${existingTransactionId}, newTx=${pixTransaction._id}`);

        return {
          status: "created" as const,
          subscriptionId: subscription.id,
          transactionId: pixTransaction._id,
          emv: pixTransaction.emv,
          amount: amountCents,
          planId: subscription.planId,
          billingPeriod: subscription.billingPeriod,
          generatedAt,
          expiresAt: addMinutes(generatedAt, PLAN_PIX_PENDING_EXPIRATION_MINUTES),
          expirationMinutes: PLAN_PIX_PENDING_EXPIRATION_MINUTES,
        };
      }

      await planSubDb.updateSubscriptionStatus(subscription.id, "canceled", {
        canceledAt: new Date(),
        lastRenewalError: "PIX pendente substituído por uma nova cobrança.",
      });

      const newSubscriptionId = await planSubDb.createPlanSubscription({
        establishmentId: establishment.id,
        planId: subscription.planId,
        billingPeriod: subscription.billingPeriod,
        gateway: "paytime_pix",
        status: "pending",
        paytimeTransactionId: pixTransaction._id,
        renewalPixEmv: pixTransaction.emv || null,
        amountCents,
      });

      logger.info(`[PlanPaytime] PIX pendente reemitido: oldSub=${subscription.id}, newSub=${newSubscriptionId}, oldTx=${existingTransactionId}, newTx=${pixTransaction._id}`);

      return {
        status: "created" as const,
        subscriptionId: newSubscriptionId,
        transactionId: pixTransaction._id,
        emv: pixTransaction.emv,
        amount: amountCents,
        planId: subscription.planId,
        billingPeriod: subscription.billingPeriod,
        generatedAt,
        expiresAt: addMinutes(generatedAt, PLAN_PIX_PENDING_EXPIRATION_MINUTES),
        expirationMinutes: PLAN_PIX_PENDING_EXPIRATION_MINUTES,
      };
    }),

  /** Cria checkout Cartão para assinatura de plano */
  createCardCheckout: protectedProcedure
    .input(z.object({
      planId: z.string(),
      isAnnual: z.boolean().optional(),
      card: z.object({
        holderName: z.string().min(3),
        holderDocument: z.string().min(11),
        cardNumber: z.string().min(13),
        expirationMonth: z.number().min(1).max(12),
        expirationYear: z.number().min(2024),
        securityCode: z.string().min(3).max(4),
      }),
      client: z.object({
        firstName: z.string(),
        lastName: z.string(),
        document: z.string(),
        phone: z.string(),
        email: z.string().email(),
        address: z.object({
          street: z.string(),
          number: z.string(),
          complement: z.string().optional(),
          neighborhood: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
        }),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      // Verificar se gateway Cartão Paytime está habilitado
      const gateways = await planSubDb.getEnabledGateways();
      const cardGateway = gateways.find(g => g.gateway === "paytime_card");
      if (!cardGateway) throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento via Cartão Paytime não está habilitado." });

      // Buscar preço do plano
      const planPrice = await adminDb.getPlanPrice(input.planId);
      if (!planPrice) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado." });

      const amountCents = input.isAnnual ? planPrice.annualPriceCents : planPrice.monthlyPriceCents;
      if (!amountCents || amountCents <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Preço do plano inválido." });

      const billingPeriod = input.isAnnual ? "annual" : "monthly";
      const referenceId = buildPlanPixReferenceId(establishment.id, input.planId);

      // Montar dados do cartão com tokenização
      const cardData: PaytimeCardData = {
        holder_name: input.card.holderName,
        holder_document: input.card.holderDocument.replace(/\D/g, ""),
        card_number: input.card.cardNumber.replace(/\D/g, ""),
        expiration_month: input.card.expirationMonth,
        expiration_year: input.card.expirationYear,
        security_code: input.card.securityCode,
        create_token: true, // Tokenizar para cobranças futuras
      };

      const clientData: PaytimeCardClient = {
        first_name: input.client.firstName,
        last_name: input.client.lastName,
        document: input.client.document.replace(/\D/g, ""),
        phone: (() => {
          let p = input.client.phone.replace(/\D/g, "");
          // Remover código do país (55) se presente
          if (p.length >= 12 && p.startsWith("55")) p = p.substring(2);
          // Garantir máximo 11 dígitos (DDD + número)
          return p.substring(0, 11);
        })(),
        email: input.client.email,
        address: {
          street: input.client.address.street,
          number: input.client.address.number,
          complement: input.client.address.complement || "",
          neighborhood: input.client.address.neighborhood,
          city: input.client.address.city,
          state: input.client.address.state,
          country: "BR",
          zip_code: input.client.address.zipCode.replace(/\D/g, ""),
        },
      };

      // Criar transação com cartão na Paytime (usando estabelecimento Bigteck 366140 - limites 3DS mais altos)
      const cardTransaction = await createCardTransaction({
        amount: amountCents,
        installments: 1,
        interest: "STORE",
        client: clientData,
        card: cardData,
        reference_id: referenceId,
        sub_establishment_id: PAYTIME_PLAN_SUB_ESTABLISHMENT_ID,
        info_additional: [
          { key: "plan_id", value: input.planId },
          { key: "establishment_id", value: String(establishment.id) },
          { key: "billing_period", value: billingPeriod },
          { key: "type", value: "plan_subscription" },
        ],
      });

      // Extrair token do cartão se retornado
      const cardToken = cardTransaction.card?._id || null;
      const cardBrand = cardTransaction.card?.brand_name || null;
      const cardLast4 = cardTransaction.card?.last4_digits || null;

      // Criar registro de subscription no banco
      const subscriptionId = await planSubDb.createPlanSubscription({
        establishmentId: establishment.id,
        planId: input.planId,
        billingPeriod,
        gateway: "paytime_card",
        status: "pending",
        paytimeTransactionId: cardTransaction._id,
        paytimeCardToken: cardToken,
        paytimeCardBrand: cardBrand,
        paytimeCardLast4: cardLast4,
        amountCents,
      });

      // Se já aprovado imediatamente (sem antifraude)
      if (cardTransaction.status === "APPROVED" || cardTransaction.status === "PAID") {
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingPeriod === "annual") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await planSubDb.activateSubscription(subscriptionId, {
          paytimeTransactionId: cardTransaction._id,
          paytimeCardToken: cardToken || undefined,
          paytimeCardBrand: cardBrand || undefined,
          paytimeCardLast4: cardLast4 || undefined,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextRenewalAt: periodEnd,
        });

        // Ativar plano no estabelecimento
        await db.activatePlan(establishment.id, input.planId as "lite" | "basic" | "pro", {
          billingPeriod,
          planExpiresAt: periodEnd,
        });

        logger.info(`[PlanPaytime] Plano ativado imediatamente via cartão: est=${establishment.id}, plan=${input.planId}`);

        // Notificar via WhatsApp
        notifyPlanPaymentWhatsApp(establishment.id, input.planId, billingPeriod, "paytime_card");
      }

      // Verificar se antifraude é requerido
      const antifraud = cardTransaction.antifraud?.[0];
      const needsAntifraud = antifraud?.analyse_required === "THREEDS" || antifraud?.analyse_required === "IDPAY";
      const sdkEnv = ENV.paytimeBaseUrl.includes('sandbox') ? 'SANDBOX' : 'PROD';

      logger.info(`[PlanPaytime] Checkout Cartão criado: sub=${subscriptionId}, tx=${cardTransaction._id}, status=${cardTransaction.status}, est=${establishment.id}, needsAntifraud=${needsAntifraud}`);

      return {
        subscriptionId,
        transactionId: cardTransaction._id,
        status: cardTransaction.status,
        planId: input.planId,
        billingPeriod,
        // Antifraude info
        needsAntifraud,
        antifraudId: antifraud?.antifraud_id || antifraud?._id || null,
        antifraudSession: antifraud?.session || null,
        sdkEnv,
        cardToken,
      };
    }),

  /** Confirma autenticação 3DS para pagamento de plano */
  confirmPlanAntifraud: protectedProcedure
    .input(z.object({
      subscriptionId: z.number(),
      transactionId: z.string(),
      antifraudId: z.string(),
      threeDsStatus: z.string().optional(),
      authenticationStatus: z.string().optional(),
      threeDsSdkId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { subscriptionId, transactionId, antifraudId, threeDsStatus, authenticationStatus, threeDsSdkId } = input;

      const subscription = await planSubDb.getSubscriptionById(subscriptionId);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada" });

      // Montar dados de autenticação 3DS
      const authPayload: any = {
        id: threeDsSdkId || antifraudId,
        status: threeDsStatus || "AUTH_FLOW_COMPLETED",
        authentication_status: authenticationStatus || "AUTHENTICATED",
      };

      logger.info("[PlanPaytime] Enviando confirmação 3DS:", {
        transactionId,
        subscriptionId,
        bodyId: authPayload.id,
        threeDsSdkId,
        antifraudId,
        threeDsStatus,
        authenticationStatus,
      });

      try {
        // Enviar resultado da autenticação à Paytime (usando estabelecimento Bigteck 366140)
        const updatedTransaction = await sendAntifraudAuth(transactionId, authPayload, PAYTIME_PLAN_SUB_ESTABLISHMENT_ID);

        logger.info("[PlanPaytime] Resposta 3DS:", { newStatus: updatedTransaction.status, newId: updatedTransaction._id });

        // Se a Paytime retornou novo ID após 3DS
        const newPaytimeId = updatedTransaction._id;
        if (newPaytimeId && newPaytimeId !== transactionId) {
          await planSubDb.updateSubscriptionTransactionId(subscriptionId, newPaytimeId);
        }

        // Verificar se foi aprovado
        if (updatedTransaction.status === "PAID" || updatedTransaction.status === "APPROVED") {
          const now = new Date();
          const periodEnd = new Date(now);
          if (subscription.billingPeriod === "annual") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          // Extrair token do cartão se disponível
          const cardToken = updatedTransaction.card?._id || subscription.paytimeCardToken || null;
          const cardBrand = updatedTransaction.card?.brand_name || subscription.paytimeCardBrand || null;
          const cardLast4 = updatedTransaction.card?.last4_digits || subscription.paytimeCardLast4 || null;

          await planSubDb.activateSubscription(subscriptionId, {
            paytimeTransactionId: newPaytimeId || transactionId,
            paytimeCardToken: cardToken || undefined,
            paytimeCardBrand: cardBrand || undefined,
            paytimeCardLast4: cardLast4 || undefined,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            nextRenewalAt: periodEnd,
          });

          await db.activatePlan(subscription.establishmentId, subscription.planId as "lite" | "basic" | "pro", {
            billingPeriod: subscription.billingPeriod,
            planExpiresAt: periodEnd,
          });

          logger.info(`[PlanPaytime] Plano ativado após 3DS: est=${subscription.establishmentId}, plan=${subscription.planId}`);

          // Notificar via WhatsApp
          notifyPlanPaymentWhatsApp(subscription.establishmentId, subscription.planId, subscription.billingPeriod, subscription.gateway || "paytime_card");

          return { status: "PAID" as const };
        } else if (updatedTransaction.status === "FAILED") {
          await planSubDb.updateSubscriptionStatus(subscriptionId, "canceled");
          return { status: "FAILED" as const };
        } else {
          // Pendente - será confirmado via polling
          return { status: "PENDING" as const };
        }
      } catch (error: any) {
        logger.error("[PlanPaytime] Erro na confirmação 3DS:", error?.message || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao confirmar autenticação 3DS. O pagamento pode ser processado em breve.",
        });
      }
    }),

  /** Verifica status de uma transação de plano (polling) */
  checkTransactionStatus: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const subscription = await planSubDb.getSubscriptionById(input.subscriptionId);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });

      // Se o status local é "pending" e temos um transactionId, verificar na Paytime diretamente
      if (subscription.status === "pending" && subscription.paytimeTransactionId) {
        try {
          const paytimeTx = await getTransaction(subscription.paytimeTransactionId, PAYTIME_PLAN_SUB_ESTABLISHMENT_ID);
          
          if (paytimeTx.status === "PAID" || paytimeTx.status === "APPROVED") {
            // Pagamento confirmado na Paytime mas webhook não chegou — ativar agora!
            const now = new Date();
            const periodEnd = new Date(now);
            if (subscription.billingPeriod === "annual") {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            await planSubDb.activateSubscription(subscription.id, {
              paytimeTransactionId: subscription.paytimeTransactionId,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              nextRenewalAt: periodEnd,
            });

            // Ativar plano no estabelecimento
            await db.activatePlan(subscription.establishmentId, subscription.planId as "lite" | "basic" | "pro", {
              billingPeriod: subscription.billingPeriod,
              planExpiresAt: periodEnd,
            });

            logger.info(`[PlanPaytime] Plano ativado via polling: est=${subscription.establishmentId}, plan=${subscription.planId}, tx=${subscription.paytimeTransactionId}`);

            // Notificar via WhatsApp
            notifyPlanPaymentWhatsApp(subscription.establishmentId, subscription.planId, subscription.billingPeriod, subscription.gateway || "paytime_pix");

            return {
              status: "active" as const,
              gateway: subscription.gateway,
              planId: subscription.planId,
              billingPeriod: subscription.billingPeriod,
              lastPaymentAt: now,
              nextRenewalAt: periodEnd,
              justActivated: true,
              ...buildPendingPixExpiration(null),
            };
          } else if (paytimeTx.status === "FAILED" || paytimeTx.status === "CANCELLED") {
            // Pagamento falhou
            await planSubDb.updateSubscriptionStatus(subscription.id, "canceled");
            logger.info(`[PlanPaytime] Assinatura cancelada via polling: tx=${subscription.paytimeTransactionId}, status=${paytimeTx.status}`);
            
            return {
              status: "canceled" as const,
              gateway: subscription.gateway,
              planId: subscription.planId,
              billingPeriod: subscription.billingPeriod,
              lastPaymentAt: subscription.lastPaymentAt,
              nextRenewalAt: subscription.nextRenewalAt,
              justActivated: false,
              ...buildPendingPixExpiration(null),
            };
          }
        } catch (err) {
          // Se falhar ao consultar Paytime, retornar status local
          logger.warn(`[PlanPaytime] Erro ao consultar Paytime para polling: ${err}`);
        }
      }

      return {
        status: subscription.status,
        gateway: subscription.gateway,
        planId: subscription.planId,
        billingPeriod: subscription.billingPeriod,
        lastPaymentAt: subscription.lastPaymentAt,
        nextRenewalAt: subscription.nextRenewalAt,
        justActivated: false,
        ...buildPendingPixExpiration(
          subscription.status === "pending" && subscription.gateway === "paytime_pix" ? subscription.createdAt : null,
        ),
      };
    }),

  /** Histórico de pagamentos de planos para a página /planos */
  getPaymentHistory: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      const subscriptions = await planSubDb.getAllSubscriptionsForEstablishment(establishment.id);
      const plans = await adminDb.getAllPlanPrices();
      const planMap = new Map(plans.map((plan) => [plan.planId, plan]));

      return subscriptions
        .filter((subscription) => subscription.amountCents > 0)
        .map((subscription) => {
          const plan = planMap.get(subscription.planId);
          const paidAt = subscription.lastPaymentAt || subscription.currentPeriodStart || subscription.updatedAt || subscription.createdAt;
          const validUntil = subscription.currentPeriodEnd || subscription.nextRenewalAt || subscription.gracePeriodEnd || null;
          const gatewayLabel = subscription.gateway === "paytime_pix"
            ? "PIX"
            : subscription.gateway === "paytime_card"
              ? "Cartão de crédito"
              : subscription.gateway === "stripe_card"
                ? "Cartão de crédito (Stripe)"
                : subscription.gateway;

          return {
            id: subscription.id,
            invoiceNumber: `FAT-${String(subscription.id).padStart(6, "0")}`,
            planId: subscription.planId,
            planName: plan?.displayName || subscription.planId,
            billingPeriod: subscription.billingPeriod,
            gateway: subscription.gateway,
            gatewayLabel,
            amountCents: subscription.amountCents,
            paidAt,
            validUntil,
            status: subscription.status,
            canDownloadReceipt: subscription.status === "active" && subscription.amountCents > 0,
            receiptUrl: `/api/export/plans/receipt/${subscription.id}.pdf`,
            transactionId: subscription.paytimeTransactionId || subscription.renewalPixTransactionId || subscription.stripeSubscriptionId || null,
          };
        });
    }),
});
