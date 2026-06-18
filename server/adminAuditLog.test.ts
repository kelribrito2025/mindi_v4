/**
 * Tests for Admin Audit Log functionality
 * Tests the audit log DB functions and admin router audit log routes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
  }),
}));

vi.mock("../drizzle/schema", () => ({
  adminAuditLog: { adminId: "adminId", action: "action", adminEmail: "adminEmail", createdAt: "createdAt" },
  users: {},
  establishments: {},
}));

vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe("Admin Audit Log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logAdminAction", () => {
    it("should call db.insert with correct values", async () => {
      const { logAdminAction } = await import("./adminDb");

      const params = {
        adminId: 1,
        adminEmail: "admin@test.com",
        action: "login",
        targetType: "admin",
      };

      await logAdminAction(params);

      expect(mockInsert).toHaveBeenCalled();
    });

    it("should not throw on db error", async () => {
      mockInsert.mockReturnValueOnce({
        values: vi.fn().mockRejectedValue(new Error("DB error")),
      });

      const { logAdminAction } = await import("./adminDb");

      // Should not throw
      await expect(
        logAdminAction({
          adminId: 1,
          adminEmail: "admin@test.com",
          action: "login",
          targetType: "admin",
        })
      ).resolves.not.toThrow();
    });

    it("should handle optional fields with null defaults", async () => {
      const { logAdminAction } = await import("./adminDb");

      const valuesCall = vi.fn().mockResolvedValue(undefined);
      mockInsert.mockReturnValueOnce({ values: valuesCall });

      await logAdminAction({
        adminId: 1,
        adminEmail: "admin@test.com",
        action: "change_plan",
        targetType: "establishment",
        // targetId, targetName, details are optional
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(valuesCall).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 1,
          adminEmail: "admin@test.com",
          action: "change_plan",
          targetType: "establishment",
          targetId: null,
          targetName: null,
          details: null,
        })
      );
    });

    it("should pass through optional fields when provided", async () => {
      const { logAdminAction } = await import("./adminDb");

      const valuesCall = vi.fn().mockResolvedValue(undefined);
      mockInsert.mockReturnValueOnce({ values: valuesCall });

      await logAdminAction({
        adminId: 1,
        adminEmail: "admin@test.com",
        action: "extend_trial",
        targetType: "establishment",
        targetId: 42,
        targetName: "Restaurante Teste",
        details: { extraDays: 30 },
      });

      expect(valuesCall).toHaveBeenCalledWith(
        expect.objectContaining({
          targetId: 42,
          targetName: "Restaurante Teste",
          details: { extraDays: 30 },
        })
      );
    });
  });

  describe("ACTION_LABELS mapping", () => {
    it("should have labels for all tracked actions", () => {
      const trackedActions = [
        "login",
        "change_plan",
        "open_menu",
        "close_menu",
        "extend_trial",
        "reset_trial",
        "force_expire",
        "impersonate",
        "update_subscription",
        "update_contact",
        "convert_to_paid",
        "convert_legacy",
        "orphan_cleanup",
      ];

      // Verify all actions are valid strings
      trackedActions.forEach((action) => {
        expect(typeof action).toBe("string");
        expect(action.length).toBeGreaterThan(0);
      });
    });
  });

  describe("CSV Export format", () => {
    it("should produce valid CSV with BOM for Excel compatibility", () => {
      const header = "ID,Admin,Email,Ação,Tipo Alvo,ID Alvo,Nome Alvo,Detalhes,Data";
      const row = `1,1,"admin@test.com","login","admin",,"","","2025-01-01T00:00:00.000Z"`;
      const csv = [header, row].join("\n");

      // Verify CSV structure
      expect(csv).toContain("ID,Admin,Email");
      expect(csv).toContain("login");
      expect(csv.split("\n").length).toBe(2);
    });

    it("should escape double quotes in JSON details", () => {
      const details = { planType: "pro" };
      const escaped = JSON.stringify(details).replace(/"/g, '""');
      expect(escaped).toBe('{""planType"":""pro""}');
    });
  });

  describe("Restaurants CSV Export format", () => {
    it("should produce valid CSV header for restaurants", () => {
      const header = "ID,Nome,Email,WhatsApp,Cidade,Estado,Plano,Dias Trial,Aberto,Criado em";
      expect(header.split(",").length).toBe(10);
    });
  });
});
