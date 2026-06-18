import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Dashboard Stats with Period Filter", () => {
  it("getDashboardStats should accept 'today' period and return correct shape with change indicators", async () => {
    const result = await db.getDashboardStats(30001, "today");
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("avgTicket");
    expect(result).toHaveProperty("lowStockCount");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("revenueChange");
    expect(result).toHaveProperty("avgTicketChange");
    expect(result).toHaveProperty("lowStockChange");
    expect(result).toHaveProperty("recurringCustomers");
    expect(result).toHaveProperty("recurringPercentage");
    expect(result).toHaveProperty("recurringChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.avgTicket).toBe("number");
    expect(typeof result.lowStockCount).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
    expect(typeof result.revenueChange).toBe("number");
    expect(typeof result.avgTicketChange).toBe("number");
    expect(typeof result.lowStockChange).toBe("number");
    expect(typeof result.recurringCustomers).toBe("number");
    expect(typeof result.recurringPercentage).toBe("number");
    expect(typeof result.recurringChange).toBe("number");
  });

  it("getDashboardStats should accept 'week' period with change indicators", async () => {
    const result = await db.getDashboardStats(30001, "week");
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("avgTicket");
    expect(result).toHaveProperty("lowStockCount");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("revenueChange");
    expect(result).toHaveProperty("recurringCustomers");
    expect(result).toHaveProperty("recurringPercentage");
    expect(result).toHaveProperty("recurringChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
    expect(typeof result.revenueChange).toBe("number");
    expect(typeof result.recurringCustomers).toBe("number");
  });

  it("getDashboardStats should accept 'month' period with change indicators", async () => {
    const result = await db.getDashboardStats(30001, "month");
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("avgTicket");
    expect(result).toHaveProperty("lowStockCount");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("revenueChange");
    expect(result).toHaveProperty("avgTicketChange");
    expect(result).toHaveProperty("recurringCustomers");
    expect(result).toHaveProperty("recurringPercentage");
    expect(result).toHaveProperty("recurringChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
  });

  it("getDashboardStats should default to 'today' when no period specified", async () => {
    const result = await db.getDashboardStats(30001);
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("recurringCustomers");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
    expect(typeof result.recurringCustomers).toBe("number");
  });

  it("week period should return >= today period values", async () => {
    const todayResult = await db.getDashboardStats(30001, "today");
    const weekResult = await db.getDashboardStats(30001, "week");
    expect(weekResult.ordersCount).toBeGreaterThanOrEqual(todayResult.ordersCount);
    expect(weekResult.revenue).toBeGreaterThanOrEqual(todayResult.revenue);
  });

  it("month period should return >= week period values", async () => {
    const weekResult = await db.getDashboardStats(30001, "week");
    const monthResult = await db.getDashboardStats(30001, "month");
    expect(monthResult.ordersCount).toBeGreaterThanOrEqual(weekResult.ordersCount);
    expect(monthResult.revenue).toBeGreaterThanOrEqual(weekResult.revenue);
  });

  it("should return zeros for non-existent establishment", async () => {
    const result = await db.getDashboardStats(999999, "today");
    expect(result.ordersCount).toBe(0);
    expect(result.revenue).toBe(0);
    expect(result.avgTicket).toBe(0);
    expect(result.ordersChange).toBe(0);
    expect(result.revenueChange).toBe(0);
    expect(result.avgTicketChange).toBe(0);
    expect(result.lowStockChange).toBe(0);
    expect(result.recurringCustomers).toBe(0);
    expect(result.recurringPercentage).toBe(0);
    expect(result.recurringChange).toBe(0);
  });
});

describe("Recurring Customers", () => {
  it("getRecurringCustomers should return correct shape", async () => {
    const result = await db.getRecurringCustomers(30001);
    expect(result).toHaveProperty("count");
    expect(result).toHaveProperty("percentage");
    expect(result).toHaveProperty("change");
    expect(typeof result.count).toBe("number");
    expect(typeof result.percentage).toBe("number");
    expect(typeof result.change).toBe("number");
  });

  it("getRecurringCustomers count should be non-negative", async () => {
    const result = await db.getRecurringCustomers(30001);
    expect(result.count).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });

  it("getRecurringCustomers should return zeros for non-existent establishment", async () => {
    const result = await db.getRecurringCustomers(999999);
    expect(result.count).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.change).toBe(0);
  });
});
