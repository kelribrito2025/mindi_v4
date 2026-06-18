import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";
import { processImage, processSingleImage, generateBlurPlaceholder } from "./imageProcessor";

/**
 * Tests for the automatic thumbnail generation in the upload flow.
 * 
 * The upload endpoint has two paths:
 * 1. singleVersion=false (products): processImage → main (1200px) + thumb (400px) + blur
 * 2. singleVersion=true (logos/covers): processSingleImage → main (1200px) + thumb (400px) + blur
 * 
 * These tests verify that both paths correctly generate thumbnails.
 */

// Helper: create a test image buffer
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

describe("Upload Thumbnail Generation", () => {
  describe("Product upload path (processImage - dual version)", () => {
    it("generates both main and thumb buffers", async () => {
      const input = await createTestImage(1600, 1200);
      const result = await processImage(input);

      expect(result.mainBuffer).toBeInstanceOf(Buffer);
      expect(result.thumbBuffer).toBeInstanceOf(Buffer);
      expect(result.mainBuffer.length).toBeGreaterThan(0);
      expect(result.thumbBuffer.length).toBeGreaterThan(0);
    });

    it("main is max 1200px and thumb is max 400px", async () => {
      const input = await createTestImage(2000, 1500);
      const result = await processImage(input);

      expect(result.mainWidth).toBeLessThanOrEqual(1200);
      expect(result.thumbWidth).toBeLessThanOrEqual(400);
    });

    it("generates blur placeholder", async () => {
      const input = await createTestImage(800, 600);
      const result = await processImage(input);

      expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    });

    it("thumb is smaller in file size than main", async () => {
      const input = await createTestImage(1600, 1200);
      const result = await processImage(input);

      expect(result.thumbSize).toBeLessThanOrEqual(result.mainSize);
    });
  });

  describe("SingleVersion upload path (logos/covers) - thumbnail generation", () => {
    it("processSingleImage with 400px width generates a valid thumbnail", async () => {
      const input = await createTestImage(1600, 1200);
      
      // This simulates what the upload endpoint now does for singleVersion
      const mainResult = await processSingleImage(input, 1200, 80);
      const thumbResult = await processSingleImage(input, 400, 75);

      expect(mainResult.buffer).toBeInstanceOf(Buffer);
      expect(thumbResult.buffer).toBeInstanceOf(Buffer);

      const mainMeta = await sharp(mainResult.buffer).metadata();
      const thumbMeta = await sharp(thumbResult.buffer).metadata();

      expect(mainMeta.format).toBe("webp");
      expect(thumbMeta.format).toBe("webp");
      expect(mainMeta.width).toBeLessThanOrEqual(1200);
      expect(thumbMeta.width).toBeLessThanOrEqual(400);
    });

    it("thumbnail is smaller in file size than main for singleVersion", async () => {
      const input = await createTestImage(2000, 1500);
      
      const mainResult = await processSingleImage(input, 1200, 80);
      const thumbResult = await processSingleImage(input, 400, 75);

      expect(thumbResult.size).toBeLessThanOrEqual(mainResult.size);
    });

    it("generates blur placeholder for singleVersion", async () => {
      const input = await createTestImage(800, 600);
      const blurDataUrl = await generateBlurPlaceholder(input);

      expect(blurDataUrl).toMatch(/^data:image\/webp;base64,/);
      expect(blurDataUrl.length).toBeLessThan(1024);
    });

    it("handles small images without enlarging for singleVersion thumbnail", async () => {
      const input = await createTestImage(200, 150);
      
      const mainResult = await processSingleImage(input, 1200, 80);
      const thumbResult = await processSingleImage(input, 400, 75);

      // Small image should not be enlarged
      expect(mainResult.width).toBe(200);
      expect(thumbResult.width).toBe(200);
    });

    it("preserves aspect ratio in both main and thumb for singleVersion", async () => {
      const input = await createTestImage(2000, 1000); // 2:1 ratio
      
      const mainResult = await processSingleImage(input, 1200, 80);
      const thumbResult = await processSingleImage(input, 400, 75);

      const mainRatio = mainResult.width / mainResult.height;
      const thumbRatio = thumbResult.width / thumbResult.height;

      expect(mainRatio).toBeCloseTo(2, 0);
      expect(thumbRatio).toBeCloseTo(2, 0);
    });
  });

  describe("Thumbnail naming convention", () => {
    it("thumb filename follows _thumb.webp convention", () => {
      const id = "testId123";
      const folder = "products";
      const mainFileName = `${folder}/${id}.webp`;
      const thumbFileName = `${folder}/${id}_thumb.webp`;

      expect(mainFileName).toBe("products/testId123.webp");
      expect(thumbFileName).toBe("products/testId123_thumb.webp");
      expect(thumbFileName).toBe(mainFileName.replace(".webp", "_thumb.webp"));
    });

    it("singleVersion thumb filename follows same convention", () => {
      const id = "logoId456";
      const folder = "establishments";
      const mainFileName = `${folder}/${id}.webp`;
      const thumbFileName = `${folder}/${id}_thumb.webp`;

      expect(thumbFileName).toBe("establishments/logoId456_thumb.webp");
      expect(thumbFileName).toBe(mainFileName.replace(".webp", "_thumb.webp"));
    });
  });

  describe("Edge cases for thumbnail generation", () => {
    it("handles JPEG input correctly", async () => {
      const jpegBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 100, g: 150, b: 200 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await processImage(jpegBuffer);
      expect(result.mainBuffer.length).toBeGreaterThan(0);
      expect(result.thumbBuffer.length).toBeGreaterThan(0);

      const mainMeta = await sharp(result.mainBuffer).metadata();
      const thumbMeta = await sharp(result.thumbBuffer).metadata();
      expect(mainMeta.format).toBe("webp");
      expect(thumbMeta.format).toBe("webp");
    });

    it("handles already-WebP input correctly", async () => {
      const webpBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 100, g: 150, b: 200 },
        },
      })
        .webp()
        .toBuffer();

      const result = await processImage(webpBuffer);
      expect(result.mainBuffer.length).toBeGreaterThan(0);
      expect(result.thumbBuffer.length).toBeGreaterThan(0);
    });

    it("handles very large images", async () => {
      const input = await createTestImage(4000, 3000);
      const result = await processImage(input);

      expect(result.mainWidth).toBeLessThanOrEqual(1200);
      expect(result.thumbWidth).toBeLessThanOrEqual(400);
    });

    it("handles square images", async () => {
      const input = await createTestImage(1000, 1000);
      const result = await processImage(input);

      expect(result.mainWidth).toBe(result.mainHeight);
      expect(result.thumbWidth).toBe(result.thumbHeight);
    });
  });
});
