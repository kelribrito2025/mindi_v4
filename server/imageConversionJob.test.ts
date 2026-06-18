import { describe, it, expect } from "vitest";
import { isLegacyImage } from "./imageConversionJob";

describe("imageConversionJob", () => {
  describe("isLegacyImage", () => {
    it("should detect PNG images as legacy", () => {
      expect(isLegacyImage("https://example.com/image.png")).toBe(true);
      expect(isLegacyImage("https://example.com/image.PNG")).toBe(true);
    });

    it("should detect JPG/JPEG images as legacy", () => {
      expect(isLegacyImage("https://example.com/image.jpg")).toBe(true);
      expect(isLegacyImage("https://example.com/image.jpeg")).toBe(true);
      expect(isLegacyImage("https://example.com/image.JPG")).toBe(true);
      expect(isLegacyImage("https://example.com/image.JPEG")).toBe(true);
    });

    it("should detect GIF images as legacy", () => {
      expect(isLegacyImage("https://example.com/image.gif")).toBe(true);
      expect(isLegacyImage("https://example.com/image.GIF")).toBe(true);
    });

    it("should detect legacy images with query parameters", () => {
      expect(isLegacyImage("https://example.com/image.png?v=123")).toBe(true);
      expect(isLegacyImage("https://example.com/image.jpg?width=400")).toBe(true);
      expect(isLegacyImage("https://example.com/image.jpeg?t=abc")).toBe(true);
      expect(isLegacyImage("https://example.com/image.gif?size=thumb")).toBe(true);
    });

    it("should NOT detect WebP images as legacy", () => {
      expect(isLegacyImage("https://example.com/image.webp")).toBe(false);
      expect(isLegacyImage("https://example.com/image.webp?v=1")).toBe(false);
    });

    it("should NOT detect SVG images as legacy", () => {
      expect(isLegacyImage("https://example.com/icon.svg")).toBe(false);
    });

    it("should handle empty or null-like values", () => {
      expect(isLegacyImage("")).toBe(false);
    });

    it("should handle URLs with complex paths", () => {
      expect(isLegacyImage("https://bucket.s3.amazonaws.com/products/123/photo.jpg")).toBe(true);
      expect(isLegacyImage("https://bucket.s3.amazonaws.com/converted/photo_123_abc.webp")).toBe(false);
    });
  });
});
