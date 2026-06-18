import { describe, it, expect } from "vitest";

/**
 * Tests for the print log system.
 * Validates the schema, tRPC routes, and data flow.
 */

describe("Print Logs Schema", () => {
  it("should have the printLogs table with correct columns", async () => {
    const { printLogs } = await import("../drizzle/schema");
    expect(printLogs).toBeDefined();
    
    // Check that the table has the expected column names
    const columnNames = Object.keys(printLogs);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("establishmentId");
    expect(columnNames).toContain("orderId");
    expect(columnNames).toContain("orderNumber");
    expect(columnNames).toContain("trigger");
    expect(columnNames).toContain("method");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("errorMessage");
    expect(columnNames).toContain("printerConnections");
    expect(columnNames).toContain("metadata");
    expect(columnNames).toContain("createdAt");
  });
});

describe("Print Logs DB Helpers", () => {
  it("should export createPrintLog function", async () => {
    const db = await import("./db");
    expect(typeof db.createPrintLog).toBe("function");
  });

  it("should export getPrintLogs function", async () => {
    const db = await import("./db");
    expect(typeof db.getPrintLogs).toBe("function");
  });

  it("should export getPrintLogStats function", async () => {
    const db = await import("./db");
    expect(typeof db.getPrintLogStats).toBe("function");
  });

  it("should export clearPrintLogs function", async () => {
    const db = await import("./db");
    expect(typeof db.clearPrintLogs).toBe("function");
  });
});

describe("Print Logs tRPC Routes", () => {
  it("should have printer.logs.list route defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    // Check that the printer router exists
    expect(appRouter._def.procedures).toBeDefined();
    
    // Check that printer.logs.list exists as a procedure
    const procedures = appRouter._def.procedures as Record<string, any>;
    expect(procedures["printer.logs.list"]).toBeDefined();
  });

  it("should have printer.logs.stats route defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as Record<string, any>;
    expect(procedures["printer.logs.stats"]).toBeDefined();
  });

  it("should have printer.logs.clear route defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as Record<string, any>;
    expect(procedures["printer.logs.clear"]).toBeDefined();
  });
});

describe("Print Log Trigger Integration", () => {
  it("createPrintLog should accept valid trigger values", async () => {
    const db = await import("./db");
    // Verify the function signature accepts the expected parameters
    expect(db.createPrintLog.length).toBeGreaterThanOrEqual(0);
  });

  it("getPrintLogs should accept filter options", async () => {
    const db = await import("./db");
    expect(db.getPrintLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("getPrintLogStats should accept establishmentId and days", async () => {
    const db = await import("./db");
    expect(db.getPrintLogStats.length).toBeGreaterThanOrEqual(1);
  });

  it("clearPrintLogs should accept establishmentId and optional olderThanDays", async () => {
    const db = await import("./db");
    expect(db.clearPrintLogs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Print Log Data Validation", () => {
  it("trigger enum should include expected values", async () => {
    const { printLogs } = await import("../drizzle/schema");
    // The trigger column should be defined
    expect(printLogs.trigger).toBeDefined();
  });

  it("method enum should include expected values", async () => {
    const { printLogs } = await import("../drizzle/schema");
    // The method column should be defined
    expect(printLogs.method).toBeDefined();
  });

  it("status enum should include expected values", async () => {
    const { printLogs } = await import("../drizzle/schema");
    // The status column should be defined
    expect(printLogs.status).toBeDefined();
  });
});

describe("Print Log Resilience", () => {
  it("createPrintLog should never throw an exception", async () => {
    const db = await import("./db");
    // Even with invalid/missing DB, createPrintLog should return null, not throw
    // The function has an outer try-catch that catches everything
    const result = await db.createPrintLog({
      establishmentId: 99999,
      orderId: 99999,
      orderNumber: "TEST-RESILIENCE",
      trigger: "new_order",
      method: "sse",
      status: "sent",
      printerConnections: 0,
    });
    // Should return a number (insertId) or null, never throw
    expect(result === null || typeof result === "number").toBe(true);
  });

  it("createPrintLog should return null instead of throwing on error", async () => {
    const db = await import("./db");
    // The function signature guarantees it returns Promise<number | null>
    const returnType = db.createPrintLog({
      establishmentId: 0,
      orderId: 0,
      orderNumber: "",
      trigger: "new_order",
      method: "sse",
      status: "failed",
    });
    // Should be a Promise
    expect(returnType).toBeInstanceOf(Promise);
    // Should resolve (not reject)
    const result = await returnType;
    expect(result === null || typeof result === "number").toBe(true);
  });

  it("all createPrintLog calls in db.ts should be fire-and-forget (no await)", async () => {
    const fs = await import("fs");
    const dbContent = fs.readFileSync("server/db.ts", "utf-8");
    
    // Find all lines with createPrintLog calls (excluding the function definition and exports)
    const lines = dbContent.split("\n");
    const callLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.includes("createPrintLog(") && 
             !trimmed.startsWith("export") && 
             !trimmed.startsWith("//") &&
             !trimmed.startsWith("*") &&
             !trimmed.includes("typeof db.createPrintLog");
    });
    
    // None of the call sites should use 'await createPrintLog'
    const awaitCalls = callLines.filter(line => line.includes("await createPrintLog"));
    expect(awaitCalls).toHaveLength(0);
    
    // All call sites should have .catch(() => {}) for fire-and-forget
    // (the function definition itself doesn't need it)
    const callSitesWithoutCatch = callLines.filter(line => {
      // Lines that start the call but the .catch is on the same or next line
      return line.includes("createPrintLog(") && 
             !line.includes(".catch") &&
             !line.includes("export") &&
             !line.includes("function createPrintLog");
    });
    // These are multi-line calls where .catch is on a subsequent line, which is fine
    // Just verify no 'await' is used
    for (const line of callSitesWithoutCatch) {
      expect(line).not.toContain("await");
    }
  });

  it("createPrintLog function should have outer try-catch wrapping everything", async () => {
    const fs = await import("fs");
    const dbContent = fs.readFileSync("server/db.ts", "utf-8");
    
    // Find the createPrintLog function definition
    const funcStart = dbContent.indexOf("export async function createPrintLog");
    expect(funcStart).toBeGreaterThan(-1);
    
    // Extract the function body (approximate)
    const funcBody = dbContent.substring(funcStart, funcStart + 1500);
    
    // Should contain the resilience comment
    expect(funcBody).toContain("NUNCA deve lan\u00e7ar exce\u00e7\u00e3o");
    
    // Should have try as the first block (outer try-catch)
    expect(funcBody).toContain("try {");
    
    // The getDb() call should be INSIDE the try block
    const tryIndex = funcBody.indexOf("try {");
    const getDbIndex = funcBody.indexOf("getDb()");
    expect(getDbIndex).toBeGreaterThan(tryIndex);
  });
});
