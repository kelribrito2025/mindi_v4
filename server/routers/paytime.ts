/**
 * Router Paytime — Pagamentos online via PIX e Smart Checkout (Cartão)
 * 
 * Fluxo PIX:
 * 1. Cliente faz pedido no menu público com paymentMethod "pix_online"
 * 2. Frontend chama paytime.createPixPayment com orderId
 * 3. Backend cria transação na Paytime e retorna EMV (QR Code string)
 * 4. Frontend exibe QR Code para o cliente pagar
 * 5. Webhook Paytime notifica quando pagamento é confirmado
 * 6. Backend atualiza status do pedido e da transação
 * 
 * Fluxo Smart Checkout (Cartão):
 * 1. Cliente faz pedido no menu público com paymentMethod "card_online"
 * 2. Frontend coleta dados do cartão e chama paytime.createCardPayment
 * 3. Backend cria transação na Paytime com dados do cartão (proxy seguro)
 * 4. Se antifraude IDPAY requerido: retorna session + antifraud_id ao frontend
 * 5. Frontend abre SDK IDPAY via iframe para validação
 * 6. Após conclusão, frontend chama paytime.confirmAntifraud
 * 7. Backend envia autenticação à Paytime
 * 8. Webhook Paytime atualiza status em background
 * 
 * SEGURANÇA: Dados do cartão NUNCA são armazenados (nem em logs, nem em banco).
 * O backend funciona apenas como proxy seguro para a API Paytime.
 */

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import * as db from "../db";
import { ENV } from "../_core/env";
import { createPixTransaction, createCardTransaction, sendAntifraudAuth, getTransaction, createPaytimeEstablishment, getPaytimeEstablishment, listPaytimeGateways, activatePaytimeGateway, refundPaytimeTransaction, listPaytimePlans, listPaytimeFeesBankings, listEstablishmentGateways, getEstablishmentBalance, getFutureReleases, getEstablishmentDetails, getTransactions, getTransactionsSummary, listBankingTransfers, getBankingTransferDetail, initPixPayment, confirmPixPayment, listLiquidations, listPlans, getPlanDetail, listFeesBanking, simulateTransaction, getEstablishmentExtract, checkBillet, payBillet, listBilletPayments, listPaytimeWebhookEvents, registerPaytimeWebhookEvents } from "../paytime";
import { assertEstablishmentOwnership } from "./helpers";

/**
 * Helper: Disparar notificações (SSE, impressão, WhatsApp) quando pagamento online é confirmado.
 * Chamado após updateOrderStatus(orderId, "new") para pedidos pix_online/card_online.
 */
type PaytimeBankingScope = {
  useMarketplaceHeaders: boolean;
  filterSubEstablishmentId?: string;
};

function normalizeKycStatus(status?: string | null): string {
  return String(status || "").trim().toLowerCase();
}

function shouldUseMarketplaceBankingFallback(establishment: any): boolean {
  const kycStatus = normalizeKycStatus(establishment?.paytimeKycStatus);
  return kycStatus === "pending" || !establishment?.paytimeEstablishmentId;
}

function getBankingPaytimeScope(establishment: any): PaytimeBankingScope {
  const paytimeSubEstablishmentId = establishment?.paytimeEstablishmentId
    ? String(establishment.paytimeEstablishmentId)
    : undefined;
  const useMarketplaceHeaders = shouldUseMarketplaceBankingFallback(establishment);

  if (useMarketplaceHeaders) {
    logger.info("[Paytime] Banking usando fallback marketplace", {
      establishmentId: establishment?.id,
      kycStatus: establishment?.paytimeKycStatus,
      hasSubEstablishmentId: Boolean(paytimeSubEstablishmentId),
    });
  }

  return {
    useMarketplaceHeaders,
    filterSubEstablishmentId: useMarketplaceHeaders ? paytimeSubEstablishmentId : undefined,
  };
}

function emptyTransactionsResponse(page = 1, perPage = 15) {
  return { data: [], meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 } };
}

async function triggerOnlinePaymentConfirmedNotifications(orderId: number) {
  try {
    const order = await db.getOrderById(orderId);
    if (!order) return;
    
    const items = await db.getOrderItems(orderId);
    const { notifyNewOrder } = await import('../_core/sse');
    
    // Notificar via SSE (faz o pedido aparecer no painel do restaurante)
    const orderData = {
      ...order,
      status: 'new',
      source: order.source || 'public',
      items: items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        complements: item.complements,
        notes: item.notes,
      })),
    };
    notifyNewOrder(order.establishmentId, orderData);
    logger.info('[Paytime] Notificação SSE enviada para pedido confirmado:', orderId);
    
    // Disparar impressão e notificação WhatsApp em background
    const orderInsertData = {
      establishmentId: order.establishmentId,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      customerAddress: order.customerAddress || null,
      deliveryType: order.deliveryType || 'delivery',
      paymentMethod: order.paymentMethod || 'pix_online',
      subtotal: order.subtotal || '0',
      deliveryFee: order.deliveryFee || '0',
      discount: order.discount || '0',
      total: order.total,
      notes: order.notes || null,
      changeAmount: order.changeAmount || null,
      orderNumber: order.orderNumber,
    } as any;
    
    const orderItemsData = items.map(item => ({
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      complements: item.complements,
      notes: item.notes || null,
    })) as any;
    
    db.processOrderPrintingInBackground(order.establishmentId, orderId, order.orderNumber, orderInsertData, orderItemsData).catch(err => {
      logger.error('[Paytime] Erro ao processar impressão em background:', err);
    });
    
    db.processOrderNotificationInBackground(order.establishmentId, orderId, order.orderNumber, orderInsertData, orderItemsData).catch(err => {
      logger.error('[Paytime] Erro ao processar notificação em background:', err);
    });
    
    // Enviar push notification para dispositivos inscritos (agora que pagamento foi confirmado)
    try {
      const { sendNewOrderNotification } = await import('../_core/webPush');
      const subscriptions = await db.getPushSubscriptionsByEstablishment(order.establishmentId);
      
      if (subscriptions.length > 0) {
        logger.info(`[Paytime] Enviando push para ${subscriptions.length} dispositivos após pagamento confirmado...`);
        
        for (const sub of subscriptions) {
          try {
            const success = await sendNewOrderNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              {
                orderId,
                orderNumber: order.orderNumber,
                customerName: order.customerName || 'Cliente',
                total: parseFloat(order.total),
              }
            );
            
            if (!success) {
              logger.info(`[Paytime] Removendo subscription inválida: ${sub.id}`);
              await db.deletePushSubscriptionById(sub.id);
            }
          } catch (pushError) {
            logger.error('[Paytime] Erro ao enviar push para subscription:', sub.id, pushError);
          }
        }
      }
    } catch (pushError) {
      logger.error('[Paytime] Erro ao enviar push notifications pós-pagamento:', pushError);
    }
  } catch (error) {
    logger.error('[Paytime] Erro ao disparar notificações de pagamento confirmado:', error);
  }
}

/**
 * Confirma um pedido pago online de forma idempotente.
 * A dedução de estoque só ocorre quando o pedido ainda está pendente de confirmação,
 * evitando desconto duplicado em polls repetidos, webhooks ou reconsultas.
 */
async function confirmPaidOrderIfPending(orderId: number): Promise<{ confirmed: boolean; deductedStock: boolean }> {
  const order = await db.getOrderById(orderId);
  if (!order) {
    return { confirmed: false, deductedStock: false };
  }

  if (order.status !== "pending_confirmation") {
    logger.info("[Paytime] Pedido pago já não está pendente; confirmação idempotente ignorada:", {
      orderId,
      currentStatus: order.status,
    });
    return { confirmed: false, deductedStock: false };
  }

  await db.updateOrderStatus(orderId, "new");
  logger.info("[Paytime] Pedido atualizado para 'new' após pagamento:", orderId);

  let deductedStock = false;
  try {
    await db.deductStockForOrder(orderId);
    deductedStock = true;
    logger.info("[Paytime] Estoque deduzido após confirmação de pagamento:", orderId);
  } catch (stockError) {
    logger.error("[Paytime] Erro ao deduzir estoque após confirmação de pagamento:", stockError);
  }

  triggerOnlinePaymentConfirmedNotifications(orderId).catch(err => {
    logger.error('[Paytime] Erro ao disparar notificações pós-pagamento:', err);
  });

  return { confirmed: true, deductedStock };
}

