import { describe, it, expect } from "vitest";
import { PLAN_PACKAGES, SMS_PACKAGES } from "./stripe";

describe("Stripe Subscription Configuration", () => {
  describe("PLAN_PACKAGES", () => {
    it("should have exactly 3 plan packages (lite, basic, pro)", () => {
      expect(PLAN_PACKAGES).toBeDefined();
      expect(PLAN_PACKAGES.length).toBe(3);
      expect(PLAN_PACKAGES.map(p => p.id)).toEqual(["lite", "basic", "pro"]);
    });

    it("should have Starter (lite) plan defined", () => {
      const starter = PLAN_PACKAGES.find((p) => p.id === "lite");
      expect(starter).toBeDefined();
      expect(starter!.name).toBe("Plano Starter");
      expect(starter!.priceInCents).toBe(4900); // R$ 49,00
    });

    it("should have Essencial (basic) plan with correct price", () => {
      const essencial = PLAN_PACKAGES.find((p) => p.id === "basic");
      expect(essencial).toBeDefined();
      expect(essencial!.name).toBe("Plano Essencial");
      expect(essencial!.priceInCents).toBe(8900); // R$ 89,00
    });

    it("should have Pro plan defined", () => {
      const pro = PLAN_PACKAGES.find((p) => p.id === "pro");
      expect(pro).toBeDefined();
      expect(pro!.name).toBe("Plano Pro");
      expect(pro!.priceInCents).toBe(14900); // R$ 149,00
    });

    it("should NOT have Enterprise plan", () => {
      const enterprise = PLAN_PACKAGES.find((p) => p.id === "enterprise");
      expect(enterprise).toBeUndefined();
    });

    it("all plans should have required fields", () => {
      for (const plan of PLAN_PACKAGES) {
        expect(plan.id).toBeTruthy();
        expect(plan.name).toBeTruthy();
        expect(plan.priceInCents).toBeGreaterThan(0);
        expect(plan.description).toBeTruthy();
      }
    });

    it("Essencial plan should be marked as popular", () => {
      const essencial = PLAN_PACKAGES.find((p) => p.id === "basic");
      expect(essencial!.popular).toBe(true);
    });
  });

  describe("SMS_PACKAGES", () => {
    it("should have SMS packages defined", () => {
      expect(SMS_PACKAGES).toBeDefined();
      expect(SMS_PACKAGES.length).toBeGreaterThan(0);
    });
  });

  describe("Subscription mode validation", () => {
    it("createPlanCheckoutSession should be exported as a function", async () => {
      const stripe = await import("./stripe");
      expect(typeof stripe.createPlanCheckoutSession).toBe("function");
    });

    it("cancelSubscription should be exported as a function", async () => {
      const stripe = await import("./stripe");
      expect(typeof stripe.cancelSubscription).toBe("function");
    });

    it("getSubscriptionDetails should be exported as a function", async () => {
      const stripe = await import("./stripe");
      expect(typeof stripe.getSubscriptionDetails).toBe("function");
    });
  });

  describe("Database helpers validation", () => {
    it("activatePlan should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.activatePlan).toBe("function");
    });

    it("deactivatePlan should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.deactivatePlan).toBe("function");
    });

    it("getEstablishmentByStripeCustomerId should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.getEstablishmentByStripeCustomerId).toBe("function");
    });

    it("updateSubscriptionId should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.updateSubscriptionId).toBe("function");
    });
  });
});
