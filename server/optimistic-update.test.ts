import { describe, it, expect } from "vitest";

// Reimplementar as funções aqui para testar a lógica pura
// (o ficheiro original está em client/src/lib/ e usa paths relativos)

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

interface NormalizedOrder {
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
  items: Array<{
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: unknown[] | null;
    notes: string | null;
    printerId: number | null;
  }>;
}

function normalizeSSEOrder(raw: SSEOrderRaw): NormalizedOrder {
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
    items: (raw.items ?? []).map((item, index) => ({
      id: item.id ?? -(index + 1),
      orderId: item.orderId ?? raw.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.totalPrice),
      complements: item.complements ?? null,
      notes: item.notes ?? null,
      printerId: item.printerId ?? null,
    })),
  };
}

function insertOrderIntoList(
  existingOrders: NormalizedOrder[],
  newOrder: NormalizedOrder
): NormalizedOrder[] {
  const exists = existingOrders.some(o => o.id === newOrder.id);
  if (exists) {
    return existingOrders.map(o => o.id === newOrder.id ? newOrder : o);
  }
  return [newOrder, ...existingOrders];
}

// ========== TESTES ==========

describe("normalizeSSEOrder", () => {
  it("normaliza um pedido completo do PDV (campos parciais)", () => {
    const sseOrder: SSEOrderRaw = {
      id: 100,
      orderNumber: "PDV-001",
      establishmentId: 1,
      customerName: "João Silva",
      customerPhone: "11999999999",
      deliveryType: "pickup",
      paymentMethod: "pix",
      subtotal: "50.00",
      deliveryFee: "0",
      total: "50.00",
      status: "new",
      source: "internal",
      createdAt: "2026-03-03T12:00:00Z",
      items: [
        {
          productId: 10,
          productName: "X-Burger",
          quantity: 2,
          unitPrice: "25.00",
          totalPrice: "50.00",
        },
      ],
    };

    const result = normalizeSSEOrder(sseOrder);

    expect(result.id).toBe(100);
    expect(result.orderNumber).toBe("PDV-001");
    expect(result.customerName).toBe("João Silva");
    expect(result.deliveryType).toBe("pickup");
    expect(result.paymentMethod).toBe("pix");
    expect(result.subtotal).toBe("50.00");
    expect(result.total).toBe("50.00");
    expect(result.status).toBe("new");
    expect(result.source).toBe("internal");
    // Campos faltantes devem ter defaults
    expect(result.discount).toBe("0");
    expect(result.couponCode).toBeNull();
    expect(result.changeAmount).toBeNull();
    expect(result.cancellationReason).toBeNull();
    expect(result.externalId).toBeNull();
    expect(result.externalDisplayId).toBeNull();
    expect(result.externalStatus).toBeNull();
    expect(result.externalData).toBeNull();
    expect(result.deliveryNotified).toBe(false);
    expect(result.isScheduled).toBe(false);
    expect(result.scheduledAt).toBeNull();
    expect(result.movedToQueue).toBe(false);
    expect(result.movedToQueueAt).toBeNull();
    expect(result.completedAt).toBeNull();
    // Items
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe("X-Burger");
    expect(result.items[0].unitPrice).toBe("25.00");
    expect(result.items[0].id).toBe(-1); // ID temporário negativo
    expect(result.items[0].orderId).toBe(100);
    expect(result.items[0].printerId).toBeNull();
  });

  it("normaliza um pedido do menu público com changeAmount", () => {
    const sseOrder: SSEOrderRaw = {
      id: 200,
      orderNumber: "WEB-050",
      establishmentId: 1,
      customerName: "Maria Santos",
      customerPhone: "11888888888",
      customerAddress: "Rua das Flores, 123",
      deliveryType: "delivery",
      paymentMethod: "cash",
      subtotal: "80.00",
      deliveryFee: "8.00",
      discount: "5.00",
      couponCode: "DESC5",
      total: "83.00",
      notes: "Sem cebola",
      changeAmount: "100.00",
      status: "new",
      source: "internal",
      createdAt: "2026-03-03T12:00:00Z",
      items: [
        { id: 1, orderId: 200, productId: 20, productName: "Pizza", quantity: 1, unitPrice: "80.00", totalPrice: "80.00" },
      ],
    };

    const result = normalizeSSEOrder(sseOrder);

    expect(result.changeAmount).toBe("100.00");
    expect(result.discount).toBe("5.00");
    expect(result.couponCode).toBe("DESC5");
    expect(result.notes).toBe("Sem cebola");
    expect(result.customerAddress).toBe("Rua das Flores, 123");
    expect(result.items[0].id).toBe(1); // ID real do menu público
    expect(result.items[0].orderId).toBe(200);
  });

  it("normaliza um pedido mínimo (apenas campos obrigatórios)", () => {
    const sseOrder: SSEOrderRaw = {
      id: 300,
      orderNumber: "MIN-001",
      establishmentId: 5,
    };

    const result = normalizeSSEOrder(sseOrder);

    expect(result.id).toBe(300);
    expect(result.orderNumber).toBe("MIN-001");
    expect(result.establishmentId).toBe(5);
    expect(result.customerName).toBeNull();
    expect(result.customerPhone).toBeNull();
    expect(result.deliveryType).toBe("delivery"); // default
    expect(result.paymentMethod).toBe("cash"); // default
    expect(result.subtotal).toBe("0");
    expect(result.total).toBe("0");
    expect(result.status).toBe("new"); // default
    expect(result.source).toBe("internal"); // default
    expect(result.items).toHaveLength(0);
  });

  it("converte valores numéricos para string", () => {
    const sseOrder: SSEOrderRaw = {
      id: 400,
      orderNumber: "NUM-001",
      establishmentId: 1,
      subtotal: 50,
      deliveryFee: 8,
      discount: 5,
      total: 53,
      changeAmount: 100,
      items: [
        { productId: 1, productName: "Item", quantity: 1, unitPrice: 50, totalPrice: 50 },
      ],
    };

    const result = normalizeSSEOrder(sseOrder);

    expect(result.subtotal).toBe("50");
    expect(result.deliveryFee).toBe("8");
    expect(result.discount).toBe("5");
    expect(result.total).toBe("53");
    expect(result.changeAmount).toBe("100");
    expect(result.items[0].unitPrice).toBe("50");
    expect(result.items[0].totalPrice).toBe("50");
  });

  it("normaliza pedido completo do DB (confirmOrderByNumber) sem perder dados", () => {
    const fullOrder: SSEOrderRaw = {
      id: 500,
      orderNumber: "FULL-001",
      establishmentId: 1,
      customerName: "Ana",
      customerPhone: "11777777777",
      customerAddress: "Av. Brasil, 500",
      deliveryType: "delivery",
      paymentMethod: "credit_card",
      subtotal: "100.00",
      deliveryFee: "10.00",
      discount: "0",
      couponCode: null,
      total: "110.00",
      notes: null,
      changeAmount: null,
      cancellationReason: null,
      status: "new",
      source: "internal",
      externalId: null,
      externalDisplayId: null,
      externalStatus: null,
      externalData: null,
      deliveryNotified: false,
      isScheduled: false,
      scheduledAt: null,
      movedToQueue: false,
      movedToQueueAt: null,
      createdAt: "2026-03-03T12:00:00Z",
      updatedAt: "2026-03-03T12:00:00Z",
      completedAt: null,
      items: [
        { id: 1, orderId: 500, productId: 10, productName: "Burger", quantity: 2, unitPrice: "50.00", totalPrice: "100.00", complements: [{ name: "Queijo" }], notes: "Bem passado", printerId: 3 },
      ],
    };

    const result = normalizeSSEOrder(fullOrder);

    // Todos os campos devem ser preservados
    expect(result.externalId).toBeNull();
    expect(result.deliveryNotified).toBe(false);
    expect(result.isScheduled).toBe(false);
    expect(result.updatedAt).toBe("2026-03-03T12:00:00Z");
    expect(result.items[0].id).toBe(1);
    expect(result.items[0].complements).toEqual([{ name: "Queijo" }]);
    expect(result.items[0].notes).toBe("Bem passado");
    expect(result.items[0].printerId).toBe(3);
  });

  it("normaliza pedido iFood com dados externos", () => {
    const ifoodOrder: SSEOrderRaw = {
      id: 600,
      orderNumber: "IFOOD-123",
      establishmentId: 1,
      customerName: "Cliente iFood",
      status: "new",
      source: "ifood",
      externalId: "abc-123-def",
      externalDisplayId: "1234",
      externalStatus: "CONFIRMED",
      externalData: { merchantId: "xyz" },
    };

    const result = normalizeSSEOrder(ifoodOrder);

    expect(result.source).toBe("ifood");
    expect(result.externalId).toBe("abc-123-def");
    expect(result.externalDisplayId).toBe("1234");
    expect(result.externalStatus).toBe("CONFIRMED");
    expect(result.externalData).toEqual({ merchantId: "xyz" });
  });

  it("gera IDs temporários negativos para itens sem ID", () => {
    const sseOrder: SSEOrderRaw = {
      id: 700,
      orderNumber: "TEMP-001",
      establishmentId: 1,
      items: [
        { productId: 1, productName: "Item A", quantity: 1, unitPrice: "10", totalPrice: "10" },
        { productId: 2, productName: "Item B", quantity: 2, unitPrice: "20", totalPrice: "40" },
        { productId: 3, productName: "Item C", quantity: 1, unitPrice: "15", totalPrice: "15" },
      ],
    };

    const result = normalizeSSEOrder(sseOrder);

    expect(result.items[0].id).toBe(-1);
    expect(result.items[1].id).toBe(-2);
    expect(result.items[2].id).toBe(-3);
    // Todos os orderId devem ser o id do pedido
    expect(result.items[0].orderId).toBe(700);
    expect(result.items[1].orderId).toBe(700);
    expect(result.items[2].orderId).toBe(700);
  });
});

