import { describe, it, expect } from "vitest";

describe("Mandrill API Key Validation", () => {
  it("should validate the Mandrill API key with a ping request", async () => {
    const apiKey = process.env.MANDRILL_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");

    const response = await fetch("https://mandrillapp.com/api/1.0/users/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey }),
    });

    const data = await response.text();
    console.log("Mandrill ping response:", response.status, data);
    // Mandrill returns 200 with "PONG!" on success, or 500 with error JSON for invalid key
    if (!response.ok) {
      // Check if it's an auth error
      const parsed = JSON.parse(data);
      console.log("Error:", parsed);
    }
    expect(response.ok).toBe(true);
    expect(data).toContain("PONG");
  });

  it("should have MANDRILL_FROM_EMAIL configured", () => {
    const fromEmail = process.env.MANDRILL_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).toContain("@");
  });

  it("should have MANDRILL_FROM_NAME configured", () => {
    const fromName = process.env.MANDRILL_FROM_NAME;
    expect(fromName).toBeDefined();
    expect(fromName!.length).toBeGreaterThan(0);
  });
});
