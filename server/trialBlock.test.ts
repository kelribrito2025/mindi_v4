import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the db module before importing routers
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    getEstablishmentByUserId: vi.fn(),
    activatePlan: vi.fn(),
  };
});

import { appRouter } from "./routers";
import * as db from "./db";

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
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
      headers: { "x-forwarded-proto": "https" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as any,
  };

  return { ctx };
}

describe("Trial expiration blocking logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trialExpired is true when trial exceeded 15 days", async () => {
    const trialStart = new Date();
    trialStart.setDate(trialStart.getDate() - 16); // 16 days ago

    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({
      id: 1,
      planType: "trial",
      trialStartDate: trialStart,
      trialDays: 15,
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.establishment.getTrialInfo();

    expect(result).not.toBeNull();
    expect(result!.trialExpired).toBe(true);
    expect(result!.daysRemaining).toBe(0);
    expect(result!.isTrial).toBe(true);
  });

  it("trialExpired is false when trial has days remaining", async () => {
    const trialStart = new Date();
    trialStart.setDate(trialStart.getDate() - 10); // 10 days ago

    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({
      id: 1,
      planType: "trial",
      trialStartDate: trialStart,
      trialDays: 15,
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.establishment.getTrialInfo();

    expect(result).not.toBeNull();
    expect(result!.trialExpired).toBe(false);
    expect(result!.daysRemaining).toBe(5);
    expect(result!.isTrial).toBe(true);
  });

  it("trialExpired is false for paid plans", async () => {
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({
      id: 1,
      planType: "pro",
      trialStartDate: null,
      trialDays: 15,
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.establishment.getTrialInfo();

    expect(result).not.toBeNull();
    expect(result!.trialExpired).toBe(false);
    expect(result!.isTrial).toBe(false);
    expect(result!.planType).toBe("pro");
  });

  it("activatePlan is called correctly", async () => {
    vi.mocked(db.activatePlan).mockResolvedValue(undefined);
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({
      id: 42,
      planType: "trial",
      trialStartDate: new Date(),
      trialDays: 15,
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.establishment.activatePlan({ planType: "basic" });

    expect(db.activatePlan).toHaveBeenCalledWith(42, "basic");
  });

  it("activatePlan throws when no establishment found", async () => {
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue(undefined as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.establishment.activatePlan({ planType: "pro" })
    ).rejects.toThrow();
  });
});

describe("PLAN_PACKAGES structure", () => {
  it("exports PLAN_PACKAGES with correct structure (lite, basic, pro)", async () => {
    const { PLAN_PACKAGES } = await import("./stripe");

    expect(PLAN_PACKAGES).toBeDefined();
    expect(PLAN_PACKAGES.length).toBe(3);

    // Verify lite plan
    const litePlan = PLAN_PACKAGES.find((p) => p.id === "lite");
    expect(litePlan).toBeDefined();
    expect(litePlan!.priceInCents).toBeGreaterThan(0);
    expect(litePlan!.name).toBe("Plano Starter");

    // Verify basic plan
    const basicPlan = PLAN_PACKAGES.find((p) => p.id === "basic");
    expect(basicPlan).toBeDefined();
    expect(basicPlan!.priceInCents).toBeGreaterThan(litePlan!.priceInCents);

    // Verify pro plan
    const proPlan = PLAN_PACKAGES.find((p) => p.id === "pro");
    expect(proPlan).toBeDefined();
    expect(proPlan!.priceInCents).toBeGreaterThan(basicPlan!.priceInCents);

    // Enterprise should NOT exist
    const enterprisePlan = PLAN_PACKAGES.find((p) => p.id === "enterprise");
    expect(enterprisePlan).toBeUndefined();
  });

  it("has popular flag on basic (Essencial) plan only", async () => {
    const { PLAN_PACKAGES } = await import("./stripe");

    const basicPlan = PLAN_PACKAGES.find((p) => p.id === "basic");
    expect(basicPlan?.popular).toBe(true);

    const litePlan = PLAN_PACKAGES.find((p) => p.id === "lite");
    expect(litePlan?.popular).toBeUndefined();

    const proPlan = PLAN_PACKAGES.find((p) => p.id === "pro");
    expect(proPlan?.popular).toBeUndefined();
  });
});
