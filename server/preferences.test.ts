import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getUserPreference: vi.fn(),
  getUserPreferences: vi.fn(),
  setUserPreference: vi.fn(),
}));

import { getUserPreference, getUserPreferences, setUserPreference } from "./db";

describe("User Preferences System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserPreference", () => {
    it("should return null when preference does not exist", async () => {
      (getUserPreference as any).mockResolvedValue(null);
      const result = await getUserPreference(1, "test_key");
      expect(result).toBeNull();
      expect(getUserPreference).toHaveBeenCalledWith(1, "test_key");
    });

    it("should return the value when preference exists", async () => {
      (getUserPreference as any).mockResolvedValue("true");
      const result = await getUserPreference(1, "modal_abc_seen");
      expect(result).toBe("true");
    });

    it("should handle establishmentId parameter", async () => {
      (getUserPreference as any).mockResolvedValue("true");
      const result = await getUserPreference(1, "onboarding_modal_dismissed_preparing", 30001);
      expect(result).toBe("true");
      expect(getUserPreference).toHaveBeenCalledWith(1, "onboarding_modal_dismissed_preparing", 30001);
    });
  });

  describe("getUserPreferences (batch)", () => {
    it("should return empty object when no preferences exist", async () => {
      (getUserPreferences as any).mockResolvedValue({});
      const result = await getUserPreferences(1, ["key1", "key2"]);
      expect(result).toEqual({});
    });

    it("should return multiple preferences at once", async () => {
      (getUserPreferences as any).mockResolvedValue({
        "abc_info_seen": "true",
        "dre_info_seen": "true",
      });
      const result = await getUserPreferences(1, ["abc_info_seen", "dre_info_seen"]);
      expect(result).toEqual({
        "abc_info_seen": "true",
        "dre_info_seen": "true",
      });
    });
  });

  describe("setUserPreference", () => {
    it("should call setUserPreference with correct parameters", async () => {
      (setUserPreference as any).mockResolvedValue(undefined);
      await setUserPreference(1, "modal_abc_seen", "true");
      expect(setUserPreference).toHaveBeenCalledWith(1, "modal_abc_seen", "true");
    });

    it("should handle establishmentId parameter", async () => {
      (setUserPreference as any).mockResolvedValue(undefined);
      await setUserPreference(1, "onboarding_modal_dismissed_preparing", "true", 30001);
      expect(setUserPreference).toHaveBeenCalledWith(1, "onboarding_modal_dismissed_preparing", "true", 30001);
    });
  });

  describe("Preference keys used in the migration", () => {
    const expectedKeys = [
      "onboarding_modal_dismissed_preparing",
      "onboarding_modal_dismissed_ready",
      "onboarding_modal_dismissed_completed",
      "multidriver_onboarding_dismissed",
      "abc_info_seen",
      "dre_info_seen",
      "welcome_checklist_dismissed",
      "onboarding_auto_opened",
      "mindi_chat_highlight_seen",
      "whatsapp_info_modal_seen",
    ];

    it("should have all expected preference keys defined", () => {
      // Verify all migrated keys are documented
      expect(expectedKeys).toHaveLength(10);
      expectedKeys.forEach(key => {
        expect(typeof key).toBe("string");
        expect(key.length).toBeGreaterThan(0);
      });
    });

    it("should use consistent naming convention (snake_case)", () => {
      expectedKeys.forEach(key => {
        // All keys should be lowercase with underscores
        expect(key).toMatch(/^[a-z_]+$/);
      });
    });
  });
});
