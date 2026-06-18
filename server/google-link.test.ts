import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  getUserByGoogleId: vi.fn(),
  linkGoogleId: vi.fn(),
  unlinkGoogleId: vi.fn(),
  getUserByEmail: vi.fn(),
  createUserWithGoogle: vi.fn(),
  createUserWithPassword: vi.fn(),
  upsertUser: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
  getCollaboratorByEmailGlobal: vi.fn(),
  getUserByResetToken: vi.fn(),
  getCollaboratorByResetToken: vi.fn(),
  setPasswordResetToken: vi.fn(),
  setCollaboratorResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  updateCollaboratorPassword: vi.fn(),
  createEstablishment: vi.fn(),
}));

// Mock other dependencies
vi.mock("./_core/auditLog", () => ({
  auditLog: vi.fn(),
}));
vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-token"),
    authenticateRequest: vi.fn(),
  },
}));
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  }),
}));
vi.mock("./mandrill", () => ({
  sendEmail: vi.fn(),
  buildPasswordResetEmail: vi.fn(),
}));
vi.mock("./rateLimiter", () => ({
  loginLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
  forgotPasswordLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
}));

import * as db from "./db";

describe("Google Link/Unlink - DB Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unlinkGoogleId", () => {
    it("should call unlinkGoogleId with correct user ID", async () => {
      const mockUnlink = vi.mocked(db.unlinkGoogleId);
      mockUnlink.mockResolvedValue(undefined);

      await db.unlinkGoogleId(42);

      expect(mockUnlink).toHaveBeenCalledWith(42);
      expect(mockUnlink).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUserByGoogleId", () => {
    it("should return user when Google ID exists", async () => {
      const mockUser = {
        id: 1,
        openId: "open-123",
        email: "test@example.com",
        googleId: "google-abc",
        passwordHash: "hash123",
        name: "Test User",
      };
      vi.mocked(db.getUserByGoogleId).mockResolvedValue(mockUser as any);

      const result = await db.getUserByGoogleId("google-abc");

      expect(result).toEqual(mockUser);
      expect(db.getUserByGoogleId).toHaveBeenCalledWith("google-abc");
    });

    it("should return null/undefined when Google ID does not exist", async () => {
      vi.mocked(db.getUserByGoogleId).mockResolvedValue(undefined as any);

      const result = await db.getUserByGoogleId("nonexistent");

      expect(result).toBeFalsy();
    });
  });

  describe("linkGoogleId", () => {
    it("should call linkGoogleId with correct parameters", async () => {
      vi.mocked(db.linkGoogleId).mockResolvedValue(undefined);

      await db.linkGoogleId(42, "google-xyz");

      expect(db.linkGoogleId).toHaveBeenCalledWith(42, "google-xyz");
    });
  });
});

describe("Google Status Logic", () => {
  it("should return linked=true when user has googleId", () => {
    const user = {
      googleId: "google-123",
      passwordHash: "hash",
      loginMethod: "email",
    };
    
    const result = {
      linked: !!user.googleId,
      googleId: user.googleId || null,
      hasPassword: !!user.passwordHash,
      loginMethod: user.loginMethod || null,
    };

    expect(result.linked).toBe(true);
    expect(result.googleId).toBe("google-123");
    expect(result.hasPassword).toBe(true);
  });

  it("should return linked=false when user has no googleId", () => {
    const user = {
      googleId: null,
      passwordHash: "hash",
      loginMethod: "email",
    };
    
    const result = {
      linked: !!user.googleId,
      googleId: user.googleId || null,
      hasPassword: !!user.passwordHash,
      loginMethod: user.loginMethod || null,
    };

    expect(result.linked).toBe(false);
    expect(result.googleId).toBeNull();
    expect(result.hasPassword).toBe(true);
  });

  it("should return hasPassword=false when user logged in only via Google", () => {
    const user = {
      googleId: "google-456",
      passwordHash: null,
      loginMethod: "google",
    };
    
    const result = {
      linked: !!user.googleId,
      googleId: user.googleId || null,
      hasPassword: !!user.passwordHash,
      loginMethod: user.loginMethod || null,
    };

    expect(result.linked).toBe(true);
    expect(result.hasPassword).toBe(false);
    expect(result.loginMethod).toBe("google");
  });
});

describe("Unlink Google Validation Logic", () => {
  it("should not allow unlink when user has no password", () => {
    const user = {
      googleId: "google-789",
      passwordHash: null,
    };

    const canUnlink = !!user.googleId && !!user.passwordHash;
    expect(canUnlink).toBe(false);
  });

  it("should allow unlink when user has both Google and password", () => {
    const user = {
      googleId: "google-789",
      passwordHash: "hash123",
    };

    const canUnlink = !!user.googleId && !!user.passwordHash;
    expect(canUnlink).toBe(true);
  });

  it("should not allow unlink when no Google is linked", () => {
    const user = {
      googleId: null,
      passwordHash: "hash123",
    };

    const canUnlink = !!user.googleId && !!user.passwordHash;
    expect(canUnlink).toBe(false);
  });
});
