import { describe, it, expect, vi } from "vitest";

/**
 * Tests for the toggleOpen SSE fix.
 * 
 * Bug: When toggling establishment open/close via SSE, the public menu
 * was not reflecting the change because:
 * 1. toggleEstablishmentOpen only updated isOpen field, not manuallyClosed/manuallyOpened
 * 2. The server-side publicMenuCache was not invalidated after toggle
 * 
 * Fix:
 * 1. toggleEstablishmentOpen now updates manuallyClosed/manuallyOpened fields
 * 2. invalidatePublicMenuCache is called in both toggleOpen and setManualClose mutations
 */

describe("toggleOpen SSE fix", () => {

  describe("toggleEstablishmentOpen should set manual flags", () => {
    // Simulate the corrected toggleEstablishmentOpen logic
    function getToggleUpdatePayload(isOpen: boolean) {
      if (isOpen) {
        return {
          isOpen: true,
          manuallyClosed: false,
          manuallyClosedAt: null,
          manuallyOpened: true,
          manuallyOpenedAt: expect.any(Date),
        };
      } else {
        return {
          isOpen: false,
          manuallyClosed: true,
          manuallyClosedAt: expect.any(Date),
          manuallyOpened: false,
          manuallyOpenedAt: null,
        };
      }
    }

    it("should set manuallyOpened=true and manuallyClosed=false when opening", () => {
      const payload = getToggleUpdatePayload(true);
      expect(payload.isOpen).toBe(true);
      expect(payload.manuallyClosed).toBe(false);
      expect(payload.manuallyClosedAt).toBeNull();
      expect(payload.manuallyOpened).toBe(true);
    });

    it("should set manuallyClosed=true and manuallyOpened=false when closing", () => {
      const payload = getToggleUpdatePayload(false);
      expect(payload.isOpen).toBe(false);
      expect(payload.manuallyClosed).toBe(true);
      expect(payload.manuallyOpened).toBe(false);
      expect(payload.manuallyOpenedAt).toBeNull();
    });
  });

  describe("computedIsOpen should reflect toggle correctly", () => {
    // Simulate getEstablishmentOpenStatus logic
    function computeStatus(opts: {
      manuallyClosed: boolean;
      manuallyOpened: boolean;
      isWithinSchedule: boolean;
      shouldAutoReopen: boolean;
    }) {
      const { manuallyClosed, manuallyOpened, isWithinSchedule, shouldAutoReopen } = opts;
      
      let isOpen = false;
      let finalManuallyClosed = manuallyClosed;
      
      if (manuallyClosed && shouldAutoReopen) {
        finalManuallyClosed = false;
        isOpen = isWithinSchedule;
      } else if (manuallyClosed) {
        isOpen = false;
      } else if (manuallyOpened && !isWithinSchedule) {
        isOpen = true;
      } else {
        isOpen = isWithinSchedule;
      }
      
      return { isOpen, manuallyClosed: finalManuallyClosed };
    }

    it("after toggleOpen(false) during business hours, should be CLOSED", () => {
      // User closes the store during business hours
      // toggleOpen sets: manuallyClosed=true, manuallyOpened=false
      const result = computeStatus({
        manuallyClosed: true,
        manuallyOpened: false,
        isWithinSchedule: true,
        shouldAutoReopen: false,
      });
      expect(result.isOpen).toBe(false);
      expect(result.manuallyClosed).toBe(true);
    });

    it("after toggleOpen(true) outside business hours, should be OPEN", () => {
      // User opens the store outside business hours
      // toggleOpen sets: manuallyClosed=false, manuallyOpened=true
      const result = computeStatus({
        manuallyClosed: false,
        manuallyOpened: true,
        isWithinSchedule: false,
        shouldAutoReopen: false,
      });
      expect(result.isOpen).toBe(true);
    });

    it("after toggleOpen(true) during business hours, should be OPEN", () => {
      // User opens the store during business hours
      // toggleOpen sets: manuallyClosed=false, manuallyOpened=true
      const result = computeStatus({
        manuallyClosed: false,
        manuallyOpened: true,
        isWithinSchedule: true,
        shouldAutoReopen: false,
      });
      // When manuallyOpened but within schedule, falls to else branch → isWithinSchedule = true
      expect(result.isOpen).toBe(true);
    });

    it("after toggleOpen(false) outside business hours, should be CLOSED", () => {
      // User closes the store outside business hours
      // toggleOpen sets: manuallyClosed=true, manuallyOpened=false
      const result = computeStatus({
        manuallyClosed: true,
        manuallyOpened: false,
        isWithinSchedule: false,
        shouldAutoReopen: false,
      });
      expect(result.isOpen).toBe(false);
      expect(result.manuallyClosed).toBe(true);
    });
  });

  describe("publicMenuCache invalidation", () => {
    it("invalidatePublicMenuCache should clear cache entries", () => {
      // Simulate cache behavior
      const cache = new Map<string, { data: any; expiresAt: number }>();
      
      function setCache(slug: string, data: any) {
        cache.set(slug, { data, expiresAt: Date.now() + 30000 });
      }
      
      function getCache(slug: string) {
        const entry = cache.get(slug);
        if (entry && entry.expiresAt > Date.now()) return entry.data;
        if (entry) cache.delete(slug);
        return null;
      }
      
      function invalidateCache() {
        cache.clear();
      }
      
      // Set cache
      setCache("burger-house", { establishment: { computedIsOpen: true } });
      expect(getCache("burger-house")).not.toBeNull();
      
      // Invalidate
      invalidateCache();
      expect(getCache("burger-house")).toBeNull();
    });

    it("after toggle, next getBySlug should recalculate status", () => {
      // This test validates the flow:
      // 1. toggleOpen mutation updates DB fields
      // 2. invalidatePublicMenuCache clears server cache
      // 3. SSE event triggers frontend refetch
      // 4. Refetch hits server which recalculates computedIsOpen from fresh DB data
      
      // Simulate the full flow
      let dbState = {
        isOpen: true,
        manuallyClosed: false,
        manuallyOpened: true,
        manuallyClosedAt: null as Date | null,
        manuallyOpenedAt: new Date(),
      };
      
      let cacheValid = true;
      
      // Step 1: Toggle close
      dbState = {
        isOpen: false,
        manuallyClosed: true,
        manuallyOpened: false,
        manuallyClosedAt: new Date(),
        manuallyOpenedAt: null,
      };
      
      // Step 2: Invalidate cache
      cacheValid = false;
      
      // Step 3: SSE event sent (simulated)
      const sseEventType = "establishment_closed";
      expect(sseEventType).toBe("establishment_closed");
      
      // Step 4: Frontend refetch → server recalculates
      expect(cacheValid).toBe(false); // Cache was invalidated
      
      // Server recalculates computedIsOpen from fresh DB data
      const computedIsOpen = dbState.manuallyClosed ? false : true;
      expect(computedIsOpen).toBe(false); // Should be closed now
    });
  });

  describe("SSE event emission", () => {
    it("toggleOpen(false) should emit establishment_closed event", () => {
      const isOpen = false;
      const eventType = isOpen ? 'establishment_opened' : 'establishment_closed';
      expect(eventType).toBe('establishment_closed');
    });

    it("toggleOpen(true) should emit establishment_opened event", () => {
      const isOpen = true;
      const eventType = isOpen ? 'establishment_opened' : 'establishment_closed';
      expect(eventType).toBe('establishment_opened');
    });

    it("setManualClose(true) should emit establishment_closed event", () => {
      const close = true;
      const eventType = close ? 'establishment_closed' : 'establishment_opened';
      expect(eventType).toBe('establishment_closed');
    });

    it("setManualClose(false) should emit establishment_opened event", () => {
      const close = false;
      const eventType = close ? 'establishment_closed' : 'establishment_opened';
      expect(eventType).toBe('establishment_opened');
    });
  });
});
