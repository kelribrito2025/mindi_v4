import { describe, it, expect } from "vitest";

describe("UAZAPI Credentials Validation", () => {
  it("should have UAZAPI_BASE_URL configured", () => {
    const baseUrl = process.env.UAZAPI_BASE_URL;
    expect(baseUrl).toBeDefined();
    expect(baseUrl).not.toBe("");
    expect(baseUrl).toMatch(/^https?:\/\//);
  });

  it("should have UAZAPI_ADMIN_TOKEN configured", () => {
    const token = process.env.UAZAPI_ADMIN_TOKEN;
    expect(token).toBeDefined();
    expect(token).not.toBe("");
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should be able to connect to UAZAPI server", async () => {
    const baseUrl = process.env.UAZAPI_BASE_URL;
    const token = process.env.UAZAPI_ADMIN_TOKEN;
    
    // Skip if credentials not available (they are injected at runtime)
    if (!baseUrl || !token) {
      console.log("Skipping UAZAPI connection test - credentials not available in test environment");
      return;
    }

    // Test connection by fetching all instances (correct endpoint)
    const response = await fetch(`${baseUrl}/instance/all`, {
      method: "GET",
      headers: {
        "admintoken": token,
        "Content-Type": "application/json"
      }
    });

    // Should return 200 OK (even if empty list)
    expect(response.status).toBe(200);
    
    const data = await response.json();
    // Response should be an array (list of instances)
    expect(Array.isArray(data)).toBe(true);
  });
});
