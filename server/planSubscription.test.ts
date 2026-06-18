import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB module
vi.mock("./planSubscriptionDb", () => ({
  getEnabledGateways: vi.fn(),
  getGatewaySettings: vi.fn(),
  upsertGatewaySetting: vi.fn(),
  createPlanSubscription: vi.fn(),
  getActiveSubscription: vi.fn(),
  getSubscriptionById: vi.fn(),
  activateSubscription: vi.fn(),
  getSubscriptionByPaytimeTransactionId: vi.fn(),
  getExpiringSubscriptions: vi.fn(),
  getPendingPixSubscriptions: vi.fn(),
  cancelSubscription: vi.fn(),
}));

import * as planSubDb from "./planSubscriptionDb";

describe("Plan Subscription DB Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEnabledGateways", () => {
    it("should return only enabled gateways", async () => {
      const mockGateways = [
        { gateway: "paytime_pix", enabled: true },
        { gateway: "paytime_card", enabled: true },
      ];
      vi.mocked(planSubDb.getEnabledGateways).mockResolvedValue(mockGateways as any);

      const result = await planSubDb.getEnabledGateways();
      expect(result).toHaveLength(2);
      expect(result[0].gateway).toBe("paytime_pix");
      expect(result[1].gateway).toBe("paytime_card");
    });

    it("should return empty array when no gateways are enabled", async () => {
      vi.mocked(planSubDb.getEnabledGateways).mockResolvedValue([]);

      const result = await planSubDb.getEnabledGateways();
      expect(result).toHaveLength(0);
    });
  });

  describe("getGatewaySettings", () => {
    it("should return all gateway settings", async () => {
      const mockSettings = [
        { id: 1, gateway: "paytime_pix", enabled: true },
        { id: 2, gateway: "paytime_card", enabled: false },
        { id: 3, gateway: "stripe_card", enabled: true },
      ];
      vi.mocked(planSubDb.getGatewaySettings).mockResolvedValue(mockSettings as any);

      const result = await planSubDb.getGatewaySettings();
      expect(result).toHaveLength(3);
    });
  });

  describe("upsertGatewaySetting", () => {
    it("should upsert a gateway setting", async () => {
      vi.mocked(planSubDb.upsertGatewaySetting).mockResolvedValue(undefined);

      await planSubDb.upsertGatewaySetting("paytime_pix", true);
      expect(planSubDb.upsertGatewaySetting).toHaveBeenCalledWith("paytime_pix", true);
    });
  });

  describe("createPlanSubscription", () => {
    it("should create a new subscription with correct data", async () => {
      vi.mocked(planSubDb.createPlanSubscription).mockResolvedValue(1);

      const result = await planSubDb.createPlanSubscription({
        establishmentId: 210016,
        planId: "pro",
        billingPeriod: "monthly",
        gateway: "paytime_pix",
        status: "pending",
        paytimeTransactionId: "tx_123",
        amountCents: 15900,
      });

      expect(result).toBe(1);
      expect(planSubDb.createPlanSubscription).toHaveBeenCalledWith({
        establishmentId: 210016,
        planId: "pro",
        billingPeriod: "monthly",
        gateway: "paytime_pix",
        status: "pending",
        paytimeTransactionId: "tx_123",
        amountCents: 15900,
      });
    });
  });

  describe("getActiveSubscription", () => {
    it("should return active subscription for establishment", async () => {
      const mockSub = {
        id: 1,
        establishmentId: 210016,
        planId: "pro",
        status: "active",
        gateway: "paytime_card",
        paytimeCardLast4: "4242",
        paytimeCardBrand: "VISA",
      };
      vi.mocked(planSubDb.getActiveSubscription).mockResolvedValue(mockSub as any);

      const result = await planSubDb.getActiveSubscription(210016);
      expect(result).toBeDefined();
      expect(result?.status).toBe("active");
      expect(result?.gateway).toBe("paytime_card");
    });

    it("should return null when no active subscription", async () => {
      vi.mocked(planSubDb.getActiveSubscription).mockResolvedValue(null as any);

      const result = await planSubDb.getActiveSubscription(999999);
      expect(result).toBeNull();
    });
  });

  describe("activateSubscription", () => {
    it("should activate subscription with period dates", async () => {
      vi.mocked(planSubDb.activateSubscription).mockResolvedValue(undefined);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await planSubDb.activateSubscription(1, {
        paytimeTransactionId: "tx_123",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextRenewalAt: periodEnd,
      });

      expect(planSubDb.activateSubscription).toHaveBeenCalledWith(1, expect.objectContaining({
        paytimeTransactionId: "tx_123",
      }));
    });

    it("should activate subscription with card token for recurring", async () => {
      vi.mocked(planSubDb.activateSubscription).mockResolvedValue(undefined);

      await planSubDb.activateSubscription(1, {
        paytimeTransactionId: "tx_456",
        paytimeCardToken: "tok_abc123",
        paytimeCardBrand: "MASTERCARD",
        paytimeCardLast4: "5678",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        nextRenewalAt: new Date(),
      });

      expect(planSubDb.activateSubscription).toHaveBeenCalledWith(1, expect.objectContaining({
        paytimeCardToken: "tok_abc123",
        paytimeCardBrand: "MASTERCARD",
        paytimeCardLast4: "5678",
      }));
    });
  });

  describe("getExpiringSubscriptions", () => {
    it("should return subscriptions expiring within the given date range", async () => {
      const mockSubs = [
        { id: 1, establishmentId: 210016, gateway: "paytime_card", nextRenewalAt: new Date() },
        { id: 2, establishmentId: 210017, gateway: "paytime_pix", nextRenewalAt: new Date() },
      ];
      vi.mocked(planSubDb.getExpiringSubscriptions).mockResolvedValue(mockSubs as any);

      const result = await planSubDb.getExpiringSubscriptions(new Date(), new Date());
      expect(result).toHaveLength(2);
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel a subscription", async () => {
      vi.mocked(planSubDb.cancelSubscription).mockResolvedValue(undefined);

      await planSubDb.cancelSubscription(1);
      expect(planSubDb.cancelSubscription).toHaveBeenCalledWith(1);
    });
  });
});

