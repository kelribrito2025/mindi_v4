import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
  getOrderById: vi.fn(),
  getOrderItems: vi.fn(),
  getAllOrdersByEstablishment: vi.fn(),
  getActiveOrdersByEstablishment: vi.fn(),
  updateOrderStatus: vi.fn(),
  searchProductsForOrder: vi.fn(),
  updateOrderItemQuantity: vi.fn(),
  recalculateOrderTotals: vi.fn(),
  deleteOrderItem: vi.fn(),
  addOrderItem: vi.fn(),
  updateOrderFulfillmentAndPayment: vi.fn(),
  updateOrderCustomer: vi.fn(),
  getProductById: vi.fn(),
  getComplementGroupsByProduct: vi.fn(),
  getComplementItemsByGroup: vi.fn(),
  getComboGroupsByProductId: vi.fn(),
  getActiveDriversByEstablishment: vi.fn(),
  getWhatsappConfig: vi.fn(),
  getDriverNotifyTiming: vi.fn(),
  getDeliveryByOrderId: vi.fn(),
  getDriverById: vi.fn(),
  createDelivery: vi.fn(),
  markDeliveryWhatsappSent: vi.fn(),
  markOrderDeliveryNotified: vi.fn(),
  getCashbackTransactionByOrderId: vi.fn(),
  getCashbackBalance: vi.fn(),
  invalidatePublicMenuCache: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const mockEstOwner = { id: 1, userId: 1, name: "Restaurante A" };
const mockOrder = { id: 10, establishmentId: 1, orderNumber: "001", customerPhone: null, deliveryType: "pickup", total: "50.00" };

describe("Orders IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // list
  it("list — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.list({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  it("list — permite do dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.getAllOrdersByEstablishment).mockResolvedValue([]);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.list({ establishmentId: 1 });
    expect(result).toEqual([]);
  });

  // getActive
  it("getActive — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.getActive({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  // get
  it("get — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.get({ id: 10 })).rejects.toThrow("Acesso negado");
  });

  it("get — NOT_FOUND para pedido inexistente", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(null as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.get({ id: 999 })).rejects.toThrow("Pedido não encontrado");
  });

  it("get — permite do dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.getOrderItems).mockResolvedValue([]);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.get({ id: 10 });
    expect(result).toHaveProperty("orderNumber", "001");
  });

  // updateStatus
  it("updateStatus — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.updateStatus({ id: 10, status: "preparing" })).rejects.toThrow("Acesso negado");
    expect(db.updateOrderStatus).not.toHaveBeenCalled();
  });

  // searchProducts
  it("searchProducts — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.searchProducts({ establishmentId: 1, search: "pizza" })).rejects.toThrow("Acesso negado");
  });

  // updateItemQuantity
  it("updateItemQuantity — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.updateItemQuantity({ itemId: 1, quantity: 2, orderId: 10 })).rejects.toThrow("Acesso negado");
    expect(db.updateOrderItemQuantity).not.toHaveBeenCalled();
  });

  // removeItem
  it("removeItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.removeItem({ itemId: 1, orderId: 10 })).rejects.toThrow("Acesso negado");
    expect(db.deleteOrderItem).not.toHaveBeenCalled();
  });

  // addItem
  it("addItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.addItem({ orderId: 10, productId: 1, quantity: 1 })).rejects.toThrow("Acesso negado");
    expect(db.addOrderItem).not.toHaveBeenCalled();
  });

  // updateOrderDetails
  it("updateOrderDetails — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.updateOrderDetails({
      orderId: 10,
      deliveryType: "delivery",
      paymentMethod: "cash",
      deliveryFee: 7.5,
      changeAmount: 100,
    })).rejects.toThrow("Acesso negado");
    expect(db.updateOrderFulfillmentAndPayment).not.toHaveBeenCalled();
  });

  it("updateOrderDetails — permite do dono e delega atualização", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.updateOrderFulfillmentAndPayment).mockResolvedValue({
      ...mockOrder,
      deliveryType: "delivery",
      paymentMethod: "cash",
      deliveryFee: "7.50",
      changeAmount: "100.00",
    } as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.updateOrderDetails({
      orderId: 10,
      deliveryType: "delivery",
      paymentMethod: "cash",
      deliveryFee: 7.5,
      changeAmount: 100,
    });

    expect(db.updateOrderFulfillmentAndPayment).toHaveBeenCalledWith(10, {
      deliveryType: "delivery",
      paymentMethod: "cash",
      deliveryFee: 7.5,
      changeAmount: 100,
    });
    expect(result.order).toHaveProperty("deliveryType", "delivery");
  });

  // updateOrderCustomer
  it("updateOrderCustomer — bloqueia de outro dono", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.updateOrderCustomer({
      orderId: 10,
      customerName: "Maria Silva",
      customerPhone: "11999998888",
    })).rejects.toThrow("Acesso negado");
    expect(db.updateOrderCustomer).not.toHaveBeenCalled();
  });

  it("updateOrderCustomer — permite do dono e delega atualização", async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.updateOrderCustomer).mockResolvedValue({
      ...mockOrder,
      customerName: "Maria Silva",
      customerPhone: "11999998888",
    } as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.updateOrderCustomer({
      orderId: 10,
      customerName: "Maria Silva",
      customerPhone: "11999998888",
    });

    expect(db.updateOrderCustomer).toHaveBeenCalledWith(10, {
      customerName: "Maria Silva",
      customerPhone: "11999998888",
    });
    expect(result.order).toHaveProperty("customerName", "Maria Silva");
  });

  // getProductComplements
  it("getProductComplements — bloqueia de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue({ id: 1, establishmentId: 1, isCombo: false } as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.getProductComplements({ productId: 1 })).rejects.toThrow("Acesso negado");
  });

  // markReadyAndAssign
  it("markReadyAndAssign — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({ id: 2, userId: 99, name: "Restaurante B" } as any);
    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.markReadyAndAssign({ orderId: 10 })).rejects.toThrow("Acesso negado");
  });
});
