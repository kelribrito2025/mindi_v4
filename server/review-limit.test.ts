import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for the fakeReviewCount validation limit (max 250).
 * 
 * Business rule: When reviews are disabled, the fake review count
 * displayed on the public menu must be limited to a maximum of 250.
 */

// Replicate the backend validation schema for fakeReviewCount
const fakeReviewCountSchema = z.number().min(0).max(250);

// Replicate the frontend clamping logic
function clampReviewCount(value: number): number {
  return Math.min(Math.max(value, 0), 250);
}

// Replicate the load-from-database clamping
function loadFakeReviewCount(dbValue: number | null | undefined): number {
  return Math.min(dbValue ?? 250, 250);
}

describe("Fake Review Count Limit (max 250)", () => {
  describe("Backend validation (zod schema)", () => {
    it("should accept 0", () => {
      expect(fakeReviewCountSchema.parse(0)).toBe(0);
    });

    it("should accept 250", () => {
      expect(fakeReviewCountSchema.parse(250)).toBe(250);
    });

    it("should accept 100", () => {
      expect(fakeReviewCountSchema.parse(100)).toBe(100);
    });

    it("should reject 251", () => {
      expect(() => fakeReviewCountSchema.parse(251)).toThrow();
    });

    it("should reject 9999", () => {
      expect(() => fakeReviewCountSchema.parse(9999)).toThrow();
    });

    it("should reject -1", () => {
      expect(() => fakeReviewCountSchema.parse(-1)).toThrow();
    });

    it("should reject 355 (old default)", () => {
      expect(() => fakeReviewCountSchema.parse(355)).toThrow();
    });
  });

  describe("Frontend clamping logic", () => {
    it("should clamp 300 to 250", () => {
      expect(clampReviewCount(300)).toBe(250);
    });

    it("should clamp 9999 to 250", () => {
      expect(clampReviewCount(9999)).toBe(250);
    });

    it("should clamp -5 to 0", () => {
      expect(clampReviewCount(-5)).toBe(0);
    });

    it("should keep 100 as 100", () => {
      expect(clampReviewCount(100)).toBe(100);
    });

    it("should keep 250 as 250", () => {
      expect(clampReviewCount(250)).toBe(250);
    });

    it("should keep 0 as 0", () => {
      expect(clampReviewCount(0)).toBe(0);
    });
  });

  describe("Load from database with clamping", () => {
    it("should clamp old value 355 to 250", () => {
      expect(loadFakeReviewCount(355)).toBe(250);
    });

    it("should return 250 for null/undefined", () => {
      expect(loadFakeReviewCount(null)).toBe(250);
      expect(loadFakeReviewCount(undefined)).toBe(250);
    });

    it("should keep 100 as 100", () => {
      expect(loadFakeReviewCount(100)).toBe(100);
    });

    it("should keep 0 as 0", () => {
      expect(loadFakeReviewCount(0)).toBe(0);
    });

    it("should clamp 500 to 250", () => {
      expect(loadFakeReviewCount(500)).toBe(250);
    });
  });
});
