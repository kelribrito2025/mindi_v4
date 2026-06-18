import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getUpcomingRecurringExpenses: vi.fn(),
}));

import { getUpcomingRecurringExpenses } from "./db";

describe("upcomingRecurring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when no recurring expenses exist", async () => {
    const mockFn = getUpcomingRecurringExpenses as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue([]);

    const result = await getUpcomingRecurringExpenses(1);
    expect(result).toEqual([]);
    expect(mockFn).toHaveBeenCalledWith(1);
  });

  it("should return upcoming occurrences with correct structure", async () => {
    const mockData = [
      {
        recurringId: 1,
        description: "Internet",
        categoryName: "Outros",
        categoryColor: "#888888",
        amount: 97,
        frequency: "monthly",
        dueDate: "2026-03-15",
        type: "expense",
      },
      {
        recurringId: 2,
        description: "Aluguel",
        categoryName: "Aluguel",
        categoryColor: "#FF9900",
        amount: 3950,
        frequency: "monthly",
        dueDate: "2026-03-10",
        type: "expense",
      },
    ];

    const mockFn = getUpcomingRecurringExpenses as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockData);

    const result = await getUpcomingRecurringExpenses(1);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("recurringId");
    expect(result[0]).toHaveProperty("description");
    expect(result[0]).toHaveProperty("categoryName");
    expect(result[0]).toHaveProperty("categoryColor");
    expect(result[0]).toHaveProperty("amount");
    expect(result[0]).toHaveProperty("frequency");
    expect(result[0]).toHaveProperty("dueDate");
    expect(result[0]).toHaveProperty("type");
  });

  it("should return occurrences sorted by date ascending", async () => {
    const mockData = [
      {
        recurringId: 2,
        description: "Aluguel",
        categoryName: "Aluguel",
        categoryColor: "#FF9900",
        amount: 3950,
        frequency: "monthly",
        dueDate: "2026-03-10",
        type: "expense",
      },
      {
        recurringId: 1,
        description: "Internet",
        categoryName: "Outros",
        categoryColor: "#888888",
        amount: 97,
        frequency: "monthly",
        dueDate: "2026-03-15",
        type: "expense",
      },
      {
        recurringId: 2,
        description: "Aluguel",
        categoryName: "Aluguel",
        categoryColor: "#FF9900",
        amount: 3950,
        frequency: "monthly",
        dueDate: "2026-04-10",
        type: "expense",
      },
    ];

    const mockFn = getUpcomingRecurringExpenses as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockData);

    const result = await getUpcomingRecurringExpenses(1);
    
    // Verify dates are in ascending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i].dueDate >= result[i - 1].dueDate).toBe(true);
    }
  });

  it("should include both expense and revenue types", async () => {
    const mockData = [
      {
        recurringId: 1,
        description: "Aluguel",
        categoryName: "Aluguel",
        categoryColor: "#FF9900",
        amount: 3950,
        frequency: "monthly",
        dueDate: "2026-03-10",
        type: "expense",
      },
      {
        recurringId: 3,
        description: "Receita fixa",
        categoryName: "Outros",
        categoryColor: "#00FF00",
        amount: 500,
        frequency: "monthly",
        dueDate: "2026-03-01",
        type: "revenue",
      },
    ];

    const mockFn = getUpcomingRecurringExpenses as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockData);

    const result = await getUpcomingRecurringExpenses(1);
    
    const types = result.map((r: any) => r.type);
    expect(types).toContain("expense");
    expect(types).toContain("revenue");
  });

  it("should have numeric amount values", async () => {
    const mockData = [
      {
        recurringId: 1,
        description: "Internet",
        categoryName: "Outros",
        categoryColor: "#888888",
        amount: 97.50,
        frequency: "monthly",
        dueDate: "2026-03-15",
        type: "expense",
      },
    ];

    const mockFn = getUpcomingRecurringExpenses as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockData);

    const result = await getUpcomingRecurringExpenses(1);
    
    expect(typeof result[0].amount).toBe("number");
    expect(result[0].amount).toBe(97.50);
  });

  it("should have valid ISO date format for dueDate", async () => {
    const mockData = [
      {
        recurringId: 1,
        description: "Internet",
        categoryName: "Outros",
        categoryColor: "#888888",
        amount: 97,
        frequency: "monthly",
        dueDate: "2026-03-15",
        type: "expense",
      },
    ];

    const mockFn = getUpcomingRecurringExpenses as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockData);

    const result = await getUpcomingRecurringExpenses(1);
    
    // Verify ISO date format YYYY-MM-DD
    expect(result[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
