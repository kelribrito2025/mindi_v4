import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the feedback system:
 * - submit: creates feedback and notifies owner
 * - myFeedbacks: lists feedbacks for current user
 * - listAll: lists all feedbacks (admin)
 * - updateStatus: updates feedback status (admin)
 * - stats: returns feedback statistics
 */

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as Record<string, unknown>;
  return {
    ...actual,
    createFeedback: vi.fn().mockResolvedValue(42),
    getFeedbacksByUser: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        establishmentId: 210007,
        type: "bug",
        subject: "Erro ao salvar",
        message: "O produto não salva corretamente",
        screenshotUrl: null,
        page: "/catalogo",
        status: "new",
        adminNotes: null,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
      },
    ]),
    getAllFeedbacks: vi.fn().mockResolvedValue([
      {
        feedback: {
          id: 1,
          userId: 1,
          establishmentId: 210007,
          type: "bug",
          subject: "Erro ao salvar",
          message: "O produto não salva corretamente",
          status: "new",
          createdAt: new Date("2026-03-01"),
          updatedAt: new Date("2026-03-01"),
        },
        userName: "Test User",
        userEmail: "test@example.com",
        establishmentName: "Tchê Restaurante",
      },
    ]),
    updateFeedbackStatus: vi.fn().mockResolvedValue(undefined),
    getFeedbackStats: vi.fn().mockResolvedValue({
      total: 5,
      new: 2,
      inProgress: 1,
      resolved: 2,
    }),
  };
});

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>) {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("feedback.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a feedback and return the id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.submit({
      type: "bug",
      subject: "Erro ao salvar produto",
      message: "Quando clico em salvar, nada acontece",
      establishmentId: 210007,
      page: "/catalogo",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(42);
  });

  it("should accept suggestion type", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.submit({
      type: "suggestion",
      subject: "Adicionar filtro por data",
      message: "Seria útil ter um filtro por data nos pedidos",
    });

    expect(result).toHaveProperty("id");
  });

  it("should accept imageUrls array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.submit({
      type: "bug",
      subject: "Erro visual",
      message: "Botão desalinhado na página",
      imageUrls: ["https://example.com/img1.webp", "https://example.com/img2.webp"],
    });

    expect(result).toHaveProperty("id");
  });

  it("should reject more than 7 images", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.feedback.submit({
        type: "bug",
        subject: "Muitas fotos",
        message: "Teste com mais de 7 fotos",
        imageUrls: Array(8).fill("https://example.com/img.webp"),
      })
    ).rejects.toThrow();
  });

  it("should reject empty subject", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.feedback.submit({
        type: "bug",
        subject: "",
        message: "Descrição do problema",
      })
    ).rejects.toThrow();
  });

  it("should reject empty message", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.feedback.submit({
        type: "bug",
        subject: "Assunto",
        message: "",
      })
    ).rejects.toThrow();
  });
});

describe("feedback.myFeedbacks", () => {
  it("should return feedbacks for the current user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.myFeedbacks();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("subject");
    expect(result[0]).toHaveProperty("type");
    expect(result[0]).toHaveProperty("status");
  });
});

describe("feedback.listAll", () => {
  it("should return all feedbacks with user and establishment info", async () => {
    const ctx = createAuthContext({ role: "admin" as any });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.listAll();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("feedback");
    expect(result[0]).toHaveProperty("userName");
    expect(result[0]).toHaveProperty("establishmentName");
  });
});

describe("feedback.updateStatus", () => {
  it("should update feedback status successfully", async () => {
    const ctx = createAuthContext({ role: "admin" as any });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.updateStatus({
      id: 1,
      status: "resolved",
      adminNotes: "Corrigido na versão 2.5",
    });

    expect(result).toEqual({ success: true });
  });

  it("should accept all valid status values", async () => {
    const ctx = createAuthContext({ role: "admin" as any });
    const caller = appRouter.createCaller(ctx);

    for (const status of ["new", "read", "in_progress", "resolved", "closed"] as const) {
      const result = await caller.feedback.updateStatus({ id: 1, status });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("feedback.stats", () => {
  it("should return feedback statistics", async () => {
    const ctx = createAuthContext({ role: "admin" as any });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("new");
    expect(result).toHaveProperty("inProgress");
    expect(result).toHaveProperty("resolved");
    expect(typeof result.total).toBe("number");
    expect(typeof result.new).toBe("number");
  });
});

describe("feedback router structure", () => {
  it("should have all expected procedures", () => {
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("feedback.submit");
    expect(procedures).toContain("feedback.myFeedbacks");
    expect(procedures).toContain("feedback.listAll");
    expect(procedures).toContain("feedback.updateStatus");
    expect(procedures).toContain("feedback.stats");
  });
});
