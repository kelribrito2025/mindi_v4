import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

// Mock the db module
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    getChangelogVersions: vi.fn().mockResolvedValue([]),
    getChangelogVersionById: vi.fn().mockResolvedValue(null),
    getPublishedChangelogVersions: vi.fn().mockResolvedValue([]),
    createChangelogVersion: vi.fn().mockResolvedValue(1),
    updateChangelogVersion: vi.fn().mockResolvedValue(undefined),
    deleteChangelogVersion: vi.fn().mockResolvedValue(undefined),
    getChangelogEntries: vi.fn().mockResolvedValue([]),
    createChangelogEntry: vi.fn().mockResolvedValue(1),
    updateChangelogEntry: vi.fn().mockResolvedValue(undefined),
    deleteChangelogEntry: vi.fn().mockResolvedValue(undefined),
    getPublishedChangelogWithEntries: vi.fn().mockResolvedValue([]),
    getEstablishmentByUserId: vi.fn().mockResolvedValue({ id: 123, userId: 2, name: "Restaurante Teste" }),
    toggleChangelogLike: vi.fn().mockResolvedValue({ liked: true, likeCount: 1 }),
  };
});

describe("changelog router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== ADMIN: LIST VERSIONS =====
  describe("listVersions", () => {
    it("admin can list all versions", async () => {
      const { getChangelogVersions } = await import("./db");
      (getChangelogVersions as any).mockResolvedValue([
        { id: 1, version: "2.5.0", title: "Novidades", isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
        { id: 2, version: "2.4.0", title: "Melhorias", isPublished: false, publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.listVersions();

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe("2.5.0");
      expect(getChangelogVersions).toHaveBeenCalledOnce();
    });

    it("regular user cannot list versions", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.changelog.listVersions()).rejects.toThrow();
    });
  });

  // ===== ADMIN: GET VERSION =====
  describe("getVersion", () => {
    it("admin can get a version with entries", async () => {
      const { getChangelogVersionById, getChangelogEntries } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue({
        id: 1, version: "2.5.0", title: "Novidades", isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
      });
      (getChangelogEntries as any).mockResolvedValue([
        { id: 10, versionId: 1, type: "feature", title: "Nova funcionalidade", description: "Desc", sortOrder: 0, createdAt: new Date() },
      ]);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.getVersion({ id: 1 });

      expect(result.version).toBe("2.5.0");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe("Nova funcionalidade");
    });

    it("throws when version not found", async () => {
      const { getChangelogVersionById } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue(null);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.changelog.getVersion({ id: 999 })).rejects.toThrow("Versão não encontrada");
    });
  });

  // ===== ADMIN: CREATE VERSION =====
  describe("createVersion", () => {
    it("admin can create a version", async () => {
      const { createChangelogVersion } = await import("./db");
      (createChangelogVersion as any).mockResolvedValue(5);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.createVersion({ version: "3.0.0", title: "Big Release" });

      expect(result.id).toBe(5);
      expect(createChangelogVersion).toHaveBeenCalledWith({
        version: "3.0.0",
        title: "Big Release",
        imageUrl: null,
        isPublished: false,
      });
    });

    it("regular user cannot create a version", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.changelog.createVersion({ version: "1.0.0", title: "Hacked" })).rejects.toThrow();
    });
  });

  // ===== ADMIN: UPDATE VERSION =====
  describe("updateVersion", () => {
    it("admin can update a version", async () => {
      const { updateChangelogVersion } = await import("./db");

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.updateVersion({ id: 1, title: "Updated Title" });

      expect(result.success).toBe(true);
      expect(updateChangelogVersion).toHaveBeenCalledWith(1, { title: "Updated Title" });
    });
  });

  // ===== ADMIN: TOGGLE PUBLISH =====
  describe("togglePublish", () => {
    it("cannot publish a version with no entries", async () => {
      const { getChangelogVersionById, getChangelogEntries } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue({
        id: 1, version: "2.5.0", title: "Test", isPublished: false, publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      (getChangelogEntries as any).mockResolvedValue([]);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.changelog.togglePublish({ id: 1 })).rejects.toThrow("Adicione pelo menos uma entrada antes de publicar");
    });

    it("can publish a version with entries", async () => {
      const { getChangelogVersionById, getChangelogEntries, updateChangelogVersion } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue({
        id: 1, version: "2.5.0", title: "Test", isPublished: false, publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      (getChangelogEntries as any).mockResolvedValue([
        { id: 10, versionId: 1, type: "feature", title: "Feature", description: null, sortOrder: 0, createdAt: new Date() },
      ]);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.togglePublish({ id: 1 });

      expect(result.isPublished).toBe(true);
      expect(updateChangelogVersion).toHaveBeenCalledWith(1, expect.objectContaining({ isPublished: true }));
    });

    it("can unpublish a published version", async () => {
      const { getChangelogVersionById, getChangelogEntries, updateChangelogVersion } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue({
        id: 1, version: "2.5.0", title: "Test", isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
      });
      // Even though entries exist, we still need to mock them because togglePublish doesn't check entries for unpublish
      (getChangelogEntries as any).mockResolvedValue([
        { id: 10, versionId: 1, type: "feature", title: "Feature", description: null, sortOrder: 0, createdAt: new Date() },
      ]);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.togglePublish({ id: 1 });

      expect(result.isPublished).toBe(false);
      expect(updateChangelogVersion).toHaveBeenCalledWith(1, expect.objectContaining({ isPublished: false, publishedAt: null }));
    });

    it("regular user cannot toggle publish", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.changelog.togglePublish({ id: 1 })).rejects.toThrow();
    });
  });

  // ===== ADMIN: DELETE VERSION =====
  describe("deleteVersion", () => {
    it("admin can delete a version", async () => {
      const { deleteChangelogVersion } = await import("./db");

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.deleteVersion({ id: 1 });

      expect(result.success).toBe(true);
      expect(deleteChangelogVersion).toHaveBeenCalledWith(1);
    });
  });

  // ===== ADMIN: ENTRY CRUD =====
  describe("entries", () => {
    it("admin can create an entry", async () => {
      const { getChangelogVersionById, createChangelogEntry } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue({
        id: 1, version: "2.5.0", title: "Test", isPublished: false, publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      (createChangelogEntry as any).mockResolvedValue(10);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.createEntry({
        versionId: 1,
        type: "feature",
        title: "New Feature",
        description: "Description",
        sortOrder: 0,
      });

      expect(result.id).toBe(10);
    });

    it("cannot create entry for non-existent version", async () => {
      const { getChangelogVersionById } = await import("./db");
      (getChangelogVersionById as any).mockResolvedValue(null);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.changelog.createEntry({ versionId: 999, type: "feature", title: "Test", sortOrder: 0 })
      ).rejects.toThrow("Versão não encontrada");
    });

    it("admin can list entries", async () => {
      const { getChangelogEntries } = await import("./db");
      (getChangelogEntries as any).mockResolvedValue([
        { id: 10, versionId: 1, type: "feature", title: "Feature A", description: null, sortOrder: 0, createdAt: new Date() },
        { id: 11, versionId: 1, type: "fix", title: "Fix B", description: "Fixed it", sortOrder: 1, createdAt: new Date() },
      ]);

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.listEntries({ versionId: 1 });

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Feature A");
    });

    it("admin can update an entry", async () => {
      const { updateChangelogEntry } = await import("./db");

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.updateEntry({ id: 10, title: "Updated Feature" });

      expect(result.success).toBe(true);
      expect(updateChangelogEntry).toHaveBeenCalledWith(10, { title: "Updated Feature" });
    });

    it("admin can delete an entry", async () => {
      const { deleteChangelogEntry } = await import("./db");

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.deleteEntry({ id: 10 });

      expect(result.success).toBe(true);
      expect(deleteChangelogEntry).toHaveBeenCalledWith(10);
    });
  });

  // ===== PUBLIC: PUBLISHED VERSIONS =====
  describe("published", () => {
    it("authenticated user can read published versions", async () => {
      const { getPublishedChangelogWithEntries, getEstablishmentByUserId } = await import("./db");
      (getPublishedChangelogWithEntries as any).mockResolvedValue([
        {
          id: 1, version: "2.5.0", title: "Novidades", isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
          entries: [
            { id: 10, versionId: 1, type: "feature", title: "Feature", description: "Desc", sortOrder: 0, createdAt: new Date() },
          ],
        },
      ]);

      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.published();

      expect(result).toHaveLength(1);
      expect(result[0].version).toBe("2.5.0");
      expect(result[0].entries).toHaveLength(1);
      expect(getEstablishmentByUserId).toHaveBeenCalledWith(2);
      expect(getPublishedChangelogWithEntries).toHaveBeenCalledWith(123);
    });

    it("returns empty array when no published versions", async () => {
      const { getPublishedChangelogWithEntries } = await import("./db");
      (getPublishedChangelogWithEntries as any).mockResolvedValue([]);

      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.published();

      expect(result).toHaveLength(0);
      expect(getPublishedChangelogWithEntries).toHaveBeenCalledWith(123);
    });
  });

  // ===== AUTHENTICATED: CHANGELOG LIKES =====
  describe("toggleLike", () => {
    it("authenticated establishment can toggle like on a published version", async () => {
      const { getEstablishmentByUserId, toggleChangelogLike } = await import("./db");
      (toggleChangelogLike as any).mockResolvedValue({ liked: true, likeCount: 3 });

      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.changelog.toggleLike({ versionId: 1 });

      expect(result).toEqual({ liked: true, likeCount: 3 });
      expect(getEstablishmentByUserId).toHaveBeenCalledWith(2);
      expect(toggleChangelogLike).toHaveBeenCalledWith(1, 123);
    });

    it("throws when authenticated user has no establishment", async () => {
      const { getEstablishmentByUserId, toggleChangelogLike } = await import("./db");
      (getEstablishmentByUserId as any).mockResolvedValueOnce(null);

      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.changelog.toggleLike({ versionId: 1 })).rejects.toThrow("Estabelecimento não encontrado");
      expect(toggleChangelogLike).not.toHaveBeenCalled();
    });

    it("throws when the version is not published or does not exist", async () => {
      const { toggleChangelogLike } = await import("./db");
      (toggleChangelogLike as any).mockResolvedValueOnce(null);

      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.changelog.toggleLike({ versionId: 999 })).rejects.toThrow("Novidade publicada não encontrada");
    });
  });
});
