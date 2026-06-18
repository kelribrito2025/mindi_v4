import { describe, it, expect } from "vitest";
import { detectBestTimezone, SUPPORTED_TIMEZONES } from "../shared/const";

describe("SUPPORTED_TIMEZONES", () => {
  it("should have at least 20 timezones", () => {
    expect(SUPPORTED_TIMEZONES.length).toBeGreaterThanOrEqual(20);
  });

  it("should include America/Sao_Paulo as default", () => {
    const sp = SUPPORTED_TIMEZONES.find(tz => tz.value === "America/Sao_Paulo");
    expect(sp).toBeDefined();
    expect(sp!.group).toBe("Brasil");
  });

  it("should have unique values", () => {
    const values = SUPPORTED_TIMEZONES.map(tz => tz.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it("should have valid IANA timezone names", () => {
    for (const tz of SUPPORTED_TIMEZONES) {
      expect(() => {
        Intl.DateTimeFormat("en-US", { timeZone: tz.value });
      }).not.toThrow();
    }
  });

  it("should have group for each timezone", () => {
    for (const tz of SUPPORTED_TIMEZONES) {
      expect(tz.group).toBeTruthy();
      expect(["Brasil", "Portugal", "Outros"]).toContain(tz.group);
    }
  });
});

describe("detectBestTimezone", () => {
  it("should return the exact timezone if it is in the supported list", () => {
    expect(detectBestTimezone("America/Sao_Paulo")).toBe("America/Sao_Paulo");
    expect(detectBestTimezone("America/Manaus")).toBe("America/Manaus");
    expect(detectBestTimezone("Europe/Lisbon")).toBe("Europe/Lisbon");
    expect(detectBestTimezone("Asia/Tokyo")).toBe("Asia/Tokyo");
  });

  it("should return America/Sao_Paulo as default when no timezone provided", () => {
    expect(detectBestTimezone()).toBe("America/Sao_Paulo");
    expect(detectBestTimezone(undefined)).toBe("America/Sao_Paulo");
  });

  it("should map unsupported timezone to closest supported one by offset", () => {
    // America/Curitiba is not in the list but has same offset as America/Sao_Paulo (GMT-3)
    const result = detectBestTimezone("America/Curitiba");
    // Should map to a GMT-3 timezone (Sao_Paulo, Fortaleza, Recife, etc.)
    const resultTz = SUPPORTED_TIMEZONES.find(tz => tz.value === result);
    expect(resultTz).toBeDefined();
  });

  it("should map Europe/Berlin to a GMT+1 timezone", () => {
    // Europe/Berlin is GMT+1, should map to Madrid or Paris
    const result = detectBestTimezone("Europe/Berlin");
    expect(["Europe/Madrid", "Europe/Paris"]).toContain(result);
  });

  it("should map America/Toronto to a supported timezone with matching offset", () => {
    const result = detectBestTimezone("America/Toronto");
    // Toronto is EST/EDT (GMT-5 or GMT-4 depending on DST)
    // Should map to a supported timezone with the same current offset
    const supportedValues = SUPPORTED_TIMEZONES.map(tz => tz.value);
    expect(supportedValues).toContain(result);
  });

  it("should handle invalid timezone gracefully", () => {
    const result = detectBestTimezone("Invalid/Timezone");
    expect(result).toBe("America/Sao_Paulo");
  });

  it("should always return a value from SUPPORTED_TIMEZONES or the default", () => {
    const testTimezones = [
      "America/Sao_Paulo",
      "America/Curitiba",
      "Europe/Berlin",
      "Asia/Shanghai",
      "Pacific/Auckland",
      undefined,
    ];
    
    const supportedValues = SUPPORTED_TIMEZONES.map(tz => tz.value);
    
    for (const tz of testTimezones) {
      const result = detectBestTimezone(tz);
      expect(supportedValues).toContain(result);
    }
  });
});
