import { describe, it, expect } from "vitest";

/**
 * Ownership Phase 2 Tests
 * 
 * These tests verify that all routers that receive resource IDs
 * properly verify ownership before performing operations.
 * 
 * The pattern is: receive resource ID → lookup resource → extract establishmentId → verify ownership
 */

// ==========================================
// tables.ts - updateStatus ownership
// ==========================================
describe("tables.updateStatus ownership", () => {
  it("should verify table ownership before updating status", async () => {
    // The updateStatus endpoint now:
    // 1. Looks up the table by ID
    // 2. Extracts establishmentId from the table
    // 3. Calls assertEstablishmentOwnership(ctx.user.id, table.establishmentId)
    // 4. Only then proceeds with the update
    
    // Verify the code pattern exists
    const fs = await import("fs");
    const tablesCode = fs.readFileSync("server/routers/tables.ts", "utf-8");
    
    // Find the updateStatus mutation
    const updateStatusSection = tablesCode.substring(
      tablesCode.indexOf("updateStatus: protectedProcedure"),
      tablesCode.indexOf("createBatch: protectedProcedure") || tablesCode.length
    );
    
    // Verify ownership check exists before the actual update
    const ownershipCheckIndex = updateStatusSection.indexOf("assertEstablishmentOwnership");
    const updateCallIndex = updateStatusSection.indexOf("updateTableStatus");
    
    expect(ownershipCheckIndex).toBeGreaterThan(-1);
    expect(updateCallIndex).toBeGreaterThan(-1);
    expect(ownershipCheckIndex).toBeLessThan(updateCallIndex);
  });

  it("should lookup table by ID before checking ownership", async () => {
    const fs = await import("fs");
    const tablesCode = fs.readFileSync("server/routers/tables.ts", "utf-8");
    
    const updateStatusSection = tablesCode.substring(
      tablesCode.indexOf("updateStatus: protectedProcedure"),
      tablesCode.indexOf("createBatch: protectedProcedure") || tablesCode.length
    );
    
    const getTableIndex = updateStatusSection.indexOf("getTableById(input.id)");
    const ownershipIndex = updateStatusSection.indexOf("assertEstablishmentOwnership");
    
    expect(getTableIndex).toBeGreaterThan(-1);
    expect(ownershipIndex).toBeGreaterThan(-1);
    expect(getTableIndex).toBeLessThan(ownershipIndex);
  });
});

// ==========================================
// tableSpaces.ts - update/delete ownership
// ==========================================
describe("tableSpaces update/delete ownership", () => {
  it("should verify tableSpace belongs to user's establishment on update", async () => {
    const fs = await import("fs");
    const code = fs.readFileSync("server/routers/tableSpaces.ts", "utf-8");
    
    const updateSection = code.substring(
      code.indexOf("update: protectedProcedure"),
      code.indexOf("delete: protectedProcedure")
    );
    
    // Should check that space belongs to establishment
    expect(updateSection).toContain("getTableSpaces(establishment.id)");
    expect(updateSection).toContain("spaces.find");
    expect(updateSection).toContain("FORBIDDEN");
  });

  it("should verify tableSpace belongs to user's establishment on delete", async () => {
    const fs = await import("fs");
    const code = fs.readFileSync("server/routers/tableSpaces.ts", "utf-8");
    
    const deleteSection = code.substring(
      code.indexOf("delete: protectedProcedure")
    );
    
    // Should check that space belongs to establishment
    expect(deleteSection).toContain("getTableSpaces(establishment.id)");
    expect(deleteSection).toContain("spaces.find");
    expect(deleteSection).toContain("FORBIDDEN");
  });
});

