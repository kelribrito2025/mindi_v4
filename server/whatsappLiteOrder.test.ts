import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Testa o fluxo de criação de pedido via WhatsApp Lite.
 * 
 * Quando isWhatsappLite=true:
 * 1. O pedido deve ser criado no banco com status "completed"
 * 2. A verificação de loja aberta deve ser pulada
 * 3. O customerPhone pode ser vazio (no Lite, telefone é opcional)
 */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Mock do db para evitar dependência do banco real
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal() as Record<string, unknown>;
  return {
    ...original,
    getEstablishmentById: vi.fn().mockResolvedValue({
      id: 1,
      name: "Test Restaurant",
      planType: "lite",
      whatsapp: "5562999999999",
      isOpen: false, // Loja fechada - deve funcionar mesmo assim para Lite
      autoAcceptOrders: false,
      timezone: "America/Sao_Paulo",
    }),
    getEstablishmentOpenStatus: vi.fn().mockResolvedValue({
      isOpen: false, // Loja fechada
      reason: "outside_hours",
    }),
    createPublicOrder: vi.fn().mockResolvedValue({
      orderId: 123,
      orderNumber: "#P1",
    }),
    getProductById: vi.fn().mockResolvedValue({
      id: 1,
      name: "Hambúrguer",
      price: "25.00",
      status: "active",
      hasStock: false,
      isActive: true,
    }),
    getComplementGroupsByProduct: vi.fn().mockResolvedValue([]),
    incrementCouponUsage: vi.fn().mockResolvedValue(undefined),
    isScheduleAvailable: vi.fn().mockReturnValue(true),
    getCategoryById: vi.fn().mockResolvedValue({ id: 1, name: "Lanches", isActive: true }),
    createOrderLog: vi.fn(),
    getCashbackBalance: vi.fn().mockResolvedValue(null),
    getNeighborhoodFeesByEstablishment: vi.fn().mockResolvedValue([]),
  };
});

describe("publicMenu.createOrder com isWhatsappLite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve aceitar pedido com isWhatsappLite=true mesmo com loja fechada", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // O pedido deve ser criado com sucesso mesmo com loja fechada
    // porque isWhatsappLite=true pula a verificação de horário
    const result = await caller.publicMenu.createOrder({
      establishmentId: 1,
      customerName: "João",
      customerPhone: "", // Telefone vazio no Lite
      deliveryType: "pickup",
      paymentMethod: "cash",
      subtotal: "25.00",
      deliveryFee: "0.00",
      discount: "0.00",
      total: "25.00",
      isWhatsappLite: true,
      items: [
        {
          productId: 1,
          productName: "Hambúrguer",
          quantity: 1,
          unitPrice: "25.00",
          totalPrice: "25.00",
          complements: [],
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result?.orderNumber).toBeDefined();
  });

  it("deve rejeitar pedido sem isWhatsappLite quando loja está fechada", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Sem isWhatsappLite, loja fechada deve gerar erro
    await expect(
      caller.publicMenu.createOrder({
        establishmentId: 1,
        customerName: "João",
        customerPhone: "62999999999",
        deliveryType: "pickup",
        paymentMethod: "cash",
        subtotal: "25.00",
        deliveryFee: "0.00",
        discount: "0.00",
        total: "25.00",
        items: [
          {
            productId: 1,
            productName: "Hambúrguer",
            quantity: 1,
            unitPrice: "25.00",
            totalPrice: "25.00",
            complements: [],
          },
        ],
      })
    ).rejects.toThrow();
  });

  it("deve passar isWhatsappLite para createPublicOrder no db", async () => {
    const db = await import("./db");
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.publicMenu.createOrder({
      establishmentId: 1,
      customerName: "Maria",
      customerPhone: "",
      deliveryType: "delivery",
      paymentMethod: "pix",
      subtotal: "50.00",
      deliveryFee: "5.00",
      discount: "0.00",
      total: "55.00",
      isWhatsappLite: true,
      items: [
        {
          productId: 1,
          productName: "Hambúrguer",
          quantity: 2,
          unitPrice: "25.00",
          totalPrice: "50.00",
          complements: [],
        },
      ],
    });

    // Verificar que createPublicOrder foi chamado com a opção isWhatsappLite
    expect(db.createPublicOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        establishmentId: 1,
        customerName: "Maria",
        paymentMethod: "pix",
      }),
      expect.any(Array),
      expect.objectContaining({ isWhatsappLite: true })
    );
  });
});
