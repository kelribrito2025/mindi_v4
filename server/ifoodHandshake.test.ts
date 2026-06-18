import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("./ifoodInfra", () => ({
  ifoodApiCall: vi.fn(),
}));

vi.mock("./ifood", () => ({
  getAccessTokenForEstablishment: vi.fn().mockResolvedValue("mock-token-123"),
}));

vi.mock("./db", () => ({
  createIfoodDispute: vi.fn(),
  getIfoodDisputeByDisputeId: vi.fn(),
  listIfoodDisputes: vi.fn(),
  updateIfoodDisputeStatus: vi.fn(),
  getPendingIfoodDisputes: vi.fn(),
  getIfoodDisputesByOrderId: vi.fn(),
  updateOrderStatusByExternalId: vi.fn(),
  updateOrderExternalStatusByExternalId: vi.fn(),
}));

vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { ifoodApiCall } from "./ifoodInfra";
import * as db from "./db";
import {
  acceptDispute,
  rejectDispute,
  sendAlternative,
  processHandshakeDispute,
  processHandshakeSettlement,
  parseDisputeDetails,
  ACCEPT_CANCELLATION_REASONS,
  type HandshakeDisputeEvent,
  type HandshakeSettlementEvent,
} from "./ifoodHandshake";

const mockIfoodApiCall = ifoodApiCall as ReturnType<typeof vi.fn>;

