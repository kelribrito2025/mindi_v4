import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the db module before importing routers
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    getEstablishmentByUserId: vi.fn(),
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
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("establishment.getTrialInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no establishment found", async () => {
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue(undefined as any);
    
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.establishment.getTrialInfo();
    
    expect(result).toBeNull();
  });

  it("returns isTrial false for non-trial plan", async () => {
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({
      id: 1,
      planType: "basic",
      trialStartDate: null,
      trialDays: 15,
    } as any);
    
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.establishment.getTrialInfo();
    
    expect(result).toEqual({
      isTrial: false,
      trialExpired: false,
      daysRemaining: 0,
      planType: "basic",
    });
  });

  it("returns correct days remaining for active trial", async () => {
    const trialStart = new Date();
    trialStart.setDate(trialStart.getDate() - 5); // Started 5 days ago
    
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
    expect(result!.isTrial).toBe(true);
    expect(result!.daysRemaining).toBe(10);
    expect(result!.trialExpired).toBe(false);
    expect(result!.trialDays).toBe(15);
    expect(result!.planType).toBe("trial");
  });

  it("returns 0 days remaining for expired trial", async () => {
    const trialStart = new Date();
    trialStart.setDate(trialStart.getDate() - 20); // Started 20 days ago (expired)
    
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
    expect(result!.isTrial).toBe(true);
    expect(result!.daysRemaining).toBe(0);
    expect(result!.trialExpired).toBe(true);
  });

  it("returns 15 days remaining for brand new trial", async () => {
    const trialStart = new Date(); // Started just now
    
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
    expect(result!.isTrial).toBe(true);
    expect(result!.daysRemaining).toBe(15);
    expect(result!.trialExpired).toBe(false);
  });

  it("returns isTrial false when trial plan but no start date", async () => {
    vi.mocked(db.getEstablishmentByUserId).mockResolvedValue({
      id: 1,
      planType: "trial",
      trialStartDate: null,
      trialDays: 15,
    } as any);
    
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.establishment.getTrialInfo();
    
    expect(result).toEqual({
      isTrial: false,
      trialExpired: false,
      daysRemaining: 0,
      planType: "trial",
    });
  });

  it("returns trialExpired true when trial is exactly 15 days old", async () => {
    const trialStart = new Date();
    trialStart.setDate(trialStart.getDate() - 15);
    trialStart.setHours(trialStart.getHours() - 1); // Ensure it's past the 15-day mark
    
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
    expect(result!.isTrial).toBe(true);
    expect(result!.daysRemaining).toBe(0);
    expect(result!.trialExpired).toBe(true);
  });

  it("returns trialExpired false for pro plan (paid)", async () => {
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
    expect(result!.isTrial).toBe(false);
    expect(result!.trialExpired).toBe(false);
    expect(result!.planType).toBe("pro");
  });
});
