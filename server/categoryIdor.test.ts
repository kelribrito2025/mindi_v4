import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
  getCategoriesByEstablishment: vi.fn(),
  createCategory: vi.fn(),
  getCategoryById: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  duplicateCategory: vi.fn(),
  reorderCategories: vi.fn(),
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
const mockCategory = { id: 10, establishmentId: 1, name: "Lanches", description: null, sortOrder: 0 };

describe("Category IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== LIST ==========
  describe("list — verifica ownership via establishmentId", () => {
    it("permite listar categorias do próprio estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.getCategoriesByEstablishment).mockResolvedValue([mockCategory] as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.list({ establishmentId: 1 });

      expect(result).toEqual([mockCategory]);
    });

    it("bloqueia listagem de categorias de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.list({ establishmentId: 1 })
      ).rejects.toThrow("Acesso negado");

      expect(db.getCategoriesByEstablishment).not.toHaveBeenCalled();
    });
  });

  // ========== CREATE ==========
  describe("create — verifica ownership via establishmentId", () => {
    it("permite criar categoria no próprio estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.createCategory).mockResolvedValue(10 as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.create({ establishmentId: 1, name: "Bebidas" });

      expect(result).toEqual({ id: 10 });
    });

    it("bloqueia criação de categoria em outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.create({ establishmentId: 1, name: "Hackeado" })
      ).rejects.toThrow("Acesso negado");

      expect(db.createCategory).not.toHaveBeenCalled();
    });
  });

  // ========== UPDATE ==========
  describe("update — verifica ownership via busca por ID", () => {
    it("permite atualizar categoria do próprio estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.updateCategory).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.update({ id: 10, name: "Atualizada" });

      expect(result).toEqual({ success: true });
      expect(db.getCategoryById).toHaveBeenCalledWith(10);
    });

    it("bloqueia atualização de categoria de outro estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.update({ id: 10, name: "Hackeado" })
      ).rejects.toThrow("Acesso negado");

      expect(db.updateCategory).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para categoria inexistente", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.update({ id: 999, name: "X" })
      ).rejects.toThrow("Categoria não encontrada");
    });
  });

  // ========== DELETE ==========
  describe("delete — verifica ownership via busca por ID", () => {
    it("permite deletar categoria do próprio estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.deleteCategory).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.delete({ id: 10 });

      expect(result).toEqual({ success: true });
    });

    it("bloqueia exclusão de categoria de outro estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.delete({ id: 10 })
      ).rejects.toThrow("Acesso negado");

      expect(db.deleteCategory).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para categoria inexistente", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.delete({ id: 999 })
      ).rejects.toThrow("Categoria não encontrada");
    });
  });

  // ========== DUPLICATE ==========
  describe("duplicate — verifica ownership via busca por ID", () => {
    it("permite duplicar categoria do próprio estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.duplicateCategory).mockResolvedValue(11 as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.duplicate({ id: 10 });

      expect(result).toEqual({ id: 11 });
    });

    it("bloqueia duplicação de categoria de outro estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.duplicate({ id: 10 })
      ).rejects.toThrow("Acesso negado");

      expect(db.duplicateCategory).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para categoria inexistente", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.duplicate({ id: 999 })
      ).rejects.toThrow("Categoria não encontrada");
    });
  });

  // ========== REORDER ==========
  describe("reorder — verifica ownership via primeira categoria", () => {
    it("permite reordenar categorias do próprio estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
      vi.mocked(db.reorderCategories).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.reorder([
        { id: 10, sortOrder: 0 },
        { id: 11, sortOrder: 1 },
      ]);

      expect(result).toEqual({ success: true });
    });

    it("bloqueia reordenação de categorias de outro estabelecimento", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(mockCategory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.reorder([
          { id: 10, sortOrder: 0 },
          { id: 11, sortOrder: 1 },
        ])
      ).rejects.toThrow("Acesso negado");

      expect(db.reorderCategories).not.toHaveBeenCalled();
    });

    it("retorna sucesso para array vazio", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.reorder([]);

      expect(result).toEqual({ success: true });
      expect(db.getCategoryById).not.toHaveBeenCalled();
    });
  });
});
