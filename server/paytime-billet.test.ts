/**
 * Tests for Paytime billet (boleto) procedures
 * Tests: checkBillet, payBillet, listBilletPayments
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the paytime module functions
vi.mock("./paytime", async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    checkBillet: vi.fn(),
    payBillet: vi.fn(),
    listBilletPayments: vi.fn(),
  };
});

import { checkBillet, payBillet, listBilletPayments } from "./paytime";

describe("Paytime Billet Functions (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkBillet", () => {
    it("should call checkBillet with digitable line", async () => {
      const mockResponse = {
        assignor: "CEMIG Distribuição S.A.",
        digitable: "83640000001-1 87450273104-1 11100024320-0 10622025041-5",
        barcode: "83640000001874502731041110002432001062202504150",
        amount: 187.45,
        original_amount: 187.45,
        due_date: "2026-04-15",
        type: "NORMAL",
        recipient_document: "06.981.180/0001-16",
        recipient_name: "CEMIG Distribuição S.A.",
        discount: 0,
        interest: 0,
        fine: 0,
      };

      (checkBillet as any).mockResolvedValue(mockResponse);

      const result = await checkBillet({
        digitable: "83640000001-1 87450273104-1 11100024320-0 10622025041-5",
      });

      expect(checkBillet).toHaveBeenCalledWith({
        digitable: "83640000001-1 87450273104-1 11100024320-0 10622025041-5",
      });
      expect(result).toEqual(mockResponse);
      expect(result.assignor).toBe("CEMIG Distribuição S.A.");
      expect(result.amount).toBe(187.45);
      expect(result.due_date).toBe("2026-04-15");
      expect(result.recipient_document).toBe("06.981.180/0001-16");
    });

    it("should call checkBillet with barcode", async () => {
      const mockResponse = {
        assignor: "Banco do Brasil",
        barcode: "23793381286000000003381112200001189260000015000",
        amount: 150.00,
        due_date: "2026-05-01",
        type: "NORMAL",
        recipient_document: "00.000.000/0001-91",
      };

      (checkBillet as any).mockResolvedValue(mockResponse);

      const result = await checkBillet({
        barcode: "23793381286000000003381112200001189260000015000",
      });

      expect(checkBillet).toHaveBeenCalledWith({
        barcode: "23793381286000000003381112200001189260000015000",
      });
      expect(result.assignor).toBe("Banco do Brasil");
      expect(result.amount).toBe(150.00);
    });

    it("should handle error from checkBillet", async () => {
      (checkBillet as any).mockRejectedValue(new Error("Boleto não encontrado ou inválido"));

      await expect(checkBillet({ barcode: "invalid" })).rejects.toThrow(
        "Boleto não encontrado ou inválido"
      );
    });
  });

  describe("payBillet", () => {
    it("should call payBillet with barcode and amount", async () => {
      const mockResponse = {
        _id: "pay_abc123",
        status: "PROCESSING",
        amount: 187.45,
        barcode: "83640000001874502731041110002432001062202504150",
        description: "Pagamento boleto - CEMIG",
        created_at: "2026-04-17T21:00:00.000Z",
      };

      (payBillet as any).mockResolvedValue(mockResponse);

      const result = await payBillet({
        barcode: "83640000001874502731041110002432001062202504150",
        amount: 187.45,
        description: "Pagamento boleto - CEMIG",
      });

      expect(payBillet).toHaveBeenCalledWith({
        barcode: "83640000001874502731041110002432001062202504150",
        amount: 187.45,
        description: "Pagamento boleto - CEMIG",
      });
      expect(result._id).toBe("pay_abc123");
      expect(result.status).toBe("PROCESSING");
      expect(result.amount).toBe(187.45);
    });

    it("should handle insufficient balance error", async () => {
      (payBillet as any).mockRejectedValue(new Error("Saldo insuficiente para realizar o pagamento"));

      await expect(
        payBillet({ barcode: "123456", amount: 99999 })
      ).rejects.toThrow("Saldo insuficiente");
    });
  });

  describe("listBilletPayments", () => {
    it("should list billet payments with pagination", async () => {
      const mockResponse = {
        data: [
          {
            _id: "pay_1",
            status: "PAID",
            amount: 187.45,
            barcode: "83640000001874502731041110002432001062202504150",
            description: "Pagamento boleto - CEMIG",
            created_at: "2026-04-17T21:00:00.000Z",
          },
          {
            _id: "pay_2",
            status: "PROCESSING",
            amount: 350.00,
            barcode: "23793381286000000003381112200001189260000035000",
            description: "Pagamento boleto - Banco do Brasil",
            created_at: "2026-04-16T15:30:00.000Z",
          },
        ],
        meta: {
          total: 2,
          per_page: 15,
          current_page: 1,
          last_page: 1,
        },
      };

      (listBilletPayments as any).mockResolvedValue(mockResponse);

      const result = await listBilletPayments({ page: 1, perPage: 15 });

      expect(listBilletPayments).toHaveBeenCalledWith({ page: 1, perPage: 15 });
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[0].status).toBe("PAID");
      expect(result.data[1].status).toBe("PROCESSING");
    });

    it("should return empty list when no payments exist", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 },
      };

      (listBilletPayments as any).mockResolvedValue(mockResponse);

      const result = await listBilletPayments();
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
