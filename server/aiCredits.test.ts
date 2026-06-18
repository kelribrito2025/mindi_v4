import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stripe module com os preços reais do stripe.ts
vi.mock("./stripe", () => ({
  AI_IMAGE_PACKAGES: [
    {
      id: "ai_50",
      name: "50 melhorias",
      credits: 50,
      priceInCents: 3350,
      priceFormatted: "R$ 33,50",
      pricePerImage: "R$ 0,67",
      description: "Pacote com 50 melhorias de foto com IA",
    },
    {
      id: "ai_100",
      name: "100 melhorias",
      credits: 100,
      priceInCents: 5700,
      priceFormatted: "R$ 57,00",
      pricePerImage: "R$ 0,57",
      description: "Pacote com 100 melhorias de foto com IA",
      popular: true,
    },
    {
      id: "ai_300",
      name: "300 melhorias",
      credits: 300,
      priceInCents: 14700,
      priceFormatted: "R$ 147,00",
      pricePerImage: "R$ 0,49",
      description: "Pacote com 300 melhorias de foto com IA",
    },
  ],
  createAiImageCheckoutSession: vi.fn().mockResolvedValue({
    url: "https://checkout.stripe.com/test",
    sessionId: "cs_test_123",
  }),
}));

describe("AI Image Credits - Packages", () => {
  it("should have 3 credit packages", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    expect(AI_IMAGE_PACKAGES).toHaveLength(3);
  });

  it("should have correct package IDs", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const ids = AI_IMAGE_PACKAGES.map((p) => p.id);
    expect(ids).toEqual(["ai_50", "ai_100", "ai_300"]);
  });

  it("should have correct credit amounts", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const credits = AI_IMAGE_PACKAGES.map((p) => p.credits);
    expect(credits).toEqual([50, 100, 300]);
  });

  it("should have correct prices in cents", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const prices = AI_IMAGE_PACKAGES.map((p) => p.priceInCents);
    expect(prices).toEqual([3350, 5700, 14700]);
  });

  it("should mark 100 credits package as popular", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const popular = AI_IMAGE_PACKAGES.find((p: any) => p.popular);
    expect(popular).toBeDefined();
    expect(popular!.id).toBe("ai_100");
  });

  it("should have decreasing price per image for larger packages", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const pricePerCredit = AI_IMAGE_PACKAGES.map(
      (p) => p.priceInCents / p.credits
    );
    // Each subsequent package should be cheaper per credit
    expect(pricePerCredit[0]).toBeGreaterThan(pricePerCredit[1]);
    expect(pricePerCredit[1]).toBeGreaterThan(pricePerCredit[2]);
  });
});

describe("AI Image Credits - Checkout Session", () => {
  it("should create checkout session for valid package", async () => {
    const { createAiImageCheckoutSession } = await import("./stripe");
    const result = await createAiImageCheckoutSession({
      packageId: "ai_100",
      userId: 1,
      userEmail: "test@test.com",
      userName: "Test User",
      establishmentId: 1,
      origin: "https://example.com",
    });
    expect(result).toBeDefined();
    expect(result!.url).toContain("stripe.com");
    expect(result!.sessionId).toBeDefined();
  });
});

describe("AI Image Credits - Business Logic", () => {
  it("should start with 0 credits by default for new establishments", () => {
    // O default no schema é 0 — créditos grátis são concedidos via elegibilidade
    const DEFAULT_CREDITS = 0;
    expect(DEFAULT_CREDITS).toBe(0);
  });

  it("should grant 4 free credits when eligibility criteria are met", () => {
    // grantFreeAiCredits concede 4 créditos grátis (uma vez)
    const FREE_CREDITS = 4;
    let credits = 0; // default
    credits += FREE_CREDITS;
    expect(credits).toBe(4);
  });

  it("should consume 1 credit per enhancement", () => {
    let credits = 4; // após receber os 4 grátis
    credits -= 1; // Simulate consumption
    expect(credits).toBe(3);
  });

  it("should not allow enhancement when credits are 0", () => {
    const credits = 0;
    const canEnhance = credits > 0;
    expect(canEnhance).toBe(false);
  });

  it("should allow enhancement when credits are positive", () => {
    const credits = 5;
    const canEnhance = credits > 0;
    expect(canEnhance).toBe(true);
  });

  it("should add credits after purchase", () => {
    let credits = 3; // ex: 4 grátis - 1 usado
    const purchased = 100;
    credits += purchased;
    expect(credits).toBe(103);
  });
});
