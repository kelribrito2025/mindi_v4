import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createPixTransaction, createCardTransaction, getTransaction, sendAntifraudAuth } from "../paytime";
import type { PaytimeCardClient, PaytimeCardData } from "../paytime";
import * as planSubDb from "../planSubscriptionDb";

const AI_IMAGE_PACKAGES = [
  {
    id: "ai_avulso",
    name: "Crédito avulso",
    credits: 1,
    priceInCents: 90,
    priceFormatted: "R$ 0,90",
    pricePerImage: "R$ 0,90",
    description: "1 crédito avulso de melhoria de foto com IA",
    avulso: true,
  },
  {
    id: "ai_50",
    name: "50 melhorias",
    credits: 50,
    priceInCents: 3670,
    priceFormatted: "R$ 36,70",
    pricePerImage: "R$ 0,73",
    description: "Pacote com 50 melhorias de foto com IA",
  },
  {
    id: "ai_100",
    name: "100 melhorias",
    credits: 100,
    priceInCents: 6790,
    priceFormatted: "R$ 67,90",
    pricePerImage: "R$ 0,68",
    description: "Pacote com 100 melhorias de foto com IA",
    popular: true,
  },
  {
    id: "ai_300",
    name: "300 melhorias",
    credits: 300,
    priceInCents: 17490,
    priceFormatted: "R$ 174,90",
    pricePerImage: "R$ 0,58",
    description: "Pacote com 300 melhorias de foto com IA",
  },
];

const PAYTIME_PLAN_SUB_ESTABLISHMENT_ID = "366140";
const CREDIT_PIX_EXPIRATION_MINUTES = 120;

function buildCreditPixReferenceId(establishmentId: number, packageId: string): string {
  return `credit_${establishmentId}_${packageId}_${Date.now()}`;
}

