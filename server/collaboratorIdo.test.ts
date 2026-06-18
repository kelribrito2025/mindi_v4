import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getCollaboratorById: vi.fn(),
  updateCollaborator: vi.fn(),
  deleteCollaborator: vi.fn(),
  getEstablishmentById: vi.fn(),
  getCollaboratorsByEstablishment: vi.fn(),
  getCollaboratorByEmail: vi.fn(),
  createCollaborator: vi.fn(),
  getCollaboratorByEmailGlobal: vi.fn(),
  updateCollaboratorLastLogin: vi.fn(),
  getUserById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const mockCollaborator = {
  id: 10,
  establishmentId: 1,
  name: "Colab A",
  email: "colabA@test.com",
  passwordHash: "$2b$10$hashedpassword",
  permissions: ["orders"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEstablishmentOwner = {
  id: 1,
  userId: 1, // pertence ao user 1
  name: "Restaurante A",
};

const mockEstablishmentOther = {
  id: 2,
  userId: 99, // pertence ao user 99
  name: "Restaurante B",
};

describe("Collaborator IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("collaborator.update", () => {
    it("permite atualizar colaborador do próprio estabelecimento", async () => {
      vi.mocked(db.getCollaboratorById).mockResolvedValue(mockCollaborator as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);
      vi.mocked(db.updateCollaborator).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1); // user 1 é dono do establishment 1
      const caller = appRouter.createCaller(ctx);

      const result = await caller.collaborator.update({
        id: 10,
        name: "Novo Nome",
      });

      expect(result).toEqual({ success: true });
      expect(db.getCollaboratorById).toHaveBeenCalledWith(10);
      expect(db.getEstablishmentById).toHaveBeenCalledWith(1);
      expect(db.updateCollaborator).toHaveBeenCalled();
    });

    it("bloqueia atualização de colaborador de outro estabelecimento", async () => {
      vi.mocked(db.getCollaboratorById).mockResolvedValue(mockCollaborator as any);
      // O establishment 1 pertence ao user 1, mas estamos logados como user 99
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99); // user 99 NÃO é dono do establishment 1
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.collaborator.update({ id: 10, name: "Hackeado" })
      ).rejects.toThrow("Acesso negado");

      expect(db.updateCollaborator).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para colaborador inexistente", async () => {
      vi.mocked(db.getCollaboratorById).mockResolvedValue(undefined);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.collaborator.update({ id: 999, name: "Fantasma" })
      ).rejects.toThrow("Colaborador não encontrado");

      expect(db.updateCollaborator).not.toHaveBeenCalled();
    });
  });

  describe("collaborator.delete", () => {
    it("permite excluir colaborador do próprio estabelecimento", async () => {
      vi.mocked(db.getCollaboratorById).mockResolvedValue(mockCollaborator as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);
      vi.mocked(db.deleteCollaborator).mockResolvedValue(undefined as any);

      const ctx = createAuthContext(1); // user 1 é dono
      const caller = appRouter.createCaller(ctx);

      const result = await caller.collaborator.delete({ id: 10 });

      expect(result).toEqual({ success: true });
      expect(db.getCollaboratorById).toHaveBeenCalledWith(10);
      expect(db.getEstablishmentById).toHaveBeenCalledWith(1);
      expect(db.deleteCollaborator).toHaveBeenCalledWith(10);
    });

    it("bloqueia exclusão de colaborador de outro estabelecimento", async () => {
      vi.mocked(db.getCollaboratorById).mockResolvedValue(mockCollaborator as any);
      vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishmentOwner as any);

      const ctx = createAuthContext(99); // user 99 NÃO é dono
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.collaborator.delete({ id: 10 })
      ).rejects.toThrow("Acesso negado");

      expect(db.deleteCollaborator).not.toHaveBeenCalled();
    });

    it("retorna NOT_FOUND para colaborador inexistente", async () => {
      vi.mocked(db.getCollaboratorById).mockResolvedValue(undefined);

      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.collaborator.delete({ id: 999 })
      ).rejects.toThrow("Colaborador não encontrado");

      expect(db.deleteCollaborator).not.toHaveBeenCalled();
    });
  });
});
