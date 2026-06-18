import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Paytime Authentication", () => {
  it("should authenticate with sandbox credentials and receive a JWT token", async () => {
    // Verify env vars are set
    expect(ENV.paytimeBaseUrl).toBeTruthy();
    expect(ENV.paytimeIntegrationKey).toBeTruthy();
    expect(ENV.paytimeAuthenticationKey).toBeTruthy();
    expect(ENV.paytimeXToken).toBeTruthy();

    const url = `${ENV.paytimeBaseUrl}/v1/auth/login`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "integration-key": ENV.paytimeIntegrationKey,
        "authentication-key": ENV.paytimeAuthenticationKey,
        "x-token": ENV.paytimeXToken,
      }),
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.token).toBeTruthy();
    expect(typeof data.token).toBe("string");

    console.log("[Paytime Auth Test] Token received successfully, length:", data.token.length);
  }, 15000); // 15s timeout for network request
});
