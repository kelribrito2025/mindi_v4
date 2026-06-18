const IFOOD_DELIVERY_CONFIRMATION_URL = 'https://confirmacao-entrega-propria.ifood.com.br/';

export interface IfoodDeliveryConfirmationOrderLike {
  source?: string | null;
  deliveryType?: string | null;
  orderType?: string | null;
  orderNumber?: string | null;
  externalDisplayId?: string | null;
  externalData?: any;
}

export interface IfoodDeliveryConfirmationInfo {
  url: string;
  localizer: string | null;
  displayId: string | null;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getIfoodDeliveryLocalizer(externalData: any): string | null {
  return normalizeText(externalData?.customer?.phone?.localizer)
    || normalizeText(externalData?.phone?.localizer)
    || normalizeText(externalData?.delivery?.localizer)
    || null;
}

export function getIfoodDisplayId(order: IfoodDeliveryConfirmationOrderLike): string | null {
  return normalizeText(order.externalDisplayId)
    || normalizeText(order.externalData?.displayId)
    || normalizeText(order.externalData?.display_id)
    || normalizeText(order.orderNumber)
    || null;
}

export function getIfoodDeliveryConfirmationInfo(
  order: IfoodDeliveryConfirmationOrderLike,
): IfoodDeliveryConfirmationInfo | null {
  const isIfoodOrder = order.source === 'ifood' || !!order.externalData?.merchant?.id;
  if (!isIfoodOrder) return null;

  const orderType = normalizeText(order.externalData?.orderType) || normalizeText(order.orderType);
  const deliveryType = normalizeText(order.deliveryType);
  const isDelivery = orderType === 'DELIVERY' || deliveryType === 'delivery';
  if (!isDelivery) return null;

  return {
    url: IFOOD_DELIVERY_CONFIRMATION_URL,
    localizer: getIfoodDeliveryLocalizer(order.externalData),
    displayId: getIfoodDisplayId(order),
  };
}

export { IFOOD_DELIVERY_CONFIRMATION_URL };
