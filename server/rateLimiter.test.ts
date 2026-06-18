import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter, forgotPasswordLimiter, botApiLimiter, loginLimiter } from "./rateLimiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  it("should allow requests within the limit", () => {
    const r1 = limiter.check("key1");
    expect(r1.allowed).toBe(true);
    if (r1.allowed) expect(r1.remaining).toBe(2);

    const r2 = limiter.check("key1");
    expect(r2.allowed).toBe(true);
    if (r2.allowed) expect(r2.remaining).toBe(1);

    const r3 = limiter.check("key1");
    expect(r3.allowed).toBe(true);
    if (r3.allowed) expect(r3.remaining).toBe(0);
  });

  it("should block requests exceeding the limit", () => {
    limiter.check("key1");
    limiter.check("key1");
    limiter.check("key1");

    const r4 = limiter.check("key1");
    expect(r4.allowed).toBe(false);
    if (!r4.allowed) {
      expect(r4.retryAfterMs).toBeGreaterThan(0);
      expect(r4.retryAfterMs).toBeLessThanOrEqual(1000);
    }
  });

  it("should track different keys independently", () => {
    limiter.check("key1");
    limiter.check("key1");
    limiter.check("key1");

    // key1 is blocked
    const r1 = limiter.check("key1");
    expect(r1.allowed).toBe(false);

    // key2 is still allowed
    const r2 = limiter.check("key2");
    expect(r2.allowed).toBe(true);
    if (r2.allowed) expect(r2.remaining).toBe(2);
  });

  it("should reset after the window expires", async () => {
    const shortLimiter = new RateLimiter({ maxRequests: 1, windowMs: 100 });

    shortLimiter.check("key1");
    const blocked = shortLimiter.check("key1");
    expect(blocked.allowed).toBe(false);

    // Esperar a janela expirar
    await new Promise((resolve) => setTimeout(resolve, 150));

    const afterExpiry = shortLimiter.check("key1");
    expect(afterExpiry.allowed).toBe(true);
    if (afterExpiry.allowed) expect(afterExpiry.remaining).toBe(0);

    shortLimiter.destroy();
  });

  it("should reset the store when reset() is called", () => {
    limiter.check("key1");
    limiter.check("key1");
    limiter.check("key1");

    const blocked = limiter.check("key1");
    expect(blocked.allowed).toBe(false);

    limiter.reset();

    const afterReset = limiter.check("key1");
    expect(afterReset.allowed).toBe(true);
    if (afterReset.allowed) expect(afterReset.remaining).toBe(2);
  });
});

describe("forgotPasswordLimiter", () => {
  beforeEach(() => {
    forgotPasswordLimiter.reset();
  });

  it("should allow 5 requests and block the 6th", () => {
    const ip = "192.168.1.100";

    for (let i = 0; i < 5; i++) {
      const result = forgotPasswordLimiter.check(ip);
      expect(result.allowed).toBe(true);
    }

    const blocked = forgotPasswordLimiter.check(ip);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      // Retry after should be within 15 minutes (900000ms)
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(15 * 60 * 1000);
    }
  });

  it("should track different IPs independently", () => {
    const ip1 = "10.0.0.1";
    const ip2 = "10.0.0.2";

    // Esgotar limite do ip1
    for (let i = 0; i < 5; i++) {
      forgotPasswordLimiter.check(ip1);
    }

    const blockedIp1 = forgotPasswordLimiter.check(ip1);
    expect(blockedIp1.allowed).toBe(false);

    // ip2 ainda deve funcionar
    const allowedIp2 = forgotPasswordLimiter.check(ip2);
    expect(allowedIp2.allowed).toBe(true);
  });
});

describe("loginLimiter", () => {
  beforeEach(() => {
    loginLimiter.reset();
  });

  it("should allow 8 login attempts and block the 9th", () => {
    const ip = "192.168.1.50";

    for (let i = 0; i < 8; i++) {
      const result = loginLimiter.check(ip);
      expect(result.allowed).toBe(true);
    }

    const blocked = loginLimiter.check(ip);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      // Retry after should be within 15 minutes (900000ms)
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(15 * 60 * 1000);
    }
  });

  it("should track different IPs independently for login", () => {
    const ip1 = "172.16.0.1";
    const ip2 = "172.16.0.2";

    // Esgotar limite do ip1
    for (let i = 0; i < 8; i++) {
      loginLimiter.check(ip1);
    }

    const blockedIp1 = loginLimiter.check(ip1);
    expect(blockedIp1.allowed).toBe(false);

    // ip2 ainda deve funcionar
    const allowedIp2 = loginLimiter.check(ip2);
    expect(allowedIp2.allowed).toBe(true);
  });

  it("should share rate limit between owner and collaborator login from same IP", () => {
    const ip = "10.10.10.10";

    // Simular 8 tentativas (mesma instância loginLimiter usada em ambos endpoints)
    for (let i = 0; i < 8; i++) {
      loginLimiter.check(ip);
    }

    // A 9ª tentativa deve ser bloqueada (seja dono ou colaborador)
    const blocked = loginLimiter.check(ip);
    expect(blocked.allowed).toBe(false);
  });
});

describe("botApiLimiter", () => {
  beforeEach(() => {
    botApiLimiter.reset();
  });

  it("should allow 100 requests and block the 101st", () => {
    const apiKeyId = "apikey:42";

    for (let i = 0; i < 100; i++) {
      const result = botApiLimiter.check(apiKeyId);
      expect(result.allowed).toBe(true);
    }

    const blocked = botApiLimiter.check(apiKeyId);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      // Retry after should be within 1 minute (60000ms)
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(60 * 1000);
    }
  });

  it("should track different API keys independently", () => {
    const key1 = "apikey:1";
    const key2 = "apikey:2";

    // Esgotar limite da key1
    for (let i = 0; i < 100; i++) {
      botApiLimiter.check(key1);
    }

    const blockedKey1 = botApiLimiter.check(key1);
    expect(blockedKey1.allowed).toBe(false);

    // key2 ainda deve funcionar
    const allowedKey2 = botApiLimiter.check(key2);
    expect(allowedKey2.allowed).toBe(true);
  });
});
