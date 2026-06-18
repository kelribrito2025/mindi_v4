import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Test admin authentication logic
describe("Admin Authentication", () => {
  const ADMIN_JWT_SECRET = "test_secret_admin";

  it("should hash and verify admin password correctly", async () => {
    const password = "TestSenha1234";
    const hash = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await bcrypt.compare("wrong_password", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create and verify admin JWT token", () => {
    const payload = { userId: 1, email: "test-admin@example.com", role: "admin" };
    const token = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: "7d" });
    
    expect(token).toBeTruthy();
    
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe("test-admin@example.com");
    expect(decoded.role).toBe("admin");
  });

  it("should reject token with wrong secret", () => {
    const payload = { userId: 1, email: "test-admin@example.com", role: "admin" };
    const token = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: "7d" });
    
    expect(() => jwt.verify(token, "wrong_secret")).toThrow();
  });

  it("should reject non-admin role in token", () => {
    const payload = { userId: 1, email: "user@test.com", role: "user" };
    const token = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: "7d" });
    
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    expect(decoded.role).not.toBe("admin");
  });
});

// Test admin cookie parsing logic
describe("Admin Cookie Parsing", () => {
  function getAdminFromCookies(cookieHeader: string | undefined, secret: string) {
    try {
      const cookies = cookieHeader?.split(";").reduce((acc: any, c: string) => {
        const [key, val] = c.trim().split("=");
        acc[key] = val;
        return acc;
      }, {} as Record<string, string>) || {};

      const token = cookies["admin_session"];
      if (!token) return null;

      const decoded = jwt.verify(token, secret) as any;
      if (decoded.role !== "admin") return null;
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      return null;
    }
  }

  const secret = "test_secret_admin";
  const validToken = jwt.sign(
    { userId: 1, email: "test-admin@example.com", role: "admin" },
    secret,
    { expiresIn: "7d" }
  );

  it("should extract admin from valid cookie", () => {
    const result = getAdminFromCookies(`admin_session=${validToken}`, secret);
    expect(result).toEqual({ userId: 1, email: "test-admin@example.com" });
  });

  it("should return null for missing cookie", () => {
    const result = getAdminFromCookies("other_cookie=abc", secret);
    expect(result).toBeNull();
  });

  it("should return null for undefined cookie header", () => {
    const result = getAdminFromCookies(undefined, secret);
    expect(result).toBeNull();
  });

  it("should return null for invalid token", () => {
    const result = getAdminFromCookies("admin_session=invalid_token", secret);
    expect(result).toBeNull();
  });

  it("should return null for non-admin role token", () => {
    const userToken = jwt.sign(
      { userId: 2, email: "user@test.com", role: "user" },
      secret,
      { expiresIn: "7d" }
    );
    const result = getAdminFromCookies(`admin_session=${userToken}`, secret);
    expect(result).toBeNull();
  });
});

// Test trial status calculation logic (same as admin uses)
describe("Admin Trial Status Calculation", () => {
  function calculateTrialStatus(trialStartDate: Date | null, trialDays: number, planType: string) {
    if (planType !== "trial") return { status: "not_trial", daysRemaining: 0, expired: false };
    if (!trialStartDate) return { status: "expired", daysRemaining: 0, expired: true };

    const now = new Date();
    const expirationDate = new Date(trialStartDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const remaining = expirationDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));

    if (remaining <= 0) return { status: "expired", daysRemaining: 0, expired: true };
    if (daysRemaining <= 3) return { status: "expiring_soon", daysRemaining, expired: false };
    return { status: "active", daysRemaining, expired: false };
  }

  it("should return not_trial for paid plans", () => {
    const result = calculateTrialStatus(new Date(), 15, "basic");
    expect(result.status).toBe("not_trial");
    expect(result.expired).toBe(false);
  });

  it("should return active for fresh trial", () => {
    const result = calculateTrialStatus(new Date(), 15, "trial");
    expect(result.status).toBe("active");
    expect(result.daysRemaining).toBe(15);
    expect(result.expired).toBe(false);
  });

  it("should return expired for old trial", () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const result = calculateTrialStatus(oldDate, 15, "trial");
    expect(result.status).toBe("expired");
    expect(result.daysRemaining).toBe(0);
    expect(result.expired).toBe(true);
  });

  it("should return expiring_soon for trial with 2 days left", () => {
    const startDate = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    const result = calculateTrialStatus(startDate, 15, "trial");
    expect(result.status).toBe("expiring_soon");
    expect(result.daysRemaining).toBeLessThanOrEqual(3);
    expect(result.expired).toBe(false);
  });

  it("should return expired for null trialStartDate", () => {
    const result = calculateTrialStatus(null, 15, "trial");
    expect(result.status).toBe("expired");
    expect(result.expired).toBe(true);
  });
});

