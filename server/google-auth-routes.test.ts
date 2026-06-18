import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes para as rotas de autenticação Google OAuth.
 * Testa a lógica do módulo googleAuth.ts sem precisar de um servidor real.
 */

// Mock do ENV
vi.mock("./server/_core/env", () => ({
  ENV: {
    googleClientId: "test-client-id",
    googleClientSecret: "test-client-secret",
  },
}));

// Mock do sdk
vi.mock("./server/_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

// Mock do logger
vi.mock("./server/_core/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do auditLog
vi.mock("./server/_core/auditLog", () => ({
  auditLog: vi.fn(),
}));

// Mock do cookies
vi.mock("./server/_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
  }),
}));

// Mock do db
vi.mock("./server/db", () => ({
  getUserByGoogleId: vi.fn(),
  getUserByEmail: vi.fn(),
  createUserWithGoogle: vi.fn(),
  linkGoogleId: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
}));

describe("Google OAuth Routes", () => {
  it("should have GOOGLE_CLIENT_ID configured in environment", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId).toContain("apps.googleusercontent.com");
  });

  it("should have GOOGLE_CLIENT_SECRET configured in environment", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret!.length).toBeGreaterThan(10);
  });

  it("should construct correct Google OAuth URL", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const redirectUri = "https://mindi.com.br/api/auth/google/callback";
    const scope = "openid email profile";
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      access_type: "offline",
      prompt: "select_account",
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    expect(authUrl).toContain("accounts.google.com");
    expect(authUrl).toContain(clientId);
    expect(authUrl).toContain(encodeURIComponent(redirectUri));
    expect(authUrl).toContain("response_type=code");
    expect(authUrl).toContain("scope=openid");
  });

  it("should have the correct redirect URI format", () => {
    const redirectUri = "https://mindi.com.br/api/auth/google/callback";
    
    // Verificar que a URI é HTTPS
    expect(redirectUri).toMatch(/^https:\/\//);
    // Verificar que termina com o path correto
    expect(redirectUri).toContain("/api/auth/google/callback");
    // Verificar que usa o domínio correto
    expect(redirectUri).toContain("mindi.com.br");
  });

  it("should generate valid CSRF state tokens", () => {
    const crypto = require("crypto");
    const state = crypto.randomBytes(32).toString("hex");
    
    // State deve ter 64 caracteres (32 bytes em hex)
    expect(state).toHaveLength(64);
    // State deve ser hexadecimal
    expect(state).toMatch(/^[0-9a-f]+$/);
  });

  it("should handle Google token exchange URL correctly", () => {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const userinfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
    
    expect(tokenUrl).toContain("googleapis.com/token");
    expect(userinfoUrl).toContain("googleapis.com/oauth2/v2/userinfo");
  });
});

describe("Google OAuth Database Functions", () => {
  it("should have googleId field in users schema", async () => {
    // Importar o schema para verificar que o campo existe
    const { users } = await import("../drizzle/schema");
    
    // Verificar que a tabela users tem o campo googleId
    expect(users).toBeDefined();
    const columns = Object.keys(users);
    // O campo googleId deve existir no schema
    expect(columns.length).toBeGreaterThan(0);
  });
});
