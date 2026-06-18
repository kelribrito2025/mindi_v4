import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// Helpers
// ============================================================

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const TEST_USER: AuthenticatedUser = {
  id: 1,
  openId: "test-owner",
  email: "owner@example.com",
  name: "Test Owner",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const OTHER_USER: AuthenticatedUser = {
  ...TEST_USER,
  id: 999,
  openId: "other-user",
  email: "other@example.com",
  name: "Other User",
};

function createCtx(user: AuthenticatedUser = TEST_USER): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ============================================================
// Mocks – we mock the db layer so tests run without a real DB
// ============================================================

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) return { id: 1, userId: 1, name: "Test Establishment" };
    if (id === 2) return { id: 2, userId: 999, name: "Other Establishment" };
    return null;
  }),

  getCustomerStats: vi.fn().mockResolvedValue({
    total: 42,
    new: 5,
    recurrent: 12,
    atRisk: 8,
    inactive: 3,
  }),

  listCustomersPaginated: vi.fn().mockResolvedValue({
    customers: [
      { id: 1, name: "Maria Silva", phone: "5511999990001", neighborhood: "Centro", totalOrders: 10, lastOrderDate: "2026-04-01" },
      { id: 2, name: "João Santos", phone: "5511999990002", neighborhood: null, totalOrders: 3, lastOrderDate: "2026-03-20" },
    ],
    total: 42,
    page: 1,
    perPage: 25,
    totalPages: 2,
  }),

  getCustomerProfile: vi.fn().mockImplementation(async (_estId: number, customerId: number) => {
    if (customerId === 1) {
      return {
        id: 1,
        name: "Maria Silva",
        phone: "5511999990001",
        street: "Rua das Flores",
        number: "123",
        complement: "Apto 4",
        neighborhood: "Centro",
        reference: "Próximo à padaria",
        notes: "Cliente VIP",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-04-01"),
        stats: {
          totalOrders: 10,
          avgTicket: 85.5,
          firstOrder: new Date("2026-01-20"),
          lastOrder: new Date("2026-04-01"),
          totalRevenue: 855.0,
        },
      };
    }
    return null;
  }),

  getCustomerOrderHistory: vi.fn().mockResolvedValue({
    orders: [
      { id: 100, orderNumber: "P100", status: "completed", total: "95.00", deliveryType: "delivery", paymentMethod: "pix", createdAt: new Date("2026-04-01"), source: "whatsapp" },
      { id: 99, orderNumber: "P99", status: "completed", total: "76.00", deliveryType: "pickup", paymentMethod: "cash", createdAt: new Date("2026-03-28"), source: "internal" },
    ],
    total: 10,
    page: 1,
    perPage: 10,
  }),

  updateCustomerProfile: vi.fn().mockResolvedValue({ success: true }),

  createNewCustomer: vi.fn().mockImplementation(async (_estId: number, data: any) => {
    if (data.phone === "5511999990001") {
      return { success: false, error: "Cliente com este telefone já existe", existingId: 1 };
    }
    return { success: true, id: 99 };
  }),

  // Other db functions that might be imported transitively
  getPdvCustomerByPhone: vi.fn(),
  searchPdvCustomersByName: vi.fn(),
  searchPdvCustomersByPhone: vi.fn(),
  upsertPdvCustomer: vi.fn(),
}));

// ============================================================
// Tests
// ============================================================

describe("pdvCustomer.stats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns customer statistics for the establishment", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.stats({
      establishmentId: 1,
      periodStart: "2026-04-01T00:00:00Z",
      periodEnd: "2026-04-13T23:59:59Z",
    });

    expect(result).toEqual({
      total: 42,
      new: 5,
      recurrent: 12,
      atRisk: 8,
      inactive: 3,
    });
  });

  it("rejects access for non-owner", async () => {
    const caller = appRouter.createCaller(createCtx(OTHER_USER));
    await expect(
      caller.pdvCustomer.stats({
        establishmentId: 1,
        periodStart: "2026-04-01T00:00:00Z",
        periodEnd: "2026-04-13T23:59:59Z",
      })
    ).rejects.toThrow(/Acesso negado/);
  });

  it("rejects access for non-existent establishment", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.pdvCustomer.stats({
        establishmentId: 9999,
        periodStart: "2026-04-01T00:00:00Z",
        periodEnd: "2026-04-13T23:59:59Z",
      })
    ).rejects.toThrow(/Acesso negado/);
  });
});