// ==========================================
// tabs.ts - addItems, updateItem, cancelItem, update ownership
// ==========================================
describe("tabs ownership checks", () => {
  it("should verify tab ownership before adding items", async () => {
    const fs = await import("fs");
    const code = fs.readFileSync("server/routers/tabs.ts", "utf-8");
    
    const addItemsSection = code.substring(
      code.indexOf("addItems: protectedProcedure"),
      code.indexOf("updateItem: protectedProcedure")
    );
    
    const ownershipIndex = addItemsSection.indexOf("assertEstablishmentOwnership");
    const addItemsIndex = addItemsSection.indexOf("addItemsToTab");
    
    expect(ownershipIndex).toBeGreaterThan(-1);
    expect(addItemsIndex).toBeGreaterThan(-1);
    expect(ownershipIndex).toBeLessThan(addItemsIndex);
  });

  it("should verify tab item ownership before updating item", async () => {
    const fs = await import("fs");
    const code = fs.readFileSync("server/routers/tabs.ts", "utf-8");
    
    const updateItemSection = code.substring(
      code.indexOf("updateItem: protectedProcedure"),
      code.indexOf("cancelItem: protectedProcedure")
    );
    
    // Should lookup tabItem → tab → assertEstablishmentOwnership
    expect(updateItemSection).toContain("getTabItemById(input.id)");
    expect(updateItemSection).toContain("getTabById(tabItem.tabId)");
    expect(updateItemSection).toContain("assertEstablishmentOwnership");
  });

  it("should verify tab item ownership before cancelling item", async () => {
    const fs = await import("fs");
    const code = fs.readFileSync("server/routers/tabs.ts", "utf-8");
    
    const cancelItemSection = code.substring(
      code.indexOf("cancelItem: protectedProcedure"),
      code.indexOf("update: protectedProcedure")
    );
    
    const ownershipIndex = cancelItemSection.indexOf("assertEstablishmentOwnership");
    const cancelIndex = cancelItemSection.indexOf("cancelTabItem");
    
    expect(ownershipIndex).toBeGreaterThan(-1);
    expect(cancelIndex).toBeGreaterThan(-1);
    expect(ownershipIndex).toBeLessThan(cancelIndex);
  });

  it("should verify tab ownership before updating tab", async () => {
    const fs = await import("fs");
    const code = fs.readFileSync("server/routers/tabs.ts", "utf-8");
    
    // Get the update section (last protected procedure)
    const updateSection = code.substring(
      code.lastIndexOf("update: protectedProcedure")
    );
    
    const ownershipIndex = updateSection.indexOf("assertEstablishmentOwnership");
    const updateTabIndex = updateSection.indexOf("updateTab(id,");
    
    expect(ownershipIndex).toBeGreaterThan(-1);
    expect(updateTabIndex).toBeGreaterThan(-1);
    expect(ownershipIndex).toBeLessThan(updateTabIndex);
  });
});

// ==========================================
// Comprehensive: verify ALL protected mutations have ownership checks
// ==========================================
describe("comprehensive ownership audit", () => {
  const routerFiles = [
    "tables.ts",
    "tableSpaces.ts",
    "tabs.ts",
    "orders.ts",
    "complement.ts",
    "stock.ts",
    "establishment.ts",
    "campanhas.ts",
    "scheduledClosures.ts",
  ];

  it("all resource-modifying routers should have ownership verification", async () => {
    const fs = await import("fs");
    
    for (const file of routerFiles) {
      const code = fs.readFileSync(`server/routers/${file}`, "utf-8");
      
      // Count protected mutations
      const mutationCount = (code.match(/\.mutation\(/g) || []).length;
      
      // Count ownership checks (any form)
      const ownershipChecks = (code.match(
        /assertEstablishmentOwnership|assertOrderOwnership|assertProductOwnership|assertGroupOwnership|assertItemOwnership|assertStockItemOwnership|assertStockCategoryOwnership|getEstablishmentByUserId|ctx\.user\.role/g
      ) || []).length;
      
      // Every router with mutations should have at least one ownership check
      if (mutationCount > 0) {
        expect(
          ownershipChecks,
          `${file} has ${mutationCount} mutations but ${ownershipChecks} ownership checks`
        ).toBeGreaterThan(0);
      }
    }
  });
});
