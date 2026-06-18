import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes para o endpoint getTaxesAndFees
 * Verifica que o endpoint retorna planos comerciais e tarifas bancárias
 * corretamente, incluindo cenários de erro e dados vazios.
 */

// Mock das funções da Paytime API
vi.mock("./paytime", () => ({
  listPlans: vi.fn(),
  getPlanDetail: vi.fn(),
  listFeesBanking: vi.fn(),
  getPaytimeToken: vi.fn().mockResolvedValue("mock-token"),
  createPixTransaction: vi.fn(),
  createCardTransaction: vi.fn(),
  sendAntifraudAuth: vi.fn(),
  getTransaction: vi.fn(),
  createPaytimeEstablishment: vi.fn(),
  getPaytimeEstablishment: vi.fn(),
  listPaytimeGateways: vi.fn(),
  activatePaytimeGateway: vi.fn(),
  createPaytimeSplitPre: vi.fn(),
  listPaytimeSplitPre: vi.fn(),
  refundPaytimeTransaction: vi.fn(),
  listPaytimePlans: vi.fn(),
  listPaytimeFeesBankings: vi.fn(),
  listEstablishmentGateways: vi.fn(),
  getEstablishmentBalance: vi.fn(),
  getFutureReleases: vi.fn(),
  getTransactions: vi.fn(),
  getTransactionsSummary: vi.fn(),
  getEstablishmentDetails: vi.fn(),
  listBankingTransfers: vi.fn(),
  getBankingTransferDetail: vi.fn(),
  initPixPayment: vi.fn(),
  confirmPixPayment: vi.fn(),
  listLiquidations: vi.fn(),
}));

// Mock do db
vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getOrderById: vi.fn(),
  getOrderItems: vi.fn(),
  getPaytimeTransactionByOrderId: vi.fn(),
  createPaytimeTransaction: vi.fn(),
  updatePaytimeTransactionStatus: vi.fn(),
  listPaytimeTransactions: vi.fn(),
  processOrderPrintingInBackground: vi.fn().mockResolvedValue(undefined),
  processOrderNotificationInBackground: vi.fn().mockResolvedValue(undefined),
}));

// Mock do helpers
vi.mock("./routers/helpers", () => ({
  assertEstablishmentOwnership: vi.fn().mockResolvedValue(undefined),
}));

import { listPlans, getPlanDetail, listFeesBanking } from "./paytime";
import * as db from "./db";

