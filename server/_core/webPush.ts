import webpush from 'web-push';
import { logger } from "./logger";

// Chaves VAPID carregadas de variáveis de ambiente
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  logger.warn('[WebPush] VAPID_PUBLIC_KEY e/ou VAPID_PRIVATE_KEY não configuradas. Push notifications desabilitadas.');
}

// Configurar web-push (só se as chaves estiverem disponíveis)
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@cardapio.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  data?: {
    url?: string;
    orderId?: number;
    orderNumber?: string;
    [key: string]: unknown;
  };
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Enviar notificação push para uma subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 horas
        urgency: 'high'
      }
    );

    logger.info('[WebPush] Notificação enviada com sucesso');
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    logger.error('[WebPush] Erro ao enviar notificação:', err.message);
    
    // Se o erro for 410 (Gone), a subscription não é mais válida
    if (err.statusCode === 410 || err.statusCode === 404) {
      logger.info('[WebPush] Subscription inválida, deve ser removida');
      return false;
    }
    
    throw error;
  }
}

/**
 * Enviar notificação de novo pedido
 */
export async function sendNewOrderNotification(
  subscription: PushSubscriptionData,
  orderData: {
    orderId: number;
    orderNumber: string;
    customerName: string;
    total: number;
  }
): Promise<boolean> {
  const payload: PushPayload = {
    title: '🔔 Novo Pedido!',
    body: `Pedido ${orderData.orderNumber} de ${orderData.customerName} - R$ ${orderData.total.toFixed(2).replace('.', ',')}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: `order-${orderData.orderId}`,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/pedidos',
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber
    },
    actions: [
      { action: 'open', title: 'Ver Pedido' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  return sendPushNotification(subscription, payload);
}

/**
 * Retorna a chave pública VAPID para o cliente
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export default {
  sendPushNotification,
  sendNewOrderNotification,
  getVapidPublicKey
};
