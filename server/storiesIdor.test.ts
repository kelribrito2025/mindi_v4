import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
  getStoriesByEstablishment: vi.fn(),
  getStoryById: vi.fn(),
  deleteStory: vi.fn(),
  countActiveStories: vi.fn(),
  createStory: vi.fn(),
  countViewsByEstablishment: vi.fn(),
  getStoryAnalytics: vi.fn(),
  getStorySalesChart: vi.fn(),
  getTopPerformingStory: vi.fn(),
  getStoryRevenuePercentToday: vi.fn(),
}));

// Mock mindiStorage
vi.mock("../mindiStorage", () => ({
  mindiStoragePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/story.webp" }),
  mindiStorageDelete: vi.fn().mockResolvedValue(undefined),
}));

// Mock imageProcessor
vi.mock("../imageProcessor", () => ({
  processImage: vi.fn(),
  processSingleImage: vi.fn().mockResolvedValue({ buffer: Buffer.from("test") }),
  generateBlurPlaceholder: vi.fn(),
}));

// Mock SSE
vi.mock("../_core/sse", () => ({
  sendMenuPublicEvent: vi.fn(),
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const mockEstablishmentOwner = {
  id: 1,
  userId: 1, // pertence ao user 1
  name: "Restaurante A",
};

const mockStory = {
  id: 10,
  establishmentId: 1,
  imageUrl: "https://s3.example.com/story.webp",
  fileKey: "stories/1/abc.webp",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  type: "simple",
};

describe("Stories IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== LIST ==========
  describe("stories.list", () => {
    it("permite listar stories do próprio estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);
      vi.mocked(db.getStoriesByEstablishment).mockResolvedValue([mockStory] as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.stories.list({ establishmentId: 1 });

      expect(result).toEqual([mockStory]);
      expect(db.getEstablishmentById).toHaveBeenCalledWith(1);
    });

    it("bloqueia listar stories de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99); // user 99 NÃO é dono
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.list({ establishmentId: 1 })
      ).rejects.toThrow("Acesso negado");

      expect(db.getStoriesByEstablishment).not.toHaveBeenCalled();
    });
  });

  // ========== DELETE ==========
  describe("stories.delete", () => {
    it("permite deletar story do próprio estabelecimento", async () => {
      vi.mocked(db.getStoryById).mockResolvedValue(mockStory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);
      vi.mocked(db.deleteStory).mockResolvedValue(mockStory as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.stories.delete({ id: 10 });

      expect(result).toEqual({ success: true });
      expect(db.getStoryById).toHaveBeenCalledWith(10);
      expect(db.getEstablishmentById).toHaveBeenCalledWith(1);
      expect(db.deleteStory).toHaveBeenCalledWith(10);
    });

    it("bloqueia deletar story de outro estabelecimento", async () => {
      vi.mocked(db.getStoryById).mockResolvedValue(mockStory as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99); // user 99 NÃO é dono
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.delete({ id: 10 })
      ).rejects.toThrow("Acesso negado");

      expect(db.deleteStory).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para story inexistente", async () => {
      vi.mocked(db.getStoryById).mockResolvedValue(null);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.delete({ id: 999 })
      ).rejects.toThrow("Story não encontrado");

      expect(db.deleteStory).not.toHaveBeenCalled();
    });
  });

  // ========== VIEWS ANALYTICS ==========
  describe("stories.viewsAnalytics", () => {
    it("permite ver analytics do próprio estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);
      vi.mocked(db.countViewsByEstablishment).mockResolvedValue([] as any);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      await caller.stories.viewsAnalytics({ establishmentId: 1 });

      expect(db.countViewsByEstablishment).toHaveBeenCalledWith(1);
    });

    it("bloqueia ver analytics de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.viewsAnalytics({ establishmentId: 1 })
      ).rejects.toThrow("Acesso negado");

      expect(db.countViewsByEstablishment).not.toHaveBeenCalled();
    });
  });

  // ========== CONVERSION ANALYTICS ==========
  describe("stories.conversionAnalytics", () => {
    it("bloqueia ver conversão de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.conversionAnalytics({ establishmentId: 1 })
      ).rejects.toThrow("Acesso negado");

      expect(db.getStoryAnalytics).not.toHaveBeenCalled();
    });
  });

  // ========== SALES CHART ==========
  describe("stories.salesChart", () => {
    it("bloqueia ver gráfico de vendas de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.salesChart({ establishmentId: 1, days: 7 })
      ).rejects.toThrow("Acesso negado");

      expect(db.getStorySalesChart).not.toHaveBeenCalled();
    });
  });

  // ========== TOP PERFORMING ==========
  describe("stories.topPerforming", () => {
    it("bloqueia ver top story de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.topPerforming({ establishmentId: 1 })
      ).rejects.toThrow("Acesso negado");

      expect(db.getTopPerformingStory).not.toHaveBeenCalled();
    });
  });

  // ========== REVENUE PERCENT ==========
  describe("stories.revenuePercent", () => {
    it("bloqueia ver receita de outro estabelecimento", async () => {
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stories.revenuePercent({ establishmentId: 1 })
      ).rejects.toThrow("Acesso negado");

      expect(db.getStoryRevenuePercentToday).not.toHaveBeenCalled();
    });
  });
});