describe("insertOrderIntoList", () => {
  const makeOrder = (id: number, orderNumber: string): NormalizedOrder => ({
    id,
    orderNumber,
    establishmentId: 1,
    customerName: `Customer ${id}`,
    customerPhone: null,
    customerAddress: null,
    deliveryType: "delivery",
    paymentMethod: "cash",
    subtotal: "50.00",
    deliveryFee: "0",
    discount: "0",
    couponCode: null,
    total: "50.00",
    notes: null,
    changeAmount: null,
    cancellationReason: null,
    status: "new",
    source: "internal",
    externalId: null,
    externalDisplayId: null,
    externalStatus: null,
    externalData: null,
    deliveryNotified: false,
    isScheduled: false,
    scheduledAt: null,
    movedToQueue: false,
    movedToQueueAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    items: [],
  });

  it("insere novo pedido no topo da lista (ordenação desc)", () => {
    const existing = [makeOrder(2, "ORD-002"), makeOrder(1, "ORD-001")];
    const newOrder = makeOrder(3, "ORD-003");

    const result = insertOrderIntoList(existing, newOrder);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(3); // Novo no topo
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(1);
  });

  it("não duplica pedido com mesmo id", () => {
    const existing = [makeOrder(3, "ORD-003"), makeOrder(2, "ORD-002"), makeOrder(1, "ORD-001")];
    const duplicate = makeOrder(2, "ORD-002-UPDATED");

    const result = insertOrderIntoList(existing, duplicate);

    expect(result).toHaveLength(3); // Sem duplicação
    expect(result[1].orderNumber).toBe("ORD-002-UPDATED"); // Substituído
  });

  it("substitui pedido existente com dados mais recentes", () => {
    const existing = [makeOrder(2, "ORD-002"), makeOrder(1, "ORD-001")];
    const updated = { ...makeOrder(1, "ORD-001"), status: "preparing", customerName: "Updated Name" };

    const result = insertOrderIntoList(existing, updated);

    expect(result).toHaveLength(2);
    const order1 = result.find(o => o.id === 1);
    expect(order1?.status).toBe("preparing");
    expect(order1?.customerName).toBe("Updated Name");
  });

  it("insere em lista vazia", () => {
    const result = insertOrderIntoList([], makeOrder(1, "ORD-001"));

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("mantém a posição ao substituir (não move para o topo)", () => {
    const existing = [makeOrder(3, "ORD-003"), makeOrder(2, "ORD-002"), makeOrder(1, "ORD-001")];
    const updated = { ...makeOrder(2, "ORD-002"), status: "ready" };

    const result = insertOrderIntoList(existing, updated);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(2); // Mantém posição
    expect(result[1].status).toBe("ready"); // Dados atualizados
    expect(result[2].id).toBe(1);
  });

  it("lida com múltiplas inserções consecutivas sem duplicação", () => {
    let orders: NormalizedOrder[] = [];
    orders = insertOrderIntoList(orders, makeOrder(1, "ORD-001"));
    orders = insertOrderIntoList(orders, makeOrder(2, "ORD-002"));
    orders = insertOrderIntoList(orders, makeOrder(3, "ORD-003"));
    // Tentar inserir duplicata
    orders = insertOrderIntoList(orders, makeOrder(2, "ORD-002-DUP"));

    expect(orders).toHaveLength(3);
    expect(orders[0].id).toBe(3);
    expect(orders[1].id).toBe(2);
    expect(orders[1].orderNumber).toBe("ORD-002-DUP"); // Substituído
    expect(orders[2].id).toBe(1);
  });
});

describe("integração normalizeSSEOrder + insertOrderIntoList", () => {
  it("normaliza e insere pedido SSE parcial no cache existente", () => {
    const existingOrders: NormalizedOrder[] = [
      normalizeSSEOrder({ id: 2, orderNumber: "ORD-002", establishmentId: 1, status: "new" }),
      normalizeSSEOrder({ id: 1, orderNumber: "ORD-001", establishmentId: 1, status: "preparing" }),
    ];

    const sseNewOrder: SSEOrderRaw = {
      id: 3,
      orderNumber: "ORD-003",
      establishmentId: 1,
      customerName: "Novo Cliente",
      total: "99.90",
      status: "new",
      items: [
        { productId: 5, productName: "Açaí", quantity: 1, unitPrice: "99.90", totalPrice: "99.90" },
      ],
    };

    const normalized = normalizeSSEOrder(sseNewOrder);
    const result = insertOrderIntoList(existingOrders, normalized);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(3);
    expect(result[0].customerName).toBe("Novo Cliente");
    expect(result[0].total).toBe("99.90");
    expect(result[0].deliveryNotified).toBe(false); // Default preenchido
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].productName).toBe("Açaí");
  });

  it("refetch do DB substitui dados parciais sem duplicação", () => {
    // Simular: SSE insere parcial, depois refetch traz dados completos
    const ssePartial = normalizeSSEOrder({
      id: 10,
      orderNumber: "ORD-010",
      establishmentId: 1,
      customerName: "Cliente",
      total: "50.00",
      status: "new",
    });

    let orders: NormalizedOrder[] = [];
    orders = insertOrderIntoList(orders, ssePartial);
    expect(orders).toHaveLength(1);
    expect(orders[0].updatedAt).toBeDefined(); // Default

    // Simular refetch com dados completos do DB
    const dbComplete = normalizeSSEOrder({
      id: 10,
      orderNumber: "ORD-010",
      establishmentId: 1,
      customerName: "Cliente",
      total: "50.00",
      status: "new",
      updatedAt: "2026-03-03T12:05:00Z",
      deliveryNotified: false,
      isScheduled: false,
    });

    orders = insertOrderIntoList(orders, dbComplete);
    expect(orders).toHaveLength(1); // Sem duplicação
    expect(orders[0].updatedAt).toBe("2026-03-03T12:05:00Z"); // Dados do DB
  });
});
