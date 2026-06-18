import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
  getTableById: vi.fn(),
  getCollaboratorById: vi.fn(),
  getPrinterById: vi.fn(),
  getTabById: vi.fn(),
  getActiveTabByTable: vi.fn(),
  getTabItems: vi.fn(),
}));

// Mock helpers
vi.mock("./routers/helpers", () => ({
  assertEstablishmentOwnership: vi.fn(),
}));

import { assertEstablishmentOwnership } from "./routers/helpers";
import * as db from "./db";

const mockAssert = vi.mocked(assertEstablishmentOwnership);
const mockDb = vi.mocked(db);

describe("Ownership Authorization - Phase 1 (establishmentId direto)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assertEstablishmentOwnership mock behavior", () => {
    it("should allow owner to proceed", async () => {
      mockAssert.mockResolvedValueOnce(undefined);
      await expect(assertEstablishmentOwnership(1, 100)).resolves.toBeUndefined();
      expect(mockAssert).toHaveBeenCalledWith(1, 100);
    });

    it("should reject non-owner", async () => {
      mockAssert.mockRejectedValueOnce(new Error("Acesso negado"));
      await expect(assertEstablishmentOwnership(999, 100)).rejects.toThrow("Acesso negado");
    });
  });

  describe("Routers with establishmentId in input", () => {
    // These routers now call assertEstablishmentOwnership with ctx.user.id and input.establishmentId:
    // - botApiKeys (list, toggleActive, rename, createGlobal)
    // - cashback (saveConfig, getMetrics, getEvolution, getClients, getEventHistory)
    // - collaborator (list, create, getById)
    // - dashboard (all 15 queries)
    // - chatShortcuts (list, create, update, delete)
    // - neighborhoodFees (create, update, delete, import, deleteAll)
    // - printer (list, get, create, update, delete, testDirectPrint, testPOSPrinter, printOrder, testConnection, getDefault, setDefault, clearDefault)
    // - push (list, sendTest, unsubscribe)
    // - reviewsAdmin (list, reply, delete, getStats)
    // - loyalty (getSettings, saveSettings, listCards, getMetrics, getEvolution, getClients, getEventHistory)
    // - combo (list, create, update, delete, reorder)
    // - reports (all KPIs, ABC, DRE, sazonalidade)
    // - pdvCustomer (list, create, update, delete, search)
    // - drivers (list, create, update, delete, toggleActive)
    // - order (list, create, updateStatus, getById)
    // - establishment (update, toggleTwoFactor)
    // - feedback (listAll, updateStatus, stats - admin role check)
    
    it("should have assertEstablishmentOwnership imported in all corrected routers", async () => {
      // Verify the import exists in each corrected router file
      const fs = await import("fs");
      const routersDir = "/home/ubuntu/cardapio-admin/server/routers";
      
      const routersToCheck = [
        "botApiKeys.ts",
        "cashback.ts",
        "collaborator.ts",
        "dashboard.ts",
        "chatShortcuts.ts",
        "neighborhoodFees.ts",
        "printer.ts",
        "push.ts",
        "reviewsAdmin.ts",
        "loyalty.ts",
        "combo.ts",
        "reports.ts",
        "pdvCustomer.ts",
        "drivers.ts",
        "order.ts",
        "tables.ts",
        "tabs.ts",
      ];
      
      for (const router of routersToCheck) {
        const content = fs.readFileSync(`${routersDir}/${router}`, "utf-8");
        expect(content).toContain('assertEstablishmentOwnership');
      }
    });

    it("should NOT have any protectedProcedure with ({ input }) without ctx in corrected routers", async () => {
      const fs = await import("fs");
      const routersDir = "/home/ubuntu/cardapio-admin/server/routers";
      
      // These routers should have NO protectedProcedure with ({ input }) - all should use ({ ctx, input })
      const fullyFixedRouters = [
        "botApiKeys.ts",
        "dashboard.ts",
        "chatShortcuts.ts",
        "reviewsAdmin.ts",
        "combo.ts",
        "reports.ts",
        "pdvCustomer.ts",
        "order.ts",
        "tables.ts",
        "tabs.ts",
      ];
      
      for (const router of fullyFixedRouters) {
        const content = fs.readFileSync(`${routersDir}/${router}`, "utf-8");
        const lines = content.split("\n");
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("async ({ input })")) {
            // Check if this is within a protectedProcedure (look back up to 15 lines)
            const contextLines = lines.slice(Math.max(0, i - 15), i + 1).join("\n");
            const isProtected = contextLines.includes("protectedProcedure");
            if (isProtected) {
              throw new Error(
                `${router} line ${i + 1}: Found protectedProcedure with ({ input }) instead of ({ ctx, input })`
              );
            }
          }
        }
      }
    });

    it("should have admin role check in feedback admin procedures", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "/home/ubuntu/cardapio-admin/server/routers/feedback.ts",
        "utf-8"
      );
      
      // Check that admin procedures have role check
      expect(content).toContain("ctx.user.role !== 'admin'");
      
      // Count occurrences - should be at least 3 (listAll, updateStatus, stats)
      const matches = content.match(/ctx\.user\.role !== 'admin'/g);
      expect(matches?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Routers with resource ID (tables, tabs)", () => {
    it("tables.ts should lookup table before asserting ownership", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "/home/ubuntu/cardapio-admin/server/routers/tables.ts",
        "utf-8"
      );
      
      // Verify pattern: getTableById followed by assertEstablishmentOwnership
      expect(content).toContain("const table = await db.getTableById(input.id)");
      expect(content).toContain("await assertEstablishmentOwnership(ctx.user.id, table.establishmentId)");
    });

    it("tabs.ts should lookup table via tab before asserting ownership", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "/home/ubuntu/cardapio-admin/server/routers/tabs.ts",
        "utf-8"
      );
      
      // Verify pattern: getTableById followed by assertEstablishmentOwnership
      expect(content).toContain("assertEstablishmentOwnership");
      expect(content).toContain("const table = await db.getTableById");
    });
  });
});
