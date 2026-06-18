import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processImage, processSingleImage, generateBlurPlaceholder } from "./imageProcessor";
import { getThumbUrl, getOptimizedImageUrl } from "../shared/imageUtils";

// Helper: create a test PNG buffer of given dimensions
async function createTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  })
    .png()
    .toBuffer();
}

describe("imageProcessor", () => {
  describe("processImage (dual version)", () => {
    it("generates main and thumb buffers in WebP format", async () => {
      const input = await createTestImage(800, 600);
      const result = await processImage(input);

      expect(result.mainBuffer).toBeInstanceOf(Buffer);
      expect(result.thumbBuffer).toBeInstanceOf(Buffer);
      expect(result.mainBuffer.length).toBeGreaterThan(0);
      expect(result.thumbBuffer.length).toBeGreaterThan(0);

      const mainMeta = await sharp(result.mainBuffer).metadata();
      const thumbMeta = await sharp(result.thumbBuffer).metadata();
      expect(mainMeta.format).toBe("webp");
      expect(thumbMeta.format).toBe("webp");
    });

    it("respects max width of 1200px for main and 400px for thumb", async () => {
      const input = await createTestImage(2000, 1500);
      const result = await processImage(input);

      expect(result.mainWidth).toBeLessThanOrEqual(1200);
      expect(result.mainWidth).toBeGreaterThan(0);
      expect(result.thumbWidth).toBeLessThanOrEqual(400);
      expect(result.thumbWidth).toBeGreaterThan(0);
    });

    it("does not enlarge small images", async () => {
      const input = await createTestImage(300, 200);
      const result = await processImage(input);

      expect(result.mainWidth).toBe(300);
      expect(result.thumbWidth).toBe(300);
    });

    it("thumb is always smaller or equal to main in dimensions", async () => {
      const input = await createTestImage(1600, 1200);
      const result = await processImage(input);

      expect(result.thumbWidth).toBeLessThanOrEqual(result.mainWidth);
    });

    it("reduces file size compared to original PNG", async () => {
      const input = await createTestImage(1600, 1200);
      const result = await processImage(input);

      expect(result.mainSize).toBeLessThan(result.originalSize);
      expect(result.thumbSize).toBeLessThan(result.originalSize);
    });

    it("preserves aspect ratio", async () => {
      const input = await createTestImage(2000, 1000); // 2:1 ratio
      const result = await processImage(input);

      const mainRatio = result.mainWidth / result.mainHeight;
      const thumbRatio = result.thumbWidth / result.thumbHeight;

      expect(mainRatio).toBeCloseTo(2, 0);
      expect(thumbRatio).toBeCloseTo(2, 0);
    });

    it("returns correct originalSize", async () => {
      const input = await createTestImage(500, 500);
      const result = await processImage(input);

      expect(result.originalSize).toBe(input.length);
    });

    it("generates a blur placeholder as base64 data URI", async () => {
      const input = await createTestImage(800, 600);
      const result = await processImage(input);

      expect(result.blurDataUrl).toBeDefined();
      expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    });

    it("blur placeholder is very small (<1KB)", async () => {
      const input = await createTestImage(2000, 1500);
      const result = await processImage(input);

      // base64 data URI should be well under 1KB
      expect(result.blurDataUrl.length).toBeLessThan(1024);
    });
  });

  describe("generateBlurPlaceholder", () => {
    it("returns a valid base64 data URI", async () => {
      const input = await createTestImage(800, 600);
      const blurDataUrl = await generateBlurPlaceholder(input);

      expect(blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    });

    it("generates a very small placeholder (<500 bytes)", async () => {
      const input = await createTestImage(2000, 1500);
      const blurDataUrl = await generateBlurPlaceholder(input);

      // The base64 string itself should be very small
      expect(blurDataUrl.length).toBeLessThan(500);
    });

    it("works with small images without enlarging", async () => {
      const input = await createTestImage(10, 10);
      const blurDataUrl = await generateBlurPlaceholder(input);

      expect(blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    });

    it("is deterministic for the same input", async () => {
      const input = await createTestImage(400, 300);
      const blur1 = await generateBlurPlaceholder(input);
      const blur2 = await generateBlurPlaceholder(input);

      expect(blur1).toBe(blur2);
    });
  });

  describe("processSingleImage", () => {
    it("generates a single WebP buffer", async () => {
      const input = await createTestImage(800, 600);
      const result = await processSingleImage(input);

      expect(result.buffer).toBeInstanceOf(Buffer);
      const meta = await sharp(result.buffer).metadata();
      expect(meta.format).toBe("webp");
    });

    it("respects custom maxWidth parameter", async () => {
      const input = await createTestImage(2000, 1500);
      const result = await processSingleImage(input, 600);

      expect(result.width).toBeLessThanOrEqual(600);
    });

    it("returns correct metadata", async () => {
      const input = await createTestImage(500, 400);
      const result = await processSingleImage(input);

      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
      expect(result.originalSize).toBe(input.length);
      expect(result.size).toBe(result.buffer.length);
    });

    it("also generates blur placeholder for single version", async () => {
      const input = await createTestImage(800, 600);
      const result = await processSingleImage(input);

      expect(result.blurDataUrl).toBeDefined();
      expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
      expect(result.blurDataUrl.length).toBeLessThan(1024);
    });
  });
});

describe("imageUtils", () => {
  describe("getThumbUrl", () => {
    it("derives thumb URL from WebP main URL", () => {
      const mainUrl = "https://files.example.com/products/abc123.webp";
      expect(getThumbUrl(mainUrl)).toBe("https://files.example.com/products/abc123_thumb.webp");
    });

    it("returns original URL for non-WebP images", () => {
      const pngUrl = "https://files.example.com/products/abc123.png";
      expect(getThumbUrl(pngUrl)).toBe(pngUrl);

      const jpgUrl = "https://files.example.com/products/abc123.jpg";
      expect(getThumbUrl(jpgUrl)).toBe(jpgUrl);
    });

    it("does not double-suffix _thumb URLs", () => {
      const thumbUrl = "https://files.example.com/products/abc123_thumb.webp";
      expect(getThumbUrl(thumbUrl)).toBe(thumbUrl);
    });

    it("returns empty string for null/undefined", () => {
      expect(getThumbUrl(null)).toBe("");
      expect(getThumbUrl(undefined)).toBe("");
    });
  });

  describe("getOptimizedImageUrl", () => {
    it("returns main URL when useThumb is false", () => {
      const url = "https://files.example.com/products/abc123.webp";
      expect(getOptimizedImageUrl(url, false)).toBe(url);
    });

    it("returns thumb URL when useThumb is true", () => {
      const url = "https://files.example.com/products/abc123.webp";
      expect(getOptimizedImageUrl(url, true)).toBe("https://files.example.com/products/abc123_thumb.webp");
    });

    it("returns empty string for null", () => {
      expect(getOptimizedImageUrl(null)).toBe("");
    });
  });

  describe("srcset generation (getThumbUrl for responsive)", () => {
    it("can generate valid srcset string from main URL", () => {
      const mainUrl = "https://files.example.com/products/abc123.webp";
      const thumbUrl = getThumbUrl(mainUrl);
      const srcset = `${thumbUrl} 400w, ${mainUrl} 1200w`;

      expect(srcset).toBe(
        "https://files.example.com/products/abc123_thumb.webp 400w, https://files.example.com/products/abc123.webp 1200w"
      );
    });

    it("returns same URL for both when image is not WebP (no srcset benefit)", () => {
      const mainUrl = "https://files.example.com/products/old.png";
      const thumbUrl = getThumbUrl(mainUrl);

      // Both are the same, so srcset would have identical entries
      expect(thumbUrl).toBe(mainUrl);
    });
  });
});