export const paytimeRouter = router({
  /**
   * Retorna o ambiente do SDK PagSeguro (PROD ou SANDBOX)
   * baseado na PAYTIME_BASE_URL configurada no backend.
   * Isso garante que frontend e backend usem o mesmo ambiente.
   */
  getPaytimeEnv: publicProcedure
    .query(() => {
      const baseUrl = ENV.paytimeBaseUrl;
      const isSandbox = baseUrl.includes('sandbox');
      return {
        sdkEnv: isSandbox ? 'SANDBOX' : 'PROD',
      };
    }),

  /**
   * Criar pagamento PIX para um pedido existente.
   * Chamado pelo frontend após o pedido ser criado com paymentMethod "pix_online".
   */
  createPixPayment: publicProcedure
    .input(z.object({
      orderId: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { orderId, establishmentId } = input;

      // Buscar o pedido
      const order = await db.getOrderById(orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      if (order.establishmentId !== establishmentId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Pedido não pertence a este estabelecimento" });
      }

      // Verificar se já existe transação Paytime para este pedido
      const existing = await db.getPaytimeTransactionByOrderId(orderId);
      if (existing && existing.status === "PENDING") {
        // Retornar a transação existente (evita duplicatas)
        return {
          transactionId: existing.paytimeTransactionId,
          emv: existing.emv,
          amountCents: existing.amountCents,
          status: existing.status,
        };
      }
      if (existing && existing.status === "APPROVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido já foi pago" });
      }

      // Converter total do pedido para centavos
      const totalReais = parseFloat(order.total);
      const amountCents = Math.round(totalReais * 100);

      if (amountCents < 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Valor do pedido inválido para pagamento PIX" });
      }

      // Buscar dados do estabelecimento para info adicional
      const establishment = await db.getEstablishmentById(establishmentId);

      const referenceId = `order_${orderId}_${Date.now()}`;

      try {
        // Criar transação PIX na Paytime
        const transaction = await createPixTransaction({
          amount: amountCents,
          interest: "STORE",
          reference_id: referenceId,
          sub_establishment_id: establishment?.paytimeEstablishmentId || undefined,
          client: {
            first_name: order.customerName || undefined,
            phone: order.customerPhone || undefined,
          },
          info_additional: [
            { key: "Pedido", value: `#${order.orderNumber}` },
            { key: "Estabelecimento", value: establishment?.name || "Mindi" },
          ],
        });

        // Salvar transação no banco local
        await db.createPaytimeTransaction({
          establishmentId,
          orderId,
          paytimeTransactionId: transaction._id,
          paytimeGatewayKey: transaction.gateway_key || null,
          referenceId,
          paymentType: "PIX",
          status: "PENDING",
          amountCents,
          emv: transaction.emv || null,
        });

        logger.info("[Paytime] Transação PIX criada:", {
          orderId,
          transactionId: transaction._id,
          amountCents,
        });

        return {
          transactionId: transaction._id,
          emv: transaction.emv,
          amountCents,
          status: "PENDING",
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao criar transação PIX:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar pagamento PIX. Tente novamente.",
        });
      }
    }),

  /**
   * Smart Checkout: Criar pagamento com cartão de crédito para um pedido existente.
   * 
   * O frontend coleta os dados do cartão e envia ao backend via HTTPS.
   * O backend repassa imediatamente à API Paytime (proxy seguro).
   * Dados do cartão NUNCA são armazenados.
   * 
   * Se antifraude IDPAY for requerido, retorna session + antifraud_id.
   */
  createCardPayment: publicProcedure
    .input(z.object({
      orderId: z.number(),
      establishmentId: z.number(),
      // Dados do cartão (proxy seguro - nunca armazenados)
      card: z.object({
        holderName: z.string().min(3, "Nome do titular é obrigatório"),
        holderDocument: z.string().min(11, "CPF é obrigatório"),
        cardNumber: z.string().min(13, "Número do cartão inválido").max(19),
        expirationMonth: z.number().min(1).max(12),
        expirationYear: z.number().min(2024),
        securityCode: z.string().min(3, "CVV é obrigatório").max(4),
      }),
      // Dados do cliente para antifraude
      customer: z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional().default(""),
        document: z.string().min(11),
        phone: z.string().min(10),
        email: z.string().email().optional().default(""),
        address: z.object({
          street: z.string().min(1),
          number: z.string().min(1),
          complement: z.string().optional().default(""),
          neighborhood: z.string().min(1),
          city: z.string().min(1),
          state: z.string().min(2).max(2),
          zipCode: z.string().min(8),
        }),
      }),
      installments: z.number().min(1).max(12).optional().default(1),
    }))
    .mutation(async ({ input }) => {
      const { orderId, establishmentId, card, customer } = input;
      // Forçar pagamento à vista (sem parcelamento)
      const installments = 1;

      // Buscar o pedido
      const order = await db.getOrderById(orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      if (order.establishmentId !== establishmentId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Pedido não pertence a este estabelecimento" });
      }

      // Verificar se estabelecimento tem pagamento com cartão online ativo
      const establishment = await db.getEstablishmentById(establishmentId);
      if (!establishment?.paytimeCardEnabled) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento com cartão online não está habilitado neste estabelecimento" });
      }

      // Verificar se já existe transação aprovada para este pedido
      const existing = await db.getPaytimeTransactionByOrderId(orderId);
      if (existing && (existing.status === "APPROVED" || existing.status === "PAID")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido já foi pago" });
      }

      // Converter total do pedido para centavos
      const totalReais = parseFloat(order.total);
      const amountCents = Math.round(totalReais * 100);

      if (amountCents < 100) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Valor mínimo para pagamento com cartão é R$ 1,00" });
      }

      const referenceId = `card_order_${orderId}_${Date.now()}`;

      // Extrair últimos 4 dígitos do cartão (para referência local, sem armazenar o número completo)
      const cardLast4 = card.cardNumber.replace(/\s/g, "").slice(-4);

      try {
        // Criar transação com cartão na Paytime (proxy seguro)
        const transaction = await createCardTransaction({
          amount: amountCents,
          installments,
          interest: "STORE",
          reference_id: referenceId,
          antifraud_type: "THREEDS", // Usar 3DS (SDK PagSeguro) para antifraude
          sub_establishment_id: establishment?.paytimeEstablishmentId || undefined,
          client: {
            first_name: customer.firstName,
            last_name: customer.lastName || "",
            document: customer.document.replace(/\D/g, ""),
            phone: customer.phone.replace(/\D/g, ""),
            email: customer.email || `${customer.phone.replace(/\D/g, "")}@noemail.com`,
            address: {
              street: customer.address.street,
              number: customer.address.number,
              complement: customer.address.complement || "",
              neighborhood: customer.address.neighborhood,
              city: customer.address.city,
              state: customer.address.state,
              country: "BR",
              zip_code: customer.address.zipCode.replace(/\D/g, ""),
            },
          },
          card: {
            holder_name: card.holderName,
            holder_document: card.holderDocument.replace(/\D/g, ""),
            card_number: card.cardNumber.replace(/\s/g, ""),
            expiration_month: card.expirationMonth,
            expiration_year: card.expirationYear,
            security_code: card.securityCode,
            create_token: false, // Não tokenizar por enquanto
          },
          info_additional: [
            { key: "Pedido", value: `#${order.orderNumber}` },
            { key: "Estabelecimento", value: establishment?.name || "Mindi" },
          ],
        });

        // Verificar se antifraude é requerido
        const antifraud = transaction.antifraud?.[0];
        const needsAntifraud = antifraud?.analyse_required === "IDPAY" || antifraud?.analyse_required === "THREEDS";

        // Determinar status local baseado na resposta
        let localStatus: "PENDING" | "APPROVED" | "PAID" | "FAILED" | "WAITING_ANTIFRAUD" = "PENDING";
        if (needsAntifraud) {
          localStatus = "WAITING_ANTIFRAUD";
        } else if (transaction.status === "PAID" || transaction.status === "APPROVED") {
          localStatus = "PAID";
        } else if (transaction.status === "FAILED") {
          localStatus = "FAILED";
        }

        // Salvar transação no banco local (SEM dados do cartão, apenas referências)
        await db.createPaytimeTransaction({
          establishmentId,
          orderId,
          paytimeTransactionId: transaction._id,
          paytimeGatewayKey: transaction.gateway_key || null,
          referenceId,
          paymentType: "CREDIT_CARD",
          status: localStatus,
          amountCents,
          emv: null,
          antifraudId: antifraud?.antifraud_id || antifraud?._id || null,
          antifraudSession: antifraud?.session || null,
          antifraudRequired: antifraud?.analyse_required || null,
          cardBrand: transaction.card?.brand_name || null,
          cardLast4,
          installments,
        });

        logger.info("[Paytime] Transação CARTÃO criada:", {
          orderId,
          transactionId: transaction._id,
          amountCents,
          status: transaction.status,
          needsAntifraud,
          antifraudType: antifraud?.analyse_required,
        });

        // Se pagamento foi aprovado diretamente (sem antifraude)
        if (localStatus === "PAID") {
          // Atualizar pedido para "new" (confirmado)
          await db.updateOrderStatus(orderId, "new");
          logger.info("[Paytime] Pedido confirmado por cartão (sem antifraude):", orderId);
          // Disparar notificações (SSE, impressão, WhatsApp) agora que pagamento foi confirmado
          triggerOnlinePaymentConfirmedNotifications(orderId).catch(err => {
            logger.error('[Paytime] Erro ao disparar notificações pós-pagamento:', err);
          });
        }

        // Determinar ambiente do SDK PagSeguro baseado na PAYTIME_BASE_URL
        const sdkEnv = ENV.paytimeBaseUrl.includes('sandbox') ? 'SANDBOX' : 'PROD';

        return {
          transactionId: transaction._id,
          status: localStatus,
          // Dados de antifraude (se necessário)
          needsAntifraud,
          antifraudType: antifraud?.analyse_required || null,
          antifraudId: antifraud?.antifraud_id || antifraud?._id || null,
          antifraudSession: antifraud?.session || null,
          // Ambiente do SDK PagSeguro (SANDBOX ou PROD) - deve coincidir com o backend
          sdkEnv,
          // Info do cartão (apenas para exibição)
          cardBrand: transaction.card?.brand_name || null,
          cardLast4,
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao criar transação CARTÃO:", error?.message || error);
        
        // Mapear erros comuns da Paytime
        let userMessage = "Erro ao processar pagamento com cartão. Tente novamente.";
        if (error?.message?.includes("card")) {
          userMessage = "Dados do cartão inválidos. Verifique e tente novamente.";
        } else if (error?.message?.includes("insufficient")) {
          userMessage = "Saldo insuficiente no cartão.";
        } else if (error?.message?.includes("declined") || error?.message?.includes("refused")) {
          userMessage = "Pagamento recusado pela operadora do cartão.";
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: userMessage,
        });
      }
    }),

  /**
   * Smart Checkout: Confirmar autenticação antifraude (3DS ou IDPAY).
   * 
   * Chamado pelo frontend após o SDK 3DS/IDPAY concluir a validação.
   * O backend envia o resultado da autenticação à Paytime.
   */
  confirmAntifraud: publicProcedure
    .input(z.object({
      orderId: z.number(),
      transactionId: z.string(),
      antifraudId: z.string(),
      // Campos IDPAY (opcionais)
      concluded: z.boolean().optional(),
      captureConcluded: z.boolean().optional(),
      // Campos 3DS (opcionais)
      threeDsStatus: z.string().optional(),
      authenticationStatus: z.string().optional(),
      // ID gerado pelo SDK 3DS (diferente do antifraudId da Paytime)
      threeDsSdkId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { orderId, transactionId, antifraudId, concluded, captureConcluded, threeDsStatus, authenticationStatus, threeDsSdkId } = input;

      // Debug log para arquivo
      const fs = await import('fs');
      fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] confirmAntifraud CALLED\ninput: ${JSON.stringify(input)}\n`);

      // Buscar transação local
      const localTx = await db.getPaytimeTransactionById(transactionId);
      if (!localTx) {
        fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] ERROR: Transação não encontrada: ${transactionId}\n`);
        throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada" });
      }
      fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] localTx found: status=${localTx.status}, orderId=${localTx.orderId}\n`);
      if (localTx.orderId !== orderId) {
        fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] ERROR: orderId mismatch: ${localTx.orderId} !== ${orderId}\n`);
        throw new TRPCError({ code: "FORBIDDEN", message: "Transação não pertence a este pedido" });
      }
      if (localTx.status !== "WAITING_ANTIFRAUD") {
        fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] ERROR: status não é WAITING_ANTIFRAUD: ${localTx.status}\n`);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta transação não requer autenticação antifraude" });
      }

      // Buscar o paytimeEstablishmentId do restaurante para usar como sub_establishment_id
      // IMPORTANTE: A Paytime exige que o mesmo establishment_id usado na criação da transação
      // seja usado na chamada de antifraud-auth. Sem isso, retorna 403 (API000104).
      let subEstablishmentId: string | undefined;
      if (localTx.establishmentId) {
        const establishment = await db.getEstablishmentById(localTx.establishmentId);
        subEstablishmentId = establishment?.paytimeEstablishmentId || undefined;
        fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] subEstablishmentId: ${subEstablishmentId} (from est ${localTx.establishmentId})\n`);
      }

      try {
        // Montar dados de autenticação baseado no tipo (3DS ou IDPAY)
        // IMPORTANTE: Para 3DS, o "id" no body deve ser o ID gerado pelo SDK PagSeguro (threeDsSdkId),
        // NÃO o antifraudId retornado pela Paytime na criação da transação.
        // Ref: https://docs-parceiro.paytime.com.br/docs/autenticação-da-transação-3ds
        const authPayload: any = {};
        if (threeDsStatus) {
          // 3DS: usar o ID do SDK PagSeguro (ou fallback para antifraudId se SDK não retornou id)
          authPayload.id = threeDsSdkId || antifraudId;
          authPayload.status = threeDsStatus;
          authPayload.authentication_status = authenticationStatus || "AUTHENTICATED";
        } else {
          // IDPAY: usar antifraudId da Paytime
          authPayload.id = antifraudId;
          authPayload.concluded = concluded ?? true;
          authPayload.capture_concluded = captureConcluded ?? true;
        }

        logger.info("[Paytime] Enviando confirmação antifraude:", {
          transactionId,
          type: threeDsStatus ? '3DS' : 'IDPAY',
          bodyId: authPayload.id,
          threeDsSdkId,
          antifraudId,
          threeDsStatus,
          authenticationStatus,
        });

        // Enviar resultado da autenticação à Paytime (com sub_establishment_id do restaurante)
        const updatedTransaction = await sendAntifraudAuth(transactionId, authPayload, subEstablishmentId);

        logger.info("[Paytime] Resposta da Paytime após antifraud-auth:", JSON.stringify(updatedTransaction));

        // IMPORTANTE: Após 3DS, a Paytime pode retornar um NOVO _id (transação definitiva)
        // diferente do ID temporário original. Precisamos atualizar nosso registro.
        const newPaytimeId = updatedTransaction._id;
        if (newPaytimeId && newPaytimeId !== transactionId) {
          logger.info("[Paytime] Novo ID de transação após 3DS:", { oldId: transactionId, newId: newPaytimeId });
          // Atualizar o ID da transação no banco local
          await db.updatePaytimeTransactionId(transactionId, newPaytimeId);
        }

        // Atualizar status local baseado na resposta
        // Usar o ID que temos no banco (pode ter sido atualizado acima)
        const txIdForUpdate = newPaytimeId || transactionId;
        let newStatus: "PAID" | "APPROVED" | "FAILED" | "PENDING" = "PENDING";
        if (updatedTransaction.status === "PAID" || updatedTransaction.status === "APPROVED") {
          newStatus = "PAID";
          await db.updatePaytimeTransactionStatus(txIdForUpdate, "PAID", new Date());
          
          // Atualizar pedido para "new" (confirmado)
          if (localTx.orderId) {
            await db.updateOrderStatus(localTx.orderId, "new");
            logger.info("[Paytime] Pedido confirmado após antifraude:", localTx.orderId);
            // Disparar notificações (SSE, impressão, WhatsApp) agora que pagamento foi confirmado
            triggerOnlinePaymentConfirmedNotifications(localTx.orderId).catch(err => {
              logger.error('[Paytime] Erro ao disparar notificações pós-antifraude:', err);
            });
          }
        } else if (updatedTransaction.status === "FAILED") {
          newStatus = "FAILED";
          await db.updatePaytimeTransactionStatus(txIdForUpdate, "FAILED");
        } else {
          // Ainda pendente, aguardar webhook
          await db.updatePaytimeTransactionStatus(txIdForUpdate, "PENDING");
        }

        logger.info("[Paytime] Autenticação antifraude processada:", {
          transactionId,
          orderId,
          type: threeDsStatus ? '3DS' : 'IDPAY',
          threeDsStatus,
          authenticationStatus,
          concluded,
          captureConcluded,
          newStatus: updatedTransaction.status,
        });

        return {
          status: newStatus,
          transactionStatus: updatedTransaction.status,
        };
      } catch (error: any) {
        fs.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] CATCH ERROR: ${error?.message || error}\nStack: ${error?.stack || 'no stack'}\n`);
        logger.error("[Paytime] Erro na autenticação antifraude:", error?.message || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao confirmar autenticação. O pagamento pode ser processado em breve.",
        });
      }
    }),

  /**
   * Consultar status de um pagamento (PIX ou Cartão).
   * Polling pelo frontend enquanto aguarda confirmação.
   */
  checkPaymentStatus: publicProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .query(async ({ input }) => {
      const transaction = await db.getPaytimeTransactionByOrderId(input.orderId);
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada" });
      }

      // Se já está aprovada/paga localmente, garantir confirmação idempotente do pedido e retornar direto
      if (transaction.status === "APPROVED" || transaction.status === "PAID") {
        if (transaction.orderId) {
          await confirmPaidOrderIfPending(transaction.orderId);
        }
        return {
          status: "APPROVED" as const,
          paidAt: transaction.paidAt,
          paymentType: transaction.paymentType,
          cardBrand: transaction.cardBrand,
          cardLast4: transaction.cardLast4,
        };
      }

      // Se está aguardando antifraude, retornar status com dados do antifraude
      if (transaction.status === "WAITING_ANTIFRAUD") {
        return {
          status: "WAITING_ANTIFRAUD" as const,
          paidAt: null,
          paymentType: transaction.paymentType,
          antifraudId: transaction.antifraudId,
          antifraudSession: transaction.antifraudSession,
          antifraudRequired: transaction.antifraudRequired,
          cardBrand: transaction.cardBrand,
          cardLast4: transaction.cardLast4,
        };
      }

      // Se está pendente, consultar a Paytime para verificar atualização
      if (transaction.status === "PENDING") {
        try {
          // Buscar sub_establishment_id para o header da consulta
          let subEstId: string | undefined;
          if (transaction.establishmentId) {
            const est = await db.getEstablishmentById(transaction.establishmentId);
            subEstId = est?.paytimeEstablishmentId || undefined;
          }
          const paytimeData = await getTransaction(transaction.paytimeTransactionId, subEstId);
          
          if (paytimeData.status === "APPROVED" || paytimeData.status === "PAID") {
            // Pagamento confirmado! Atualizar localmente
            await db.updatePaytimeTransactionStatus(
              transaction.paytimeTransactionId,
              "APPROVED",
              new Date()
            );
            
            // Atualizar status do pedido para "new" e deduzir estoque somente uma vez
            if (transaction.orderId) {
              await confirmPaidOrderIfPending(transaction.orderId);
            }

            return {
              status: "APPROVED" as const,
              paidAt: new Date(),
              paymentType: transaction.paymentType,
              cardBrand: transaction.cardBrand,
              cardLast4: transaction.cardLast4,
            };
          }

          if (paytimeData.status === "CANCELLED" || paytimeData.status === "FAILED") {
            const failStatus = paytimeData.status === "FAILED" ? "FAILED" : "CANCELLED";
            await db.updatePaytimeTransactionStatus(
              transaction.paytimeTransactionId,
              failStatus as any
            );
            return { status: failStatus as "CANCELLED" | "FAILED", paidAt: null, paymentType: transaction.paymentType };
          }
        } catch (error) {
          logger.error("[Paytime] Erro ao consultar status:", error);
          // Se falhar a consulta, retornar status local
        }
      }

      return {
        status: transaction.status as "PENDING" | "APPROVED" | "CANCELLED" | "EXPIRED" | "FAILED" | "WAITING_ANTIFRAUD",
        paidAt: transaction.paidAt,
        paymentType: transaction.paymentType,
        cardBrand: transaction.cardBrand,
        cardLast4: transaction.cardLast4,
      };
    }),

  /**
   * Polling protegido do PDV para pagamento PIX criado via WhatsApp.
   * Confirma automaticamente o pedido quando a Paytime retornar pagamento aprovado.
   */
  checkPixStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      transactionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      await assertEstablishmentOwnership(ctx.user.id, order.establishmentId);

      const transaction = await db.getPaytimeTransactionByOrderId(input.orderId);
      if (!transaction || transaction.paytimeTransactionId !== input.transactionId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transação PIX não encontrada para este pedido" });
      }

      if (transaction.status === "APPROVED" || transaction.status === "PAID") {
        const confirmation = await confirmPaidOrderIfPending(input.orderId);
        return {
          status: "APPROVED" as const,
          isPaid: true,
          paid: true,
          paidAt: transaction.paidAt,
          orderId: input.orderId,
          orderStatus: confirmation.confirmed ? "new" : order.status,
          deductedStock: confirmation.deductedStock,
        };
      }

      if (transaction.status !== "PENDING") {
        return {
          status: transaction.status as "CANCELLED" | "EXPIRED" | "FAILED" | "WAITING_ANTIFRAUD",
          isPaid: false,
          paid: false,
          paidAt: transaction.paidAt,
          orderId: input.orderId,
          orderStatus: order.status,
          deductedStock: false,
        };
      }

      try {
        const est = await db.getEstablishmentById(order.establishmentId);
        const paytimeData = await getTransaction(
          transaction.paytimeTransactionId,
          est?.paytimeEstablishmentId || undefined
        );

        if (paytimeData.status === "APPROVED" || paytimeData.status === "PAID") {
          const paidAt = new Date();
          await db.updatePaytimeTransactionStatus(transaction.paytimeTransactionId, "APPROVED", paidAt);
          const confirmation = await confirmPaidOrderIfPending(input.orderId);

          return {
            status: "APPROVED" as const,
            isPaid: true,
            paid: true,
            paidAt,
            orderId: input.orderId,
            orderStatus: "new",
            deductedStock: confirmation.deductedStock,
          };
        }

        if (paytimeData.status === "CANCELLED" || paytimeData.status === "FAILED" || paytimeData.status === "EXPIRED") {
          const finalStatus = paytimeData.status as "CANCELLED" | "FAILED" | "EXPIRED";
          await db.updatePaytimeTransactionStatus(transaction.paytimeTransactionId, finalStatus as any);
          return {
            status: finalStatus,
            isPaid: false,
            paid: false,
            paidAt: null,
            orderId: input.orderId,
            orderStatus: order.status,
            deductedStock: false,
          };
        }
      } catch (error) {
        logger.error("[Paytime] Erro ao consultar status PIX do PDV:", error);
      }

      return {
        status: "PENDING" as const,
        isPaid: false,
        paid: false,
        paidAt: transaction.paidAt,
        orderId: input.orderId,
        orderStatus: order.status,
        deductedStock: false,
      };
    }),

  /**
   * Listar transações Paytime de um estabelecimento (admin).
   */
  listTransactions: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.listPaytimeTransactions(input.establishmentId, input.limit, input.offset);
    }),

  // ======================================================================
  // Fase 4: Onboarding Paytime (Cadastro + Gateway + Split)
  // ======================================================================

  /**
   * Obter status do onboarding Paytime de um estabelecimento.
   */
  getOnboardingStatus: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      return {
        onboardingStatus: est.paytimeOnboardingStatus || "not_started",
        paytimeEstablishmentId: est.paytimeEstablishmentId,
        gatewayActive: est.paytimeGatewayActive,
        bankingActive: est.paytimeBankingActive,
        subPaytimeActive: est.paytimeSubPaytimeActive,
        kycUrl: est.paytimeKycUrl,
        kycStatus: est.paytimeKycStatus || "not_started",
        splitConfigured: est.paytimeSplitConfigured, // Deprecated: split removido, markup do plano cuida da receita
        splitRuleId: est.paytimeSplitRuleId, // Deprecated
        pixEnabled: est.paytimeEnabled,
        cardEnabled: est.paytimeCardEnabled,
        // Dados do representante (para pré-preenchimento)
        representativeName: est.representativeName,
        representativeLastName: est.representativeLastName,
        representativeCpf: est.representativeCpf,
        representativeEmail: est.representativeEmail,
        representativePhone: est.representativePhone,
        representativeBirthDate: est.representativeBirthDate,
        cnae: est.cnae,
        razaoSocial: est.razaoSocial,
        nomeFantasia: est.nomeFantasia,
        // Dados do estabelecimento
        cnpj: est.cnpj,
        street: est.street,
        number: est.number,
        complement: est.complement,
        neighborhood: est.neighborhood,
        city: est.city,
        state: est.state,
        zipCode: est.zipCode,
      };
    }),

  /**
   * Cadastrar sub-estabelecimento na Paytime.
   * Envia os dados do restaurante + representante legal para a API Paytime.
   */
  submitOnboarding: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      // Dados da empresa
      type: z.enum(["INDIVIDUAL", "BUSINESS"]).default("BUSINESS"), // Tipo: PF ou PJ
      razaoSocial: z.string().min(3, "Razão Social é obrigatória"),
      nomeFantasia: z.string().min(2, "Nome Fantasia é obrigatório"),
      document: z.string().min(11, "CNPJ/CPF é obrigatório"), // CNPJ ou CPF
      cnae: z.string().min(4, "CNAE é obrigatório").max(7, "CNAE deve ter no máximo 7 caracteres"),
      email: z.string().email("Email inválido"),
      phone: z.string().min(10, "Telefone é obrigatório"),
      format: z.string().min(1, "Formato da empresa é obrigatório").default("LTDA"), // SS, SC, SPE, LTDA, SA, ME, MEI, EI, EIRELI, SLU, ESI
      birthdate: z.string().optional().default(""), // Data de abertura da empresa (YYYY-MM-DD)
      revenue: z.number().min(1, "Faturamento deve ser >= 1").optional().default(10000), // Faturamento estimado (>= 1, obrigatório para Banking/Celcoin)
      gmv: z.number().optional(), // Meta de faturamento anual
      // Endereço
      address: z.object({
        street: z.string().min(1),
        number: z.string().min(1),
        complement: z.string().optional().default(""),
        neighborhood: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(2).max(2),
        zipCode: z.string().min(8),
      }),
      // Representante legal
      representative: z.object({
        firstName: z.string().min(2, "Nome do representante é obrigatório"),
        lastName: z.string().min(2, "Sobrenome do representante é obrigatório"),
        document: z.string().min(11, "CPF do representante é obrigatório"),
        email: z.string().email("Email do representante inválido"),
        phone: z.string().min(10, "Telefone do representante é obrigatório"),
        birthDate: z.string().min(10, "Data de nascimento é obrigatória"), // YYYY-MM-DD
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { establishmentId, type, razaoSocial, nomeFantasia, document, cnae, email, phone, format, birthdate, revenue, gmv, address, representative } = input;
      await assertEstablishmentOwnership(ctx.user.id, establishmentId);

      const est = await db.getEstablishmentById(establishmentId);
      if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      // Verificar se já tem onboarding em andamento
      if (est.paytimeEstablishmentId && est.paytimeOnboardingStatus !== "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding já foi enviado. Aguarde a aprovação." });
      }

      try {
        // Helpers para formatar documentos no padrão Paytime (apenas dígitos)
        const formatCNPJ = (raw: string) => {
          const d = raw.replace(/\D/g, "");
          if (d.length < 14) throw new TRPCError({ code: "BAD_REQUEST", message: `CNPJ inválido: deve ter 14 dígitos (recebido: ${d.length})` });
          return d.slice(0, 14);
        };
        const formatCPF = (raw: string) => {
          const d = raw.replace(/\D/g, "");
          if (d.length < 11) throw new TRPCError({ code: "BAD_REQUEST", message: `CPF inválido: deve ter 11 dígitos (recebido: ${d.length})` });
          return d.slice(0, 11);
        };
        const formatPhone = (raw: string) => {
          const d = raw.replace(/\D/g, "");
          // Telefone deve ter 10-11 dígitos (DDD + 8-9 dígitos)
          // Não usar padStart com zeros pois a Paytime rejeita telefones inválidos
          if (d.length < 10) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Telefone inválido: deve ter pelo menos 10 dígitos (recebido: ${d.length})` });
          }
          return d.slice(0, 11);
        };
        const formatCNAE = (raw: string) => {
          const d = raw.replace(/\D/g, "");
          // CNAE deve ter exatamente 7 caracteres
          return d.padStart(7, "0").slice(0, 7);
        };

        // LOG DETALHADO para debug
        const finalPayload = {
          type: type || "BUSINESS",
          first_name: razaoSocial,
          last_name: nomeFantasia,
          document: formatCNPJ(document),
          // CNAE deve ter exatamente 7 dígitos - obrigatório para Banking/Celcoin
          cnae: formatCNAE(cnae) || "5611201", // Default: Restaurantes (Exceto Fast-Food)
          email,
          phone_number: formatPhone(phone),
          format: format || "LTDA",
          birthdate: birthdate || new Date().toISOString().split("T")[0],
          // CRÍTICO: revenue DEVE ser >= 1 para o Celcoin (Banking/Gateway 6) aceitar.
          // Se revenue for 0 ou falsy, o Celcoin rejeita com BNK006000.
          revenue: (revenue && revenue >= 1) ? revenue : 10000,
          gmv: gmv || 13000,
          address: {
            street: address.street,
            number: address.number,
            complement: address.complement || "N/A",
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zip_code: address.zipCode.replace(/\D/g, ""),
          },
          responsible: {
            first_name: `${representative.firstName} ${representative.lastName}`,
            document: formatCPF(representative.document),
            email: representative.email,
            phone: formatPhone(representative.phone),
            birthdate: representative.birthDate,
          },
        };
        console.log("[Paytime Router] PAYLOAD FINAL:", JSON.stringify(finalPayload, null, 2));
        console.log("[Paytime Router] INPUT RECEBIDO:", JSON.stringify({ type, document, phone, revenue, representative: { phone: representative.phone, document: representative.document, birthDate: representative.birthDate } }, null, 2));
        const paytimeEst = await createPaytimeEstablishment(finalPayload);

        // Salvar dados localmente
        await db.updateEstablishment(establishmentId, {
          paytimeEstablishmentId: String(paytimeEst.id),
          paytimeOnboardingStatus: "submitted",
          representativeName: representative.firstName,
          representativeLastName: representative.lastName,
          representativeCpf: representative.document,
          representativeEmail: representative.email,
          representativePhone: representative.phone,
          representativeBirthDate: representative.birthDate,
          cnae,
          razaoSocial,
          nomeFantasia,
        });

        logger.info("[Paytime] Onboarding submetido:", {
          establishmentId,
          paytimeEstablishmentId: paytimeEst.id,
          status: paytimeEst.status,
        });

        return {
          success: true,
          paytimeEstablishmentId: String(paytimeEst.id),
          status: paytimeEst.status,
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro no onboarding:", error?.message || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao cadastrar: ${error?.message || "Tente novamente."}`,
        });
      }
    }),

  /**
   * Verificar status do sub-estabelecimento na Paytime (consulta API).
   * Atualiza o status local se houver mudança.
   */
  refreshOnboardingStatus: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi submetido" });
      }

      try {
        const paytimeEst = await getPaytimeEstablishment(Number(est.paytimeEstablishmentId));
        
        // Mapear status da Paytime para status local
        let localStatus: "submitted" | "approved" | "rejected" = "submitted";
        const ptStatus = String(paytimeEst.status).toLowerCase();
        if (ptStatus === "active" || ptStatus === "approved" || ptStatus === "activated") {
          localStatus = "approved";
        } else if (ptStatus === "rejected" || ptStatus === "denied" || ptStatus === "inactive") {
          localStatus = "rejected";
        }

        // Atualizar localmente se mudou
        if (est.paytimeOnboardingStatus !== localStatus) {
          await db.updateEstablishment(input.establishmentId, {
            paytimeOnboardingStatus: localStatus,
          });
          logger.info("[Paytime] Status de onboarding atualizado:", {
            establishmentId: input.establishmentId,
            oldStatus: est.paytimeOnboardingStatus,
            newStatus: localStatus,
          });
        }

        return {
          status: localStatus,
          paytimeStatus: paytimeEst.status,
          paytimeEstablishmentId: est.paytimeEstablishmentId,
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao consultar status:", error?.message || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao consultar status. Tente novamente.",
        });
      }
    }),

  /**
   * Ativar gateway para o sub-estabelecimento na Paytime.
   * Só pode ser chamado após onboarding aprovado.
   */
  activateGateway: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      gatewayId: z.number().optional(), // Se não fornecido, usa o primeiro disponível
      planId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi submetido" });
      }
      if (est.paytimeOnboardingStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi aprovado" });
      }
      if (est.paytimeGatewayActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Gateway já está ativo" });
      }

      try {
        // Se não forneceu gatewayId, listar gateways disponíveis e usar o primeiro
        let gatewayId = input.gatewayId;
        if (!gatewayId) {
          const gateways = await listPaytimeGateways();
          if (!gateways || gateways.length === 0) {
            throw new Error("Nenhum gateway disponível no momento");
          }
          gatewayId = gateways[0].id;
        }

        await activatePaytimeGateway(
          Number(est.paytimeEstablishmentId),
          gatewayId,
          input.planId ? { planId: input.planId } : undefined
        );

        // Atualizar localmente
        await db.updateEstablishment(input.establishmentId, {
          paytimeGatewayActive: true,
        });

        logger.info("[Paytime] Gateway ativado:", {
          establishmentId: input.establishmentId,
          gatewayId,
        });

        return { success: true, gatewayId };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao ativar gateway:", error?.message || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao ativar gateway: ${error?.message || "Tente novamente."}`,
        });
      }
    }),

  /**
   * Etapa 1: Ativar Banking Paytime (Gateway 6)
   * Retorna a URL do KYC para o titular completar a validação de identidade.
   */
  activateBanking: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi submetido" });
      }
      if (est.paytimeOnboardingStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi aprovado" });
      }

      // Se já ativou banking no banco local, retornar URL KYC existente
      if (est.paytimeBankingActive && est.paytimeKycUrl) {
        return { success: true, kycUrl: est.paytimeKycUrl, alreadyActive: true };
      }

      // Helper: sincronizar estado local a partir dos gateways existentes na Paytime
      const syncExistingBanking = async () => {
        logger.info("[Paytime] Verificando gateways existentes do EC", est.paytimeEstablishmentId);
        const gateways = await listEstablishmentGateways(Number(est.paytimeEstablishmentId));
        const banking = gateways.find((g: any) => g.gateway_id === 6 || g.gateway?.id === 6);
        if (banking) {
          logger.info("[Paytime] Gateway 6 já existe:", JSON.stringify(banking).substring(0, 500));
          const kycUrl = banking?.metadata?.url_documents_copy || est.paytimeKycUrl || null;
          const status = banking?.status || "PENDING";
          await db.updateEstablishment(input.establishmentId, {
            paytimeBankingActive: true,
            paytimeGatewayActive: true,
            paytimeKycUrl: kycUrl || null,
            paytimeKycStatus: status === "APPROVED" ? "approved" : (kycUrl ? "waiting_kyc" : "not_started"),
            // Ativar pagamento online por padrão ao sincronizar banking
            paytimeEnabled: true,
            paytimeCardEnabled: true,
            onlinePaymentEnabled: true,
          });
          return { success: true, kycUrl, alreadyActive: true, status };
        }
        return null;
      };

      // Verificar se o Gateway 6 já existe na Paytime ANTES de tentar ativar
      try {
        const existing = await syncExistingBanking();
        if (existing) {
          logger.info("[Paytime] Gateway 6 já ativo na Paytime, sincronizado com banco local.");
          return existing;
        }
      } catch (checkErr: any) {
        logger.warn("[Paytime] Não foi possível verificar gateways existentes:", checkErr?.message);
        // Continua para tentar ativar normalmente
      }

      // Buscar tarifas bancárias disponíveis
      let feesBankingId: number | undefined;
      try {
        const feesBankings = await listPaytimeFeesBankings();
        logger.info("[Paytime] Tarifas bancárias retornadas:", JSON.stringify(feesBankings).substring(0, 500));
        if (feesBankings && feesBankings.length > 0) {
          // API retorna array com objetos que têm campo `id` (não `_id`)
          feesBankingId = feesBankings[0].id || feesBankings[0]._id;
          logger.info("[Paytime] Tarifa bancária selecionada — feesBankingId:", feesBankingId, "tipo:", typeof feesBankingId);
        } else {
          logger.warn("[Paytime] Nenhuma tarifa bancária encontrada! Array vazio.");
        }
      } catch (e: any) {
        logger.warn("[Paytime] Não foi possível listar tarifas bancárias:", e?.message);
      }

      // Montar statement_descriptor a partir do nome do estabelecimento (obrigatório quando form_receipt=PAYTIME)
      const statementDescriptor = (est.name || "Estabelecimento").substring(0, 22);

      // reference_id obrigatório segundo a documentação Paytime
      const referenceId = `banking-${est.paytimeEstablishmentId}`;

      logger.info("[Paytime] Ativando Gateway 6 com:", {
        paytimeEstablishmentId: est.paytimeEstablishmentId,
        feesBankingId,
        statementDescriptor,
        referenceId,
        formReceipt: "PAYTIME",
      });

      // Helper: obter link KYC do gateway via GET
      const fetchKycUrlFromGateway = async (): Promise<string | null> => {
        try {
          const gateways = await listEstablishmentGateways(Number(est.paytimeEstablishmentId));
          const banking = gateways.find((g: any) => g.gateway_id === 6 || g.gateway?.id === 6);
          return banking?.metadata?.url_documents_copy || null;
        } catch (err: any) {
          logger.warn("[Paytime] Erro ao buscar KYC URL via GET:", err?.message);
          return null;
        }
      };

      // Helper: aguardar um tempo
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Ativar Gateway 6 (Banking Paytime)
      // Conforme documentação Paytime:
      // 1ª chamada: cria o gateway
      // 2ª chamada: retorna metadata.url_documents_copy com link do KYC
      try {
        const activationOptions = {
          formReceipt: "PAYTIME",
          feesBankingId,
          statementDescriptor,
          referenceId,
        };

        // 1ª chamada: ativar o gateway
        const response = await activatePaytimeGateway(
          Number(est.paytimeEstablishmentId),
          6,
          activationOptions
        );

        let kycUrl = response?.metadata?.url_documents_copy || response?.url_documents_copy || null;
        logger.info("[Paytime] 1ª chamada Banking. KYC URL:", kycUrl);
        logger.info("[Paytime] Resposta 1ª chamada:", JSON.stringify(response).substring(0, 1000));

        // Se a 1ª chamada não retornou o link do KYC, fazer 2ª chamada
        // Conforme doc: "Após ativar o Gateway 6, faça uma nova requisição e a resposta conterá o link do KYC"
        if (!kycUrl) {
          logger.info("[Paytime] KYC URL não retornada na 1ª chamada. Aguardando 3s para 2ª chamada...");
          await sleep(3000);

          try {
            const response2 = await activatePaytimeGateway(
              Number(est.paytimeEstablishmentId),
              6,
              activationOptions
            );
            kycUrl = response2?.metadata?.url_documents_copy || response2?.url_documents_copy || null;
            logger.info("[Paytime] 2ª chamada Banking. KYC URL:", kycUrl);
          } catch (e2: any) {
            logger.warn("[Paytime] 2ª chamada falhou (esperado se gateway já existe):", e2?.message?.substring(0, 100));
            // Tentar obter via GET no gateway
            kycUrl = await fetchKycUrlFromGateway();
            logger.info("[Paytime] KYC URL via GET:", kycUrl);
          }
        }

        // Se ainda não tem KYC URL, esperar mais e tentar via GET (pode demorar a propagar)
        if (!kycUrl) {
          logger.info("[Paytime] KYC URL ainda não disponível. Aguardando 5s e tentando via GET...");
          await sleep(5000);
          kycUrl = await fetchKycUrlFromGateway();
          logger.info("[Paytime] KYC URL via GET (2ª tentativa):", kycUrl);
        }

        await db.updateEstablishment(input.establishmentId, {
          paytimeBankingActive: true,
          paytimeGatewayActive: true,
          paytimeKycUrl: kycUrl || null,
          paytimeKycStatus: kycUrl ? "waiting_kyc" : "pending",
          // Ativar pagamento online por padrão ao ativar banking
          paytimeEnabled: true,
          paytimeCardEnabled: true,
          onlinePaymentEnabled: true,
        });

        return { success: true, kycUrl, alreadyActive: false };
      } catch (e: any) {
        // Se já ativado (409, 500/BNK006000, ou mensagem de "already"/"já"), sincronizar estado
        const isAlreadyActive = e?.message?.includes("409") 
          || e?.message?.includes("already") 
          || e?.message?.includes("já")
          || e?.message?.includes("BNK006000")
          || e?.message?.includes("500");

        if (isAlreadyActive) {
          logger.info("[Paytime] Gateway 6 possivelmente já ativado (erro:", e?.message?.substring(0, 100), "), sincronizando...");
          try {
            const synced = await syncExistingBanking();
            if (synced) return synced;
          } catch (listErr: any) {
            logger.error("[Paytime] Erro ao sincronizar gateways:", listErr?.message);
          }
        }
        logger.error("[Paytime] Erro ao ativar Banking (Gateway 6):", e?.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao ativar Banking: ${e?.message}` });
      }
    }),

  /**
   * Verificar status do KYC do sub-estabelecimento.
   * Consulta os gateways do sub-estabelecimento para verificar se o Banking está aprovado.
   */
  checkKycStatus: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        return { status: "not_started" as const, kycUrl: null };
      }

      try {
        const gateways = await listEstablishmentGateways(Number(est.paytimeEstablishmentId));
        const banking = gateways.find((g: any) => g.gateway_id === 6 || g.gateway?.id === 6);

        if (!banking) {
          return { status: "not_started" as const, kycUrl: est.paytimeKycUrl };
        }

        // Verificar status do banking
        const bankingStatus = banking.status || banking.gateway_status;
        logger.info("[Paytime] Status do Banking:", { bankingStatus, banking: JSON.stringify(banking).substring(0, 500) });

        let kycStatus: "not_started" | "waiting_kyc" | "pending" | "approved" | "rejected" = "pending";
        const upperStatus = (bankingStatus || "").toUpperCase();
        if (upperStatus === "APPROVED" || upperStatus === "ACTIVE") {
          kycStatus = "approved";
        } else if (upperStatus === "REJECTED" || upperStatus === "DENIED" || upperStatus === "DENIED_KYC" || upperStatus === "REPROVED" || upperStatus === "BLOCKED" || upperStatus === "CANCELLED") {
          kycStatus = "rejected";
        } else if (upperStatus === "WAITING_KYC" || upperStatus === "WAITING_DOCUMENTS" || upperStatus === "DOCUMENTS_PENDING") {
          kycStatus = "waiting_kyc";
        } else if (upperStatus === "PENDING" || upperStatus === "WAITING" || upperStatus === "ANALYZING" || upperStatus === "IN_ANALYSIS" || upperStatus === "PROCESSING") {
          kycStatus = "pending";
        } else {
          // Status desconhecido — logar e tratar como pendente
          logger.warn("[Paytime] Status de Banking desconhecido:", { bankingStatus: upperStatus, establishmentId: input.establishmentId });
          kycStatus = "pending";
        }

        // Atualizar status no banco local
        if (est.paytimeKycStatus !== kycStatus) {
          await db.updateEstablishment(input.establishmentId, { paytimeKycStatus: kycStatus });
          
          // Enviar push notification quando KYC muda para aprovado ou rejeitado
          if (kycStatus === 'approved' || kycStatus === 'rejected') {
            try {
              const { sendPushNotification } = await import('../_core/webPush');
              const subscriptions = await db.getPushSubscriptionsByEstablishment(input.establishmentId);
              const payload = kycStatus === 'approved'
                ? { title: '\u2705 KYC Aprovado!', body: 'Sua verifica\u00e7\u00e3o de identidade foi aprovada. Agora voc\u00ea pode ativar o pagamento online!', icon: '/icon-192.png', url: '/banking' }
                : { title: '\u274c KYC Rejeitado', body: 'Sua verifica\u00e7\u00e3o de identidade foi negada. Acesse a p\u00e1gina Conta Digital para reenviar os documentos.', icon: '/icon-192.png', url: '/banking' };
              for (const sub of subscriptions) {
                try {
                  const success = await sendPushNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                  );
                  if (!success) {
                    await db.deletePushSubscriptionById(sub.id);
                  }
                } catch (pushErr) {
                  logger.error('[Paytime] Erro push KYC notification:', sub.id, pushErr);
                }
              }
              logger.info(`[Paytime] Push KYC ${kycStatus} enviado para ${subscriptions.length} dispositivos do EC ${input.establishmentId}`);
            } catch (pushError) {
              logger.error('[Paytime] Erro ao enviar push KYC:', pushError);
            }
          }
        }

        const kycUrl = banking?.metadata?.url_documents_copy || est.paytimeKycUrl;

        return { status: kycStatus, kycUrl, bankingStatus };
      } catch (e: any) {
        logger.error("[Paytime] Erro ao verificar KYC:", e?.message);
        return { status: est.paytimeKycStatus || "pending", kycUrl: est.paytimeKycUrl };
      }
    }),

  /**
   * Etapa 2: Ativar SubPaytime (Gateway 4) com planos comerciais.
   * Só pode ser executado após KYC aprovado.
   */
  activateSubPaytime: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      statementDescriptor: z.string().optional().default("MINDI"),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi submetido" });
      }

      // Se já ativou SubPaytime, retornar sucesso
      if (est.paytimeSubPaytimeActive) {
        return { success: true, alreadyActive: true };
      }

      // Planos definidos no portal Paytime
      const PAYTIME_PLAN_ONLINE_ID = 22152; // Plano - Venda Online
      const PAYTIME_PLAN_PRESENCIAL_ID = 22174; // Plano - Venda Presencial
      const plans: Array<{ id: number; active: boolean }> = [
        { id: PAYTIME_PLAN_ONLINE_ID, active: true },
        { id: PAYTIME_PLAN_PRESENCIAL_ID, active: true },
      ];
      logger.info("[Paytime] Usando planos (online + presencial):", plans);

      // Ativar Gateway 4 (SubPaytime) com plano fixo
      try {
        await activatePaytimeGateway(
          Number(est.paytimeEstablishmentId),
          4,
          {
            formReceipt: "PAYTIME",
            statementDescriptor: input.statementDescriptor.substring(0, 13),
            plans,
          }
        );

        await db.updateEstablishment(input.establishmentId, {
          paytimeSubPaytimeActive: true,
          // Ativar pagamento online por padrão ao ativar SubPaytime
          paytimeEnabled: true,
          paytimeCardEnabled: true,
          onlinePaymentEnabled: true,
        });

        return { success: true, alreadyActive: false, plansLinked: plans.length };
      } catch (e: any) {
        if (e?.message?.includes("409") || e?.message?.includes("already") || e?.message?.includes("já")) {
          await db.updateEstablishment(input.establishmentId, {
            paytimeSubPaytimeActive: true,
            paytimeEnabled: true,
            paytimeCardEnabled: true,
            onlinePaymentEnabled: true,
          });
          return { success: true, alreadyActive: true };
        }
        logger.error("[Paytime] Erro ao ativar SubPaytime (Gateway 4):", e?.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao ativar pagamento online: ${e?.message}` });
      }
    }),

  /**
   * Etapa 3: Ativar PIX/Cartão.
   * Fluxo final após Banking + KYC + SubPaytime.
   * Nota: Split removido — o markup do plano comercial já cuida da receita da Mindi.
   */
  completeSetup: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      enablePix: z.boolean().optional().default(true),
      enableCard: z.boolean().optional().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi submetido" });
      }
      if (est.paytimeOnboardingStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding ainda não foi aprovado" });
      }

      const results: string[] = [];

      // Ativar PIX e Cartão online + onlinePaymentEnabled
      const updates: Record<string, boolean> = {};
      if (input.enablePix) updates.paytimeEnabled = true;
      if (input.enableCard) updates.paytimeCardEnabled = true;
      // Sempre ativar onlinePaymentEnabled quando banking está ativo
      updates.onlinePaymentEnabled = true;
      if (Object.keys(updates).length > 0) {
        await db.updateEstablishment(input.establishmentId, updates);
        results.push(`PIX: ${input.enablePix ? "ativado" : "mantido"}, Cartão: ${input.enableCard ? "ativado" : "mantido"}, Pagamento Online: ativado`);
      }

      // Marcar split como configurado para manter compatibilidade com o frontend
      if (!est.paytimeSplitConfigured) {
        await db.updateEstablishment(input.establishmentId, {
          paytimeSplitConfigured: true,
          paytimeSplitRuleId: "not-needed",
        });
      }

      logger.info("[Paytime] Setup completo:", { establishmentId: input.establishmentId, results });

      return { success: true, results };
    }),

  /**
   * Listar planos comerciais disponíveis no marketplace Paytime.
   */
  listPlans: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      try {
        const plans = await listPaytimePlans();
        return { plans };
      } catch (e: any) {
        logger.error("[Paytime] Erro ao listar planos:", e?.message);
        return { plans: [] };
      }
    }),

  /**
   * Listar tarifas bancárias disponíveis.
   */
  listFeesBankings: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      try {
        const feesBankings = await listPaytimeFeesBankings();
        return { feesBankings };
      } catch (e: any) {
        logger.error("[Paytime] Erro ao listar tarifas bancárias:", e?.message);
        return { feesBankings: [] };
      }
    }),

  /**
   * Estornar uma transação Paytime.
   * Chamado manualmente pelo admin ou automaticamente ao cancelar pedido com pagamento online.
   */
  refundTransaction: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      useAccount: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Buscar o pedido
      const order = await db.getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
      
      // Verificar ownership
      await assertEstablishmentOwnership(ctx.user.id, order.establishmentId);
      
      // Buscar a transação Paytime vinculada ao pedido
      const ptTx = await db.getPaytimeTransactionByOrderId(input.orderId);
      if (!ptTx) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nenhuma transação encontrada para este pedido' });
      }
      
      // Só pode estornar transações que foram pagas/aprovadas
      if (!['PAID', 'APPROVED'].includes(ptTx.status)) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: `Transação não pode ser estornada. Status atual: ${ptTx.status}` 
        });
      }
      
      try {
        // Chamar API Paytime para estornar
        const refundResult = await refundPaytimeTransaction(
          ptTx.paytimeTransactionId,
          input.useAccount
        );
        
        // Atualizar status local para REFUNDED
        await db.updatePaytimeTransactionStatus(ptTx.paytimeTransactionId, 'REFUNDED');
        
        logger.info('[Paytime] Estorno realizado com sucesso:', {
          orderId: input.orderId,
          paytimeTransactionId: ptTx.paytimeTransactionId,
          refundStatus: refundResult.status,
        });
        
        return {
          success: true,
          refundStatus: refundResult.status,
          transactionId: ptTx.paytimeTransactionId,
        };
      } catch (error: any) {
        logger.error('[Paytime] Erro ao estornar transação:', {
          orderId: input.orderId,
          paytimeTransactionId: ptTx.paytimeTransactionId,
          error: error?.message,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao estornar: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Estornar transação diretamente pelo ID da transação Paytime.
   * Usado no modal de detalhes da transação no Banking.
   */
  refundByTransactionId: protectedProcedure
    .input(z.object({
      transactionId: z.string(),
      establishmentId: z.number(),
      useAccount: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

      try {
        const refundResult = await refundPaytimeTransaction(
          input.transactionId,
          input.useAccount
        );

        // Tentar atualizar status local se existir
        try {
          await db.updatePaytimeTransactionStatus(input.transactionId, 'REFUNDED');
        } catch {
          // Pode não existir no banco local, ok
        }

        logger.info('[Paytime] Estorno direto realizado com sucesso:', {
          transactionId: input.transactionId,
          refundStatus: refundResult.status,
        });

        return {
          success: true,
          refundStatus: refundResult.status,
          transactionId: input.transactionId,
        };
      } catch (error: any) {
        logger.error('[Paytime] Erro ao estornar transação direta:', {
          transactionId: input.transactionId,
          error: error?.message,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao estornar: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Listar gateways disponíveis na Paytime (para seleção manual).
   */
  listGateways: protectedProcedure
    .query(async () => {
      try {
        return await listPaytimeGateways();
      } catch (error: any) {
        logger.error("[Paytime] Erro ao listar gateways:", error?.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar gateways" });
      }
    }),

  // ======================================================================
  // Banking: Dashboard Combinado (Performance)
  // ======================================================================

  /**
   * Endpoint combinado que busca saldo + lançamentos futuros + transações recentes
   * em paralelo (Promise.all), reduzindo de 3 chamadas sequenciais para 1.
   * Usado pelo BankingHome para carregamento rápido.
   */
  getBankingDashboard: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      transactionsPerPage: z.number().optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }
      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      const paytimeId = String(est.paytimeEstablishmentId);

      try {
        // Executar todas as chamadas à API Paytime em paralelo.
        // Para KYC pending, leituras Banking usam headers do marketplace e filtram pelo sub-establishment.
        const paytimeScope = getBankingPaytimeScope(est);
        const [balanceResult, futureResult, txResult, gatewaysResult, detailsResult] = await Promise.allSettled([
          getEstablishmentBalance(paytimeId, paytimeScope),
          getFutureReleases(paytimeId, paytimeScope),
          getTransactions(paytimeId, { page: 1, perPage: input.transactionsPerPage }, paytimeScope),
          listEstablishmentGateways(Number(est.paytimeEstablishmentId)),
          getEstablishmentDetails(paytimeId),
        ]);

        // Extrair resultados (com fallback para erros individuais)
        const balance = balanceResult.status === 'fulfilled' ? balanceResult.value : null;
        const future = futureResult.status === 'fulfilled' ? futureResult.value : null;
        const transactions = txResult.status === 'fulfilled' ? txResult.value : null;
        const gatewaysRaw: any[] = gatewaysResult.status === 'fulfilled' ? (gatewaysResult.value as any[]) : [];
        const detailsRaw: any = detailsResult.status === 'fulfilled' ? detailsResult.value : null;

        // Log de erros individuais
        if (balanceResult.status === 'rejected') {
          logger.error('[Paytime] getBankingDashboard - balance failed:', balanceResult.reason?.message);
        }
        if (futureResult.status === 'rejected') {
          logger.error('[Paytime] getBankingDashboard - future failed:', futureResult.reason?.message);
        }
        if (txResult.status === 'rejected') {
          logger.error('[Paytime] getBankingDashboard - transactions failed:', txResult.reason?.message);
        }
        if (gatewaysResult.status === 'rejected') {
          logger.error('[Paytime] getBankingDashboard - gateways failed:', (gatewaysResult as PromiseRejectedResult).reason?.message);
        }
        if (detailsResult.status === 'rejected') {
          logger.error('[Paytime] getBankingDashboard - details failed:', (detailsResult as PromiseRejectedResult).reason?.message);
        }

        // Extrair dados da conta bancária dos detalhes do estabelecimento
        let bankAccount: { bank: string; bankCode: string; type: string; agency: string; account: string; accountDigit: string } | null = null;
        if (detailsRaw) {
          const gwList: any[] = detailsRaw.gateways || [];
          for (const gw of gwList) {
            if (gw.bank_account) {
              const ba = gw.bank_account;
              const bankName = ba.bank?.name || ba.bank || '';
              const bankCode = ba.bank?.code || ba.bank_code || '';
              const accType = (ba.type || '').toUpperCase();
              bankAccount = {
                bank: bankName,
                bankCode: bankCode,
                type: accType === 'CHECKING' ? 'Conta Corrente' : accType === 'SAVINGS' ? 'Conta Poupança' : (ba.type || ''),
                agency: ba.routing_number || ba.agency || '',
                account: ba.account_number || ba.account || '',
                accountDigit: ba.account_check_digit || ba.account_digit || '',
              };
              break;
            }
          }
        }

        return {
          balance: balance ? {
            balance: balance.balance,
            blockedBalance: balance.blocked_balance,
            totalBalance: balance.total_balance,
          } : null,
          futureReleases: future ? {
            calendar: future.calendar || [],
            thirtyDays: future.thirtyDays?.amount ?? 0,
            months: future.months || [],
            total: future.total?.amount ?? 0,
          } : null,
          transactions: transactions || { data: [], meta: { total: 0, per_page: input.transactionsPerPage, current_page: 1, last_page: 1 } },
          gateways: gatewaysRaw.map((gw: any) => ({
            id: gw.id,
            name: gw.gateway?.name || gw.name || '',
            type: gw.gateway?.type || '',
            modality: gw.gateway?.modality || '',
            status: gw.status || '',
            active: gw.active ?? false,
          })),
          // Planos do estabelecimento (para determinar modalidades realmente ativas)
          plans: (detailsRaw?.plans || []).map((p: any) => ({
            id: p.id,
            name: p.name || '',
            modality: p.modality || '',
            active: p.active ?? false,
            gatewayId: p.gateway_id,
            type: p.type || '',
          })),
          bankAccount,
        };
      } catch (error: any) {
        logger.error('[Paytime] getBankingDashboard failed:', {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao carregar dados bancários: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ======================================================================
  // Banking: Saldo do Estabelecimento
  // ======================================================================

  /**
   * Consulta o saldo do sub-estabelecimento na Paytime.
   * Retorna saldo disponível, bloqueado e total (em centavos).
   */
  getBalance: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }

      // Verificar se banking está ativo
      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      try {
        const paytimeScope = getBankingPaytimeScope(est);
        const balance = await getEstablishmentBalance(String(est.paytimeEstablishmentId), paytimeScope);
        return {
          balance: balance.balance,             // centavos
          blockedBalance: balance.blocked_balance, // centavos
          totalBalance: balance.total_balance,     // centavos
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao consultar saldo:", {
          establishmentId: input.establishmentId,
          paytimeId: est.paytimeEstablishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao consultar saldo: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ======================================================================
  // Banking: Lançamentos Futuros
  // ======================================================================

  /**
   * Consulta os lançamentos futuros do sub-estabelecimento na Paytime.
   * Retorna valores previstos por data, 30 dias, meses e total.
   */
  getFutureReleases: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }

      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      try {
        const paytimeScope = getBankingPaytimeScope(est);
        const data = await getFutureReleases(String(est.paytimeEstablishmentId), paytimeScope);
        return {
          calendar: data.calendar || [],
          thirtyDays: data.thirtyDays?.amount ?? 0,
          months: data.months || [],
          total: data.total?.amount ?? 0,
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao consultar lançamentos futuros:", {
          establishmentId: input.establishmentId,
          paytimeId: est.paytimeEstablishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao consultar lançamentos futuros: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Consulta detalhes completos do sub-estabelecimento na Paytime.
   * Retorna dados bancários, endereço, gateways, etc.
   */
  getEstablishmentDetails: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }

      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      try {
        const data = await getEstablishmentDetails(String(est.paytimeEstablishmentId));

        // Extrair dados da conta bancária dos gateways
        // A API retorna bank_account dentro do gateway PAYTIME (id: 4)
        let bankAccount = null;
        const gwList: any[] = data.gateways || [];
        for (const gw of gwList) {
          if (gw.bank_account) {
            const ba = gw.bank_account;
            const bankName = ba.bank?.name || ba.bank || '';
            const bankCode = ba.bank?.code || ba.bank_code || '';
            const accType = (ba.type || '').toUpperCase();
            bankAccount = {
              bank: bankName,
              bankCode: bankCode,
              type: accType === 'CHECKING' ? 'Conta Corrente' : accType === 'SAVINGS' ? 'Conta Poupança' : (ba.type || ''),
              agency: ba.routing_number || ba.agency || '',
              account: ba.account_number || ba.account || '',
              accountDigit: ba.account_check_digit || ba.account_digit || '',
            };
            break;
          }
        }

        return {
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          document: data.document || '',
          email: data.email || '',
          phone: data.phone_number || data.phone || '',
          status: data.status || '',
          type: data.type || '',
          bankAccount,
          addresses: (data.addresses || (data.address ? [data.address] : [])).map((addr: any) => ({
            street: addr.street || '',
            number: addr.number || '',
            complement: addr.complement || '',
            neighborhood: addr.neighborhood || addr.district || '',
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zip_code || addr.zipcode || '',
          })),
          gateways: gwList.map((gw: any) => ({
            id: gw.id,
            name: gw.name || '',
            status: gw.status || '',
          })),
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao consultar detalhes do estabelecimento:", {
          establishmentId: input.establishmentId,
          paytimeId: est.paytimeEstablishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao consultar detalhes: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Listar Transações ────────────────────────────────────
  getTransactions: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(15),
      search: z.string().optional(),
      statusFilter: z.string().optional(),
      typeFilter: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      }

      if (!est.paytimeEstablishmentId) {
        return emptyTransactionsResponse(input.page, input.perPage);
      }
      const paytimeScope = getBankingPaytimeScope(est);

      try {
        const filters: Record<string, unknown> = {};
        if (input.statusFilter) filters.status = input.statusFilter;
        if (input.typeFilter) filters.type = input.typeFilter;

        const result = await getTransactions(
          est.paytimeEstablishmentId,
          {
            page: input.page,
            perPage: input.perPage,
            search: input.search,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
          },
          paytimeScope
        );

        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao listar transações:", {
          establishmentId: input.establishmentId,
          paytimeId: est.paytimeEstablishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao listar transações: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ======================================================================
  // Banking: Área PIX - Transferências
  // ======================================================================

  /**
   * Lista transferências do estabelecimento (Banking).
   * Retorna todas as transferências (PIX, liquidações, TED, etc).
   */
  listPixTransfers: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(15),
      search: z.string().optional(),
      statusFilter: z.string().optional(),
      methodFilter: z.enum(['all', 'IN', 'OUT']).optional().default('all'),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }
      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      try {
        const filters: Record<string, unknown> = {};
        if (input.statusFilter) filters.status = input.statusFilter;

        const paytimeScope = getBankingPaytimeScope(est);
        const result = await listBankingTransfers(
          String(est.paytimeEstablishmentId),
          {
            page: input.page,
            perPage: input.perPage,
            search: input.search,
            filters,
          },
          paytimeScope
        );

        // Filtrar por método (IN = recebidas, OUT = enviadas, all = todas)
        const filteredData = input.methodFilter === 'all'
          ? result.data
          : result.data.filter((t: any) => t.method === input.methodFilter);

        return {
          ...result,
          data: filteredData,
          meta: {
            ...result.meta,
            total: filteredData.length,
          },
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao listar transferências PIX:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao listar transferências PIX: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Detalha uma transferência PIX específica.
   */
  getPixTransferDetail: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      transferId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }
      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      try {
        const detail = await getBankingTransferDetail(
          String(est.paytimeEstablishmentId),
          input.transferId
        );
        return detail;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao detalhar transferência PIX:", {
          establishmentId: input.establishmentId,
          transferId: input.transferId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao detalhar transferência: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Inicia um pagamento PIX (Banking).
   * Retorna dados do destinatário e init_id para confirmação.
   */
  initPixTransfer: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      type: z.enum(['HASH', 'CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']),
      key: z.string().optional(),
      hashCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }
      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      // Validar campos obrigatórios
      if (input.type === 'HASH' && !input.hashCode) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código copia e cola é obrigatório para tipo HASH" });
      }
      if (input.type !== 'HASH' && !input.key) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Chave PIX é obrigatória" });
      }

      try {
        const result = await initPixPayment(
          String(est.paytimeEstablishmentId),
          {
            type: input.type,
            key: input.key,
            hash_code: input.hashCode,
          }
        );

        logger.info("[Paytime] PIX init sucesso:", {
          establishmentId: input.establishmentId,
          type: input.type,
          initId: result.init_id || result.id,
        });

        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao iniciar pagamento PIX:", {
          establishmentId: input.establishmentId,
          type: input.type,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao iniciar PIX: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Confirma um pagamento PIX (Banking).
   * Executa a transferência com o valor informado.
   */
  confirmPixTransfer: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      type: z.enum(['HASH', 'CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']),
      key: z.string().optional(),
      hashCode: z.string().optional(),
      amount: z.number().min(1, "Valor mínimo é R$ 0,01"),
      initId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est || !est.paytimeEstablishmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não possui cadastro de pagamento ativo" });
      }
      if (!est.paytimeBankingActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Banking não está ativo para este estabelecimento" });
      }

      try {
        const result = await confirmPixPayment(
          String(est.paytimeEstablishmentId),
          {
            type: input.type,
            key: input.key,
            hash_code: input.hashCode,
            amount: input.amount,
            init_id: input.initId,
          }
        );

        logger.info("[Paytime] PIX confirm sucesso:", {
          establishmentId: input.establishmentId,
          type: input.type,
          amount: input.amount,
        });

        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao confirmar pagamento PIX:", {
          establishmentId: input.establishmentId,
          type: input.type,
          amount: input.amount,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao confirmar PIX: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Resumo de Transações (totais corretos) ────────────────
  getTransactionsSummary: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      search: z.string().optional(),
      statusFilter: z.string().optional(),
      typeFilter: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      }

      if (!est.paytimeEstablishmentId) {
        return { totalIn: 0, totalOut: 0, totalCount: 0, byModality: [], byChannel: [], byConversion: [] } as ReturnType<typeof getTransactionsSummary> extends Promise<infer R> ? R : never;
      }
      const paytimeScope = getBankingPaytimeScope(est);

      try {
        const filters: Record<string, unknown> = {};
        if (input.statusFilter) filters.status = input.statusFilter;
        if (input.typeFilter) filters.type = input.typeFilter;

        const summary = await getTransactionsSummary(
          est.paytimeEstablishmentId,
          {
            search: input.search,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
          },
          paytimeScope
        );

        return summary;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar resumo de transações:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar resumo: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Faturamento (Hoje / Mensal) ─────────────────────────────────────

  /**
   * Retorna faturamento bruto de hoje, ontem, mês atual e mês passado.
   * Usa a API de transações da Paytime e filtra por created_at no servidor.
   */
  getBillingStats: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      }
      if (!est.paytimeEstablishmentId) {
        return { today: 0, yesterday: 0, month: 0, lastMonth: 0 };
      }
      const paytimeScope = getBankingPaytimeScope(est);

      try {
        // Buscar todas as transações (perPage alto)
        const allTx = await getTransactions(est.paytimeEstablishmentId, {
          page: 1,
          perPage: 1000,
        }, paytimeScope);

        // Usar horário de Brasília (UTC-3) para comparações
        const BRT_OFFSET = -3 * 60 * 60 * 1000; // -3 horas em ms
        const nowUTC = Date.now();
        const nowBRT = new Date(nowUTC + BRT_OFFSET);
        
        // Calcular início do dia em BRT (convertido para UTC timestamp)
        const todayStartBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate()));
        const todayStart = new Date(todayStartBRT.getTime() - BRT_OFFSET); // Converte de volta para UTC
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        
        const monthStartBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), 1));
        const monthStart = new Date(monthStartBRT.getTime() - BRT_OFFSET);
        
        const lastMonthStartBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth() - 1, 1));
        const lastMonthStart = new Date(lastMonthStartBRT.getTime() - BRT_OFFSET);
        
        const lastMonthEndBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), 0, 23, 59, 59, 999));
        const lastMonthEnd = new Date(lastMonthEndBRT.getTime() - BRT_OFFSET);

        let today = 0;
        let yesterday = 0;
        let month = 0;
        let lastMonth = 0;

        const COMPLETED_STATUSES = ['PAID', 'COMPLETED', 'APPROVED', 'SETTLED', 'CAPTURED', 'CONFIRMED'];
        for (const t of allTx.data) {
          const status = (t.status || '').toUpperCase();
          if (!COMPLETED_STATUSES.includes(status)) continue;
          const amount = t.original_amount || 0;
          const d = new Date(t.created_at);

          // Hoje
          if (d >= todayStart) today += amount;
          // Ontem
          if (d >= yesterdayStart && d < todayStart) yesterday += amount;
          // Mês atual
          if (d >= monthStart) month += amount;
          // Mês passado
          if (d >= lastMonthStart && d <= lastMonthEnd) lastMonth += amount;
        }

        return { today, yesterday, month, lastMonth };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar faturamento:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar faturamento: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Liquidações / Repasses ─────────────────────────────────────────

  /**
   * Lista liquidações/repasses do estabelecimento.
   * Mostra quando e quanto dinheiro foi transferido para a conta.
   */
  getLiquidations: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(20),
        statusFilter: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est?.paytimeEstablishmentId) {
        return {
          meta: { total_amount: 0, total_transactions: 0, total_payments: 0 },
          total: 0,
          perPage: input.perPage,
          page: input.page,
          lastPage: 1,
          data: [],
        };
      }
      const paytimeScope = getBankingPaytimeScope(est);
      try {
        const filters: Record<string, unknown> = {};
        if (input.statusFilter) filters.status = input.statusFilter;
        const result = await listLiquidations(
          est.paytimeEstablishmentId,
          {
            page: input.page,
            perPage: input.perPage,
            search: input.search,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
            sorters: [{ column: "created_at", direction: "DESC" }],
          },
          paytimeScope
        );
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar liquidações:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar liquidações: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  /**
   * Buscar taxas e tarifas completas para um estabelecimento.
   * Retorna planos comerciais com taxas por bandeira + tarifas bancárias.
   */
  getTaxesAndFees: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est?.paytimeEstablishmentId) {
        return {
          plans: [],
          planDetails: [],
          feesBanking: [],
        };
      }

      try {
        // Buscar detalhes do sub-estabelecimento (inclui planos vinculados) e tarifas em paralelo
        const [estDetails, feesBankingResult] = await Promise.all([
          getEstablishmentDetails(est.paytimeEstablishmentId).catch((e) => {
            logger.error("[Paytime] Erro ao buscar detalhes do estabelecimento:", e?.message);
            return null;
          }),
          listFeesBanking(est.paytimeEstablishmentId).catch((e) => {
            logger.error("[Paytime] Erro ao buscar tarifas bancárias:", e?.message);
            return { data: [], total: 0, perPage: 50, page: 1, lastPage: 1 };
          }),
        ]);

        const feesBanking = feesBankingResult.data || [];

        // Usar os planos vinculados ao sub-estabelecimento (não todos do marketplace)
        const estPlans = (estDetails as any)?.plans || [];
        const activePlans = estPlans.filter((p: any) => p.active);

        // Buscar detalhes de cada plano ativo (com taxas por bandeira)
        const planDetails = await Promise.all(
          activePlans.map(async (plan: any) => {
            try {
              const detail = await getPlanDetail(plan.id, est.paytimeEstablishmentId!);
              return detail;
            } catch (e: any) {
              logger.error(`[Paytime] Erro ao buscar detalhe do plano ${plan.id}:`, e?.message);
              return { ...plan, flags: [] };
            }
          })
        );

        return {
          plans: activePlans,
          planDetails,
          feesBanking,
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar taxas e tarifas:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar taxas e tarifas: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Exibir Transação Individual ─────────────────────────────

  /**
   * Busca detalhes completos de uma transação específica pelo ID.
   * Usa GET /transactions/{id} da Paytime.
   */
  getTransactionDetail: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        transactionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est?.paytimeEstablishmentId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estabelecimento não possui banking ativo.",
        });
      }

      try {
        const transaction = await getTransaction(input.transactionId, est.paytimeEstablishmentId);
        return transaction;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar detalhes da transação:", {
          transactionId: input.transactionId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar detalhes da transação: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Simulação de Valores de Transação ─────────────────────────

  /**
   * Simula taxas e valores de uma transação antes de cobrar.
   * Útil para o restaurante saber quanto vai receber líquido.
   */
  simulateTransaction: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        amount: z.number().min(1), // centavos
        flagId: z.number().default(8), // 8 = BACEN (PIX)
        modality: z.string().default("ONLINE"),
        interest: z.enum(["CLIENT", "STORE"]).default("STORE"),
        gatewayId: z.number().optional(),
        antifraudType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est?.paytimeEstablishmentId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estabelecimento não possui banking ativo.",
        });
      }

      try {
        const result = await simulateTransaction(est.paytimeEstablishmentId, {
          amount: input.amount,
          flag_id: input.flagId,
          modality: input.modality,
          interest: input.interest,
          gateway_id: input.gatewayId,
          antifraud_type: input.antifraudType,
        });
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao simular transação:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao simular transação: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Extrato do Estabelecimento (Banking) ─────────────────────

  /**
   * Lista o extrato bancário do estabelecimento.
   * Mostra todas as movimentações da conta banking.
   */
  getExtract: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(20),
        search: z.string().optional(),
        typeFilter: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est?.paytimeEstablishmentId) {
        return {
          data: [],
          meta: { total: 0, per_page: input.perPage, current_page: input.page, last_page: 1 },
        };
      }

      try {
        const filters: Record<string, unknown> = {};
        if (input.typeFilter) filters.type = input.typeFilter;

        const result = await getEstablishmentExtract(est.paytimeEstablishmentId, {
          page: input.page,
          perPage: input.perPage,
          search: input.search,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          sorters: [{ column: "created_at", direction: "DESC" }],
        });
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar extrato:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar extrato: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),

  // ─── Pagamento de Boletos ─────────────────────────────────

  /**
   * Consultar dados de um boleto antes do pagamento.
   * Aceita linha digitável ou código de barras.
   */
  checkBillet: protectedProcedure
    .input(
      z.object({
        digitable: z.string().optional(),
        barcode: z.string().optional(),
      }).refine(data => data.digitable || data.barcode, {
        message: "Informe a linha digitável ou o código de barras do boleto",
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await checkBillet({
          digitable: input.digitable,
          barcode: input.barcode,
        });
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao consultar boleto:", error?.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Erro ao consultar boleto",
        });
      }
    }),

  /**
   * Realizar pagamento de um boleto.
   */
  payBillet: protectedProcedure
    .input(
      z.object({
        barcode: z.string().min(1, "Código de barras é obrigatório"),
        description: z.string().optional(),
        amount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await payBillet({
          barcode: input.barcode,
          description: input.description,
          amount: input.amount,
        });
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao pagar boleto:", error?.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Erro ao realizar pagamento do boleto",
        });
      }
    }),

  /**
   * Listar pagamentos de boletos realizados.
   */
  listBilletPayments: protectedProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(15),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await listBilletPayments({
          page: input.page,
          perPage: input.perPage,
          search: input.search,
          sorters: [{ column: "created_at", order: "DESC" }],
        });
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao listar pagamentos:", error?.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Erro ao listar pagamentos de boletos",
        });
      }
    }),

  // ─── Webhook Management ─────────────────────────────────

  /**
   * Lista os eventos de webhook registrados na Paytime.
   */
  listWebhookEvents: protectedProcedure
    .query(async () => {
      try {
        const result = await listPaytimeWebhookEvents();
        return result;
      } catch (error: any) {
        logger.error("[Paytime] Erro ao listar webhook events:", error?.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Erro ao listar eventos de webhook",
        });
      }
    }),

  /**
   * Registra os webhooks necessários na Paytime.
   * Configura automaticamente os eventos:
   * - updated-establishment-status (aprovação/rejeição de cadastro)
   * - updated-establishment-gateway (ativação de gateway)
   * - updated-sub-transaction (atualização de transações)
   * - new-sub-transaction (novas transações)
   */
  registerWebhooks: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.string().url().optional(),
      }).optional()
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Determinar a URL do webhook
        // Em produção, usar a URL do site; em dev, usar a URL fornecida
        const baseUrl = input?.webhookUrl || ctx.req.headers.origin || '';
        const webhookUrl = `${baseUrl}/api/paytime/webhook`;
        
        if (!webhookUrl || webhookUrl === '/api/paytime/webhook') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não foi possível determinar a URL do webhook. Forneça a URL manualmente.",
          });
        }

        // Primeiro, listar os eventos disponíveis para obter os IDs corretos
        const existingEvents = await listPaytimeWebhookEvents();
        
        // Mapear nomes de eventos para IDs
        const eventNameToId: Record<string, number> = {};
        for (const event of existingEvents.data) {
          eventNameToId[event.name] = event.id;
        }

        // Eventos que queremos registrar
        const desiredEvents = [
          'updated-establishment-status',
          'updated-establishment-gateway',
          'updated-sub-transaction',
          'new-sub-transaction',
        ];

        const eventsToRegister = desiredEvents
          .filter(name => eventNameToId[name])
          .map(name => ({
            event_id: eventNameToId[name],
            active: true,
            url: webhookUrl,
          }));

        if (eventsToRegister.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nenhum evento de webhook encontrado. Verifique a configuração da conta.",
          });
        }

        const result = await registerPaytimeWebhookEvents(eventsToRegister);

        logger.info(`[Paytime] Webhooks registrados com sucesso: ${eventsToRegister.length} eventos para ${webhookUrl}`);

        return {
          success: true,
          webhookUrl,
          registeredEvents: eventsToRegister.map(e => {
            const eventName = desiredEvents.find(name => eventNameToId[name] === e.event_id);
            return { eventId: e.event_id, name: eventName, active: e.active };
          }),
          availableEvents: existingEvents.data.map(e => ({ id: e.id, name: e.name, active: e.active, url: e.url })),
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        logger.error("[Paytime] Erro ao registrar webhooks:", error?.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Erro ao registrar webhooks",
        });
      }
    }),

  // ============ ONBOARDING DRAFT (Salvar e continuar depois) ============

  saveDraft: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      step: z.number().min(1).max(4),
      data: z.object({
        razaoSocial: z.string().optional(),
        nomeFantasia: z.string().optional(),
        document: z.string().optional(),
        cnae: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        cep: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        repFirstName: z.string().optional(),
        repLastName: z.string().optional(),
        repCpf: z.string().optional(),
        repEmail: z.string().optional(),
        repPhone: z.string().optional(),
        repBirthDate: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.upsertOnboardingDraft(input.establishmentId, input.step, input.data);
      return { success: true };
    }),

  getDraft: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const draft = await db.getOnboardingDraft(input.establishmentId);
      return draft;
    }),

  deleteDraft: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.deleteOnboardingDraft(input.establishmentId);
      return { success: true };
    }),

  /**
   * Progressão de vendas - dados para gráfico por hora/dia.
   * Retorna valor bruto e líquido agrupados por período, além de totais.
   */
  getSalesProgression: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      startDate: z.string(), // ISO date string YYYY-MM-DD
      endDate: z.string(),   // ISO date string YYYY-MM-DD
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est?.paytimeEstablishmentId) {
        return {
          chartData: [],
          totalSales: 0,
          grossAmount: 0,
          netAmount: 0,
          averageTicket: 0,
        };
      }
      const paytimeScope = getBankingPaytimeScope(est);

      try {
        // Buscar todas as transações
        const allTx = await getTransactions(est.paytimeEstablishmentId, {
          page: 1,
          perPage: 1000,
        }, paytimeScope);

        const BRT_OFFSET = -3 * 60 * 60 * 1000;
        const startUTC = new Date(input.startDate + "T00:00:00-03:00");
        const endUTC = new Date(input.endDate + "T23:59:59.999-03:00");

        // Determinar se agrupa por hora (mesmo dia) ou por dia
        const isSameDay = input.startDate === input.endDate;

        // Filtrar transações no período - apenas concluídas (excluir pendentes, canceladas, etc.)
        const COMPLETED_STATUSES = ['PAID', 'COMPLETED', 'APPROVED', 'SETTLED', 'CAPTURED', 'CONFIRMED'];
        const filteredTx = allTx.data.filter(t => {
          const status = (t.status || '').toUpperCase();
          if (!COMPLETED_STATUSES.includes(status)) return false;
          const d = new Date(t.created_at);
          return d >= startUTC && d <= endUTC;
        });

        // Calcular totais
        let grossAmount = 0;
        let netAmount = 0;
        for (const t of filteredTx) {
          grossAmount += t.original_amount || 0;
          netAmount += t.amount || 0;
        }
        const totalSales = filteredTx.length;
        const averageTicket = totalSales > 0 ? grossAmount / totalSales : 0;

        // Agrupar para o gráfico
        const buckets: Record<string, { gross: number; net: number }> = {};

        if (isSameDay) {
          // Agrupar por hora (0-23)
          for (let h = 0; h < 24; h++) {
            const label = `${String(h).padStart(2, '0')}:00`;
            buckets[label] = { gross: 0, net: 0 };
          }
          for (const t of filteredTx) {
            const d = new Date(new Date(t.created_at).getTime() + BRT_OFFSET);
            const hour = d.getUTCHours();
            const label = `${String(hour).padStart(2, '0')}:00`;
            buckets[label].gross += t.original_amount || 0;
            buckets[label].net += t.amount || 0;
          }
        } else {
          // Agrupar por dia
          const current = new Date(startUTC);
          while (current <= endUTC) {
            const brt = new Date(current.getTime() + BRT_OFFSET);
            const label = `${String(brt.getUTCDate()).padStart(2, '0')}/${String(brt.getUTCMonth() + 1).padStart(2, '0')}`;
            buckets[label] = { gross: 0, net: 0 };
            current.setDate(current.getDate() + 1);
          }
          for (const t of filteredTx) {
            const d = new Date(new Date(t.created_at).getTime() + BRT_OFFSET);
            const label = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
            if (buckets[label]) {
              buckets[label].gross += t.original_amount || 0;
              buckets[label].net += t.amount || 0;
            }
          }
        }

        const chartData = Object.entries(buckets).map(([label, vals]) => ({
          label,
          gross: Math.round(vals.gross) / 100,
          net: Math.round(vals.net) / 100,
        }));

        return {
          chartData,
          totalSales,
          grossAmount: Math.round(grossAmount * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          averageTicket: Math.round(averageTicket * 100) / 100,
        };
      } catch (error: any) {
        logger.error("[Paytime] Erro ao buscar progressão de vendas:", {
          establishmentId: input.establishmentId,
          error: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar progressão de vendas: ${error?.message || 'Erro desconhecido'}`,
        });
      }
    }),
});
