/**
 * Telegram Bot Notifier — Envia notificações de pedidos via Telegram Bot API
 *
 * Usa o token global do bot @Mindi_pedidos_bot (env TELEGRAM_BOT_TOKEN).
 * Cada estabelecimento configura apenas o chat_id (privado ou grupo).
 */

import { ENV } from "./_core/env";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface TelegramResponse {
  ok: boolean;
  description?: string;
  result?: any;
}

/**
 * Envia uma mensagem de texto via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "HTML" | "MarkdownV2" = "HTML"
): Promise<{ ok: boolean; error?: string }> {
  const token = ENV.telegramBotToken;
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN não configurado" };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error(`[Telegram] Erro ao enviar mensagem para chat ${chatId}:`, data.description);
      return { ok: false, error: data.description || "Erro desconhecido" };
    }

    return { ok: true };
  } catch (err: any) {
    console.error(`[Telegram] Exceção ao enviar mensagem:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Valida um chat_id enviando uma mensagem de teste
 */
export async function sendTelegramTestMessage(chatId: string): Promise<{ ok: boolean; error?: string }> {
  const text =
    `✅ <b>Teste de conexão — Mindi</b>\n\n` +
    `Seu Telegram foi conectado com sucesso!\n` +
    `A partir de agora, você receberá notificações de novos pedidos aqui.\n\n` +
    `<i>Chat ID: ${chatId}</i>`;

  return sendTelegramMessage(chatId, text);
}

/**
 * Formata a mensagem de notificação de um novo pedido (formato igual ao WhatsApp)
 */
export function formatOrderNotification(order: {
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: string;
  paymentMethod?: string;
  total: number | string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number | string;
    notes?: string;
    complements?: Array<{ name: string; price: number; quantity?: number }> | null;
  }>;
  address?: string;
  scheduledFor?: string;
  notes?: string;
  source?: string;
  deliveryFee?: number | string | null;
  changeAmount?: number | string | null;
}): string {
  const lines: string[] = [];

  // Header
  lines.push(`🔔 <b>NOVO PEDIDO #${escapeHtml(order.orderNumber)}</b>`);
  lines.push("");

  // Cliente
  if (order.customerName) {
    lines.push(`👤 <b>Cliente:</b> ${escapeHtml(order.customerName)}`);
  }
  if (order.customerPhone) {
    lines.push(`📱 <b>Telefone:</b> ${escapeHtml(order.customerPhone)}`);
  }

  // Tipo de entrega
  if (order.deliveryType) {
    const deliveryLabel = order.deliveryType === "delivery" ? "🛵 Delivery" :
      order.deliveryType === "pickup" ? "🏪 Retirada" :
      order.deliveryType === "dine_in" ? "🍽️ Mesa" : escapeHtml(order.deliveryType);
    lines.push(`📦 <b>Tipo:</b> ${deliveryLabel}`);
  }

  // Endereço (se delivery)
  if (order.address && order.deliveryType === "delivery") {
    lines.push(`📍 <b>Endereço:</b> ${escapeHtml(order.address)}`);
  }

  // Agendamento
  if (order.scheduledFor) {
    lines.push(`📅 <b>Agendado para:</b> ${escapeHtml(order.scheduledFor)}`);
  }

  lines.push("");
  lines.push("📦 <b>Itens do pedido:</b>");
  lines.push("");

  // Itens com complementos (formato WhatsApp)
  for (const item of order.items) {
    lines.push(`${item.quantity}x ${escapeHtml(item.name)}`);
    // Complementos abaixo do item com ↳
    if (item.complements && item.complements.length > 0) {
      for (const comp of item.complements) {
        lines.push(`  ↳ ${escapeHtml(comp.name)}`);
      }
    }
    // Observações do item
    if (item.notes) {
      lines.push(`  <i>📝 ${escapeHtml(item.notes)}</i>`);
    }
    lines.push("");
  }

  // Taxa de entrega (se delivery e valor > 0)
  const deliveryFeeValue = order.deliveryFee ? (typeof order.deliveryFee === "string" ? parseFloat(order.deliveryFee) : order.deliveryFee) : 0;
  if (order.deliveryType === "delivery" && deliveryFeeValue > 0) {
    lines.push(`🛵 <b>Taxa de entrega:</b> R$ ${deliveryFeeValue.toFixed(2).replace(".", ",")}`);
  }

  // Total
  const totalValue = typeof order.total === "string" ? parseFloat(order.total) : order.total;
  lines.push(`🧾 <b>Total:</b> R$ ${totalValue.toFixed(2).replace(".", ",")}`);

  // Pagamento
  if (order.paymentMethod) {
    const paymentLabel = getPaymentLabel(order.paymentMethod);
    lines.push(`💰 <b>Pagamento via:</b> ${paymentLabel}`);
  }

  // Troco
  if (order.paymentMethod === "cash") {
    const changeValue = order.changeAmount ? (typeof order.changeAmount === "string" ? parseFloat(order.changeAmount) : order.changeAmount) : 0;
    if (changeValue > 0) {
      lines.push(`💵 <b>Troco para:</b> R$ ${changeValue.toFixed(2).replace(".", ",")}`);
    } else {
      lines.push(`💵 Não precisa de troco`);
    }
  }

  // Observações gerais
  if (order.notes) {
    lines.push("");
    lines.push(`📝 <b>Obs:</b> ${escapeHtml(order.notes)}`);
  }

  // Fonte (se não for do cardápio público)
  if (order.source && order.source !== "internal") {
    lines.push("");
    lines.push(`📲 <i>Via ${escapeHtml(order.source)}</i>`);
  }

  return lines.join("\n");
}

/**
 * Envia notificação de novo pedido para o Telegram do estabelecimento
 */
export async function sendOrderNotificationTelegram(
  chatId: string,
  order: Parameters<typeof formatOrderNotification>[0]
): Promise<{ ok: boolean; error?: string }> {
  const text = formatOrderNotification(order);
  return sendTelegramMessage(chatId, text);
}

// ---- Helpers ----

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Dinheiro",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    pix: "PIX",
    pix_online: "PIX Online",
    card_online: "Cartão Online",
    meal_voucher: "Vale Refeição",
    food_voucher: "Vale Alimentação",
    boleto: "Boleto",
  };
  return labels[method] || escapeHtml(method);
}
