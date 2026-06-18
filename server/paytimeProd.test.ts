import { describe, it, expect } from "vitest";

/**
 * Testes para validar as credenciais Paytime de produção
 */
describe("Paytime Production Credentials", () => {
  it("should have production base URL configured", () => {
    const baseUrl = process.env.PAYTIME_BASE_URL;
    expect(baseUrl).toBeDefined();
    expect(baseUrl).toBe("https://api.paytime.com.br");
    expect(baseUrl).not.toContain("sandbox");
  });

  it("should have production integration key configured", () => {
    const key = process.env.PAYTIME_INTEGRATION_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
    expect(key).toBe("2f402dae-1d68-4ce0-a84f-2b83a07aa515");
  });

  it("should have production authentication key configured", () => {
    const key = process.env.PAYTIME_AUTHENTICATION_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it("should have production x-token configured", () => {
    const token = process.env.PAYTIME_X_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(0);
  });

  it("should have production establishment ID configured", () => {
    const id = process.env.PAYTIME_ESTABLISHMENT_ID;
    expect(id).toBeDefined();
    expect(id).toBe("358314");
  });

  it(
    "should authenticate with production Paytime API",
    async () => {
      const baseUrl = process.env.PAYTIME_BASE_URL;
      const integrationKey = process.env.PAYTIME_INTEGRATION_KEY;
      const authKey = process.env.PAYTIME_AUTHENTICATION_KEY;
      const xToken = process.env.PAYTIME_X_TOKEN;

      // O login da Paytime envia as credenciais no body JSON, não nos headers
      const response = await fetch(`${baseUrl}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "integration-key": integrationKey,
          "authentication-key": authKey,
          "x-token": xToken,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.token).toBeTruthy();
    },
    20000
  );
});
