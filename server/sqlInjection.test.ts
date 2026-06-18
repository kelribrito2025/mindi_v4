import { describe, it, expect, vi } from "vitest";

// Test that getDailyRevenue, getDailyPaymentData, and getStoryAnalytics
// no longer use string concatenation for SQL queries

describe("SQL Injection Prevention", () => {
  describe("getDailyRevenue", () => {
    it("should not contain sql.raw with string concatenation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/db.ts", "utf-8");
      
      // Find the getDailyRevenue function
      const fnStart = content.indexOf("export async function getDailyRevenue");
      const fnEnd = content.indexOf("\nexport ", fnStart + 1);
      const fnBody = content.slice(fnStart, fnEnd > -1 ? fnEnd : fnStart + 2000);
      
      // Should NOT contain sql.raw(query) or sql.raw(countQuery) patterns
      expect(fnBody).not.toMatch(/sql\.raw\(query\)/);
      expect(fnBody).not.toMatch(/sql\.raw\(countQuery\)/);
      
      // Should NOT contain string concatenation for conditions
      expect(fnBody).not.toMatch(/conditions \+= `/);
      expect(fnBody).not.toMatch(/let conditions = `/);
    });

    it("should use parameterized sql template literals", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/db.ts", "utf-8");
      
      const fnStart = content.indexOf("export async function getDailyRevenue");
      const fnEnd = content.indexOf("\nexport ", fnStart + 1);
      const fnBody = content.slice(fnStart, fnEnd > -1 ? fnEnd : fnStart + 2000);
      
      // Should use sql`` template literals with ${} placeholders
      expect(fnBody).toMatch(/sql`.*\$\{establishmentId\}/s);
      expect(fnBody).toMatch(/sql`.*\$\{filters\.startDate\}/s);
      expect(fnBody).toMatch(/sql\.join\(conditions/);
    });

    it("should validate timezone format", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/db.ts", "utf-8");
      
      const fnStart = content.indexOf("export async function getDailyRevenue");
      const fnEnd = content.indexOf("\nexport ", fnStart + 1);
      const fnBody = content.slice(fnStart, fnEnd > -1 ? fnEnd : fnStart + 2000);
      
      // Should validate timezone with regex
      expect(fnBody).toMatch(/validTz|safeTz|sanitizedTz/);
      expect(fnBody).toMatch(/\.test\(tz\)/);
    });
  });

  describe("getDailyPaymentData (revenueByPaymentMethod)", () => {
    it("should not contain sql.raw with string concatenation for endCondition", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/db.ts", "utf-8");
      
      // Find the function that contains the endCondition pattern (around line 11190-11266)
      const fnMatch = content.indexOf("const endCondition = nowStr");
      
      if (fnMatch > -1) {
        // If endCondition still exists as string concatenation, it's a vulnerability
        const surrounding = content.slice(Math.max(0, fnMatch - 200), fnMatch + 500);
        // Should NOT have raw string interpolation in endCondition
        expect(surrounding).not.toMatch(/`AND CONVERT_TZ.*'\$\{tz\}'.*'\$\{nowStr\}'`/);
      }
    });
  });

  describe("getStoryAnalytics", () => {
    it("should not use sql.raw for idList", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/db.ts", "utf-8");
      
      const fnStart = content.indexOf("export async function getStoryAnalytics");
      const fnEnd = content.indexOf("\nexport ", fnStart + 1);
      const fnBody = content.slice(fnStart, fnEnd > -1 ? fnEnd : fnStart + 2000);
      
      // Should NOT use sql.raw(idList)
      expect(fnBody).not.toMatch(/sql\.raw\(idList\)/);
    });

    it("should use parameterized approach for IN clause", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/db.ts", "utf-8");
      
      const fnStart = content.indexOf("export async function getStoryAnalytics");
      const fnEnd = content.indexOf("\nexport ", fnStart + 1);
      const fnBody = content.slice(fnStart, fnEnd > -1 ? fnEnd : fnStart + 2000);
      
      // Should use inArray or sql.join for parameterized IN clause
      expect(fnBody).toMatch(/inArray|sql\.join|placeholders/);
    });
  });
});