describe("pdvCustomer.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated customer list", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.list({
      establishmentId: 1,
      page: 1,
      perPage: 25,
    });

    expect(result.customers).toHaveLength(2);
    expect(result.total).toBe(42);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(2);
    expect(result.customers[0].name).toBe("Maria Silva");
  });

  it("passes search parameter to db function", async () => {
    const { listCustomersPaginated } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    await caller.pdvCustomer.list({
      establishmentId: 1,
      page: 1,
      perPage: 25,
      search: "Maria",
    });

    expect(listCustomersPaginated).toHaveBeenCalledWith(
      1, 1, 25, "Maria", undefined, undefined, undefined
    );
  });

  it("passes customerType filter to db function", async () => {
    const { listCustomersPaginated } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    await caller.pdvCustomer.list({
      establishmentId: 1,
      page: 1,
      perPage: 25,
      customerType: "recurrent",
    });

    expect(listCustomersPaginated).toHaveBeenCalledWith(
      1, 1, 25, undefined, "recurrent", undefined, undefined
    );
  });

  it("passes period dates to db function", async () => {
    const { listCustomersPaginated } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    await caller.pdvCustomer.list({
      establishmentId: 1,
      page: 1,
      perPage: 25,
      customerType: "new",
      periodStart: "2026-04-01T00:00:00Z",
      periodEnd: "2026-04-13T23:59:59Z",
    });

    expect(listCustomersPaginated).toHaveBeenCalledWith(
      1, 1, 25, undefined, "new",
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-13T23:59:59Z")
    );
  });

  it("rejects invalid customerType values", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.pdvCustomer.list({
        establishmentId: 1,
        customerType: "invalid" as any,
      })
    ).rejects.toThrow();
  });

  it("rejects access for non-owner", async () => {
    const caller = appRouter.createCaller(createCtx(OTHER_USER));
    await expect(
      caller.pdvCustomer.list({ establishmentId: 1 })
    ).rejects.toThrow(/Acesso negado/);
  });

  it("validates perPage max value", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.pdvCustomer.list({ establishmentId: 1, perPage: 200 })
    ).rejects.toThrow();
  });
});

describe("pdvCustomer.profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns full customer profile with stats", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.profile({
      establishmentId: 1,
      customerId: 1,
    });

    expect(result.name).toBe("Maria Silva");
    expect(result.phone).toBe("5511999990001");
    expect(result.neighborhood).toBe("Centro");
    expect(result.notes).toBe("Cliente VIP");
    expect(result.stats.totalOrders).toBe(10);
    expect(result.stats.avgTicket).toBe(85.5);
    expect(result.stats.totalRevenue).toBe(855.0);
  });

  it("throws NOT_FOUND for non-existent customer", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.pdvCustomer.profile({ establishmentId: 1, customerId: 9999 })
    ).rejects.toThrow(/não encontrado/);
  });

  it("rejects access for non-owner", async () => {
    const caller = appRouter.createCaller(createCtx(OTHER_USER));
    await expect(
      caller.pdvCustomer.profile({ establishmentId: 1, customerId: 1 })
    ).rejects.toThrow(/Acesso negado/);
  });
});

describe("pdvCustomer.orderHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated order history for a customer", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.orderHistory({
      establishmentId: 1,
      customerPhone: "5511999990001",
      page: 1,
      perPage: 10,
    });

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(10);
    expect(result.orders[0].orderNumber).toBe("P100");
    expect(result.orders[0].status).toBe("completed");
    expect(result.orders[0].total).toBe("95.00");
  });

  it("rejects access for non-owner", async () => {
    const caller = appRouter.createCaller(createCtx(OTHER_USER));
    await expect(
      caller.pdvCustomer.orderHistory({
        establishmentId: 1,
        customerPhone: "5511999990001",
      })
    ).rejects.toThrow(/Acesso negado/);
  });
});

describe("pdvCustomer.updateProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates customer profile successfully", async () => {
    const { updateCustomerProfile } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.updateProfile({
      establishmentId: 1,
      customerId: 1,
      name: "Maria Silva Atualizada",
      notes: "Nova anotação",
    });

    expect(result).toEqual({ success: true });
    expect(updateCustomerProfile).toHaveBeenCalledWith(1, 1, {
      name: "Maria Silva Atualizada",
      notes: "Nova anotação",
    });
  });

  it("updates only the provided fields", async () => {
    const { updateCustomerProfile } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    await caller.pdvCustomer.updateProfile({
      establishmentId: 1,
      customerId: 1,
      neighborhood: "Jardins",
    });

    expect(updateCustomerProfile).toHaveBeenCalledWith(1, 1, {
      neighborhood: "Jardins",
    });
  });

  it("rejects access for non-owner", async () => {
    const caller = appRouter.createCaller(createCtx(OTHER_USER));
    await expect(
      caller.pdvCustomer.updateProfile({
        establishmentId: 1,
        customerId: 1,
        name: "Hacker",
      })
    ).rejects.toThrow(/Acesso negado/);
  });
});

describe("pdvCustomer.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new customer successfully", async () => {
    const { createNewCustomer } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.create({
      establishmentId: 1,
      name: "Novo Cliente",
      phone: "5511888880001",
      neighborhood: "Vila Madalena",
      notes: "Primeira compra",
    });

    expect(result).toEqual({ success: true, id: 99 });
    expect(createNewCustomer).toHaveBeenCalledWith(1, {
      name: "Novo Cliente",
      phone: "5511888880001",
      neighborhood: "Vila Madalena",
      notes: "Primeira compra",
    });
  });

  it("returns error when phone already exists", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pdvCustomer.create({
      establishmentId: 1,
      name: "Duplicado",
      phone: "5511999990001",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("já existe");
    expect(result.existingId).toBe(1);
  });

  it("validates minimum phone length", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.pdvCustomer.create({
        establishmentId: 1,
        name: "Teste",
        phone: "123",
      })
    ).rejects.toThrow();
  });

  it("validates minimum name length", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.pdvCustomer.create({
        establishmentId: 1,
        name: "",
        phone: "5511888880001",
      })
    ).rejects.toThrow();
  });

  it("rejects access for non-owner", async () => {
    const caller = appRouter.createCaller(createCtx(OTHER_USER));
    await expect(
      caller.pdvCustomer.create({
        establishmentId: 1,
        name: "Hacker",
        phone: "5511888880001",
      })
    ).rejects.toThrow(/Acesso negado/);
  });
});
