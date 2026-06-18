import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}));

vi.mock("./ifoodInfra", () => ({
  ifoodApiCall: vi.fn()
}));

vi.mock("./ifood", () => ({
  getAccessTokenForEstablishment: vi.fn()
}));

import { ifoodApiCall } from "./ifoodInfra";
import { getAccessTokenForEstablishment } from "./ifood";
import {
  getMerchantStatus,
  getMerchantDetails,
  getOpeningHours,
  updateOpeningHours,
  listInterruptions,
  createInterruption,
  deleteInterruption,
  quickPause,
  getMerchantAvailability,
} from "./ifoodMerchant";

const mockIfoodApiCall = ifoodApiCall as ReturnType<typeof vi.fn>;
const mockGetToken = getAccessTokenForEstablishment as ReturnType<typeof vi.fn>;

describe("iFood Merchant Module - Phase 2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("test-token-123");
  });

  // ─── getMerchantStatus ─────────────────────────────────────────────
  describe("getMerchantStatus", () => {
    it("should fetch merchant status successfully", async () => {
      const mockStatus = [
        {
          operation: "DELIVERY",
          salesChannel: "MARKETPLACE",
          available: true,
          state: "OK",
          validations: []
        }
      ];

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const result = await getMerchantStatus(1, "merchant-123");

      expect(mockGetToken).toHaveBeenCalledWith(1);
      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/status"),
        expect.objectContaining({ method: "GET", token: "test-token-123" }),
        expect.objectContaining({ maxRetries: 2 })
      );
      expect(result).toEqual(mockStatus);
    });

    it("should throw error on API failure", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized")
      });

      await expect(getMerchantStatus(1, "merchant-123"))
        .rejects.toThrow("Falha ao buscar status do merchant: 401");
    });
  });

  // ─── getMerchantDetails ────────────────────────────────────────────
  describe("getMerchantDetails", () => {
    it("should fetch merchant details successfully", async () => {
      const mockDetails = {
        id: "merchant-123",
        name: "Restaurante Teste",
        corporateName: "Teste LTDA"
      };

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDetails)
      });

      const result = await getMerchantDetails(1, "merchant-123");

      expect(result).toEqual(mockDetails);
      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123"),
        expect.objectContaining({ method: "GET" }),
        expect.any(Object)
      );
    });
  });

  // ─── getOpeningHours ───────────────────────────────────────────────
  describe("getOpeningHours", () => {
    it("should fetch opening hours successfully", async () => {
      const mockHours = {
        shifts: [
          { id: "shift-1", dayOfWeek: "MONDAY", start: "09:00:00", duration: 480 },
          { id: "shift-2", dayOfWeek: "TUESDAY", start: "09:00:00", duration: 480 }
        ]
      };

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHours)
      });

      const result = await getOpeningHours(1, "merchant-123");

      expect(result).toEqual(mockHours);
      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/opening-hours"),
        expect.objectContaining({ method: "GET" }),
        expect.any(Object)
      );
    });

    it("should throw error when API returns error", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error")
      });

      await expect(getOpeningHours(1, "merchant-123"))
        .rejects.toThrow("Falha ao buscar horários de funcionamento: 500");
    });
  });

  // ─── updateOpeningHours ────────────────────────────────────────────
  describe("updateOpeningHours", () => {
    it("should update opening hours successfully", async () => {
      const newShifts = [
        { dayOfWeek: "MONDAY", start: "08:00:00", duration: 600 },
        { dayOfWeek: "TUESDAY", start: "08:00:00", duration: 600 }
      ];

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ shifts: newShifts })
      });

      const result = await updateOpeningHours(1, "merchant-123", newShifts);

      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/opening-hours"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(newShifts)
        }),
        expect.objectContaining({ maxRetries: 1 })
      );
      expect(result).toEqual({ shifts: newShifts });
    });

    it("should throw error on failure", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Invalid shift configuration")
      });

      await expect(updateOpeningHours(1, "merchant-123", []))
        .rejects.toThrow("Falha ao atualizar horários: 400");
    });
  });

  // ─── listInterruptions ────────────────────────────────────────────
  describe("listInterruptions", () => {
    it("should list interruptions successfully", async () => {
      const mockInterruptions = [
        {
          id: "int-1",
          merchantId: "merchant-123",
          description: "Pausa para almoço",
          start: "2024-01-15T12:00:00Z",
          end: "2024-01-15T13:00:00Z"
        }
      ];

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockInterruptions)
      });

      const result = await listInterruptions(1, "merchant-123");

      expect(result).toEqual(mockInterruptions);
      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/interruptions"),
        expect.objectContaining({ method: "GET" }),
        expect.any(Object)
      );
    });

    it("should return empty array on error", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error")
      });

      await expect(listInterruptions(1, "merchant-123"))
        .rejects.toThrow("Falha ao listar interrupções: 500");
    });
  });

  // ─── createInterruption ───────────────────────────────────────────
  describe("createInterruption", () => {
    it("should create interruption successfully", async () => {
      const interruptionData = {
        description: "Manutenção",
        start: "2024-01-15T14:00:00Z",
        end: "2024-01-15T15:00:00Z"
      };

      const mockResponse = {
        id: "int-new",
        merchantId: "merchant-123",
        ...interruptionData
      };

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await createInterruption(1, "merchant-123", interruptionData);

      expect(result).toEqual(mockResponse);
      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/interruptions"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(interruptionData)
        }),
        expect.any(Object)
      );
    });

    it("should throw specific error on 409 (overlap)", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 409,
        text: () => Promise.resolve("Overlapping pause")
      });

      await expect(createInterruption(1, "merchant-123", {
        description: "Test",
        start: "2024-01-15T14:00:00Z",
        end: "2024-01-15T15:00:00Z"
      })).rejects.toThrow("Já existe uma pausa ativa que se sobrepõe ao período solicitado.");
    });

    it("should throw generic error on other failures", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad request")
      });

      await expect(createInterruption(1, "merchant-123", {
        description: "Test",
        start: "2024-01-15T14:00:00Z",
        end: "2024-01-15T15:00:00Z"
      })).rejects.toThrow("Falha ao criar interrupção: 400");
    });
  });

  // ─── deleteInterruption ───────────────────────────────────────────
  describe("deleteInterruption", () => {
    it("should delete interruption successfully", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: true
      });

      await expect(deleteInterruption(1, "merchant-123", "int-1"))
        .resolves.toBeUndefined();

      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/interruptions/int-1"),
        expect.objectContaining({ method: "DELETE" }),
        expect.any(Object)
      );
    });

    it("should throw error on failure", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found")
      });

      await expect(deleteInterruption(1, "merchant-123", "int-999"))
        .rejects.toThrow("Falha ao remover interrupção: 404");
    });
  });

  // ─── quickPause ───────────────────────────────────────────────────
  describe("quickPause", () => {
    it("should create a quick pause with correct duration", async () => {
      const mockResponse = {
        id: "int-quick",
        merchantId: "merchant-123",
        description: "Pausa temporária",
        start: expect.any(String),
        end: expect.any(String)
      };

      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await quickPause(1, "merchant-123", 30);

      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-123/interruptions"),
        expect.objectContaining({ method: "POST" }),
        expect.any(Object)
      );

      // Verify the body contains proper ISO dates
      const callArgs = mockIfoodApiCall.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.description).toBe("Pausa temporária");

      const startDate = new Date(body.start);
      const endDate = new Date(body.end);
      const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      expect(diffMinutes).toBe(30);
    });

    it("should use custom description when provided", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "int-custom" })
      });

      await quickPause(1, "merchant-123", 60, "Hora do almoço");

      const callArgs = mockIfoodApiCall.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.description).toBe("Hora do almoço");
    });
  });

  // ─── getMerchantAvailability ───────────────────────────────────────
  describe("getMerchantAvailability", () => {
    it("should combine status and interruptions data", async () => {
      const mockStatus = [
        { operation: "DELIVERY", salesChannel: "MARKETPLACE", available: true, state: "OK", validations: [] },
        { operation: "TAKEOUT", salesChannel: "MARKETPLACE", available: false, state: "PAUSED", validations: [] }
      ];

      const mockInterruptions = [
        { id: "int-1", merchantId: "merchant-123", description: "Pausa", start: "2024-01-15T12:00:00Z", end: "2024-01-15T13:00:00Z" }
      ];

      // First call = getMerchantStatus, second call = listInterruptions
      mockIfoodApiCall
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStatus) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockInterruptions) });

      const result = await getMerchantAvailability(1, "merchant-123");

      expect(result.available).toBe(true); // At least one operation is available
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0]).toEqual({ operation: "DELIVERY", available: true, state: "OK" });
      expect(result.operations[1]).toEqual({ operation: "TAKEOUT", available: false, state: "PAUSED" });
      expect(result.interruptions).toEqual(mockInterruptions);
    });

    it("should return unavailable when all operations are down", async () => {
      const mockStatus = [
        { operation: "DELIVERY", salesChannel: "MARKETPLACE", available: false, state: "PAUSED", validations: [] }
      ];

      mockIfoodApiCall
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStatus) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

      const result = await getMerchantAvailability(1, "merchant-123");

      expect(result.available).toBe(false);
    });

    it("should propagate errors", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error")
      });

      await expect(getMerchantAvailability(1, "merchant-123"))
        .rejects.toThrow();
    });
  });
});
