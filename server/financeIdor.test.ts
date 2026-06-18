import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
  getExpenseCategories: vi.fn(),
  createExpenseCategory: vi.fn(),
  getExpenseCategoryById: vi.fn(),
  updateExpenseCategory: vi.fn(),
  deleteExpenseCategory: vi.fn(),
  getExpenses: vi.fn(),
  createExpense: vi.fn(),
  getExpenseById: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getFinanceSummary: vi.fn(),
  getFinanceChart: vi.fn(),
  getExpensesByCategory: vi.fn(),
  getMonthlyGoal: vi.fn(),
  upsertMonthlyGoal: vi.fn(),
  listFinancialGoals: vi.fn(),
  createFinancialGoal: vi.fn(),
  updateFinancialGoal: vi.fn(),
  deleteFinancialGoal: vi.fn(),
  getWeeklyGoal: vi.fn(),
  upsertWeeklyGoal: vi.fn(),
  deleteWeeklyGoal: vi.fn(),
  deleteMonthlyGoal: vi.fn(),
  getDailyRevenue: vi.fn(),
  getUpcomingRecurringExpenses: vi.fn(),
  listRecurringExpenses: vi.fn(),
  createRecurringExpense: vi.fn(),
  updateRecurringExpense: vi.fn(),
  getRecurringExpenseHistory: vi.fn(),
  deleteRecurringExpense: vi.fn(),
  deactivateRecurringExpense: vi.fn(),
  processRecurringExpenses: vi.fn(),
  getMonthlyComparison: vi.fn(),
  getRevenueByChannel: vi.fn(),
  getRevenueByPaymentMethod: vi.fn(),
  getPaymentMethodDailyBreakdown: vi.fn(),
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
const mockCategory = { id: 10, establishmentId: 1, name: "Alimentação", color: "#ff0000" };
const mockExpense = { id: 20, establishmentId: 1, categoryId: 10, description: "Compra", amount: "50.00" };

