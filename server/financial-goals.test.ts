import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("finance.customGoals", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  const testEstablishmentId = 1;
  const testMonth = 2;
  const testYear = 2026;
  let createdGoalId: number;

  it("should create a custom financial goal", async () => {
    const result = await caller.finance.createGoalCustom({
      establishmentId: testEstablishmentId,
      month: testMonth,
      year: testYear,
      name: "Meta Teste Vitest",
      targetValue: "5000",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    createdGoalId = result.id;
  });

  it("should list custom goals for the month", async () => {
    const goals = await caller.finance.listGoals({
      establishmentId: testEstablishmentId,
      month: testMonth,
      year: testYear,
    });

    expect(Array.isArray(goals)).toBe(true);
    const found = goals.find((g: any) => g.id === createdGoalId);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Meta Teste Vitest");
    expect(Number(found!.targetValue)).toBe(5000);
  });

  it("should update a custom financial goal", async () => {
    const result = await caller.finance.updateGoalCustom({
      id: createdGoalId,
      establishmentId: testEstablishmentId,
      name: "Meta Atualizada",
      targetValue: "8000",
    });

    expect(result).toEqual({ success: true });

    // Verify the update
    const goals = await caller.finance.listGoals({
      establishmentId: testEstablishmentId,
      month: testMonth,
      year: testYear,
    });
    const updated = goals.find((g: any) => g.id === createdGoalId);
    expect(updated).toBeDefined();
    expect(updated!.name).toBe("Meta Atualizada");
    expect(Number(updated!.targetValue)).toBe(8000);
  });

  it("should create a second goal and list both in order", async () => {
    const result = await caller.finance.createGoalCustom({
      establishmentId: testEstablishmentId,
      month: testMonth,
      year: testYear,
      name: "Segunda Meta",
      targetValue: "10000",
    });

    expect(result.id).toBeGreaterThan(createdGoalId);

    const goals = await caller.finance.listGoals({
      establishmentId: testEstablishmentId,
      month: testMonth,
      year: testYear,
    });

    // Should have at least 2 goals
    const testGoals = goals.filter(
      (g: any) => g.name === "Meta Atualizada" || g.name === "Segunda Meta"
    );
    expect(testGoals.length).toBe(2);

    // First goal should come before second (ordered by id asc)
    const firstIdx = goals.findIndex((g: any) => g.id === createdGoalId);
    const secondIdx = goals.findIndex((g: any) => g.id === result.id);
    expect(firstIdx).toBeLessThan(secondIdx);

    // Clean up second goal
    await caller.finance.deleteGoalCustom({
      id: result.id,
      establishmentId: testEstablishmentId,
    });
  });

  it("should delete a custom financial goal", async () => {
    const result = await caller.finance.deleteGoalCustom({
      id: createdGoalId,
      establishmentId: testEstablishmentId,
    });

    expect(result).toEqual({ success: true });

    // Verify deletion
    const goals = await caller.finance.listGoals({
      establishmentId: testEstablishmentId,
      month: testMonth,
      year: testYear,
    });
    const found = goals.find((g: any) => g.id === createdGoalId);
    expect(found).toBeUndefined();
  });

  it("should reject creating a goal with empty name", async () => {
    await expect(
      caller.finance.createGoalCustom({
        establishmentId: testEstablishmentId,
        month: testMonth,
        year: testYear,
        name: "",
        targetValue: "5000",
      })
    ).rejects.toThrow();
  });
});
