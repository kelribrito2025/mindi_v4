import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

  return { ctx };
}

// Mock the db module
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    getEstablishmentByUserId: vi.fn().mockResolvedValue({
      id: 30001,
      userId: 1,
      name: "Test Restaurant",
      timezone: "America/Sao_Paulo",
    }),
    getScheduledClosures: vi.fn().mockResolvedValue([]),
    createScheduledClosure: vi.fn().mockResolvedValue(1),
    updateScheduledClosure: vi.fn().mockResolvedValue(undefined),
    deleteScheduledClosure: vi.fn().mockResolvedValue(undefined),
    checkScheduledClosure: vi.fn().mockResolvedValue({ isClosed: false, reason: null }),
  };
});

describe("scheduledClosures router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns scheduled closures for the user's establishment", async () => {
      const { getScheduledClosures } = await import("./db");
      (getScheduledClosures as any).mockResolvedValue([
        { id: 1, type: "specific_date", specificDate: "2026-04-15", reason: "Reforma", isActive: true },
        { id: 2, type: "recurring", recurringRule: "last_sunday", reason: "Fechamento mensal", isActive: true },
      ]);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.list();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("specific_date");
      expect(result[1].type).toBe("recurring");
    });
  });

  describe("create", () => {
    it("creates a specific date closure", async () => {
      const { createScheduledClosure } = await import("./db");
      (createScheduledClosure as any).mockResolvedValue(10);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.create({
        type: "specific_date",
        specificDate: "2026-04-15",
        reason: "Reforma no restaurante",
      });

      expect(result).toEqual({ id: 10 });
      expect(createScheduledClosure).toHaveBeenCalledWith(
        expect.objectContaining({
          establishmentId: 30001,
          type: "specific_date",
          reason: "Reforma no restaurante",
          isActive: true,
        })
      );
    });

    it("creates a recurring closure", async () => {
      const { createScheduledClosure } = await import("./db");
      (createScheduledClosure as any).mockResolvedValue(11);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.create({
        type: "recurring",
        recurringRule: "last_sunday",
        reason: "Fechamento mensal",
      });

      expect(result).toEqual({ id: 11 });
      expect(createScheduledClosure).toHaveBeenCalledWith(
        expect.objectContaining({
          establishmentId: 30001,
          type: "recurring",
          recurringRule: "last_sunday",
          reason: "Fechamento mensal",
          isActive: true,
        })
      );
    });

    it("throws error when specific_date type has no date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.scheduledClosures.create({
          type: "specific_date",
          reason: "Test",
        })
      ).rejects.toThrow("Data específica é obrigatória");
    });

    it("throws error when recurring type has no rule", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.scheduledClosures.create({
          type: "recurring",
          reason: "Test",
        })
      ).rejects.toThrow("Regra recorrente é obrigatória");
    });
  });

  describe("update", () => {
    it("updates a closure's active status", async () => {
      const { updateScheduledClosure } = await import("./db");

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.update({
        id: 1,
        isActive: false,
      });

      expect(result).toEqual({ success: true });
      expect(updateScheduledClosure).toHaveBeenCalledWith(1, 30001, { isActive: false });
    });
  });

  describe("delete", () => {
    it("deletes a closure", async () => {
      const { deleteScheduledClosure } = await import("./db");

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(deleteScheduledClosure).toHaveBeenCalledWith(1, 30001);
    });
  });

  describe("checkToday", () => {
    it("returns closure status for today", async () => {
      const { checkScheduledClosure } = await import("./db");
      (checkScheduledClosure as any).mockResolvedValue({ isClosed: true, reason: "Inventário mensal" });

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.checkToday();

      expect(result).toEqual({ isClosed: true, reason: "Inventário mensal" });
      expect(checkScheduledClosure).toHaveBeenCalledWith(30001, "America/Sao_Paulo");
    });
  });

  describe("upcoming", () => {
    it("returns empty when no closures exist", async () => {
      const { getScheduledClosures } = await import("./db");
      (getScheduledClosures as any).mockResolvedValue([]);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.upcoming();

      expect(result.upcoming).toEqual([]);
      expect(result.nextClosure).toBeNull();
    });

    it("returns upcoming closures for specific dates within 7 days", async () => {
      const { getScheduledClosures } = await import("./db");
      
      // Create a date 2 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      (getScheduledClosures as any).mockResolvedValue([
        {
          id: 1,
          type: "specific_date",
          specificDate: futureDateStr,
          recurringRule: null,
          reason: "Reforma",
          isActive: true,
        },
      ]);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.upcoming();

      expect(result.upcoming.length).toBeGreaterThanOrEqual(1);
      expect(result.nextClosure).not.toBeNull();
      expect(result.nextClosure?.reason).toBe("Reforma");
      expect(result.nextClosure?.daysUntil).toBe(2);
    });

    it("does not return inactive closures", async () => {
      const { getScheduledClosures } = await import("./db");
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      (getScheduledClosures as any).mockResolvedValue([
        {
          id: 1,
          type: "specific_date",
          specificDate: tomorrowStr,
          recurringRule: null,
          reason: "Inactive closure",
          isActive: false,
        },
      ]);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.scheduledClosures.upcoming();

      expect(result.upcoming).toEqual([]);
      expect(result.nextClosure).toBeNull();
    });
  });
});
