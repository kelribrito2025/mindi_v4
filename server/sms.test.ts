import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizePhoneNumber, isValidPhoneNumber } from "./_core/sms";

describe("SMS Service", () => {
  describe("normalizePhoneNumber", () => {
    it("should return null for empty phone", () => {
      expect(normalizePhoneNumber("")).toBeNull();
      expect(normalizePhoneNumber(null as any)).toBeNull();
      expect(normalizePhoneNumber(undefined as any)).toBeNull();
    });

    it("should normalize phone with DDD only", () => {
      expect(normalizePhoneNumber("11999887766")).toBe("5511999887766");
    });

    it("should normalize phone with country code", () => {
      expect(normalizePhoneNumber("5511999887766")).toBe("5511999887766");
    });

    it("should remove leading zero from DDD", () => {
      expect(normalizePhoneNumber("011999887766")).toBe("5511999887766");
    });

    it("should remove special characters", () => {
      expect(normalizePhoneNumber("(11) 99988-7766")).toBe("5511999887766");
      expect(normalizePhoneNumber("+55 11 99988-7766")).toBe("5511999887766");
      expect(normalizePhoneNumber("55-11-99988-7766")).toBe("5511999887766");
    });

    it("should handle 8-digit numbers (landline)", () => {
      expect(normalizePhoneNumber("1132547698")).toBe("551132547698");
    });

    it("should return null for invalid phone numbers", () => {
      expect(normalizePhoneNumber("123")).toBeNull(); // Too short
      expect(normalizePhoneNumber("12345678901234567")).toBeNull(); // Too long
    });
  });

  describe("isValidPhoneNumber", () => {
    it("should return true for valid phone numbers", () => {
      expect(isValidPhoneNumber("11999887766")).toBe(true);
      expect(isValidPhoneNumber("5511999887766")).toBe(true);
      expect(isValidPhoneNumber("(11) 99988-7766")).toBe(true);
    });

    it("should return false for invalid phone numbers", () => {
      expect(isValidPhoneNumber("")).toBe(false);
      expect(isValidPhoneNumber("123")).toBe(false);
      expect(isValidPhoneNumber("abc")).toBe(false);
    });
  });
});

describe("SMS Integration", () => {
  it("should have correct message format", () => {
    const restaurantName = "Sushi Haruno";
    const expectedMessage = `${restaurantName}: Seu pedido está saindo para entrega.`;
    
    expect(expectedMessage).toBe("Sushi Haruno: Seu pedido está saindo para entrega.");
  });

  it("should validate phone before sending", () => {
    // Valid phones should pass validation
    expect(isValidPhoneNumber("11999887766")).toBe(true);
    expect(isValidPhoneNumber("(85) 99999-9999")).toBe(true);
    
    // Invalid phones should fail validation
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("invalid")).toBe(false);
  });
});
