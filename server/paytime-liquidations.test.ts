/**
 * Tests for Paytime liquidations endpoint migration
 * Validates that listLiquidations uses the complete endpoint (/v1/marketplace/liquidations)
 * and returns all expected fields (status, transactions, history, plans, payments)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the paytime module
vi.mock("./paytime", async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    listLiquidations: vi.fn(),
  };
});

import { listLiquidations } from "./paytime";

describe("Paytime Liquidations - Complete Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCompleteLiquidation = {
    _id: "6720c0e72b1f2399b8e00000",
    amount: 100000,
    transactions: 3,
    status: "PAID",
    liquidation: "2025-07-22T22:10:38.308Z",
    establishment: {
      id: 1,
      name1: "Estabelecimento Um",
      name2: "Loja 1",
      document: "12345678900",
      status: "PAID",
      active: true,
      block: 10,
      type: "store",
    },
    marketplace: {
      id: 1,
      name1: "Marketplace Teste",
      name2: "MKT",
      document: "0099887766",
      nickname: "mkt_teste",
    },
    plans: [
      {
        id: 1,
        name: "Plano Físico",
        allow_anticipation: true,
        modality: "PHYSICAL",
        pivot: {
          plan_id: 1,
          establishment_id: 1,
          active: true,
        },
      },
    ],
    payments: [],
    reprocessing: false,
    history: [],
    created_at: "2025-07-22T22:10:38.308Z",
    updated_at: "2025-07-22T22:10:38.308Z",
  };

  const mockResponse = {
    meta: {
      total_amount: 350000,
      total_transactions: 8,
      total_payments: 0,
    },
    total: 2,
    perPage: 20,
    page: 1,
    lastPage: 1,
    data: [
      mockCompleteLiquidation,
      {
        ...mockCompleteLiquidation,
        _id: "6720c0e72b1f2399b8e11111",
        amount: 250000,
        transactions: 5,
        status: "PENDING",
        establishment: {
          ...mockCompleteLiquidation.establishment,
          id: 2,
          name1: "Estabelecimento Dois",
          status: "PENDING",
        },
        reprocessing: true,
        history: [
          {
            status: "PENDING",
            created_at: "2025-07-22T22:10:38.308Z",
            user: { id: 1, first_name: "Admin", last_name: "User" },
          },
        ],
      },
    ],
  };

  describe("listLiquidations", () => {
    it("should return complete liquidation data with status field", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001", { page: 1, perPage: 20 });

      expect(listLiquidations).toHaveBeenCalledWith("30001", { page: 1, perPage: 20 });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].status).toBe("PAID");
      expect(result.data[1].status).toBe("PENDING");
    });

    it("should return transactions count for each liquidation", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      expect(result.data[0].transactions).toBe(3);
      expect(result.data[1].transactions).toBe(5);
    });

    it("should return plans array for each liquidation", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      expect(result.data[0].plans).toHaveLength(1);
      expect(result.data[0].plans[0].name).toBe("Plano Físico");
      expect(result.data[0].plans[0].modality).toBe("PHYSICAL");
      expect(result.data[0].plans[0].allow_anticipation).toBe(true);
    });

    it("should return history array for liquidations", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      // First liquidation has empty history
      expect(result.data[0].history).toHaveLength(0);

      // Second liquidation has history entries
      expect(result.data[1].history).toHaveLength(1);
      expect(result.data[1].history[0].status).toBe("PENDING");
      expect(result.data[1].history[0].user.first_name).toBe("Admin");
    });

    it("should return reprocessing flag", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      expect(result.data[0].reprocessing).toBe(false);
      expect(result.data[1].reprocessing).toBe(true);
    });

    it("should return establishment details with status, active, block, type", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      const est = result.data[0].establishment;
      expect(est.status).toBe("PAID");
      expect(est.active).toBe(true);
      expect(est.block).toBe(10);
      expect(est.type).toBe("store");
    });

    it("should return meta with total_amount, total_transactions, total_payments", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      expect(result.meta.total_amount).toBe(350000);
      expect(result.meta.total_transactions).toBe(8);
      expect(result.meta.total_payments).toBe(0);
    });

    it("should return created_at and updated_at timestamps", async () => {
      (listLiquidations as any).mockResolvedValue(mockResponse);

      const result = await listLiquidations("30001");

      expect(result.data[0].created_at).toBe("2025-07-22T22:10:38.308Z");
      expect(result.data[0].updated_at).toBe("2025-07-22T22:10:38.308Z");
    });

    it("should support pagination parameters", async () => {
      (listLiquidations as any).mockResolvedValue({
        ...mockResponse,
        page: 2,
        perPage: 10,
        lastPage: 3,
      });

      const result = await listLiquidations("30001", { page: 2, perPage: 10 });

      expect(listLiquidations).toHaveBeenCalledWith("30001", { page: 2, perPage: 10 });
      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
      expect(result.lastPage).toBe(3);
    });

    it("should support status filter", async () => {
      const filteredResponse = {
        ...mockResponse,
        data: [mockCompleteLiquidation],
        total: 1,
      };
      (listLiquidations as any).mockResolvedValue(filteredResponse);

      const result = await listLiquidations("30001", {
        filters: { status: "PAID" },
      });

      expect(listLiquidations).toHaveBeenCalledWith("30001", {
        filters: { status: "PAID" },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe("PAID");
    });

    it("should handle API error gracefully", async () => {
      (listLiquidations as any).mockRejectedValue(
        new Error("Erro ao listar liquidações (500)")
      );

      await expect(listLiquidations("30001")).rejects.toThrow(
        "Erro ao listar liquidações (500)"
      );
    });

    it("should return payments array with complete details when available", async () => {
      const responseWithPayments = {
        ...mockResponse,
        data: [
          {
            ...mockCompleteLiquidation,
            payments: [
              {
                _id: "pay_001",
                amount: 95000,
                status: "PAID",
                original_amount: 100000,
                transfer_id: "tf_001",
                send_to_establishment: true,
                receipt: {
                  document: "12345678900",
                  form_receipt: "BANKACCOUNT",
                  type: "CHECKING",
                  routing_number: "0001",
                  account_number: "12345-6",
                  bank: { id: 1, name: "Banco do Brasil", code: "001", ispb: "00000000" },
                },
                reductions: [
                  { amount: 5000, motive: "TAXA", description: "Taxa de serviço", status: "CREATED" },
                ],
              },
            ],
          },
        ],
      };

      (listLiquidations as any).mockResolvedValue(responseWithPayments);

      const result = await listLiquidations("30001");

      expect(result.data[0].payments).toHaveLength(1);
      const payment = result.data[0].payments[0];
      expect(payment._id).toBe("pay_001");
      expect(payment.amount).toBe(95000);
      expect(payment.status).toBe("PAID");
      expect(payment.receipt.bank.name).toBe("Banco do Brasil");
      expect(payment.send_to_establishment).toBe(true);
      expect(payment.reductions).toHaveLength(1);
      expect(payment.reductions[0].motive).toBe("TAXA");
    });
  });
});
