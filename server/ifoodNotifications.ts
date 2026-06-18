/**
 * iFood Notifications Module (Phase 5)
 * 
 * Sends notifications when new disputes arrive via:
 * - Push notifications (Web Push)
 * - Telegram messages
 * - SSE real-time events
 * 
 * All notifications are fire-and-forget to not block the main flow.
 */

import { logger } from "./_core/logger";
import { sendEvent } from "./_core/sse";
import * as db from "./db";

// ─── Types ────────────────────────────────────────────────────────────

export interface DisputeNotificationData {
  disputeId: string;
  orderId: string;
  action: string;
  expiresAt: string;
  message?: string | null;
  handshakeType: string;
}

// ─── SSE Notification ─────────────────────────────────────────────────

/**
 * Send real-time SSE event for a new dispute to the establishment dashboard.
 */
export function notifyDisputeSSE(establishmentId: number, data: DisputeNotificationData): void {
  try {
    const timeRemaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
    
    sendEvent(establishmentId, "ifood_dispute", {
      type: "new_dispute",
      disputeId: data.disputeId,
              ifoodOrderId: data.orderId,
      
      action: data.action,
      handshakeType: data.handshakeType,
      message: data.message,
      expiresAt: data.expiresAt,
      timeRemainingSeconds: timeRemaining,
    });
    
    logger.info(`[iFood Notifications] SSE dispute event sent to establishment ${establishmentId}`);
  } catch (error) {
    logger.error("[iFood Notifications] Error sending SSE dispute event:", error);
  }
}

// ─── Push Notification ────────────────────────────────────────────────

/**
 * Send push notification for a new dispute to all subscribed devices.
 */
export async function notifyDisputePush(establishmentId: number, data: DisputeNotificationData): Promise<void> {
  try {
    const { sendPushNotification } = await import("./_core/webPush");
    const subscriptions = await db.getPushSubscriptionsByEstablishment(establishmentId);
    
    if (subscriptions.length === 0) {
      logger.info("[iFood Notifications] No push subscriptions for establishment " + establishmentId);
      return;
    }

    const timeRemaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
    const minutesRemaining = Math.ceil(timeRemaining / 60);

    const actionLabel = getActionLabel(data.action);
    const title = `⚠️ Disputa iFood — ${actionLabel}`;
    const body = data.message 
      ? `${data.message} (${minutesRemaining}min para responder)`
      : `Pedido ${data.orderId.substring(0, 8)}... — Responda em ${minutesRemaining} minutos`;

    logger.info(`[iFood Notifications] Sending push to ${subscriptions.length} devices for dispute ${data.disputeId}`);

    for (const sub of subscriptions) {
      try {
        const success = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          {
            title,
            body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-96x96.png",
            tag: `dispute-${data.disputeId}`,
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 300],
            data: {
              url: "/integracoes",
              disputeId: data.disputeId,
              ifoodOrderId: data.orderId,
              
            },
          }
        );

        if (!success) {
          // Invalid subscription, remove it
          await db.deletePushSubscriptionById(sub.id);
        }
      } catch (err) {
        logger.error(`[iFood Notifications] Push error for sub ${sub.id}:`, err);
      }
    }
  } catch (error) {
    logger.error("[iFood Notifications] Error sending push notifications:", error);
  }
}

// ─── Telegram Notification ────────────────────────────────────────────

/**
 * Send Telegram notification for a new dispute.
 */
export async function notifyDisputeTelegram(establishmentId: number, data: DisputeNotificationData): Promise<void> {
  try {
    const telegramConfig = await db.getTelegramConfig(establishmentId);
    
    if (!telegramConfig?.enabled || !telegramConfig?.chatId) {
      logger.info("[iFood Notifications] Telegram not configured for establishment " + establishmentId);
      return;
    }

    const { sendTelegramMessage } = await import("./telegramNotifier");

    const timeRemaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
    const minutesRemaining = Math.ceil(timeRemaining / 60);
    const actionLabel = getActionLabel(data.action);

    const text = 
      `⚠️ <b>Disputa iFood — ${actionLabel}</b>\n\n` +
      `📋 <b>Pedido:</b> ${data.orderId.substring(0, 8)}...\n` +
      `🔄 <b>Tipo:</b> ${data.handshakeType}\n` +
      (data.message ? `💬 <b>Mensagem:</b> ${data.message}\n` : "") +
      `⏰ <b>Tempo para responder:</b> ${minutesRemaining} minutos\n\n` +
      `<i>Acesse o painel para aceitar, rejeitar ou propor alternativa.</i>`;

    const result = await sendTelegramMessage(telegramConfig.chatId, text);
    
    if (result.ok) {
      logger.info(`[iFood Notifications] ✅ Telegram dispute notification sent for ${data.disputeId}`);
    } else {
      logger.error(`[iFood Notifications] ❌ Telegram error: ${result.error}`);
    }
  } catch (error) {
    logger.error("[iFood Notifications] Error sending Telegram notification:", error);
  }
}

// ─── Combined Notification ────────────────────────────────────────────

/**
 * Send all notification channels for a new dispute (fire-and-forget).
 * This is the main entry point called from processHandshakeDispute.
 */
export async function notifyNewDispute(establishmentId: number, data: DisputeNotificationData): Promise<void> {
  logger.info(`[iFood Notifications] Notifying establishment ${establishmentId} about dispute ${data.disputeId}`);

  // SSE is synchronous and immediate
  notifyDisputeSSE(establishmentId, data);

  // Push and Telegram are async fire-and-forget
  notifyDisputePush(establishmentId, data).catch((err) => {
    logger.error("[iFood Notifications] Push notification failed:", err);
  });

  notifyDisputeTelegram(establishmentId, data).catch((err) => {
    logger.error("[iFood Notifications] Telegram notification failed:", err);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getActionLabel(action: string): string {
  switch (action) {
    case "CANCELLATION_REQUESTED":
      return "Cancelamento Solicitado";
    case "CANCELLATION_REQUEST_DENIED":
      return "Cancelamento Negado";
    case "FULL_REFUND_REQUESTED":
      return "Reembolso Total Solicitado";
    case "PARTIAL_REFUND_REQUESTED":
      return "Reembolso Parcial Solicitado";
    default:
      return action;
  }
}