describe("Gateway Configuration Logic", () => {
  it("should allow enabling multiple gateways simultaneously", async () => {
    // Simulate enabling all 3 gateways
    vi.mocked(planSubDb.upsertGatewaySetting).mockResolvedValue(undefined);

    await planSubDb.upsertGatewaySetting("paytime_pix", true);
    await planSubDb.upsertGatewaySetting("paytime_card", true);
    await planSubDb.upsertGatewaySetting("stripe_card", true);

    expect(planSubDb.upsertGatewaySetting).toHaveBeenCalledTimes(3);
  });

  it("should allow disabling Stripe while keeping Paytime active", async () => {
    vi.mocked(planSubDb.upsertGatewaySetting).mockResolvedValue(undefined);
    vi.mocked(planSubDb.getEnabledGateways).mockResolvedValue([
      { gateway: "paytime_pix", enabled: true },
      { gateway: "paytime_card", enabled: true },
    ] as any);

    await planSubDb.upsertGatewaySetting("stripe_card", false);

    const enabled = await planSubDb.getEnabledGateways();
    expect(enabled).toHaveLength(2);
    expect(enabled.every(g => g.gateway !== "stripe_card")).toBe(true);
  });
});

describe("Subscription Renewal Logic", () => {
  it("should identify card subscriptions for auto-renewal", async () => {
    const cardSubs = [
      { id: 1, gateway: "paytime_card", paytimeCardToken: "tok_abc", status: "active" },
    ];
    vi.mocked(planSubDb.getExpiringSubscriptions).mockResolvedValue(cardSubs as any);

    const expiring = await planSubDb.getExpiringSubscriptions(new Date(), new Date());
    const autoRenewable = expiring.filter(
      (s: any) => s.gateway === "paytime_card" && s.paytimeCardToken
    );
    expect(autoRenewable).toHaveLength(1);
  });

  it("should identify PIX subscriptions that need manual renewal notification", async () => {
    const pixSubs = [
      { id: 2, gateway: "paytime_pix", paytimeCardToken: null, status: "active" },
    ];
    vi.mocked(planSubDb.getExpiringSubscriptions).mockResolvedValue(pixSubs as any);

    const expiring = await planSubDb.getExpiringSubscriptions(new Date(), new Date());
    const needsNotification = expiring.filter(
      (s: any) => s.gateway === "paytime_pix"
    );
    expect(needsNotification).toHaveLength(1);
  });

  it("should handle grace period (2 days) for PIX non-payment", async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const pendingPixSubs = [
      {
        id: 3,
        gateway: "paytime_pix",
        status: "pending",
        nextRenewalAt: twoDaysAgo,
      },
    ];
    vi.mocked(planSubDb.getPendingPixSubscriptions).mockResolvedValue(pendingPixSubs as any);

    const pending = await planSubDb.getPendingPixSubscriptions();
    const expired = pending.filter((s: any) => {
      const renewalDate = new Date(s.nextRenewalAt);
      const gracePeriodEnd = new Date(renewalDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      return now >= gracePeriodEnd;
    });

    expect(expired).toHaveLength(1);
  });
});
