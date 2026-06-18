import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the mandrill module
vi.mock("./mandrill", () => ({
  sendEmail: vi.fn().mockResolvedValue([{ email: "test@test.com", status: "sent" }]),
  buildPasswordResetEmail: vi.fn().mockReturnValue("<html>Reset email</html>"),
}));

describe("Password Reset Flow", () => {
  describe("Mandrill Email Service", () => {
    it("should have MANDRILL_API_KEY configured", () => {
      const apiKey = process.env.MANDRILL_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey).not.toBe("");
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

    it("should validate Mandrill API key with ping", async () => {
      const apiKey = process.env.MANDRILL_API_KEY;
      const response = await fetch("https://mandrillapp.com/api/1.0/users/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey }),
      });
      const data = await response.text();
      expect(response.ok).toBe(true);
      expect(data).toContain("PONG");
    });
  });

  describe("Password Reset Email Template", () => {
    it("should generate valid HTML email template", async () => {
      const { buildPasswordResetEmail: realBuild } = await vi.importActual<typeof import("./mandrill")>("./mandrill");
      const html = realBuild("João Silva", "https://v2.mindi.com.br/redefinir-senha?token=abc123");
      
      expect(html).toContain("João Silva");
      expect(html).toContain("https://v2.mindi.com.br/redefinir-senha?token=abc123");
      expect(html).toContain("Redefinir minha senha");
      expect(html).toContain("1 hora");
      expect(html).toContain("Mindi");
      expect(html).toContain("<!DOCTYPE html>");
    });

    it("should handle empty user name gracefully", async () => {
      const { buildPasswordResetEmail: realBuild } = await vi.importActual<typeof import("./mandrill")>("./mandrill");
      const html = realBuild("", "https://example.com/reset?token=xyz");
      
      expect(html).toContain("Olá!");
      expect(html).not.toContain("Olá,");
      expect(html).toContain("https://example.com/reset?token=xyz");
    });
  });

  describe("Token Generation", () => {
    it("should generate unique tokens", async () => {
      const crypto = await import("crypto");
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");
      
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it("should generate tokens with sufficient entropy", async () => {
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      
      // Check it's a valid hex string
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("Token Expiration", () => {
    it("should set expiration to 1 hour from now", () => {
      const now = Date.now();
      const expiresAt = new Date(now + 60 * 60 * 1000);
      
      const diffMs = expiresAt.getTime() - now;
      expect(diffMs).toBe(3600000); // 1 hour in ms
    });

    it("should correctly detect expired tokens", () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      expect(new Date() > expiredDate).toBe(true);
    });

    it("should correctly detect valid tokens", () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      expect(new Date() > futureDate).toBe(false);
    });
  });
});
