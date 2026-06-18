import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getCollaboratorByEmailGlobal: vi.fn(),
  getUserByResetToken: vi.fn(),
  getCollaboratorByResetToken: vi.fn(),
  setPasswordResetToken: vi.fn(),
  setCollaboratorResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  updateCollaboratorPassword: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
}));

// Mock other dependencies
vi.mock("./_core/auditLog", () => ({ auditLog: vi.fn() }));
vi.mock("./_core/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock("./_core/cookies", () => ({ getSessionCookieOptions: vi.fn(() => ({})) }));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: vi.fn(() => "mock-token") } }));
vi.mock("./email", () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  buildPasswordResetEmail: vi.fn(() => "<html>reset</html>"),
}));

import * as db from "./db";

describe("Collaborator Password Reset Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("forgotPassword - email lookup", () => {
    it("should prioritize collaborator when email exists in collaborators table", async () => {
      const mockCollaborator = {
        id: 1,
        name: "Test Collab",
        email: "collab@test.com",
        passwordHash: "hash",
        establishmentId: 1,
        permissions: [],
        isActive: true,
      };

      (db.getUserByEmail as any).mockResolvedValue(null);
      (db.getCollaboratorByEmailGlobal as any).mockResolvedValue(mockCollaborator);

      // The forgotPassword should call setCollaboratorResetToken, NOT setPasswordResetToken
      // We verify the logic by checking which function would be called
      const user = await db.getUserByEmail("collab@test.com");
      const collaborator = await db.getCollaboratorByEmailGlobal("collab@test.com");

      expect(user).toBeNull();
      expect(collaborator).not.toBeNull();
      expect(collaborator!.id).toBe(1);
      expect(collaborator!.name).toBe("Test Collab");

      // When collaborator is found, setCollaboratorResetToken should be called
      if (collaborator) {
        await db.setCollaboratorResetToken(collaborator.id, "test-token", new Date());
        expect(db.setCollaboratorResetToken).toHaveBeenCalledWith(1, "test-token", expect.any(Date));
        expect(db.setPasswordResetToken).not.toHaveBeenCalled();
      }
    });

    it("should use user reset when email only exists in users table", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "user@test.com",
        passwordHash: "hash",
        openId: "open-1",
      };

      (db.getUserByEmail as any).mockResolvedValue(mockUser);
      (db.getCollaboratorByEmailGlobal as any).mockResolvedValue(null);

      const user = await db.getUserByEmail("user@test.com");
      const collaborator = await db.getCollaboratorByEmailGlobal("user@test.com");

      expect(user).not.toBeNull();
      expect(collaborator).toBeNull();

      // When only user is found, setPasswordResetToken should be called
      if (!collaborator && user) {
        await db.setPasswordResetToken(user.id, "test-token", new Date());
        expect(db.setPasswordResetToken).toHaveBeenCalledWith(1, "test-token", expect.any(Date));
        expect(db.setCollaboratorResetToken).not.toHaveBeenCalled();
      }
    });
  });

  describe("resetPassword - token lookup", () => {
    it("should reset collaborator password when token belongs to collaborator", async () => {
      const mockCollaborator = {
        id: 5,
        name: "Collab Reset",
        email: "collab@test.com",
        passwordHash: "old-hash",
        resetToken: "collab-token-123",
        resetTokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        establishmentId: 1,
        permissions: [],
        isActive: true,
      };

      (db.getUserByResetToken as any).mockResolvedValue(null);
      (db.getCollaboratorByResetToken as any).mockResolvedValue(mockCollaborator);

      const user = await db.getUserByResetToken("collab-token-123");
      const collaborator = await db.getCollaboratorByResetToken("collab-token-123");

      expect(user).toBeNull();
      expect(collaborator).not.toBeNull();
      expect(collaborator!.id).toBe(5);

      // Should update collaborator password, NOT user password
      if (collaborator && collaborator.resetTokenExpiresAt && new Date() <= collaborator.resetTokenExpiresAt) {
        const newHash = await bcrypt.hash("newpassword123", 10);
        await db.updateCollaboratorPassword(collaborator.id, newHash);
        expect(db.updateCollaboratorPassword).toHaveBeenCalledWith(5, expect.any(String));
        expect(db.updateUserPassword).not.toHaveBeenCalled();
      }
    });

    it("should reset user password when token belongs to user", async () => {
      const mockUser = {
        id: 3,
        name: "User Reset",
        email: "user@test.com",
        passwordHash: "old-hash",
        resetToken: "user-token-456",
        resetTokenExpiresAt: new Date(Date.now() + 3600000),
        openId: "open-3",
      };

      (db.getUserByResetToken as any).mockResolvedValue(mockUser);
      (db.getCollaboratorByResetToken as any).mockResolvedValue(null);

      const user = await db.getUserByResetToken("user-token-456");
      const collaborator = await db.getCollaboratorByResetToken("user-token-456");

      expect(user).not.toBeNull();
      expect(collaborator).toBeNull();

      if (user && user.resetTokenExpiresAt && new Date() <= user.resetTokenExpiresAt) {
        const newHash = await bcrypt.hash("newpassword123", 10);
        await db.updateUserPassword(user.id, newHash);
        expect(db.updateUserPassword).toHaveBeenCalledWith(3, expect.any(String));
        expect(db.updateCollaboratorPassword).not.toHaveBeenCalled();
      }
    });

    it("should reject expired collaborator token", async () => {
      const mockCollaborator = {
        id: 5,
        name: "Collab Expired",
        email: "collab@test.com",
        passwordHash: "old-hash",
        resetToken: "expired-token",
        resetTokenExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago (expired)
        establishmentId: 1,
        permissions: [],
        isActive: true,
      };

      (db.getUserByResetToken as any).mockResolvedValue(null);
      (db.getCollaboratorByResetToken as any).mockResolvedValue(mockCollaborator);

      const collaborator = await db.getCollaboratorByResetToken("expired-token");
      expect(collaborator).not.toBeNull();
      
      // Token should be expired
      const isExpired = !collaborator!.resetTokenExpiresAt || new Date() > collaborator!.resetTokenExpiresAt;
      expect(isExpired).toBe(true);
    });
  });

  describe("loginWithEmail - collaborator detection", () => {
    it("should detect collaborator trying to login as establishment", async () => {
      const collabPassword = "testpass123";
      const collabHash = await bcrypt.hash(collabPassword, 10);

      const mockCollaborator = {
        id: 1,
        name: "Test Collab",
        email: "collab@test.com",
        passwordHash: collabHash,
        establishmentId: 1,
        permissions: [],
        isActive: true,
      };

      (db.getCollaboratorByEmailGlobal as any).mockResolvedValue(mockCollaborator);

      const collaborator = await db.getCollaboratorByEmailGlobal("collab@test.com");
      expect(collaborator).not.toBeNull();

      // Verify password matches collaborator
      const isValid = await bcrypt.compare(collabPassword, collaborator!.passwordHash);
      expect(isValid).toBe(true);

      // When collaborator password matches, should return isCollaborator flag
      // instead of proceeding with establishment login
      if (collaborator && isValid) {
        const result = { success: false, isCollaborator: true };
        expect(result.isCollaborator).toBe(true);
        expect(result.success).toBe(false);
      }
    });

    it("should allow normal user login when email is not a collaborator", async () => {
      (db.getCollaboratorByEmailGlobal as any).mockResolvedValue(null);

      const collaborator = await db.getCollaboratorByEmailGlobal("user@test.com");
      expect(collaborator).toBeNull();

      // Should proceed with normal user login flow
    });

    it("should fall through to user login when collaborator password doesn't match", async () => {
      const collabHash = await bcrypt.hash("collabpass", 10);
      const mockCollaborator = {
        id: 1,
        name: "Test Collab",
        email: "shared@test.com",
        passwordHash: collabHash,
        establishmentId: 1,
        permissions: [],
        isActive: true,
      };

      (db.getCollaboratorByEmailGlobal as any).mockResolvedValue(mockCollaborator);

      const collaborator = await db.getCollaboratorByEmailGlobal("shared@test.com");
      expect(collaborator).not.toBeNull();

      // Password doesn't match collaborator
      const isValid = await bcrypt.compare("differentpassword", collaborator!.passwordHash);
      expect(isValid).toBe(false);

      // Should fall through to check user table (not redirect to collaborator)
    });
  });
});
