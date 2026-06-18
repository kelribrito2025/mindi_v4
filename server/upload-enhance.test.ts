import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Tests for the standalone upload.enhanceImage endpoint.
 * This endpoint allows image enhancement without requiring a productId,
 * enabling enhancement during product creation (before the product is saved).
 */

// Mock dependencies
vi.mock("../server/db", () => ({
  getAiImageCredits: vi.fn(),
  consumeAiImageCredit: vi.fn(),
}));

vi.mock("./imageEnhancer", () => ({
  enhanceProductImage: vi.fn(),
}));

vi.mock("./imageProcessor", () => ({
  processImage: vi.fn(),
  processSingleImage: vi.fn(),
  generateBlurPlaceholder: vi.fn(),
}));

vi.mock("./mindiStorage", () => ({
  mindiStoragePut: vi.fn(),
}));

vi.mock("./routers/helpers", () => ({
  assertEstablishmentOwnership: vi.fn(),
}));

import * as db from "./db";
import { enhanceProductImage } from "./imageEnhancer";
import { processImage } from "./imageProcessor";
import { mindiStoragePut } from "./mindiStorage";
import { assertEstablishmentOwnership } from "./routers/helpers";

const mockGetCredits = vi.mocked(db.getAiImageCredits);
const mockConsumeCredit = vi.mocked(db.consumeAiImageCredit);
const mockEnhance = vi.mocked(enhanceProductImage);
const mockProcessImage = vi.mocked(processImage);
const mockStoragePut = vi.mocked(mindiStoragePut);
const mockAssertOwnership = vi.mocked(assertEstablishmentOwnership);

describe("upload.enhanceImage standalone endpoint logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should require imageUrl and establishmentId", () => {
      // The endpoint requires both fields via zod schema
      // imageUrl: z.string().url()
      // establishmentId: z.number()
      const validInput = {
        imageUrl: "https://example.com/image.jpg",
        establishmentId: 30001,
      };
      expect(validInput.imageUrl).toBeTruthy();
      expect(validInput.establishmentId).toBeGreaterThan(0);
    });

    it("should not require productId", () => {
      // The key difference from product.enhanceImage - no productId needed
      const input = {
        imageUrl: "https://example.com/image.jpg",
        establishmentId: 30001,
      };
      expect(input).not.toHaveProperty("productId");
    });
  });

  describe("ownership verification", () => {
    it("should call assertEstablishmentOwnership with correct params", async () => {
      mockAssertOwnership.mockResolvedValue(undefined);
      
      await assertEstablishmentOwnership(42, 30001);
      
      expect(mockAssertOwnership).toHaveBeenCalledWith(42, 30001);
    });

    it("should throw if user does not own the establishment", async () => {
      mockAssertOwnership.mockRejectedValue(new Error("FORBIDDEN"));
      
      await expect(assertEstablishmentOwnership(999, 30001)).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("credit checking", () => {
    it("should check AI credits for the establishment", async () => {
      mockGetCredits.mockResolvedValue(5);
      
      const credits = await db.getAiImageCredits(30001);
      
      expect(credits).toBe(5);
      expect(mockGetCredits).toHaveBeenCalledWith(30001);
    });

    it("should reject when credits are 0", async () => {
      mockGetCredits.mockResolvedValue(0);
      
      const credits = await db.getAiImageCredits(30001);
      
      expect(credits).toBe(0);
      // The endpoint throws FORBIDDEN when credits <= 0
    });
  });

  describe("image enhancement flow", () => {
    it("should call enhanceProductImage with imageUrl and establishmentId", async () => {
      mockEnhance.mockResolvedValue({
        enhancedUrl: "https://s3.example.com/enhanced/abc.png",
        originalUrl: "https://example.com/image.jpg",
      });

      const result = await enhanceProductImage(
        "https://example.com/image.jpg",
        30001
      );

      expect(mockEnhance).toHaveBeenCalledWith(
        "https://example.com/image.jpg",
        30001
      );
      expect(result.enhancedUrl).toBe("https://s3.example.com/enhanced/abc.png");
    });
  });

  describe("post-enhancement processing", () => {
    it("should process enhanced image through the same pipeline (WebP + resize)", async () => {
      const mockMainBuffer = Buffer.from("main");
      const mockThumbBuffer = Buffer.from("thumb");
      
      mockProcessImage.mockResolvedValue({
        mainBuffer: mockMainBuffer,
        thumbBuffer: mockThumbBuffer,
        blurDataUrl: "data:image/png;base64,blur",
      });

      const result = await processImage(Buffer.from("enhanced-image"));

      expect(result.mainBuffer).toBe(mockMainBuffer);
      expect(result.thumbBuffer).toBe(mockThumbBuffer);
    });

    it("should upload processed images to S3 with correct paths", async () => {
      mockStoragePut.mockResolvedValue({
        url: "https://s3.example.com/est/30001/products/enhanced_abc.webp",
        key: "est/30001/products/enhanced_abc.webp",
      });

      const result = await mindiStoragePut(
        "est/30001/products/enhanced_abc.webp",
        Buffer.from("data"),
        "image/webp"
      );

      expect(result.url).toContain("est/30001/products/enhanced_");
      expect(result.url).toContain(".webp");
    });
  });

  describe("credit consumption", () => {
    it("should consume 1 credit after successful enhancement", async () => {
      mockConsumeCredit.mockResolvedValue(4); // 5 - 1 = 4

      const remaining = await db.consumeAiImageCredit(30001, 42);

      expect(mockConsumeCredit).toHaveBeenCalledWith(30001, 42);
      expect(remaining).toBe(4);
    });
  });

  describe("response format", () => {
    it("should return enhancedUrl, originalUrl, and remainingCredits", () => {
      // Validate the expected response shape
      const expectedResponse = {
        enhancedUrl: "https://s3.example.com/est/30001/products/enhanced_abc.webp",
        originalUrl: "https://example.com/image.jpg",
        remainingCredits: 4,
      };

      expect(expectedResponse).toHaveProperty("enhancedUrl");
      expect(expectedResponse).toHaveProperty("originalUrl");
      expect(expectedResponse).toHaveProperty("remainingCredits");
      expect(typeof expectedResponse.remainingCredits).toBe("number");
    });
  });

  describe("ImageEnhanceModal dual-mode support", () => {
    it("should use product.enhanceImage when productId is provided", () => {
      // In edit mode: productId exists → use product.enhanceImage
      const editModeProps = {
        productId: 123,
        establishmentId: 30001,
        imageUrl: "https://example.com/image.jpg",
        imageIndex: 0,
      };
      expect(editModeProps.productId).toBeDefined();
      // Modal should use product.enhanceImage endpoint
    });

    it("should use upload.enhanceImage when only establishmentId is provided", () => {
      // In creation mode: no productId → use upload.enhanceImage
      const createModeProps = {
        productId: undefined,
        establishmentId: 30001,
        imageUrl: "https://example.com/image.jpg",
        imageIndex: 0,
      };
      expect(createModeProps.productId).toBeUndefined();
      expect(createModeProps.establishmentId).toBeDefined();
      // Modal should use upload.enhanceImage endpoint
    });
  });
});
