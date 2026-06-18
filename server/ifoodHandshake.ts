/**
 * iFood Handshake Module (Phase 4)
 * Handles post-delivery disputes, cancellations, and refund negotiations.
 * Required for iFood homologation.
 */

import { ifoodApiCall } from "./ifoodInfra";
import { getAccessTokenForEstablishment } from "./ifood";
import { logger } from "./_core/logger";
import * as db from "./db";

const CATALOG_BASE = "https://merchant-api.ifood.com.br";

// ─── Types ───────────────────────────────────────────────────────────

export interface DisputeAlternative {
  id: string;
  description: string;
  type: string; // PROPOSED_AMOUNT_REFUND, PROPOSED_ADDITIONAL_TIME, etc.
  amount?: number;
  additionalTime?: number;
}

export interface DisputeMetadata {
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  evidences?: Array<{
    type: string; // PHOTO, TEXT
    url?: string;
    description?: string;
  }>;
  reasons?: Array<{
    code: string;
    description: string;
  }>;
  totalAmount?: number;
  refundAmount?: number;
}

export interface HandshakeDisputeEvent {
  id: string;
  disputeId: string;
  orderId: string;
  action: string; // CANCELLATION, PARTIAL_CANCELLATION, PROPOSED_AMOUNT_REFUND, PROPOSED_ADDITIONAL_TIME
  handshakeType: string; // FULL, PARTIAL
  message?: string;
  expiresAt: string;
  timeoutAction: string; // ACCEPT, REJECT
  alternatives?: DisputeAlternative[];
  metadata?: DisputeMetadata;
}

export interface HandshakeSettlementEvent {
  id: string;
  disputeId: string;
  orderId: string;
  status: string; // ACCEPTED, REJECTED, EXPIRED, ALTERNATIVE_REPLIED
  alternativeId?: string;
  metadata?: Record<string, any>;
}

// ─── Accept Cancellation Reasons ─────────────────────────────────────

export const ACCEPT_CANCELLATION_REASONS = [
  { code: "501", description: "Problemas internos do restaurante" },
  { code: "502", description: "Pedido em duplicidade" },
  { code: "503", description: "Cardápio desatualizado" },
  { code: "504", description: "Demora no preparo" },
  { code: "505", description: "Restaurante sem insumos" },
  { code: "506", description: "Pedido feito por engano" },
  { code: "507", description: "Área de entrega não atendida" },
  { code: "508", description: "Cliente solicitou o cancelamento" },
  { code: "509", description: "Outros" },
] as const;

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Accept a dispute (cancellation/refund)
 */