// Test ADMIN_JWT_SECRET environment variable requirement
describe("Admin JWT Secret Configuration", () => {
  it("should have ADMIN_JWT_SECRET configured in environment", () => {
    const secret = process.env.ADMIN_JWT_SECRET;
    expect(secret).toBeTruthy();
    expect(secret!.length).toBeGreaterThanOrEqual(32);
  });

  it("should have ADMIN_JWT_SECRET different from JWT_SECRET", () => {
    const adminSecret = process.env.ADMIN_JWT_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    // Ambos devem existir e ser diferentes
    expect(adminSecret).toBeTruthy();
    expect(jwtSecret).toBeTruthy();
    expect(adminSecret).not.toBe(jwtSecret);
  });

  it("should not be a derivation of JWT_SECRET", () => {
    const adminSecret = process.env.ADMIN_JWT_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    // Não deve conter o JWT_SECRET como substring
    if (jwtSecret && adminSecret) {
      expect(adminSecret.includes(jwtSecret)).toBe(false);
      expect(adminSecret).not.toBe(jwtSecret + "_admin");
      expect(adminSecret).not.toBe(jwtSecret + "_admin_v2");
    }
  });
});

// Test dashboard stats calculation
describe("Admin Dashboard Stats", () => {
  function calculateStats(restaurants: Array<{
    planType: string;
    trialStartDate: Date | null;
    trialDays: number;
    createdAt: Date;
  }>) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let newSignups = 0;
    let activeTrial = 0;
    let paid = 0;
    let expired = 0;

    for (const r of restaurants) {
      if (r.createdAt >= sevenDaysAgo) newSignups++;

      if (r.planType === "trial") {
        if (!r.trialStartDate) {
          expired++;
        } else {
          const expDate = new Date(r.trialStartDate.getTime() + r.trialDays * 24 * 60 * 60 * 1000);
          if (expDate.getTime() <= now.getTime()) {
            expired++;
          } else {
            activeTrial++;
          }
        }
      } else {
        paid++;
      }
    }

    return { newSignups, activeTrial, paid, expired };
  }

  it("should count new signups from last 7 days", () => {
    const restaurants = [
      { planType: "trial", trialStartDate: new Date(), trialDays: 15, createdAt: new Date() },
      { planType: "basic", trialStartDate: null, trialDays: 0, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    ];
    const stats = calculateStats(restaurants);
    expect(stats.newSignups).toBe(1);
  });

  it("should count active trials vs expired", () => {
    const restaurants = [
      { planType: "trial", trialStartDate: new Date(), trialDays: 15, createdAt: new Date() },
      { planType: "trial", trialStartDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), trialDays: 15, createdAt: new Date() },
    ];
    const stats = calculateStats(restaurants);
    expect(stats.activeTrial).toBe(1);
    expect(stats.expired).toBe(1);
  });

  it("should count paid plans", () => {
    const restaurants = [
      { planType: "lite", trialStartDate: null, trialDays: 0, createdAt: new Date() },
      { planType: "basic", trialStartDate: null, trialDays: 0, createdAt: new Date() },
      { planType: "pro", trialStartDate: null, trialDays: 0, createdAt: new Date() },
    ];
    const stats = calculateStats(restaurants);
    expect(stats.paid).toBe(3);
    expect(stats.activeTrial).toBe(0);
    expect(stats.expired).toBe(0);
  });
});
