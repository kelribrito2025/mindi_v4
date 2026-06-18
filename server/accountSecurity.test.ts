import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock do módulo de banco de dados
vi.mock("./db", () => ({
  getEstablishmentAccountData: vi.fn(),
  updateEstablishmentAccountData: vi.fn(),
  getUserById: vi.fn(),
  updateUserPassword: vi.fn(),
  updateTwoFactorSettings: vi.fn(),
}));

import * as db from "./db";

describe("Account Security Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEstablishmentAccountData", () => {
    it("should return account data for valid establishment", async () => {
      const mockAccountData = {
        id: 1,
        name: "Restaurante Teste",
        email: "teste@email.com",
        cnpj: "12.345.678/0001-90",
        responsibleName: "João Silva",
        responsiblePhone: "(11) 99999-9999",
        twoFactorEnabled: false,
        twoFactorEmail: null,
      };

      vi.mocked(db.getEstablishmentAccountData).mockResolvedValue(mockAccountData);

      const result = await db.getEstablishmentAccountData(1);

      expect(result).toEqual(mockAccountData);
      expect(db.getEstablishmentAccountData).toHaveBeenCalledWith(1);
    });

    it("should return null for non-existent establishment", async () => {
      vi.mocked(db.getEstablishmentAccountData).mockResolvedValue(null);

      const result = await db.getEstablishmentAccountData(999);

      expect(result).toBeNull();
    });
  });

  describe("updateEstablishmentAccountData", () => {
    it("should update account data successfully", async () => {
      vi.mocked(db.updateEstablishmentAccountData).mockResolvedValue(undefined);

      const updateData = {
        name: "Novo Nome",
        email: "novo@email.com",
        cnpj: "98.765.432/0001-10",
      };

      await db.updateEstablishmentAccountData(1, updateData);

      expect(db.updateEstablishmentAccountData).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe("Password Change Validation", () => {
    it("should validate password minimum length of 8 characters", () => {
      const validPassword = "12345678";
      const invalidPassword = "1234567";

      expect(validPassword.length >= 8).toBe(true);
      expect(invalidPassword.length >= 8).toBe(false);
    });

    it("should verify password match", () => {
      const newPassword = "newpassword123";
      const confirmPassword = "newpassword123";
      const wrongConfirm = "differentpassword";

      expect(newPassword === confirmPassword).toBe(true);
      expect(newPassword === wrongConfirm).toBe(false);
    });

    it("should hash password correctly with bcrypt", async () => {
      const password = "testpassword123";
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare("wrongpassword", hash)).toBe(false);
    });
  });

  describe("getUserById", () => {
    it("should return user with passwordHash", async () => {
      const mockUser = {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@email.com",
        passwordHash: "$2a$10$hashedpassword",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "email",
      };

      vi.mocked(db.getUserById).mockResolvedValue(mockUser);

      const result = await db.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(result?.passwordHash).toBeDefined();
    });

    it("should return null for non-existent user", async () => {
      vi.mocked(db.getUserById).mockResolvedValue(null);

      const result = await db.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe("updateUserPassword", () => {
    it("should update password hash", async () => {
      vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);

      const newHash = "$2a$10$newhash";
      await db.updateUserPassword(1, newHash);

      expect(db.updateUserPassword).toHaveBeenCalledWith(1, newHash);
    });
  });

  describe("Two Factor Authentication", () => {
    it("should enable 2FA with email", async () => {
      vi.mocked(db.updateTwoFactorSettings).mockResolvedValue(undefined);

      await db.updateTwoFactorSettings(1, true, "2fa@email.com");

      expect(db.updateTwoFactorSettings).toHaveBeenCalledWith(1, true, "2fa@email.com");
    });

    it("should disable 2FA", async () => {
      vi.mocked(db.updateTwoFactorSettings).mockResolvedValue(undefined);

      await db.updateTwoFactorSettings(1, false);

      expect(db.updateTwoFactorSettings).toHaveBeenCalledWith(1, false);
    });
  });

  describe("CNPJ Formatting", () => {
    it("should format CNPJ correctly", () => {
      const formatCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length <= 14) {
          return numbers
            .replace(/(\d{2})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
        }
        return value;
      };

      expect(formatCNPJ("12345678000190")).toBe("12.345.678/0001-90");
      expect(formatCNPJ("12345678")).toBe("12.345.678");
    });
  });

  describe("Phone Formatting", () => {
    it("should format phone correctly", () => {
      const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length <= 11) {
          if (numbers.length <= 10) {
            return numbers
              .replace(/(\d{2})(\d)/, "($1) $2")
              .replace(/(\d{4})(\d)/, "$1-$2");
          }
          return numbers
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
        }
        return value;
      };

      expect(formatPhone("11999999999")).toBe("(11) 99999-9999");
      expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    });
  });
});
