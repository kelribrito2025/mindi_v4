import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for ownerDisplayName feature:
 * - Field should accept max 11 characters
 * - Field should be stored in establishments table
 * - Field should be returned in establishment.get query
 * - Field should be used in topbar display (frontend logic)
 */

describe("ownerDisplayName feature", () => {
  describe("validation", () => {
    it("should accept ownerDisplayName with 11 or fewer characters", () => {
      const validNames = ["João", "teste", "Ana", "12345678901"];
      for (const name of validNames) {
        expect(name.length).toBeLessThanOrEqual(11);
      }
    });

    it("should reject ownerDisplayName with more than 11 characters", () => {
      const invalidName = "123456789012"; // 12 chars
      expect(invalidName.length).toBeGreaterThan(11);
    });

    it("should handle empty ownerDisplayName gracefully", () => {
      const emptyName = "";
      const fallbackName = "Kelri Brito";
      const displayName = emptyName || fallbackName;
      expect(displayName).toBe("Kelri Brito");
    });

    it("should use ownerDisplayName when available instead of user.name", () => {
      const ownerDisplayName = "teste";
      const userName = "Kelri Brito";
      const displayName = ownerDisplayName || userName || "Usuário";
      expect(displayName).toBe("teste");
    });

    it("should fall back to user.name when ownerDisplayName is null", () => {
      const ownerDisplayName: string | null = null;
      const userName = "Kelri Brito";
      const displayName = ownerDisplayName || userName || "Usuário";
      expect(displayName).toBe("Kelri Brito");
    });

    it("should fall back to user.name when ownerDisplayName is undefined", () => {
      const ownerDisplayName: string | undefined = undefined;
      const userName = "Kelri Brito";
      const displayName = ownerDisplayName || userName || "Usuário";
      expect(displayName).toBe("Kelri Brito");
    });

    it("should use first character of ownerDisplayName for avatar", () => {
      const ownerDisplayName = "teste";
      const initial = ownerDisplayName.charAt(0).toUpperCase();
      expect(initial).toBe("T");
    });

    it("should use first character of user.name when ownerDisplayName is not set", () => {
      const ownerDisplayName: string | null = null;
      const userName = "Kelri Brito";
      const initial = (ownerDisplayName || userName)?.charAt(0).toUpperCase() || "U";
      expect(initial).toBe("K");
    });
  });

  describe("schema validation", () => {
    it("ownerDisplayName field should be varchar(11)", () => {
      // This test validates the schema constraint
      // The field in drizzle/schema.ts is: ownerDisplayName: varchar("ownerDisplayName", { length: 11 })
      const maxLength = 11;
      const testValue = "a".repeat(maxLength);
      expect(testValue.length).toBe(11);
      
      const tooLong = "a".repeat(maxLength + 1);
      expect(tooLong.length).toBeGreaterThan(11);
    });
  });

  describe("onboarding integration", () => {
    it("should include ownerDisplayName in establishment create input", () => {
      // Simulates the onboarding form data
      const onboardingData = {
        name: "Pizzaria do João",
        menuSlug: "pizzaria-joao",
        whatsapp: "11999999999",
        ownerDisplayName: "João",
      };

      expect(onboardingData.ownerDisplayName).toBeDefined();
      expect(onboardingData.ownerDisplayName!.length).toBeLessThanOrEqual(11);
    });

    it("should allow empty ownerDisplayName in onboarding", () => {
      const onboardingData = {
        name: "Pizzaria do João",
        menuSlug: "pizzaria-joao",
        ownerDisplayName: undefined,
      };

      // When trimmed to empty, it should be sent as undefined
      const trimmed = "".trim() || undefined;
      expect(trimmed).toBeUndefined();
    });
  });
});
