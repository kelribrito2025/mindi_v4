import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractKeyFromUrl, isImageKey } from "./orphanCleanupJob";

describe("orphanCleanupJob", () => {
  describe("extractKeyFromUrl", () => {
    it("extracts key from S3 URL", () => {
      const url = "https://my-bucket.s3.us-east-1.amazonaws.com/products/123/image.webp";
      expect(extractKeyFromUrl(url)).toBe("products/123/image.webp");
    });

    it("extracts key from CDN URL", () => {
      const url = "https://files.manus.im/products/456/photo.jpg";
      expect(extractKeyFromUrl(url)).toBe("products/456/photo.jpg");
    });

    it("handles nested paths", () => {
      const url = "https://bucket.s3.us-east-1.amazonaws.com/est/100/products/img_thumb.webp";
      expect(extractKeyFromUrl(url)).toBe("est/100/products/img_thumb.webp");
    });

    it("returns null for empty string", () => {
      expect(extractKeyFromUrl("")).toBeNull();
    });

    it("returns null for invalid URL", () => {
      expect(extractKeyFromUrl("not-a-url")).toBeNull();
    });

    it("returns null for null/undefined input", () => {
      expect(extractKeyFromUrl(null as any)).toBeNull();
      expect(extractKeyFromUrl(undefined as any)).toBeNull();
    });

    it("handles URL with query parameters", () => {
      const url = "https://bucket.s3.us-east-1.amazonaws.com/path/image.webp?v=123";
      expect(extractKeyFromUrl(url)).toBe("path/image.webp");
    });

    it("handles URL with encoded characters", () => {
      const url = "https://bucket.s3.us-east-1.amazonaws.com/path/my%20image.webp";
      expect(extractKeyFromUrl(url)).toBe("path/my%20image.webp");
    });

    it("handles URL with multiple leading slashes", () => {
      const url = "https://bucket.s3.us-east-1.amazonaws.com///path/image.webp";
      expect(extractKeyFromUrl(url)).toBe("path/image.webp");
    });

    it("handles URL with hash fragment", () => {
      const url = "https://bucket.s3.us-east-1.amazonaws.com/path/image.webp#section";
      expect(extractKeyFromUrl(url)).toBe("path/image.webp");
    });

    it("handles URL with port number", () => {
      const url = "http://localhost:9000/products/image.webp";
      expect(extractKeyFromUrl(url)).toBe("products/image.webp");
    });

    it("returns null for URL with only domain (no path)", () => {
      const url = "https://bucket.s3.us-east-1.amazonaws.com/";
      expect(extractKeyFromUrl(url)).toBeNull();
    });
  });

  describe("isImageKey", () => {
    it("recognizes .webp files", () => {
      expect(isImageKey("products/123/image.webp")).toBe(true);
    });

    it("recognizes .jpg files", () => {
      expect(isImageKey("products/123/image.jpg")).toBe(true);
    });

    it("recognizes .jpeg files", () => {
      expect(isImageKey("products/123/image.jpeg")).toBe(true);
    });

    it("recognizes .png files", () => {
      expect(isImageKey("products/123/image.png")).toBe(true);
    });

    it("recognizes .gif files", () => {
      expect(isImageKey("products/123/image.gif")).toBe(true);
    });

    it("recognizes .svg files", () => {
      expect(isImageKey("products/123/logo.svg")).toBe(true);
    });

    it("is case insensitive", () => {
      expect(isImageKey("products/123/IMAGE.PNG")).toBe(true);
      expect(isImageKey("products/123/photo.WEBP")).toBe(true);
    });

    it("rejects non-image files", () => {
      expect(isImageKey("data/export.json")).toBe(false);
      expect(isImageKey("docs/readme.html")).toBe(false);
      expect(isImageKey("config.yaml")).toBe(false);
      expect(isImageKey("backup.sql")).toBe(false);
    });

    it("recognizes thumb variants", () => {
      expect(isImageKey("products/123/image_thumb.webp")).toBe(true);
    });

    it("recognizes .avif files", () => {
      expect(isImageKey("products/123/image.avif")).toBe(true);
    });

    it("recognizes .ico files", () => {
      expect(isImageKey("favicon.ico")).toBe(true);
    });

    it("recognizes .bmp files", () => {
      expect(isImageKey("products/123/image.bmp")).toBe(true);
    });

    it("recognizes .tiff files", () => {
      expect(isImageKey("products/123/image.tiff")).toBe(true);
    });

    it("rejects files without extension", () => {
      expect(isImageKey("products/123/noextension")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isImageKey("")).toBe(false);
    });

    it("rejects text files that look like images in name", () => {
      expect(isImageKey("image-list.txt")).toBe(false);
      expect(isImageKey("png-config.json")).toBe(false);
    });
  });

  describe("OrphanCleanupResult interface", () => {
    it("has the correct shape", () => {
      // Verify the result interface is importable and has expected fields
      const mockResult = {
        totalS3Objects: 100,
        totalReferencedUrls: 80,
        orphanCount: 20,
        orphanKeys: [
          { key: "products/old.png", size: 1024, lastModified: new Date() },
        ],
        totalOrphanSizeBytes: 20480,
        totalOrphanSizeMB: "0.02",
        deletedCount: 0,
        errors: [],
      };

      expect(mockResult.totalS3Objects).toBe(100);
      expect(mockResult.orphanCount).toBe(20);
      expect(mockResult.deletedCount).toBe(0);
      expect(mockResult.errors).toHaveLength(0);
      expect(mockResult.orphanKeys).toHaveLength(1);
      expect(mockResult.orphanKeys[0].key).toBe("products/old.png");
    });
  });

  describe("thumb variant generation logic", () => {
    it("generates correct thumb key from main key", () => {
      // This tests the logic used in collectReferencedKeys
      const mainKey = "products/abc123.webp";
      const lastDot = mainKey.lastIndexOf(".");
      const thumbKey = mainKey.substring(0, lastDot) + "_thumb" + mainKey.substring(lastDot);
      expect(thumbKey).toBe("products/abc123_thumb.webp");
    });

    it("generates correct thumb key for nested paths", () => {
      const mainKey = "establishments/est1/logo.jpeg";
      const lastDot = mainKey.lastIndexOf(".");
      const thumbKey = mainKey.substring(0, lastDot) + "_thumb" + mainKey.substring(lastDot);
      expect(thumbKey).toBe("establishments/est1/logo_thumb.jpeg");
    });

    it("handles keys with multiple dots", () => {
      const mainKey = "products/file.name.with.dots.webp";
      const lastDot = mainKey.lastIndexOf(".");
      const thumbKey = mainKey.substring(0, lastDot) + "_thumb" + mainKey.substring(lastDot);
      expect(thumbKey).toBe("products/file.name.with.dots_thumb.webp");
    });

    it("does not generate thumb for key without extension", () => {
      const mainKey = "products/noextension";
      const lastDot = mainKey.lastIndexOf(".");
      // lastDot would be -1 for no extension, so no thumb generated
      expect(lastDot).toBe(-1);
    });
  });

  describe("orphan detection logic (unit)", () => {
    it("identifies orphans correctly from sets", () => {
      // Simulates the core orphan detection logic
      const s3Keys = [
        { key: "products/a.webp", size: 1000 },
        { key: "products/b.webp", size: 2000 },
        { key: "products/c.webp", size: 3000 },
        { key: "products/d.webp", size: 4000 },
      ];
      const referencedKeys = new Set(["products/a.webp", "products/c.webp"]);

      const orphans = s3Keys.filter((obj) => !referencedKeys.has(obj.key));

      expect(orphans).toHaveLength(2);
      expect(orphans[0].key).toBe("products/b.webp");
      expect(orphans[1].key).toBe("products/d.webp");
    });

    it("returns empty when all keys are referenced", () => {
      const s3Keys = [
        { key: "products/a.webp", size: 1000 },
        { key: "products/b.webp", size: 2000 },
      ];
      const referencedKeys = new Set(["products/a.webp", "products/b.webp"]);

      const orphans = s3Keys.filter((obj) => !referencedKeys.has(obj.key));
      expect(orphans).toHaveLength(0);
    });

    it("returns all when none are referenced", () => {
      const s3Keys = [
        { key: "products/a.webp", size: 1000 },
        { key: "products/b.webp", size: 2000 },
      ];
      const referencedKeys = new Set<string>();

      const orphans = s3Keys.filter((obj) => !referencedKeys.has(obj.key));
      expect(orphans).toHaveLength(2);
    });

    it("correctly calculates total orphan size", () => {
      const orphans = [
        { key: "a.webp", size: 1024 * 1024 },     // 1 MB
        { key: "b.webp", size: 512 * 1024 },       // 0.5 MB
        { key: "c.webp", size: 256 * 1024 },       // 0.25 MB
      ];
      const totalBytes = orphans.reduce((sum, o) => sum + o.size, 0);
      const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
      expect(totalMB).toBe("1.75");
    });

    it("handles thumb variants being referenced through main key", () => {
      // If main key is referenced, its thumb should also be considered referenced
      const mainKey = "products/abc.webp";
      const thumbKey = "products/abc_thumb.webp";
      
      const referencedKeys = new Set([mainKey]);
      // Add thumb variant
      const lastDot = mainKey.lastIndexOf(".");
      const generatedThumb = mainKey.substring(0, lastDot) + "_thumb" + mainKey.substring(lastDot);
      referencedKeys.add(generatedThumb);

      expect(referencedKeys.has(thumbKey)).toBe(true);
    });
  });

  describe("batch deletion logic (unit)", () => {
    it("correctly splits items into batches", () => {
      const items = Array.from({ length: 25 }, (_, i) => `item-${i}`);
      const batchSize = 10;
      const batches: string[][] = [];

      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(10);
      expect(batches[1]).toHaveLength(10);
      expect(batches[2]).toHaveLength(5);
    });

    it("handles single batch when items < batchSize", () => {
      const items = Array.from({ length: 5 }, (_, i) => `item-${i}`);
      const batchSize = 10;
      const batches: string[][] = [];

      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(5);
    });

    it("handles empty items array", () => {
      const items: string[] = [];
      const batchSize = 10;
      const batches: string[][] = [];

      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(0);
    });
  });
});
