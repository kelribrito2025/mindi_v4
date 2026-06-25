import { logger } from './logger';
import {
  generateStatusMessage,
  sendTextMessage as uazapiSendText,
  sendButtonMessage as uazapiSendButtons,
  sendOrderStatusNotification as uazapiSendOrderNotification,
} from './uazapi';

import {
  sendTextMessage as officialSendText,
  sendButtonMessage as officialSendButtons,
  sendTemplateMessage,
  type OfficialConfig,
} from './whatsappOfficial';

// ─── types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';

export interface NotificationData {
  customerName: string;
  orderNumber: string;
  establishmentName: string;
  template?: string | null;
  deliveryType?: 'delivery' | 'pickup' | 'dine_in' | null;
  cancellationReason?: string | null;
  orderItems?: Array<{
    productName: string;
    quantity: number;
    unitPrice?: string;
    totalPrice?: string;
    complements?: Array<{ name: string; price: number }> | string | null;
    notes?: string | null;
  }> | null;
  orderTotal?: string | null;
  paymentMethod?: string | null;
  customerAddress?: string | null;
  timezone?: string;
  cashbackInfo?: { cashbackEarned: string; cashbackTotal: string } | null;
  schedulingInfo?: { isScheduled: boolean; scheduledDate: string; scheduledTime: string };
}

export interface WhatsAppProvider {
  sendText(phone: string, text: string): Promise<{ success: boolean; messageId?: string }>;
  sendButtons(
    phone: string,
    body: string,
    buttons: Array<{ text: string; id: string }>,
    footer?: string,
  ): Promise<{ success: boolean; messageId?: string }>;
  sendOrderNotification(
    phone: string,
    status: OrderStatus,
    data: NotificationData,
  ): Promise<{ success: boolean }>;
  isAvailable(): boolean;
}

// ─── null provider (fallback when nothing is configured) ──────────────────────

function nullProvider(): WhatsAppProvider {
  return {
    sendText: async () => ({ success: false }),
    sendButtons: async () => ({ success: false }),
    sendOrderNotification: async () => ({ success: false }),
    isAvailable: () => false,
  };
}

// ─── UAZAPI provider ──────────────────────────────────────────────────────────

function createUazapiProvider(instanceToken: string): WhatsAppProvider {
  return {
    isAvailable: () => true,

    sendText: (phone, text) => uazapiSendText(instanceToken, phone, text),

    sendButtons: (phone, body, buttons, footer) =>
      uazapiSendButtons(instanceToken, phone, body, buttons, footer),

    sendOrderNotification: (phone, status, data) =>
      uazapiSendOrderNotification(
        instanceToken,
        phone,
        status,
        {
          customerName: data.customerName,
          orderNumber: data.orderNumber,
          establishmentName: data.establishmentName,
          template: data.template,
          deliveryType: data.deliveryType,
          cancellationReason: data.cancellationReason,
          orderItems: data.orderItems?.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? '0',
            totalPrice: item.totalPrice ?? '0',
            complements: item.complements,
            notes: item.notes,
          })) ?? [],
          orderTotal: data.orderTotal,
          paymentMethod: data.paymentMethod,
          customerAddress: data.customerAddress,
          timezone: data.timezone,
          cashbackInfo: data.cashbackInfo,
          schedulingInfo: data.schedulingInfo,
        },
      ),
  };
}

// ─── Official API provider ────────────────────────────────────────────────────

// Mapeia status internos para nomes de template aprovados no Meta Business Manager

/**
 * Builds template components array matching the approved Meta templates.
 * Each template has different parameters.
 */
