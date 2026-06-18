import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Stripe
const mockAccountsCreate = vi.fn();
const mockAccountLinksCreate = vi.fn();
const mockAccountsRetrieve = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockAccountsCreateLoginLink = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      accounts: {
        create: mockAccountsCreate,
        retrieve: mockAccountsRetrieve,
        createLoginLink: mockAccountsCreateLoginLink,
      },
      accountLinks: {
        create: mockAccountLinksCreate,
      },
      checkout: {
        sessions: {
          create: mockCheckoutSessionsCreate,
        },
      },
    })),
  };
});

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    stripeSecretKey: "sk_test_mock_key",
  },
}));

describe("Stripe Connect Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createConnectedAccount", () => {
    it("should create a connected account with correct parameters", async () => {
      mockAccountsCreate.mockResolvedValue({ id: "acct_test_123" });

      const { createConnectedAccount } = await import("./stripeConnect");
      const result = await createConnectedAccount({
        displayName: "Restaurante Teste",
        contactEmail: "teste@email.com",
      });

      expect(result.accountId).toBe("acct_test_123");
      expect(mockAccountsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "express",
          country: "BR",
          email: "teste@email.com",
          business_type: "individual",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: "Restaurante Teste",
            mcc: "5812",
          },
        })
      );
    });
  });

  describe("createAccountLink", () => {
    it("should create an account link for onboarding", async () => {
      mockAccountLinksCreate.mockResolvedValue({
        url: "https://connect.stripe.com/setup/s/test",
      });

      const { createAccountLink } = await import("./stripeConnect");
      const result = await createAccountLink({
        accountId: "acct_test_123",
        returnUrl: "https://example.com/return",
        refreshUrl: "https://example.com/refresh",
      });

      expect(result.url).toBe("https://connect.stripe.com/setup/s/test");
      expect(mockAccountLinksCreate).toHaveBeenCalledWith({
        account: "acct_test_123",
        type: "account_onboarding",
        return_url: "https://example.com/return",
        refresh_url: "https://example.com/refresh",
      });
    });
  });

  describe("getAccountStatus", () => {
    it("should return account status correctly", async () => {
      mockAccountsRetrieve.mockResolvedValue({
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          past_due: [],
        },
      });

      const { getAccountStatus } = await import("./stripeConnect");
      const result = await getAccountStatus("acct_test_123");

      expect(result.chargesEnabled).toBe(true);
      expect(result.payoutsEnabled).toBe(true);
      expect(result.detailsSubmitted).toBe(true);
      expect(result.requirementsCurrentlyDue).toEqual([]);
      expect(result.requirementsPastDue).toEqual([]);
    });

    it("should handle incomplete account status", async () => {
      mockAccountsRetrieve.mockResolvedValue({
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        requirements: {
          currently_due: ["individual.first_name", "individual.last_name"],
          past_due: [],
        },
      });

      const { getAccountStatus } = await import("./stripeConnect");
      const result = await getAccountStatus("acct_test_456");

      expect(result.chargesEnabled).toBe(false);
      expect(result.detailsSubmitted).toBe(false);
      expect(result.requirementsCurrentlyDue).toHaveLength(2);
    });
  });

  describe("calculatePlatformFee", () => {
    it("should calculate fee as 3.99% + R$ 0.89 fixed", async () => {
      const { calculatePlatformFee } = await import("./stripeConnect");

      // R$ 100.00 = 10000 cents
      // 10000 * 0.0399 = 399 + 89 = 488 cents = R$ 4.88
      expect(calculatePlatformFee(10000)).toBe(488);
    });

    it("should calculate fee correctly for R$ 50.00", async () => {
      const { calculatePlatformFee } = await import("./stripeConnect");

      // R$ 50.00 = 5000 cents
      // 5000 * 0.0399 = 199.5 + 89 = 288.5 → rounded to 289 cents = R$ 2.89
      expect(calculatePlatformFee(5000)).toBe(289);
    });

    it("should calculate fee correctly for R$ 20.00", async () => {
      const { calculatePlatformFee } = await import("./stripeConnect");

      // R$ 20.00 = 2000 cents
      // 2000 * 0.0399 = 79.8 + 89 = 168.8 → rounded to 169 cents = R$ 1.69
      expect(calculatePlatformFee(2000)).toBe(169);
    });

    it("should calculate fee correctly for R$ 200.00", async () => {
      const { calculatePlatformFee } = await import("./stripeConnect");

      // R$ 200.00 = 20000 cents
      // 20000 * 0.0399 = 798 + 89 = 887 cents = R$ 8.87
      expect(calculatePlatformFee(20000)).toBe(887);
    });
  });

  describe("createOrderCheckoutSession", () => {
    it("should create a checkout session with correct destination charge", async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: "cs_test_session_123",
        url: "https://checkout.stripe.com/pay/cs_test_session_123",
      });

      const { createOrderCheckoutSession, calculatePlatformFee } = await import("./stripeConnect");

      const result = await createOrderCheckoutSession({
        connectedAccountId: "acct_test_123",
        orderItems: [
          { name: "Pizza Margherita", quantity: 2, priceInCents: 3500, description: "Queijo, Tomate" },
          { name: "Coca-Cola", quantity: 1, priceInCents: 800 },
        ],
        deliveryFeeInCents: 500,
        customerEmail: "cliente@email.com",
        customerName: "João Silva",
        establishmentId: 1,
        establishmentName: "Restaurante Teste",
        orderData: JSON.stringify({ test: true }),
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.sessionId).toBe("cs_test_session_123");
      expect(result.url).toBe("https://checkout.stripe.com/pay/cs_test_session_123");

      // Verify the checkout session was created with correct parameters
      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      
      // Verify payment_method_types
      expect(callArgs.payment_method_types).toEqual(["card"]);
      expect(callArgs.mode).toBe("payment");
      expect(callArgs.customer_email).toBe("cliente@email.com");

      // Verify line items (2 products + 1 delivery fee)
      expect(callArgs.line_items).toHaveLength(3);
      expect(callArgs.line_items[0].price_data.unit_amount).toBe(3500);
      expect(callArgs.line_items[0].quantity).toBe(2);
      expect(callArgs.line_items[1].price_data.unit_amount).toBe(800);
      expect(callArgs.line_items[2].price_data.product_data.name).toBe("Taxa de entrega");
      expect(callArgs.line_items[2].price_data.unit_amount).toBe(500);

      // Verify destination charge
      expect(callArgs.payment_intent_data.transfer_data.destination).toBe("acct_test_123");

      // Verify platform fee (3.99% + R$ 0.89)
      // Total: (3500*2 + 800 + 500) = 8300 cents
      // Fee: 8300 * 0.0399 + 89 = 331.17 + 89 = 420.17 → rounded to 420
      const expectedTotal = 3500 * 2 + 800 + 500;
      const expectedFee = calculatePlatformFee(expectedTotal);
      expect(callArgs.payment_intent_data.application_fee_amount).toBe(expectedFee);

      // Verify metadata
      expect(callArgs.metadata.type).toBe("online_order");
      expect(callArgs.metadata.establishment_id).toBe("1");
    });

    it("should not add delivery fee line item when fee is 0", async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: "cs_test_no_delivery",
        url: "https://checkout.stripe.com/pay/cs_test_no_delivery",
      });

      const { createOrderCheckoutSession } = await import("./stripeConnect");

      await createOrderCheckoutSession({
        connectedAccountId: "acct_test_123",
        orderItems: [
          { name: "Pizza", quantity: 1, priceInCents: 3000 },
        ],
        deliveryFeeInCents: 0,
        establishmentId: 1,
        establishmentName: "Restaurante",
        orderData: "{}",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      // Should only have 1 line item (no delivery fee)
      expect(callArgs.line_items).toHaveLength(1);
    });

    it("should apply 3.99% + R$ 0.89 fee on R$ 100.00 order", async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: "cs_test_fee",
        url: "https://checkout.stripe.com/pay/cs_test_fee",
      });

      const { createOrderCheckoutSession, PLATFORM_FEE_PERCENT, PLATFORM_FEE_FIXED_CENTS } = await import("./stripeConnect");
      expect(PLATFORM_FEE_PERCENT).toBe(3.99);
      expect(PLATFORM_FEE_FIXED_CENTS).toBe(89);

      await createOrderCheckoutSession({
        connectedAccountId: "acct_test_123",
        orderItems: [
          { name: "Item", quantity: 1, priceInCents: 10000 }, // R$ 100.00
        ],
        deliveryFeeInCents: 0,
        establishmentId: 1,
        establishmentName: "Restaurante",
        orderData: "{}",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      // 10000 * 0.0399 = 399 + 89 = 488 cents = R$ 4.88
      expect(callArgs.payment_intent_data.application_fee_amount).toBe(488);
    });
  });

  describe("createDashboardLink", () => {
    it("should create a dashboard login link", async () => {
      mockAccountsCreateLoginLink.mockResolvedValue({
        url: "https://connect.stripe.com/express/login/test",
      });

      const { createDashboardLink } = await import("./stripeConnect");
      const result = await createDashboardLink("acct_test_123");

      expect(result.url).toBe("https://connect.stripe.com/express/login/test");
      expect(mockAccountsCreateLoginLink).toHaveBeenCalledWith("acct_test_123");
    });
  });
});
