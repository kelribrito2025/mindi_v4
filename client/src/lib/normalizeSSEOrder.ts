/**
 * Normaliza um objeto de pedido recebido via SSE para ser compatível
 * com o shape retornado por orders.list (getAllOrdersByEstablishment).
 * 
 * O SSE pode enviar objetos parciais (createOrder/createPublicOrder)
 * ou completos (confirmOrderByNumber/moveScheduledOrderToQueue).
 * Esta função preenche campos faltantes com defaults seguros.
 */

interface SSEOrderRaw {
  id: number;
  orderNumber: string;
  establishmentId: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  deliveryType?: string;
  paymentMethod?: string;
  subtotal?: string | number;
  deliveryFee?: string | number;
  discount?: string | number;
  couponCode?: string | null;
  total?: string | number;
  notes?: string | null;
  changeAmount?: string | number | null;
  cancellationReason?: string | null;
  status?: string;
  source?: string;
  externalId?: string | null;
  externalDisplayId?: string | null;
  externalStatus?: string | null;
  externalData?: Record<string, unknown> | null;
  deliveryNotified?: boolean;
  isScheduled?: boolean;
  scheduledAt?: Date | string | null;
  movedToQueue?: boolean;
  movedToQueueAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  completedAt?: Date | string | null;
  acceptedAt?: Date | string | null;
  readyAt?: Date | string | null;
  customerLat?: string | null;
  customerLng?: string | null;
  items?: Array<{
    id?: number;
    orderId?: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string | number;
    totalPrice: string | number;
    complements?: unknown[];
    notes?: string | null;
    printerId?: number | null;
  }>;
}

export interface NormalizedOrder {
  id: number;
  orderNumber: string;
  establishmentId: number;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryType: string;
  paymentMethod: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  couponCode: string | null;
  total: string;
  notes: string | null;
  changeAmount: string | null;
  cancellationReason: string | null;
  status: string;
  source: string;
  externalId: string | null;
  externalDisplayId: string | null;
  externalStatus: string | null;
  externalData: Record<string, unknown> | null;
  deliveryNotified: boolean;
  isScheduled: boolean;
  scheduledAt: Date | string | null;
  movedToQueue: boolean;
  movedToQueueAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt: Date | string | null;
  acceptedAt: Date | string | null;
  readyAt: Date | string | null;
  customerLat: string | null;
  customerLng: string | null;
  items: Array<{
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: { name: string; price: number; quantity: number; }[] | null;
    notes: string | null;
    printerId: number | null;
    createdAt: Date | string;
  }>;
}

/**
 * Normaliza um pedido SSE para o shape completo esperado pelo cache do React Query.
 * Campos faltantes são preenchidos com defaults seguros.
 */
export function normalizeSSEOrder(raw: SSEOrderRaw): NormalizedOrder {
  const now = new Date();
  
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    establishmentId: raw.establishmentId,
    customerName: raw.customerName ?? null,
    customerPhone: raw.customerPhone ?? null,
    customerAddress: raw.customerAddress ?? null,
    deliveryType: raw.deliveryType ?? "delivery",
    paymentMethod: raw.paymentMethod ?? "cash",
    subtotal: String(raw.subtotal ?? "0"),
    deliveryFee: String(raw.deliveryFee ?? "0"),
    discount: String(raw.discount ?? "0"),
    couponCode: raw.couponCode ?? null,
    total: String(raw.total ?? "0"),
    notes: raw.notes ?? null,
    changeAmount: raw.changeAmount != null ? String(raw.changeAmount) : null,
    cancellationReason: raw.cancellationReason ?? null,
    status: raw.status ?? "new",
    source: raw.source ?? "internal",
    externalId: raw.externalId ?? null,
    externalDisplayId: raw.externalDisplayId ?? null,
    externalStatus: raw.externalStatus ?? null,
    externalData: raw.externalData ?? null,
    deliveryNotified: raw.deliveryNotified ?? false,
    isScheduled: raw.isScheduled ?? false,
    scheduledAt: raw.scheduledAt ?? null,
    movedToQueue: raw.movedToQueue ?? false,
    movedToQueueAt: raw.movedToQueueAt ?? null,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    completedAt: raw.completedAt ?? null,
    acceptedAt: raw.acceptedAt ?? null,
    readyAt: raw.readyAt ?? null,
    customerLat: raw.customerLat ?? null,
    customerLng: raw.customerLng ?? null,
    items: (raw.items ?? []).map((item, index) => ({
      id: item.id ?? -(index + 1), // ID negativo temporário para itens sem ID real
      orderId: item.orderId ?? raw.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.totalPrice),
      complements: (item.complements ?? null) as { name: string; price: number; quantity: number; }[] | null,
      notes: item.notes ?? null,
      printerId: item.printerId ?? null,
      createdAt: (item as any).createdAt ?? now,
    })),
  };
}

/**
 * Insere um pedido normalizado no array de pedidos existente,
 * garantindo deduplicação e ordenação por createdAt desc.
 */
export function insertOrderIntoList(
  existingOrders: NormalizedOrder[],
  newOrder: NormalizedOrder
): NormalizedOrder[] {
  // Deduplicação: verificar se já existe pelo id
  const exists = existingOrders.some(o => o.id === newOrder.id);
  if (exists) {
    // Se já existe, substituir pelo mais recente (pode ter dados mais completos)
    return existingOrders.map(o => o.id === newOrder.id ? newOrder : o);
  }
  
  // Inserir no topo (pedido mais recente) — mantém ordenação desc por createdAt
  return [newOrder, ...existingOrders];
}