export const aiCreditsRouter = router({
  // Consultar créditos disponíveis + elegibilidade
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) return { credits: 0, eligible: false };
    const eligible = await db.checkAiCreditsEligibility(establishment.id);
    if (eligible && !establishment.aiCreditsGranted) {
      await db.grantFreeAiCredits(establishment.id, ctx.user.id);
      const credits = await db.getAiImageCredits(establishment.id);
      return { credits, eligible: true };
    }
    const credits = await db.getAiImageCredits(establishment.id);
    return { credits, eligible: eligible || establishment.aiCreditsGranted || credits > 0 };
  }),

  // Listar pacotes de compra
  getPackages: protectedProcedure.query(async () => {
    return AI_IMAGE_PACKAGES;
  }),

  // Listar gateways habilitados (reutiliza o mesmo do planos)
  getEnabledGateways: protectedProcedure.query(async () => {
    return planSubDb.getEnabledGateways();
  }),

  // Criar checkout PIX para créditos
  createPixCheckout: protectedProcedure
    .input(z.object({ packageId: z.string(), quantity: z.number().min(1).max(999).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      const pkg = AI_IMAGE_PACKAGES.find(p => p.id === input.packageId);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Pacote não encontrado" });
      const quantity = input.quantity || 1;
      const totalPriceInCents = pkg.priceInCents * quantity;
      const totalCredits = pkg.credits * quantity;

      const gateways = await planSubDb.getEnabledGateways();
      const pixGateway = gateways.find(g => g.gateway === "paytime_pix");
      if (!pixGateway) throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento via PIX não está habilitado." });

      const referenceId = buildCreditPixReferenceId(establishment.id, pkg.id);

      const pixTransaction = await createPixTransaction({
        amount: totalPriceInCents,
        interest: "STORE",
        reference_id: referenceId,
        sub_establishment_id: PAYTIME_PLAN_SUB_ESTABLISHMENT_ID,
        client: {
          first_name: ctx.user.name?.split(" ")[0] || "Cliente",
          last_name: ctx.user.name?.split(" ").slice(1).join(" ") || "",
          email: ctx.user.email || undefined,
        },
        info_additional: [
          { key: "type", value: "ai_credits" },
          { key: "package_id", value: pkg.id },
          { key: "credits", value: String(totalCredits) },
          { key: "establishment_id", value: String(establishment.id) },
          { key: "user_id", value: String(ctx.user.id) },
        ],
      });

      logger.info(`[AiCredits] PIX checkout criado: pkg=${pkg.id}, tx=${pixTransaction._id}, est=${establishment.id}`);

      const generatedAt = new Date();
      const expiresAt = new Date(generatedAt.getTime() + CREDIT_PIX_EXPIRATION_MINUTES * 60 * 1000);

      return {
        transactionId: pixTransaction._id,
        emv: pixTransaction.emv,
        amount: totalPriceInCents,
        packageId: pkg.id,
        packageName: pkg.name,
        credits: totalCredits,
        generatedAt,
        expiresAt,
        expirationMinutes: CREDIT_PIX_EXPIRATION_MINUTES,
      };
    }),

  // Criar checkout Cartão para créditos
  createCardCheckout: protectedProcedure
    .input(z.object({
      packageId: z.string(),
      quantity: z.number().min(1).max(999).optional(),
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

      const pkg = AI_IMAGE_PACKAGES.find(p => p.id === input.packageId);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Pacote não encontrado" });
      const quantity = input.quantity || 1;
      const totalPriceInCents = pkg.priceInCents * quantity;
      const totalCredits = pkg.credits * quantity;
      if (totalPriceInCents < 100) throw new TRPCError({ code: "BAD_REQUEST", message: "O valor mínimo para pagamento com cartão é R$ 1,00. Aumente a quantidade ou escolha PIX." });

      const gateways = await planSubDb.getEnabledGateways();
      const cardGateway = gateways.find(g => g.gateway === "paytime_card");
      if (!cardGateway) throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento via Cartão não está habilitado." });

      const referenceId = buildCreditPixReferenceId(establishment.id, pkg.id);

      const cardData: PaytimeCardData = {
        holder_name: input.card.holderName,
        holder_document: input.card.holderDocument.replace(/\D/g, ""),
        card_number: input.card.cardNumber.replace(/\D/g, ""),
        expiration_month: input.card.expirationMonth,
        expiration_year: input.card.expirationYear,
        security_code: input.card.securityCode,
        create_token: false,
      };

      const clientData: PaytimeCardClient = {
        first_name: input.client.firstName,
        last_name: input.client.lastName,
        document: input.client.document.replace(/\D/g, ""),
        phone: (() => {
          let p = input.client.phone.replace(/\D/g, "");
          if (p.length >= 12 && p.startsWith("55")) p = p.substring(2);
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

      const cardTransaction = await createCardTransaction({
        amount: totalPriceInCents,
        installments: 1,
        interest: "STORE",
        client: clientData,
        card: cardData,
        reference_id: referenceId,
        sub_establishment_id: PAYTIME_PLAN_SUB_ESTABLISHMENT_ID,
        info_additional: [
          { key: "type", value: "ai_credits" },
          { key: "package_id", value: pkg.id },
          { key: "credits", value: String(totalCredits) },
          { key: "establishment_id", value: String(establishment.id) },
          { key: "user_id", value: String(ctx.user.id) },
        ],
      });

      logger.info(`[AiCredits] Card checkout criado: pkg=${pkg.id}, tx=${cardTransaction._id}, est=${establishment.id}, status=${cardTransaction.status}`);

      // Se cartão já foi aprovado imediatamente
      if (cardTransaction.status === "PAID" || cardTransaction.status === "APPROVED") {
        const newBalance = await db.addAiImageCredits(
          establishment.id,
          ctx.user.id,
          pkg.credits,
          "purchase",
          `Compra ${pkg.name} via cartão (Paytime)`,
        );
        logger.info(`[AiCredits] Créditos adicionados via cartão: est=${establishment.id}, credits=${pkg.credits}, newBalance=${newBalance}`);
        return {
          transactionId: cardTransaction._id,
          status: "approved" as const,
          credits: pkg.credits,
          newBalance,
        };
      }

      // Se precisa de 3DS/antifraude
      if (cardTransaction.status === "PENDING_AUTH" || cardTransaction.status === "PENDING") {
        return {
          transactionId: cardTransaction._id,
          status: "pending_auth" as const,
          authUrl: cardTransaction.authentication_url || null,
          credits: pkg.credits,
          newBalance: null,
        };
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: `Pagamento recusado: ${cardTransaction.status}` });
    }),

  // Poll status de pagamento (PIX ou cartão pendente)
  pollPaymentStatus: publicProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ ctx, input }) => {
      logger.info(`[AiCredits Poll] Called with transactionId=${input.transactionId}, user=${ctx.user?.id || 'anonymous'}`);
      try {
        const tx = await getTransaction(input.transactionId, PAYTIME_PLAN_SUB_ESTABLISHMENT_ID);
        logger.info(`[AiCredits Poll] Transaction status: ${tx.status}, info_additional: ${JSON.stringify(tx.info_additional)}`);
        console.log("[DEBUG POLL]", JSON.stringify({status: tx.status, info_additional: tx.info_additional}));
        if (tx.status === "PAID" || tx.status === "APPROVED") {
          // Extrair info do pacote dos info_additional
          const pkgId = tx.info_additional?.find((i: any) => i.key === "package_id")?.value;
          const creditsStr = tx.info_additional?.find((i: any) => i.key === "credits")?.value;
          const estIdStr = tx.info_additional?.find((i: any) => i.key === "establishment_id")?.value;
          const userIdStr = tx.info_additional?.find((i: any) => i.key === "user_id")?.value;
          if (!pkgId || !creditsStr) {
            return { status: "paid" as const, credited: false };
          }
          const credits = parseInt(creditsStr, 10);
          let estId: number;
          if (estIdStr) {
            estId = parseInt(estIdStr, 10);
          } else if (userIdStr) {
            const est = await db.getEstablishmentByUserId(parseInt(userIdStr, 10));
            if (!est) return { status: "paid" as const, credited: false };
            estId = est.id;
          } else {
            return { status: "paid" as const, credited: false };
          }
          // Verificar se já creditou (evitar duplicata)
          const history = await db.getAiImageCreditHistory(estId, 10);
          const alreadyCredited = history.some(h =>
            h.description?.includes(input.transactionId)
          );
          if (!alreadyCredited) {
            const pkg = AI_IMAGE_PACKAGES.find(p => p.id === pkgId);
            await db.addAiImageCredits(
              estId, 0, credits, "purchase",
              `Compra ${pkg?.name || pkgId} via Paytime (tx: ${input.transactionId})`
            );
            logger.info(`[AiCredits Poll] Credits added: est=${estId}, credits=${credits}`);
          }
          return { status: "paid" as const, credited: true };
        }
        if (tx.status === "CANCELLED" || tx.status === "FAILED" || tx.status === "EXPIRED") {
          return { status: "failed" as const, credited: false };
        }
        return { status: "pending" as const, credited: false };
      } catch (error: any) {
        logger.warn(`[AiCredits Poll] Error checking transaction: ${error.message}`);
        return { status: "pending" as const, credited: false };
      }
    }),

  // Histórico de créditos
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) return [];
    return db.getAiImageCreditHistory(establishment.id);
  }),
});
