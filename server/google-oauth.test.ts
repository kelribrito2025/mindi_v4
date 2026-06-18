import { describe, it, expect } from "vitest";

describe("Google OAuth credentials", () => {
  it("should have GOOGLE_CLIENT_ID configured", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId).toContain(".apps.googleusercontent.com");
  });

  it("should have GOOGLE_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret).toContain("GOCSPX-");
  });

  it("should be able to reach Google OAuth token endpoint", async () => {
    // Just verify the endpoint is reachable (don't actually auth)
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        code: "invalid_test_code",
        grant_type: "authorization_code",
        redirect_uri: "https://mindi.com.br/api/auth/google/callback",
      }),
    });
    // We expect a 400 (bad request) because the code is invalid, not a 401 (unauthorized)
    // A 401 would mean the client_id/secret are wrong
    const data = await response.json();
    // Google returns "invalid_grant" for bad code but valid credentials
    // Google returns "invalid_client" for bad credentials
    expect(data.error).not.toBe("invalid_client");
  });
});