function buildTemplateComponents(status: OrderStatus, data: {
  customerName: string;
  orderNumber: string;
  establishmentName: string;
  cancellationReason?: string | null;
  orderItems?: Array<{ productName: string; quantity: number; unitPrice: string; totalPrice: string; complements?: string | null; notes?: string | null; }>;
  orderTotal?: string | null;
}): object[] {
  switch (status) {
    case 'new':
      // mindi_order_new: {{1}}=cliente, {{2}}=pedido, {{3}}=loja, {{4}}=itens, {{5}}=total
      const itemsText = (data.orderItems ?? [])
        .map(item => `${item.quantity}x ${item.productName}`)
        .join('\n') || 'Sem itens';
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.orderNumber },
          { type: 'text', text: data.establishmentName },
          { type: 'text', text: itemsText },
          { type: 'text', text: data.orderTotal ?? 'R$ 0,00' },
        ],
      }];
    case 'preparing':
      // mindi_order_preparing: {{1}}=pedido
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.orderNumber },
        ],
      }];
    case 'ready':
      // mindi_order_ready_delivery: {{1}}=cliente, {{2}}=pedido
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.orderNumber },
        ],
      }];
    case 'out_for_delivery':
      // mindi_order_out_for_delivery: {{1}}=cliente, {{2}}=pedido
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.orderNumber },
        ],
      }];
    case 'completed':
      // mindi_order_completed: {{1}}=pedido, {{2}}=loja
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.orderNumber },
          { type: 'text', text: data.establishmentName },
        ],
      }];
    case 'cancelled':
      // mindi_order_cancelled: {{1}}=cliente, {{2}}=pedido, {{3}}=motivo
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.orderNumber },
          { type: 'text', text: data.cancellationReason || 'Não informado' },
        ],
      }];
    default:
      return [{
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.orderNumber },
          { type: 'text', text: data.establishmentName },
        ],
      }];
  }
}

const STATUS_TO_TEMPLATE: Record<OrderStatus, string> = {
  new: 'mindi_order_new',
  preparing: 'mindi_order_preparing',
  ready: 'mindi_order_ready_delivery',
  out_for_delivery: 'mindi_order_out_for_delivery',
  completed: 'mindi_order_completed',
  cancelled: 'mindi_order_cancelled',
};

function createOfficialProvider(config: OfficialConfig): WhatsAppProvider {
  return {
    isAvailable: () => true,

    sendText: (phone, text) => officialSendText(config, phone, text),

    sendButtons: (phone, body, buttons) => officialSendButtons(config, phone, body, buttons),

    sendOrderNotification: async (phone, status, data) => {
      // Compose the full message text using the shared generator (same as UAZAPI path).
      // For the official API this becomes the template body parameter.
      const messageText = generateStatusMessage(
        status,
        data.orderNumber,
        data.customerName,
        data.establishmentName,
        data.template,
        data.deliveryType,
        data.cancellationReason,
        data.orderItems?.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? '0',
          totalPrice: item.totalPrice ?? '0',
          complements: item.complements,
          notes: item.notes,
        })) ?? [],
        data.orderTotal,
        data.timezone,
        data.paymentMethod,
        data.schedulingInfo,
        data.cashbackInfo,
        data.customerAddress,
      );

      // Try free-form text first (works within the 24h customer service window).
      // If it fails, fall back to a pre-approved template.
      const textResult = await officialSendText(config, phone, messageText);
      if (textResult.success) return { success: true };

      // Free-form failed — the window probably expired. Use template.
      const templateName = STATUS_TO_TEMPLATE[status];
      if (!templateName) {
        logger.warn('[WhatsApp] Nenhum template mapeado para status:', status);
        return { success: false };
      }

      // Template components: build parameters per approved Meta template
      const components = buildTemplateComponents(status, data);
      const tplResult = await sendTemplateMessage(config, phone, templateName, components);
      return { success: tplResult.success };
    },
  };
}

// ─── factory (the only export callers should use) ─────────────────────────────

/**
 * Retorna o provider de WhatsApp para o estabelecimento.
 * Usa a Cloud API oficial se configurada, caso contrário usa UAZAPI.
 */
export async function getWhatsAppProvider(establishmentId: number): Promise<WhatsAppProvider> {
  const { getWhatsappConfig } = await import('../db');
  const config = await getWhatsappConfig(establishmentId);

  if (!config || config.status !== 'connected') return nullProvider();

  if (
    config.provider === 'official'
    && config.phoneNumberId
    && config.accessToken
  ) {
    return createOfficialProvider({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
    });
  }

  if (config.instanceToken) {
    return createUazapiProvider(config.instanceToken);
  }

  return nullProvider();
}
