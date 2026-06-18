import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCachedCatalog,
  setCachedCatalog,
  invalidateCatalogCache,
  invalidateAllCatalogCache,
  getCatalogCacheStats,
  hasCachedCatalog,
} from "./ifoodCatalogCache";

// Mock logger
vi.mock("./_core/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe("iFood Catalog Cache", () => {
  beforeEach(() => {
    // Clear all cache before each test
    invalidateAllCatalogCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("setCachedCatalog / getCachedCatalog", () => {
    it("should store and retrieve catalog data", () => {
      const mockData = {
        catalogs: [
          { catalogId: "cat-1", categories: [{ id: "categ-1", name: "Pizzas", products: [] }] },
        ],
      };

      setCachedCatalog(1, mockData);
      const result = getCachedCatalog(1);

      expect(result).toEqual(mockData);
    });

    it("should return undefined for non-existent cache", () => {
      const result = getCachedCatalog(999);
      expect(result).toBeUndefined();
    });

    it("should store separate caches per establishmentId", () => {
      const data1 = { catalogs: [{ catalogId: "cat-1" }] };
      const data2 = { catalogs: [{ catalogId: "cat-2" }] };

      setCachedCatalog(1, data1);
      setCachedCatalog(2, data2);

      expect(getCachedCatalog(1)).toEqual(data1);
      expect(getCachedCatalog(2)).toEqual(data2);
    });
  });

  describe("TTL expiration", () => {
    it("should return data within TTL (10 minutes)", () => {
      const mockData = { catalogs: [] };
      setCachedCatalog(1, mockData);

      // Advance 9 minutes (within TTL)
      vi.advanceTimersByTime(9 * 60 * 1000);

      expect(getCachedCatalog(1)).toEqual(mockData);
    });

    it("should return undefined after TTL expires (10 minutes)", () => {
      const mockData = { catalogs: [] };
      setCachedCatalog(1, mockData);

      // Advance 10 minutes + 1ms (past TTL)
      vi.advanceTimersByTime(10 * 60 * 1000 + 1);

      expect(getCachedCatalog(1)).toBeUndefined();
    });

    it("should return undefined exactly at expiration boundary", () => {
      const mockData = { catalogs: [] };
      setCachedCatalog(1, mockData);

      // Advance exactly 10 minutes + 1ms
      vi.advanceTimersByTime(10 * 60 * 1000 + 1);

      expect(getCachedCatalog(1)).toBeUndefined();
    });
  });

  describe("invalidateCatalogCache", () => {
    it("should remove cache for specific establishment", () => {
      setCachedCatalog(1, { catalogs: [] });
      setCachedCatalog(2, { catalogs: [] });

      invalidateCatalogCache(1);

      expect(getCachedCatalog(1)).toBeUndefined();
      expect(getCachedCatalog(2)).toEqual({ catalogs: [] });
    });

    it("should not throw when invalidating non-existent cache", () => {
      expect(() => invalidateCatalogCache(999)).not.toThrow();
    });
  });

  describe("invalidateAllCatalogCache", () => {
    it("should remove all cached entries", () => {
      setCachedCatalog(1, { catalogs: [] });
      setCachedCatalog(2, { catalogs: [] });
      setCachedCatalog(3, { catalogs: [] });

      invalidateAllCatalogCache();

      expect(getCachedCatalog(1)).toBeUndefined();
      expect(getCachedCatalog(2)).toBeUndefined();
      expect(getCachedCatalog(3)).toBeUndefined();
    });
  });

  describe("hasCachedCatalog", () => {
    it("should return true when valid cache exists", () => {
      setCachedCatalog(1, { catalogs: [] });
      expect(hasCachedCatalog(1)).toBe(true);
    });

    it("should return false when no cache exists", () => {
      expect(hasCachedCatalog(999)).toBe(false);
    });

    it("should return false when cache has expired", () => {
      setCachedCatalog(1, { catalogs: [] });
      vi.advanceTimersByTime(10 * 60 * 1000 + 1);
      expect(hasCachedCatalog(1)).toBe(false);
    });
  });

  describe("getCatalogCacheStats", () => {
    it("should track hits and misses", () => {
      setCachedCatalog(1, { catalogs: [] });

      // Hit
      getCachedCatalog(1);
      // Miss
      getCachedCatalog(999);

      const stats = getCatalogCacheStats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(stats.size).toBe(1);
      expect(stats.ttlSeconds).toBe(600); // 10 minutes
    });

    it("should track invalidations", () => {
      setCachedCatalog(1, { catalogs: [] });
      const statsBefore = getCatalogCacheStats();
      const invalidationsBefore = statsBefore.invalidations;

      invalidateCatalogCache(1);

      const statsAfter = getCatalogCacheStats();
      expect(statsAfter.invalidations).toBe(invalidationsBefore + 1);
    });
  });

  describe("cache overwrite", () => {
    it("should overwrite existing cache with new data", () => {
      const oldData = { catalogs: [{ catalogId: "old" }] };
      const newData = { catalogs: [{ catalogId: "new" }] };

      setCachedCatalog(1, oldData);
      setCachedCatalog(1, newData);

      expect(getCachedCatalog(1)).toEqual(newData);
    });

    it("should reset TTL when overwriting", () => {
      setCachedCatalog(1, { catalogs: [] });

      // Advance 8 minutes
      vi.advanceTimersByTime(8 * 60 * 1000);

      // Overwrite - resets TTL
      setCachedCatalog(1, { catalogs: [{ catalogId: "refreshed" }] });

      // Advance another 8 minutes (would have expired without overwrite)
      vi.advanceTimersByTime(8 * 60 * 1000);

      // Should still be valid (only 8 min since last set)
      expect(getCachedCatalog(1)).toEqual({ catalogs: [{ catalogId: "refreshed" }] });
    });
  });
});
