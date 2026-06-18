import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions used by onboardingChecklist
vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getCategoriesByEstablishment: vi.fn(),
  getProductsByEstablishment: vi.fn(),
  getBusinessHoursByEstablishment: vi.fn(),
  getWhatsappConfig: vi.fn(),
  getRecentOrders: vi.fn(),
  // Other db functions that may be referenced
  getDashboardStats: vi.fn(),
  getWeeklyStats: vi.fn(),
  updatePrepGoal: vi.fn(),
  getRevenueByHour: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const mockEstablishment = {
  id: 1,
  userId: 1,
  name: "Test Restaurant",
  logo: "https://example.com/logo.png",
  coverImage: "https://example.com/cover.png",
  menuSlug: "test-restaurant",
  pixKey: "test@pix.com",
};

describe("dashboard.onboardingChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishment as any);
    vi.mocked(db.getCategoriesByEstablishment).mockResolvedValue([{ id: 1, name: "Cat" }] as any);
    vi.mocked(db.getProductsByEstablishment).mockResolvedValue({ products: [{ id: 1 }], total: 1 } as any);
    vi.mocked(db.getWhatsappConfig).mockResolvedValue({ status: "connected" } as any);
    vi.mocked(db.getRecentOrders).mockResolvedValue([{ id: 1 }] as any);
  });

  it("has the onboardingChecklist procedure defined on dashboard router", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.dashboard.onboardingChecklist).toBe("function");
  });

  it("rejects when establishment not found or not owned by user", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(null as any);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.onboardingChecklist({ establishmentId: 999999 })).rejects.toThrow("Acesso negado");
  });

  it("returns correct structure with 8 steps", async () => {
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue([]);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    expect(result).toHaveProperty("steps");
    expect(result).toHaveProperty("completedCount");
    expect(result).toHaveProperty("totalSteps");
    expect(result).toHaveProperty("allCompleted");
    expect(result!.totalSteps).toBe(8);

    const stepIds = result!.steps.map((s: any) => s.id);
    expect(stepIds).toEqual([
      "category",
      "products",
      "business_hours",
      "photos",
      "pix_key",
      "whatsapp",
      "sound_notification",
      "test_order",
    ]);
  });

  it("marks business_hours as completed when 1 active day has valid hours", async () => {
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue([
      { id: 1, establishmentId: 1, dayOfWeek: 1, isActive: true, openTime: "08:00", closeTime: "18:00", createdAt: new Date(), updatedAt: new Date() },
    ] as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep).toBeDefined();
    expect(bhStep!.completed).toBe(true);
  });

  it("marks business_hours as completed when 4 active days have valid hours", async () => {
    const fourDays = [0, 4, 5, 6].map((day, index) => ({
      id: index + 1,
      establishmentId: 1,
      dayOfWeek: day,
      isActive: true,
      openTime: "18:00",
      closeTime: "23:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue(fourDays as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep!.completed).toBe(true);
  });

  it("marks business_hours as completed when 6 days have active hours", async () => {
    const sixDays = [1, 2, 3, 4, 5, 6].map((day) => ({
      id: day,
      establishmentId: 1,
      dayOfWeek: day,
      isActive: true,
      openTime: "08:00",
      closeTime: "18:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue(sixDays as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep!.completed).toBe(true);
  });

  it("marks business_hours as completed when all 7 days have active hours", async () => {
    const sevenDays = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: day + 1,
      establishmentId: 1,
      dayOfWeek: day,
      isActive: true,
      openTime: "08:00",
      closeTime: "23:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue(sevenDays as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep!.completed).toBe(true);
  });

  it("does NOT count inactive days towards business_hours completion", async () => {
    const inactiveDays = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: day + 1,
      establishmentId: 1,
      dayOfWeek: day,
      isActive: false,
      openTime: "08:00",
      closeTime: "18:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue(inactiveDays as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep!.completed).toBe(false);
  });

  it("does NOT count days without openTime/closeTime towards business_hours completion", async () => {
    const incompleteDays = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: day + 1,
      establishmentId: 1,
      dayOfWeek: day,
      isActive: true,
      openTime: day % 2 === 0 ? "08:00" : null,
      closeTime: day % 2 === 0 ? null : "18:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue(incompleteDays as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep!.completed).toBe(false);
  });

  it("whatsapp step redirects to /pedidos?connectWhatsapp=true", async () => {
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue([]);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const waStep = result!.steps.find((s: any) => s.id === "whatsapp");
    expect(waStep).toBeDefined();
    expect(waStep!.href).toBe("/pedidos?connectWhatsapp=true");
  });

  it("pix_key step redirects to configuracoes with scrollTo param", async () => {
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue([]);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const pixStep = result!.steps.find((s: any) => s.id === "pix_key");
    expect(pixStep).toBeDefined();
    expect(pixStep!.href).toContain("/configuracoes");
    expect(pixStep!.href).toContain("scrollTo=formas-pagamento");
  });

  it("business_hours step redirects to the atendimento section and business hours card", async () => {
    vi.mocked(db.getBusinessHoursByEstablishment).mockResolvedValue([]);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.onboardingChecklist({ establishmentId: 1 });

    const bhStep = result!.steps.find((s: any) => s.id === "business_hours");
    expect(bhStep).toBeDefined();
    expect(bhStep!.href).toContain("/configuracoes");
    expect(bhStep!.href).toContain("section=atendimento");
    expect(bhStep!.href).toContain("scrollTo=horarios-funcionamento");
  });
});