export async function acceptDispute(
  establishmentId: number,
  orderId: string,
  disputeId: string,
  reasonCode?: string
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const body: any = {};
  if (reasonCode) {
    body.reasonCode = reasonCode;
  }

  const response = await ifoodApiCall(
    `${CATALOG_BASE}/order/v1.0/orders/${orderId}/disputes/${disputeId}/accept`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[Handshake] Erro ao aceitar disputa ${disputeId}: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao aceitar disputa: ${response.status}`);
  }

  // Update local DB
  await db.updateIfoodDisputeStatus(disputeId, "ACCEPTED", new Date());
  logger.info(`[Handshake] Disputa ${disputeId} aceita com sucesso`);
}

/**
 * Reject a dispute
 */
export async function rejectDispute(
  establishmentId: number,
  orderId: string,
  disputeId: string
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${CATALOG_BASE}/order/v1.0/orders/${orderId}/disputes/${disputeId}/reject`,
    {
      method: "POST",
      token,
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[Handshake] Erro ao rejeitar disputa ${disputeId}: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao rejeitar disputa: ${response.status}`);
  }

  // Update local DB
  await db.updateIfoodDisputeStatus(disputeId, "REJECTED", new Date());
  logger.info(`[Handshake] Disputa ${disputeId} rejeitada com sucesso`);
}

/**
 * Send an alternative/counter-proposal for a dispute
 */
export async function sendAlternative(
  establishmentId: number,
  orderId: string,
  disputeId: string,
  alternativeId: string
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${CATALOG_BASE}/order/v1.0/orders/${orderId}/disputes/${disputeId}/alternative`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ alternativeId }),
      headers: { "Content-Type": "application/json" },
    },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[Handshake] Erro ao enviar alternativa para disputa ${disputeId}: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao enviar alternativa: ${response.status}`);
  }

  // Update local DB
  await db.updateIfoodDisputeStatus(disputeId, "ALTERNATIVE", new Date());
  logger.info(`[Handshake] Alternativa enviada para disputa ${disputeId}`);
}

// ─── Webhook Event Processing ────────────────────────────────────────

/**
 * Process a HANDSHAKE_DISPUTE event from the webhook
 */
export async function processHandshakeDispute(
  event: HandshakeDisputeEvent,
  establishmentId: number
): Promise<void> {
  logger.info(`[Handshake] Processando disputa: ${event.disputeId} - Ação: ${event.action} - Pedido: ${event.orderId}`);

  // Store dispute in database
  const dispute = await db.createIfoodDispute({
    disputeId: event.disputeId,
    orderId: event.orderId,
    establishmentId,
    action: event.action,
    handshakeType: event.handshakeType,
    message: event.message || null,
    expiresAt: new Date(event.expiresAt),
    timeoutAction: event.timeoutAction,
    status: "PENDING",
    alternativesJson: event.alternatives ? JSON.stringify(event.alternatives) : null,
    metadataJson: event.metadata ? JSON.stringify(event.metadata) : null,
  });

  if (dispute) {
    logger.info(`[Handshake] Disputa ${event.disputeId} armazenada com sucesso (ID: ${dispute.id})`);
  }

  // Send real-time notifications (SSE + Push + Telegram)
  try {
    const { notifyNewDispute } = await import('./ifoodNotifications');
    await notifyNewDispute(establishmentId, {
      disputeId: event.disputeId,
      orderId: event.orderId,
      action: event.action,
      expiresAt: event.expiresAt,
      message: event.message || null,
      handshakeType: event.handshakeType,
    });
  } catch (notifError) {
    logger.error('[Handshake] Erro ao enviar notificações de disputa:', notifError);
  }
}

/**
 * Process a HANDSHAKE_SETTLEMENT event from the webhook
 */
export async function processHandshakeSettlement(
  event: HandshakeSettlementEvent,
  establishmentId: number
): Promise<void> {
  logger.info(`[Handshake] Processando settlement: ${event.disputeId} - Status: ${event.status}`);

  // Map settlement status to dispute status
  let disputeStatus: "ACCEPTED" | "REJECTED" | "EXPIRED" | "ALTERNATIVE";
  switch (event.status) {
    case "ACCEPTED":
      disputeStatus = "ACCEPTED";
      break;
    case "REJECTED":
      disputeStatus = "REJECTED";
      break;
    case "EXPIRED":
      disputeStatus = "EXPIRED";
      break;
    case "ALTERNATIVE_REPLIED":
      disputeStatus = "ALTERNATIVE";
      break;
    default:
      disputeStatus = "ACCEPTED"; // fallback
  }

  // Update dispute status
  await db.updateIfoodDisputeStatus(event.disputeId, disputeStatus, new Date());

  // If accepted, update order status
  if (event.status === "ACCEPTED") {
    await db.updateOrderStatusByExternalId(event.orderId, "cancelled");
    await db.updateOrderExternalStatusByExternalId(event.orderId, "CANCELLED");
    logger.info(`[Handshake] Pedido ${event.orderId} cancelado após settlement aceito`);
  }

  // If expired, check timeoutAction
  if (event.status === "EXPIRED") {
    const dispute = await db.getIfoodDisputeByDisputeId(event.disputeId);
    if (dispute && dispute.timeoutAction === "ACCEPT") {
      await db.updateOrderStatusByExternalId(event.orderId, "cancelled");
      await db.updateOrderExternalStatusByExternalId(event.orderId, "CANCELLED");
      logger.info(`[Handshake] Pedido ${event.orderId} cancelado por timeout (timeoutAction=ACCEPT)`);
    }
  }

  logger.info(`[Handshake] Settlement processado para disputa ${event.disputeId}`);
}

/**
 * Get dispute details with parsed alternatives and metadata
 */
export function parseDisputeDetails(dispute: any) {
  return {
    ...dispute,
    alternatives: dispute.alternativesJson ? JSON.parse(dispute.alternativesJson) as DisputeAlternative[] : [],
    metadata: dispute.metadataJson ? JSON.parse(dispute.metadataJson) as DisputeMetadata : null,
  };
}
