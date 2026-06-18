import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key Validation", () => {
  it("should have RESEND_API_KEY configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^re_/);
  });

  it("should have RESEND_FROM_EMAIL configured", () => {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    expect(fromEmail).toBeTruthy();
    expect(fromEmail).toContain("@");
  });

  it("should be able to create Resend client", () => {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    expect(resend).toBeDefined();
  });

  it("should validate API key by listing domains", async () => {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    // Listar domínios é uma operação leve que valida a API key
    const { data, error } = await resend.domains.list();
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
