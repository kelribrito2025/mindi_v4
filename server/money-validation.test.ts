import { describe, it, expect } from "vitest";
import { zMoney, zMoneyOptional, parseMoney, validateOrderTotal } from "../shared/validation";

describe("zMoney schema", () => {
  it("should accept valid monetary values", () => {
    expect(zMoney.safeParse("0").success).toBe(true);
    expect(zMoney.safeParse("0.00").success).toBe(true);
    expect(zMoney.safeParse("12.50").success).toBe(true);
    expect(zMoney.safeParse("1234.99").success).toBe(true);
    expect(zMoney.safeParse("9999999.99").success).toBe(true);
    expect(zMoney.safeParse("100").success).toBe(true);
    expect(zMoney.safeParse("89").success).toBe(true);
  });

  it("should reject invalid monetary values", () => {
    expect(zMoney.safeParse("").success).toBe(false); // empty
    expect(zMoney.safeParse("abc").success).toBe(false); // letters
    expect(zMoney.safeParse("-10.00").success).toBe(false); // negative
    expect(zMoney.safeParse("12.999").success).toBe(false); // 3 decimal places
    expect(zMoney.safeParse("12,50").success).toBe(false); // comma instead of dot
    expect(zMoney.safeParse("0.01; DROP TABLE orders").success).toBe(false); // injection
    expect(zMoney.safeParse("99999999999.99").success).toBe(false); // too large (>10 digits)
  });

  it("should reject values above the max limit", () => {
    expect(zMoney.safeParse("10000000.00").success).toBe(false); // > 9999999.99
  });
});

describe("zMoneyOptional schema", () => {
  it("should accept undefined", () => {
    expect(zMoneyOptional.safeParse(undefined).success).toBe(true);
  });

  it("should accept valid monetary values", () => {
    expect(zMoneyOptional.safeParse("12.50").success).toBe(true);
  });

  it("should reject invalid monetary values", () => {
    expect(zMoneyOptional.safeParse("abc").success).toBe(false);
  });
});

describe("parseMoney", () => {
  it("should parse valid monetary strings", () => {
    expect(parseMoney("12.50")).toBe(12.50);
    expect(parseMoney("0")).toBe(0);
    expect(parseMoney("1234.99")).toBe(1234.99);
  });

  it("should return 0 for null/undefined/empty", () => {
    expect(parseMoney(null)).toBe(0);
    expect(parseMoney(undefined)).toBe(0);
    expect(parseMoney("")).toBe(0);
  });

  it("should return 0 for negative values", () => {
    expect(parseMoney("-10")).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    expect(parseMoney("12.999")).toBe(13.00);
    expect(parseMoney("12.001")).toBe(12.00);
  });
});

describe("validateOrderTotal", () => {
  it("should validate correct total (subtotal + deliveryFee - discount)", () => {
    const result = validateOrderTotal({
      claimedSubtotal: "100.00",
      claimedDeliveryFee: "10.00",
      claimedDiscount: "5.00",
      claimedTotal: "105.00",
    });
    expect(result.valid).toBe(true);
    expect(result.expectedTotal).toBe(105.00);
  });

  it("should validate correct total with cashback", () => {
    const result = validateOrderTotal({
      claimedSubtotal: "100.00",
      claimedDeliveryFee: "10.00",
      claimedDiscount: "0",
      claimedTotal: "100.00",
      claimedCashback: "10.00",
    });
    expect(result.valid).toBe(true);
    expect(result.expectedTotal).toBe(100.00);
  });

  it("should reject manipulated total (too low)", () => {
    const result = validateOrderTotal({
      claimedSubtotal: "100.00",
      claimedDeliveryFee: "10.00",
      claimedDiscount: "0",
      claimedTotal: "0.01", // manipulated!
    });
    expect(result.valid).toBe(false);
    expect(result.diff).toBeGreaterThan(0.02);
  });

  it("should reject manipulated total (too high)", () => {
    const result = validateOrderTotal({
      claimedSubtotal: "50.00",
      claimedDeliveryFee: "5.00",
      claimedDiscount: "0",
      claimedTotal: "200.00", // manipulated!
    });
    expect(result.valid).toBe(false);
  });

  it("should allow small rounding differences (R$ 0.01)", () => {
    const result = validateOrderTotal({
      claimedSubtotal: "33.33",
      claimedDeliveryFee: "5.00",
      claimedDiscount: "0",
      claimedTotal: "38.34", // 0.01 diff due to rounding
    });
    expect(result.valid).toBe(true);
  });

  it("should ensure total is never negative", () => {
    const result = validateOrderTotal({
      claimedSubtotal: "10.00",
      claimedDeliveryFee: "0",
      claimedDiscount: "20.00", // discount > subtotal
      claimedTotal: "0",
    });
    expect(result.valid).toBe(true);
    expect(result.expectedTotal).toBe(0);
  });
});