describe("Finance IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== QUERIES COM establishmentId ==========
  describe("Queries com establishmentId — acesso negado para outro dono", () => {
    const queriesWithEstId = [
      { name: "listCategories", input: { establishmentId: 1 }, dbFn: "getExpenseCategories" },
      { name: "listExpenses", input: { establishmentId: 1 }, dbFn: "getExpenses" },
      { name: "summary", input: { establishmentId: 1 }, dbFn: "getFinanceSummary" },
      { name: "chart", input: { establishmentId: 1 }, dbFn: "getFinanceChart" },
      { name: "expensesByCategory", input: { establishmentId: 1 }, dbFn: "getExpensesByCategory" },
      { name: "getGoal", input: { establishmentId: 1, month: 4, year: 2026 }, dbFn: "getMonthlyGoal" },
      { name: "listGoals", input: { establishmentId: 1, month: 4, year: 2026 }, dbFn: "listFinancialGoals" },
      { name: "getWeeklyGoal", input: { establishmentId: 1 }, dbFn: "getWeeklyGoal" },
      { name: "listDailyRevenue", input: { establishmentId: 1 }, dbFn: "getDailyRevenue" },
      { name: "upcomingRecurring", input: { establishmentId: 1 }, dbFn: "getUpcomingRecurringExpenses" },
      { name: "listRecurring", input: { establishmentId: 1 }, dbFn: "listRecurringExpenses" },
      { name: "getMonthlyComparison", input: { establishmentId: 1 }, dbFn: "getMonthlyComparison" },
      { name: "revenueByChannel", input: { establishmentId: 1 }, dbFn: "getRevenueByChannel" },
      { name: "revenueByPaymentMethod", input: { establishmentId: 1 }, dbFn: "getRevenueByPaymentMethod" },
      { name: "paymentMethodDaily", input: { establishmentId: 1 }, dbFn: "getPaymentMethodDailyBreakdown" },
    ];

    for (const q of queriesWithEstId) {
      it(`finance.${q.name} — bloqueia acesso de outro dono`, async () => {
        vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

        const ctx = createAuthContext(99); // NÃO é dono
        const caller = appRouter.createCaller(ctx);

        await expect(
          (caller.finance as any)[q.name](q.input)
        ).rejects.toThrow("Acesso negado");

        expect((db as any)[q.dbFn]).not.toHaveBeenCalled();
      });
    }
  });

  describe("Queries com establishmentId — permite acesso do dono", () => {
    it("finance.listCategories — permite acesso do dono", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.getExpenseCategories).mockResolvedValue([mockCategory] as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.finance.listCategories({ establishmentId: 1 });

      expect(result).toEqual([mockCategory]);
    });

    it("finance.summary — permite acesso do dono", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.getFinanceSummary).mockResolvedValue({ revenue: 100, expenses: 50 } as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.finance.summary({ establishmentId: 1 });

      expect(result).toEqual({ revenue: 100, expenses: 50 });
    });
  });

  // ========== MUTATIONS COM establishmentId ==========
  describe("Mutations com establishmentId — acesso negado para outro dono", () => {
    const mutationsWithEstId = [
      { name: "createCategory", input: { establishmentId: 1, name: "Nova" }, dbFn: "createExpenseCategory" },
      { name: "createExpense", input: { establishmentId: 1, categoryId: 10, description: "X", amount: "10", paymentMethod: "cash" as const, date: "2026-04-01" }, dbFn: "createExpense" },
      { name: "setGoal", input: { establishmentId: 1, month: 4, year: 2026, targetProfit: "1000" }, dbFn: "upsertMonthlyGoal" },
      { name: "createGoalCustom", input: { establishmentId: 1, month: 4, year: 2026, name: "Meta", targetValue: "500" }, dbFn: "createFinancialGoal" },
      { name: "setWeeklyGoal", input: { establishmentId: 1, targetRevenue: "2000" }, dbFn: "upsertWeeklyGoal" },
      { name: "deleteWeeklyGoal", input: { establishmentId: 1 }, dbFn: "deleteWeeklyGoal" },
      { name: "deleteMonthlyGoal", input: { establishmentId: 1, month: 4, year: 2026 }, dbFn: "deleteMonthlyGoal" },
      { name: "processRecurring", input: { establishmentId: 1 }, dbFn: "processRecurringExpenses" },
    ];

    for (const m of mutationsWithEstId) {
      it(`finance.${m.name} — bloqueia acesso de outro dono`, async () => {
        vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

        const ctx = createAuthContext(99);
        const caller = appRouter.createCaller(ctx);

        await expect(
          (caller.finance as any)[m.name](m.input)
        ).rejects.toThrow("Acesso negado");

        expect((db as any)[m.dbFn]).not.toHaveBeenCalled();
      });
    }
  });

  // ========== MUTATIONS COM APENAS ID (busca por ID primeiro) ==========
  describe("updateCategory — verifica ownership via busca por ID", () => {
    it("permite atualizar categoria do próprio estabelecimento", async () => {
      vi.mocked(db.getExpenseCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.updateExpenseCategory).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.finance.updateCategory({ id: 10, name: "Atualizada" });

      expect(result).toEqual({ success: true });
      expect(db.getExpenseCategoryById).toHaveBeenCalledWith(10);
    });

    it("bloqueia atualização de categoria de outro estabelecimento", async () => {
      vi.mocked(db.getExpenseCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.updateCategory({ id: 10, name: "Hackeado" })
      ).rejects.toThrow("Acesso negado");

      expect(db.updateExpenseCategory).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para categoria inexistente", async () => {
      vi.mocked(db.getExpenseCategoryById).mockResolvedValue(null);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.updateCategory({ id: 999, name: "X" })
      ).rejects.toThrow("Categoria não encontrada");
    });
  });

  describe("deleteCategory — verifica ownership via busca por ID", () => {
    it("bloqueia exclusão de categoria de outro estabelecimento", async () => {
      vi.mocked(db.getExpenseCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.deleteCategory({ id: 10 })
      ).rejects.toThrow("Acesso negado");

      expect(db.deleteExpenseCategory).not.toHaveBeenCalled();
    });
  });

  describe("updateExpense — verifica ownership via busca por ID", () => {
    it("permite atualizar despesa do próprio estabelecimento", async () => {
      vi.mocked(db.getExpenseById).mockResolvedValue(mockExpense as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.updateExpense).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.finance.updateExpense({ id: 20, description: "Atualizada" });

      expect(result).toEqual({ success: true });
    });

    it("bloqueia atualização de despesa de outro estabelecimento", async () => {
      vi.mocked(db.getExpenseById).mockResolvedValue(mockExpense as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.updateExpense({ id: 20, description: "Hackeado" })
      ).rejects.toThrow("Acesso negado");

      expect(db.updateExpense).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para despesa inexistente", async () => {
      vi.mocked(db.getExpenseById).mockResolvedValue(null);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.updateExpense({ id: 999, description: "X" })
      ).rejects.toThrow("Despesa não encontrada");
    });
  });

  describe("deleteExpense — verifica ownership via busca por ID", () => {
    it("bloqueia exclusão de despesa de outro estabelecimento", async () => {
      vi.mocked(db.getExpenseById).mockResolvedValue(mockExpense as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.deleteExpense({ id: 20 })
      ).rejects.toThrow("Acesso negado");

      expect(db.deleteExpense).not.toHaveBeenCalled();
    });
  });

  describe("undoMarkAsPaid — verifica ownership via expense", () => {
    it("bloqueia desfazer pagamento de outro estabelecimento", async () => {
      vi.mocked(db.getExpenseById).mockResolvedValue(mockExpense as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.finance.undoMarkAsPaid({ expenseId: 20, action: "created", originalDate: null })
      ).rejects.toThrow("Acesso negado");

      expect(db.deleteExpense).not.toHaveBeenCalled();
    });
  });
});