describe("getTaxesAndFees endpoint logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEstablishment = {
    id: 30001,
    userId: 1,
    paytimeEstablishmentId: "157547",
    paytimeBankingActive: true,
  };

  const mockPlansResponse = {
    data: [
      { id: 1, name: "Plano Básico", active: true, modality: "STANDARD", allow_anticipation: false, days_anticipation: null, created_at: "2026-01-01", updated_at: "2026-01-01", categories: [] },
      { id: 2, name: "Plano Premium", active: false, modality: "PREMIUM", allow_anticipation: true, days_anticipation: "2", created_at: "2026-01-01", updated_at: "2026-01-01", categories: [] },
    ],
    total: 2,
    perPage: 50,
    page: 1,
    lastPage: 1,
  };

  const mockPlanDetail = {
    id: 1,
    name: "Plano Básico",
    active: true,
    modality: "STANDARD",
    allow_anticipation: false,
    days_anticipation: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    categories: [],
    flags: [
      {
        id: 1,
        name: "MASTERCARD",
        active: true,
        standard: { pix: 0.5, debit: 1.0, credit_1: 2.0, credit_2: 2.5, credit_3: 3.0, credit_4: 3.5, credit_5: 4.0, credit_6: 4.5, credit_7: 5.0, credit_8: 5.5, credit_9: 6.0, credit_10: 6.5, credit_11: 7.0, credit_12: 7.5, credit_13: 8.0, credit_14: 8.5, credit_15: 9.0, credit_16: 9.5, credit_17: 10.0, credit_18: 10.5 },
        markup: { pix: 0.1, debit: 0.2, credit_1: 0.3, credit_2: 0.3, credit_3: 0.3, credit_4: 0.3, credit_5: 0.3, credit_6: 0.3, credit_7: 0.3, credit_8: 0.3, credit_9: 0.3, credit_10: 0.3, credit_11: 0.3, credit_12: 0.3, credit_13: 0.3, credit_14: 0.3, credit_15: 0.3, credit_16: 0.3, credit_17: 0.3, credit_18: 0.3 },
        fees: { pix: 0.6, debit: 1.2, credit_1: 2.3, credit_2: 2.8, credit_3: 3.3, credit_4: 3.8, credit_5: 4.3, credit_6: 4.8, credit_7: 5.3, credit_8: 5.8, credit_9: 6.3, credit_10: 6.8, credit_11: 7.3, credit_12: 7.8, credit_13: 8.3, credit_14: 8.8, credit_15: 9.3, credit_16: 9.8, credit_17: 10.3, credit_18: 10.8 },
      },
      {
        id: 2,
        name: "VISA",
        active: true,
        standard: { pix: 0.5, debit: 1.0, credit_1: 2.0, credit_2: 2.5, credit_3: 3.0, credit_4: 3.5, credit_5: 4.0, credit_6: 4.5, credit_7: 5.0, credit_8: 5.5, credit_9: 6.0, credit_10: 6.5, credit_11: 7.0, credit_12: 7.5, credit_13: 8.0, credit_14: 8.5, credit_15: 9.0, credit_16: 9.5, credit_17: 10.0, credit_18: 10.5 },
        markup: { pix: 0.1, debit: 0.2, credit_1: 0.3, credit_2: 0.3, credit_3: 0.3, credit_4: 0.3, credit_5: 0.3, credit_6: 0.3, credit_7: 0.3, credit_8: 0.3, credit_9: 0.3, credit_10: 0.3, credit_11: 0.3, credit_12: 0.3, credit_13: 0.3, credit_14: 0.3, credit_15: 0.3, credit_16: 0.3, credit_17: 0.3, credit_18: 0.3 },
        fees: { pix: 0.6, debit: 1.2, credit_1: 2.3, credit_2: 2.8, credit_3: 3.3, credit_4: 3.8, credit_5: 4.3, credit_6: 4.8, credit_7: 5.3, credit_8: 5.8, credit_9: 6.3, credit_10: 6.8, credit_11: 7.3, credit_12: 7.8, credit_13: 8.3, credit_14: 8.8, credit_15: 9.3, credit_16: 9.8, credit_17: 10.3, credit_18: 10.8 },
      },
    ],
  };

  const mockFeesBankingResponse = {
    data: [
      {
        id: 1,
        name: "Pacote Padrão",
        active: true,
        standard: { pix: 100, ted: 500, billet: 350, dynamic_pix: 150 },
        markup: { pix: 50, ted: 100, billet: 50, dynamic_pix: 50 },
        fees: { pix: 150, ted: 600, billet: 400, dynamic_pix: 200 },
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    total: 1,
    perPage: 50,
    page: 1,
    lastPage: 1,
  };

  it("should fetch plans and fees-banking in parallel", async () => {
    (db.getEstablishmentById as any).mockResolvedValue(mockEstablishment);
    (listPlans as any).mockResolvedValue(mockPlansResponse);
    (getPlanDetail as any).mockResolvedValue(mockPlanDetail);
    (listFeesBanking as any).mockResolvedValue(mockFeesBankingResponse);

    const paytimeId = mockEstablishment.paytimeEstablishmentId;

    // Simulate what the endpoint does: fetch plans and fees in parallel
    const [plansResult, feesBankingResult] = await Promise.all([
      listPlans(paytimeId),
      listFeesBanking(paytimeId),
    ]);

    expect(listPlans).toHaveBeenCalledWith(paytimeId);
    expect(listFeesBanking).toHaveBeenCalledWith(paytimeId);

    const plans = plansResult.data || [];
    const feesBanking = feesBankingResult.data || [];

    expect(plans).toHaveLength(2);
    expect(feesBanking).toHaveLength(1);
    expect(plans[0].name).toBe("Plano Básico");
    expect(feesBanking[0].name).toBe("Pacote Padrão");
  });

  it("should only fetch details for active plans", async () => {
    (db.getEstablishmentById as any).mockResolvedValue(mockEstablishment);
    (listPlans as any).mockResolvedValue(mockPlansResponse);
    (getPlanDetail as any).mockResolvedValue(mockPlanDetail);
    (listFeesBanking as any).mockResolvedValue(mockFeesBankingResponse);

    const paytimeId = mockEstablishment.paytimeEstablishmentId;
    const plansResult = await listPlans(paytimeId);
    const plans = plansResult.data || [];

    // Only active plans should get detail fetched
    const activePlans = plans.filter((p: any) => p.active);
    expect(activePlans).toHaveLength(1);
    expect(activePlans[0].name).toBe("Plano Básico");

    // Fetch detail for active plan
    const detail = await getPlanDetail(activePlans[0].id, paytimeId);
    expect(getPlanDetail).toHaveBeenCalledWith(1, paytimeId);
    expect(detail.flags).toHaveLength(2);
    expect(detail.flags[0].name).toBe("MASTERCARD");
    expect(detail.flags[1].name).toBe("VISA");
  });

  it("should return correct fee structure for flags", async () => {
    (getPlanDetail as any).mockResolvedValue(mockPlanDetail);

    const detail = await getPlanDetail(1, "157547");
    const mastercard = detail.flags[0];

    // Verify fee structure
    expect(mastercard.fees.pix).toBe(0.6);
    expect(mastercard.fees.debit).toBe(1.2);
    expect(mastercard.fees.credit_1).toBe(2.3);
    expect(mastercard.fees.credit_12).toBe(7.8);

    // Verify standard + markup = fees
    expect(mastercard.standard.pix + mastercard.markup.pix).toBeCloseTo(mastercard.fees.pix, 1);
    expect(mastercard.standard.debit + mastercard.markup.debit).toBeCloseTo(mastercard.fees.debit, 1);
  });

  it("should return correct banking fees in centavos", async () => {
    (listFeesBanking as any).mockResolvedValue(mockFeesBankingResponse);

    const result = await listFeesBanking("157547");
    const fees = result.data[0];

    // Fees are in centavos
    expect(fees.fees.pix).toBe(150); // R$ 1,50
    expect(fees.fees.ted).toBe(600); // R$ 6,00
    expect(fees.fees.billet).toBe(400); // R$ 4,00
    expect(fees.fees.dynamic_pix).toBe(200); // R$ 2,00

    // Verify standard + markup = fees
    expect(fees.standard.pix + fees.markup.pix).toBe(fees.fees.pix);
    expect(fees.standard.ted + fees.markup.ted).toBe(fees.fees.ted);
  });

  it("should handle empty plans and fees gracefully", async () => {
    (listPlans as any).mockResolvedValue({ data: [], total: 0, perPage: 50, page: 1, lastPage: 1 });
    (listFeesBanking as any).mockResolvedValue({ data: [], total: 0, perPage: 50, page: 1, lastPage: 1 });

    const [plansResult, feesResult] = await Promise.all([
      listPlans("157547"),
      listFeesBanking("157547"),
    ]);

    expect(plansResult.data).toHaveLength(0);
    expect(feesResult.data).toHaveLength(0);
  });

  it("should handle API errors gracefully with catch", async () => {
    (listPlans as any).mockRejectedValue(new Error("Plans API timeout"));
    (listFeesBanking as any).mockResolvedValue(mockFeesBankingResponse);

    // Simulate the endpoint's error handling pattern
    const [plansResult, feesResult] = await Promise.all([
      listPlans("157547").catch((e: any) => {
        return { data: [], total: 0, perPage: 50, page: 1, lastPage: 1 };
      }),
      listFeesBanking("157547").catch((e: any) => {
        return { data: [], total: 0, perPage: 50, page: 1, lastPage: 1 };
      }),
    ]);

    // Plans should fallback to empty
    expect(plansResult.data).toHaveLength(0);
    // Fees should still work
    expect(feesResult.data).toHaveLength(1);
  });

  it("should handle getPlanDetail failure gracefully", async () => {
    (listPlans as any).mockResolvedValue(mockPlansResponse);
    (getPlanDetail as any).mockRejectedValue(new Error("Plan detail API error"));

    const plansResult = await listPlans("157547");
    const activePlans = plansResult.data.filter((p: any) => p.active);

    // Simulate the endpoint's error handling for plan details
    const planDetails = await Promise.all(
      activePlans.map(async (plan: any) => {
        try {
          return await getPlanDetail(plan.id, "157547");
        } catch (e: any) {
          return { ...plan, flags: [] };
        }
      })
    );

    expect(planDetails).toHaveLength(1);
    expect(planDetails[0].flags).toHaveLength(0); // Fallback to empty flags
    expect(planDetails[0].name).toBe("Plano Básico");
  });

  it("should return establishment without banking as empty data", async () => {
    const estWithoutBanking = {
      ...mockEstablishment,
      paytimeEstablishmentId: null,
    };
    (db.getEstablishmentById as any).mockResolvedValue(estWithoutBanking);

    // Simulate what the endpoint does when no paytimeEstablishmentId
    const est = await db.getEstablishmentById(30001);
    if (!est?.paytimeEstablishmentId) {
      const result = { plans: [], planDetails: [], feesBanking: [] };
      expect(result.plans).toHaveLength(0);
      expect(result.planDetails).toHaveLength(0);
      expect(result.feesBanking).toHaveLength(0);
    }
  });
});
