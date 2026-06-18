import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// Helper to create a mock DB instance with chainable methods
function createMockDbInstance() {
  const mockResults: Record<string, any[]> = {};
  let queryCount = 0;

  const createSelectChain = () => {
    const chain: any = {
      from: () => chain,
      where: () => {
        queryCount++;
        const key = `query_${queryCount}`;
        return mockResults[key] ?? [];
      },
    };
    return chain;
  };

  const createInsertChain = () => ({
    values: () => [{ insertId: Math.floor(Math.random() * 10000) + 1000 }],
  });

  const createDeleteChain = () => ({
    where: () => Promise.resolve(),
  });

  const createUpdateChain = () => ({
    set: () => ({
      where: () => Promise.resolve(),
    }),
  });

  return {
    instance: {
      select: createSelectChain,
      insert: () => createInsertChain(),
      delete: () => createDeleteChain(),
      update: () => createUpdateChain(),
    },
    setQueryResults: (queryIndex: number, results: any[]) => {
      mockResults[`query_${queryIndex}`] = results;
    },
    resetQueryCount: () => { queryCount = 0; },
  };
}

describe("catalogVersion router", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("stats", () => {
    it("should return version stats for an establishment owned by the user", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const mockDb = createMockDbInstance();
      // Query 1: draft categories count
      mockDb.setQueryResults(1, [{ count: 5 }]);
      // Query 2: draft products count
      mockDb.setQueryResults(2, [{ count: 10 }]);
      // Query 3: published categories count
      mockDb.setQueryResults(3, [{ count: 5 }]);
      // Query 4: published products count
      mockDb.setQueryResults(4, [{ count: 10 }]);
      // Query 5: draft products details
      mockDb.setQueryResults(5, [
        { name: "Prod A", price: "10.00", status: "active", categoryId: 1, updatedAt: new Date() },
      ]);
      // Query 6: published products details
      mockDb.setQueryResults(6, [
        { name: "Prod A", price: "10.00", status: "active", categoryId: 1, updatedAt: new Date() },
      ]);

      vi.spyOn(db, "getDb").mockResolvedValue(mockDb.instance as any);

      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.catalogVersion.stats({ establishmentId: 100 });

      expect(result).toHaveProperty("draft");
      expect(result).toHaveProperty("published");
      expect(result).toHaveProperty("hasPendingChanges");
      expect(result.draft).toHaveProperty("categories");
      expect(result.draft).toHaveProperty("products");
      expect(result.published).toHaveProperty("categories");
      expect(result.published).toHaveProperty("products");
    });

    it("should detect pending changes when draft and published differ", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const mockDb = createMockDbInstance();
      // Different counts → hasPendingChanges = true
      mockDb.setQueryResults(1, [{ count: 6 }]); // draft cats
      mockDb.setQueryResults(2, [{ count: 12 }]); // draft prods
      mockDb.setQueryResults(3, [{ count: 5 }]); // pub cats
      mockDb.setQueryResults(4, [{ count: 10 }]); // pub prods
      mockDb.setQueryResults(5, []); // draft products details
      mockDb.setQueryResults(6, []); // published products details

      vi.spyOn(db, "getDb").mockResolvedValue(mockDb.instance as any);

      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.catalogVersion.stats({ establishmentId: 100 });

      expect(result.hasPendingChanges).toBe(true);
    });

    it("should reject non-owner access", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const { ctx } = createAuthContext(2); // User 2 is not the owner
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.catalogVersion.stats({ establishmentId: 100 })
      ).rejects.toThrow("Acesso negado");
    });
  });

  describe("publish", () => {
    it("should reject non-owner from publishing", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const { ctx } = createAuthContext(2);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.catalogVersion.publish({ establishmentId: 100 })
      ).rejects.toThrow("Acesso negado");
    });

    it("should publish draft to published for establishment owner", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const now = new Date();
      const mockDb = createMockDbInstance();
      
      // Query 1: draft categories
      mockDb.setQueryResults(1, [
        { id: 1, name: "Entradas", establishmentId: 100, version: "draft", isActive: true, sortOrder: 0, publishedSourceId: null, emoji: "🫔", createdAt: now, updatedAt: now },
      ]);
      // Query 2: draft products
      mockDb.setQueryResults(2, [
        { id: 10, name: "Produto A", establishmentId: 100, version: "draft", categoryId: 1, price: "15.00", status: "active", createdAt: now, updatedAt: now },
      ]);
      // Query 3: complement groups for product 10
      mockDb.setQueryResults(3, []);
      // Query 4: published products (to delete)
      mockDb.setQueryResults(4, []);

      vi.spyOn(db, "getDb").mockResolvedValue(mockDb.instance as any);

      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.catalogVersion.publish({ establishmentId: 100 });

      expect(result.success).toBe(true);
      expect(result.published).toHaveProperty("categories");
      expect(result.published).toHaveProperty("products");
      expect(result.published.categories).toBe(1);
      expect(result.published.products).toBe(1);
    });
  });

  describe("discardDraft", () => {
    it("should reject non-owner from discarding draft", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const { ctx } = createAuthContext(2);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.catalogVersion.discardDraft({ establishmentId: 100 })
      ).rejects.toThrow("Acesso negado");
    });

    it("should discard draft and restore from published for establishment owner", async () => {
      vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
        id: 100,
        userId: 1,
      } as any);

      const now = new Date();
      const mockDb = createMockDbInstance();
      
      // Query 1: published categories
      mockDb.setQueryResults(1, [
        { id: 50, name: "Entradas", establishmentId: 100, version: "published", isActive: true, sortOrder: 0, publishedSourceId: null, emoji: "🫔", createdAt: now, updatedAt: now },
      ]);
      // Query 2: published products
      mockDb.setQueryResults(2, [
        { id: 60, name: "Produto A", establishmentId: 100, version: "published", categoryId: 50, price: "15.00", status: "active", createdAt: now, updatedAt: now },
      ]);
      // Query 3: complement groups for published product 60
      mockDb.setQueryResults(3, []);
      // Query 4: draft products (to delete)
      mockDb.setQueryResults(4, []);

      vi.spyOn(db, "getDb").mockResolvedValue(mockDb.instance as any);

      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.catalogVersion.discardDraft({ establishmentId: 100 });

      expect(result.success).toBe(true);
      expect(result.restored).toHaveProperty("categories");
      expect(result.restored).toHaveProperty("products");
      expect(result.restored.categories).toBe(1);
      expect(result.restored.products).toBe(1);
    });
  });
});