describe("iFood Handshake Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Accept Dispute ─────────────────────────────────────────────────

  describe("acceptDispute", () => {
    it("should call the accept endpoint and update DB status", async () => {
      mockIfoodApiCall.mockResolvedValue({ ok: true });

      await acceptDispute(1, "order-123", "dispute-456", "501");

      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/order/v1.0/orders/order-123/disputes/dispute-456/accept"),
        expect.objectContaining({
          method: "POST",
          token: "mock-token-123",
        }),
        { maxRetries: 2 }
      );

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "dispute-456",
        "ACCEPTED",
        expect.any(Date)
      );
    });

    it("should throw on API failure", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      });

      await expect(acceptDispute(1, "order-123", "dispute-456")).rejects.toThrow(
        "Falha ao aceitar disputa: 400"
      );
    });

    it("should send reasonCode in body when provided", async () => {
      mockIfoodApiCall.mockResolvedValue({ ok: true });

      await acceptDispute(1, "order-123", "dispute-456", "508");

      const callBody = JSON.parse(mockIfoodApiCall.mock.calls[0][1].body);
      expect(callBody.reasonCode).toBe("508");
    });
  });

  // ─── Reject Dispute ─────────────────────────────────────────────────

  describe("rejectDispute", () => {
    it("should call the reject endpoint and update DB status", async () => {
      mockIfoodApiCall.mockResolvedValue({ ok: true });

      await rejectDispute(1, "order-123", "dispute-789");

      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/order/v1.0/orders/order-123/disputes/dispute-789/reject"),
        expect.objectContaining({ method: "POST" }),
        { maxRetries: 2 }
      );

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "dispute-789",
        "REJECTED",
        expect.any(Date)
      );
    });

    it("should throw on API failure", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      await expect(rejectDispute(1, "order-123", "dispute-789")).rejects.toThrow(
        "Falha ao rejeitar disputa: 500"
      );
    });
  });

  // ─── Send Alternative ───────────────────────────────────────────────

  describe("sendAlternative", () => {
    it("should call the alternative endpoint with alternativeId", async () => {
      mockIfoodApiCall.mockResolvedValue({ ok: true });

      await sendAlternative(1, "order-123", "dispute-456", "alt-001");

      expect(mockIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/order/v1.0/orders/order-123/disputes/dispute-456/alternative"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ alternativeId: "alt-001" }),
        }),
        { maxRetries: 2 }
      );

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "dispute-456",
        "ALTERNATIVE",
        expect.any(Date)
      );
    });

    it("should throw on API failure", async () => {
      mockIfoodApiCall.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve("Unprocessable Entity"),
      });

      await expect(sendAlternative(1, "order-123", "dispute-456", "alt-001")).rejects.toThrow(
        "Falha ao enviar alternativa: 422"
      );
    });
  });

  // ─── Process Handshake Dispute ──────────────────────────────────────

  describe("processHandshakeDispute", () => {
    it("should store dispute in database with correct fields", async () => {
      const event: HandshakeDisputeEvent = {
        id: "evt-001",
        disputeId: "disp-001",
        orderId: "order-abc",
        action: "CANCELLATION",
        handshakeType: "FULL",
        message: "Pedido veio errado",
        expiresAt: "2026-04-30T15:00:00Z",
        timeoutAction: "ACCEPT",
        alternatives: [
          { id: "alt-1", description: "Reembolso parcial R$10", type: "PROPOSED_AMOUNT_REFUND", amount: 10 },
        ],
        metadata: {
          items: [{ id: "item-1", name: "Pizza", quantity: 1, unitPrice: 35 }],
          refundAmount: 35,
        },
      };

      (db.createIfoodDispute as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 1,
        disputeId: "disp-001",
        ...event,
      });

      await processHandshakeDispute(event, 42);

      expect(db.createIfoodDispute).toHaveBeenCalledWith({
        disputeId: "disp-001",
        orderId: "order-abc",
        establishmentId: 42,
        action: "CANCELLATION",
        handshakeType: "FULL",
        message: "Pedido veio errado",
        expiresAt: expect.any(Date),
        timeoutAction: "ACCEPT",
        status: "PENDING",
        alternativesJson: JSON.stringify(event.alternatives),
        metadataJson: JSON.stringify(event.metadata),
      });
    });

    it("should handle events without optional fields", async () => {
      const event: HandshakeDisputeEvent = {
        id: "evt-002",
        disputeId: "disp-002",
        orderId: "order-def",
        action: "PARTIAL_CANCELLATION",
        handshakeType: "PARTIAL",
        expiresAt: "2026-04-30T16:00:00Z",
        timeoutAction: "REJECT",
      };

      (db.createIfoodDispute as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 2,
        ...event,
      });

      await processHandshakeDispute(event, 42);

      expect(db.createIfoodDispute).toHaveBeenCalledWith(
        expect.objectContaining({
          message: null,
          alternativesJson: null,
          metadataJson: null,
        })
      );
    });
  });

  // ─── Process Handshake Settlement ───────────────────────────────────

  describe("processHandshakeSettlement", () => {
    it("should update dispute status to ACCEPTED and cancel order", async () => {
      const event: HandshakeSettlementEvent = {
        id: "evt-003",
        disputeId: "disp-001",
        orderId: "order-abc",
        status: "ACCEPTED",
      };

      await processHandshakeSettlement(event, 42);

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "disp-001",
        "ACCEPTED",
        expect.any(Date)
      );
      expect(db.updateOrderStatusByExternalId).toHaveBeenCalledWith("order-abc", "cancelled");
      expect(db.updateOrderExternalStatusByExternalId).toHaveBeenCalledWith("order-abc", "CANCELLED");
    });

    it("should update dispute status to REJECTED without cancelling order", async () => {
      const event: HandshakeSettlementEvent = {
        id: "evt-004",
        disputeId: "disp-002",
        orderId: "order-def",
        status: "REJECTED",
      };

      await processHandshakeSettlement(event, 42);

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "disp-002",
        "REJECTED",
        expect.any(Date)
      );
      expect(db.updateOrderStatusByExternalId).not.toHaveBeenCalled();
    });

    it("should handle EXPIRED with timeoutAction=ACCEPT (cancel order)", async () => {
      const event: HandshakeSettlementEvent = {
        id: "evt-005",
        disputeId: "disp-003",
        orderId: "order-ghi",
        status: "EXPIRED",
      };

      (db.getIfoodDisputeByDisputeId as ReturnType<typeof vi.fn>).mockResolvedValue({
        disputeId: "disp-003",
        timeoutAction: "ACCEPT",
      });

      await processHandshakeSettlement(event, 42);

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "disp-003",
        "EXPIRED",
        expect.any(Date)
      );
      expect(db.updateOrderStatusByExternalId).toHaveBeenCalledWith("order-ghi", "cancelled");
    });

    it("should handle EXPIRED with timeoutAction=REJECT (no cancel)", async () => {
      const event: HandshakeSettlementEvent = {
        id: "evt-006",
        disputeId: "disp-004",
        orderId: "order-jkl",
        status: "EXPIRED",
      };

      (db.getIfoodDisputeByDisputeId as ReturnType<typeof vi.fn>).mockResolvedValue({
        disputeId: "disp-004",
        timeoutAction: "REJECT",
      });

      await processHandshakeSettlement(event, 42);

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "disp-004",
        "EXPIRED",
        expect.any(Date)
      );
      expect(db.updateOrderStatusByExternalId).not.toHaveBeenCalled();
    });

    it("should handle ALTERNATIVE_REPLIED status", async () => {
      const event: HandshakeSettlementEvent = {
        id: "evt-007",
        disputeId: "disp-005",
        orderId: "order-mno",
        status: "ALTERNATIVE_REPLIED",
        alternativeId: "alt-001",
      };

      await processHandshakeSettlement(event, 42);

      expect(db.updateIfoodDisputeStatus).toHaveBeenCalledWith(
        "disp-005",
        "ALTERNATIVE",
        expect.any(Date)
      );
    });
  });

  // ─── Parse Dispute Details ──────────────────────────────────────────

  describe("parseDisputeDetails", () => {
    it("should parse alternativesJson and metadataJson", () => {
      const dispute = {
        id: 1,
        disputeId: "disp-001",
        alternativesJson: JSON.stringify([
          { id: "alt-1", description: "Reembolso R$10", type: "PROPOSED_AMOUNT_REFUND", amount: 10 },
        ]),
        metadataJson: JSON.stringify({
          items: [{ id: "item-1", name: "Pizza", quantity: 1, unitPrice: 35 }],
          refundAmount: 35,
        }),
      };

      const result = parseDisputeDetails(dispute);

      expect(result.alternatives).toHaveLength(1);
      expect(result.alternatives[0].id).toBe("alt-1");
      expect(result.alternatives[0].amount).toBe(10);
      expect(result.metadata?.items).toHaveLength(1);
      expect(result.metadata?.refundAmount).toBe(35);
    });

    it("should handle null JSON fields", () => {
      const dispute = {
        id: 2,
        disputeId: "disp-002",
        alternativesJson: null,
        metadataJson: null,
      };

      const result = parseDisputeDetails(dispute);

      expect(result.alternatives).toEqual([]);
      expect(result.metadata).toBeNull();
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────

  describe("ACCEPT_CANCELLATION_REASONS", () => {
    it("should have valid reason codes", () => {
      expect(ACCEPT_CANCELLATION_REASONS.length).toBeGreaterThan(0);
      ACCEPT_CANCELLATION_REASONS.forEach((reason) => {
        expect(reason.code).toBeDefined();
        expect(reason.description).toBeDefined();
        expect(reason.code.length).toBeGreaterThan(0);
      });
    });

    it("should include common cancellation reasons", () => {
      const codes = ACCEPT_CANCELLATION_REASONS.map((r) => r.code);
      expect(codes).toContain("501"); // Problemas internos
      expect(codes).toContain("508"); // Cliente solicitou
    });
  });
});
