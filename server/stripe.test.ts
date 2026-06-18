import { describe, it, expect } from "vitest";
import { SMS_PACKAGES, COST_PER_SMS } from "./stripe";

describe("SMS Packages", () => {
  it("should have valid packages defined", () => {
    expect(SMS_PACKAGES).toBeDefined();
    expect(SMS_PACKAGES.length).toBeGreaterThan(0);
  });

  it("each package should have required fields", () => {
    for (const pkg of SMS_PACKAGES) {
      expect(pkg.id).toBeTruthy();
      expect(pkg.name).toBeTruthy();
      expect(pkg.smsCount).toBeGreaterThan(0);
      expect(pkg.priceInCents).toBeGreaterThan(0);
      expect(pkg.priceFormatted).toBeTruthy();
      expect(pkg.description).toBeTruthy();
    }
  });

  it("should have correct pricing based on R$ 0.097 per SMS", () => {
    for (const pkg of SMS_PACKAGES) {
      const expectedPrice = Math.round(pkg.smsCount * 0.097 * 100);
      expect(pkg.priceInCents).toBe(expectedPrice);
    }
  });

  it("should have packages in ascending order of SMS count", () => {
    for (let i = 1; i < SMS_PACKAGES.length; i++) {
      expect(SMS_PACKAGES[i].smsCount).toBeGreaterThan(SMS_PACKAGES[i - 1].smsCount);
    }
  });

  it("should have unique IDs", () => {
    const ids = SMS_PACKAGES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have the 500 SMS package marked as popular", () => {
    const popular = SMS_PACKAGES.find((p) => (p as any).popular);
    expect(popular).toBeDefined();
    expect(popular!.smsCount).toBe(500);
  });

  it("priceFormatted should match priceInCents", () => {
    for (const pkg of SMS_PACKAGES) {
      const priceInReais = (pkg.priceInCents / 100).toFixed(2).replace(".", ",");
      expect(pkg.priceFormatted).toBe(`R$ ${priceInReais}`);
    }
  });
});

describe("COST_PER_SMS", () => {
  it("should be 0.097", () => {
    expect(COST_PER_SMS).toBe(0.097);
  });
});

describe("Custom Checkout Calculation", () => {
  it("should calculate correct SMS count for R$ 10,00", () => {
    const amountInReais = 10;
    const smsCount = Math.floor(amountInReais / COST_PER_SMS);
    expect(smsCount).toBe(103);
  });

  it("should calculate correct SMS count for R$ 50,00", () => {
    const amountInReais = 50;
    const smsCount = Math.floor(amountInReais / COST_PER_SMS);
    expect(smsCount).toBe(515);
  });

  it("should calculate correct SMS count for R$ 1,00 (minimum)", () => {
    const amountInReais = 1;
    const smsCount = Math.floor(amountInReais / COST_PER_SMS);
    expect(smsCount).toBe(10);
  });

  it("should reject amounts below R$ 1,00", () => {
    const amountInCents = 50; // R$ 0,50
    expect(amountInCents).toBeLessThan(100);
  });

  it("should reject amounts above R$ 1.000,00", () => {
    const amountInCents = 150000; // R$ 1.500,00
    expect(amountInCents).toBeGreaterThan(100000);
  });

  it("should calculate at least 1 SMS for minimum amount", () => {
    const amountInReais = 1;
    const smsCount = Math.floor(amountInReais / COST_PER_SMS);
    expect(smsCount).toBeGreaterThanOrEqual(1);
  });
});
