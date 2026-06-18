import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  createUserWithPassword: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock_token"),
  },
}));

import * as db from "./db";

describe("Auth Router - Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a new user successfully", async () => {
    // Mock: no existing user
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    vi.mocked(db.createUserWithPassword).mockResolvedValue({
      id: 1,
      openId: "email_123",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hashed_password",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const ctx: TrpcContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.register({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(db.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    expect(db.createUserWithPassword).toHaveBeenCalled();
  });

  it("should reject registration if email already exists", async () => {
    // Mock: existing user
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "existing_user",
      name: "Existing User",
      email: "test@example.com",
      passwordHash: "hashed_password",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const ctx: TrpcContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })
    ).rejects.toThrow("Este email já está cadastrado.");
  });

  it("should reject registration with short password", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test User",
        email: "test@example.com",
        password: "12345", // Too short
      })
    ).rejects.toThrow();
  });
});

describe("Auth Router - Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should login successfully with correct credentials", async () => {
    // Mock: existing user with password
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "email_123",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hashed_password",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const cookieFn = vi.fn();
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {
        cookie: cookieFn,
      } as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.loginWithEmail({
      email: "test@example.com",
      password: "password123",
      rememberMe: false,
    });

    expect(result.success).toBe(true);
    expect(cookieFn).toHaveBeenCalled();
    expect(db.updateUserLastSignedIn).toHaveBeenCalledWith(1);
  });

  it("should reject login with wrong email", async () => {
    // Mock: no user found
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);

    const ctx: TrpcContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.loginWithEmail({
        email: "nonexistent@example.com",
        password: "password123",
      })
    ).rejects.toThrow("Email ou senha incorretos.");
  });
});
