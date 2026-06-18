import { describe, it, expect } from "vitest";

/**
 * Tests for the HTML receipt template width fix.
 * 
 * Problem: The Mindi Printer app renders HTML without @media print context,
 * so the body's max-width: 320px was being used instead of the paper width.
 * 
 * Fix: The base body style now uses width/max-width set to paperWidth (72mm for 80mm, 48mm for 58mm).
 * The 320px max-width is only applied inside @media screen (browser preview).
 * This ensures the Mindi Printer app (which doesn't use @media queries) gets the correct paper width.
 */

describe("HTML Receipt Template Width", () => {
  it("should have generateReceiptHTML function available in index.ts", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    expect(indexContent).toContain("function generateReceiptHTML");
  });

  it("base body style should use paperWidth variable, not hardcoded 320px", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    
    // Find all body style blocks (not inside @media)
    // The base body should use ${paperWidth} for width and max-width
    const bodyStyleRegex = /body\s*\{\s*[^}]*width:\s*\$\{paperWidth\}/g;
    const matches = indexContent.match(bodyStyleRegex);
    
    // Should have at least 2 matches (one per template instance)
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("base body style should NOT have max-width: 320px outside @media screen", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    
    // Find the generateReceiptHTML function
    const funcStart = indexContent.indexOf("function generateReceiptHTML");
    expect(funcStart).toBeGreaterThan(-1);
    
    // Extract the template section (first occurrence)
    const templateStart = indexContent.indexOf("<style>", funcStart);
    const templateEnd = indexContent.indexOf("</style>", templateStart);
    const styleContent = indexContent.substring(templateStart, templateEnd);
    
    // The base body should NOT contain max-width: 320px
    // 320px should only appear inside @media screen
    const lines = styleContent.split("\n");
    let inMediaScreen = false;
    let inBody = false;
    let bodyDepth = 0;
    
    for (const line of lines) {
      if (line.includes("@media screen")) {
        inMediaScreen = true;
      }
      if (line.includes("@media print")) {
        inMediaScreen = false;
      }
      
      // Check that 320px only appears inside @media screen context
      if (line.includes("320px")) {
        expect(inMediaScreen).toBe(true);
      }
    }
  });

  it("@media screen should override body with max-width: 320px for browser preview", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    
    // Should have @media screen with 320px
    expect(indexContent).toContain("@media screen");
    expect(indexContent).toContain("max-width: 320px");
  });

  it("@media print should use paperWidth for body width", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    
    // The @media print block should contain width: ${paperWidth}
    const printMediaRegex = /@media print\s*\{[\s\S]*?width:\s*\$\{paperWidth\}/g;
    const matches = indexContent.match(printMediaRegex);
    
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("paperWidth should be 72mm for 80mm paper and 48mm for 58mm paper", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    
    // Check the paperWidth calculation
    expect(indexContent).toContain("const paperWidth = is58mm ? '48mm' : '72mm'");
  });

  it("both template instances should have the same CSS structure", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync("server/_core/index.ts", "utf-8");
    
    // Count occurrences of key CSS patterns that should appear in both templates
    const screenMediaCount = (indexContent.match(/@media screen\s*\{/g) || []).length;
    const printMediaCount = (indexContent.match(/@media print\s*\{/g) || []).length;
    
    // Both templates should have @media screen and @media print
    expect(screenMediaCount).toBeGreaterThanOrEqual(2);
    expect(printMediaCount).toBeGreaterThanOrEqual(2);
  });
});
