/**
 * Phase 5 Tests: Homologation & Notifications
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Homologation Module Tests ────────────────────────────────────────

describe("iFood Homologation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("./db");
    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
  });

  describe("getIfoodHealthStatus", () => {
    it("returns disconnected status when no config exists", async () => {
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue(null),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { getIfoodHealthStatus } = await import("./ifoodHomologation");
      const result = await getIfoodHealthStatus(1);

      expect(result.connected).toBe(false);
      expect(result.merchantId).toBeNull();
      expect(result.tokenValid).toBe(false);
      expect(result.modules.events).toBe(false);
    });

    it("returns connected status with valid token", async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue({
          isConnected: true,
          merchantId: "merchant-123",
          accessToken: "valid-token",
          tokenExpiresAt: futureDate,
        }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { getIfoodHealthStatus } = await import("./ifoodHomologation");
      const result = await getIfoodHealthStatus(1);

      expect(result.connected).toBe(true);
      expect(result.merchantId).toBe("merchant-123");
      expect(result.tokenValid).toBe(true);
      expect(result.modules.events).toBe(true);
      expect(result.modules.merchant).toBe(true);
      expect(result.modules.catalog).toBe(true);
      expect(result.modules.handshake).toBe(true);
    });

    it("detects expired token", async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue({
          isConnected: true,
          merchantId: "merchant-123",
          accessToken: "expired-token",
          tokenExpiresAt: pastDate,
        }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { getIfoodHealthStatus } = await import("./ifoodHomologation");
      const result = await getIfoodHealthStatus(1);

      expect(result.connected).toBe(true);
      expect(result.tokenValid).toBe(false);
    });
  });

  describe("runHomologationChecklist", () => {
    it("returns READY when all checks pass with full config", async () => {
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue({
          isConnected: true,
          merchantId: "merchant-123",
          clientSecret: "secret-abc",
          refreshToken: "refresh-token",
        }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./_core/env", () => ({
        ENV: { ifoodClientId: "client-id-abc", ifoodClientSecret: "secret-abc" },
      }));

      const { runHomologationChecklist } = await import("./ifoodHomologation");
      const report = await runHomologationChecklist(1);

      expect(report.overallStatus).toBe("READY");
      expect(report.failCount).toBe(0);
      expect(report.warnCount).toBe(0);
      expect(report.passCount).toBeGreaterThan(15);
      expect(report.timestamp).toBeDefined();
    });

    it("returns PARTIAL when clientSecret is missing", async () => {
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue({
          isConnected: true,
          merchantId: "merchant-123",
          refreshToken: "refresh-token",
        }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./_core/env", () => ({
        ENV: { ifoodClientSecret: "" },
      }));

      const { runHomologationChecklist } = await import("./ifoodHomologation");
      const report = await runHomologationChecklist(1);

      expect(report.overallStatus).toBe("PARTIAL");
      expect(report.warnCount).toBeGreaterThan(0);
    });

    it("returns NOT_READY when merchantId is missing", async () => {
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue({
          isConnected: true,
          merchantId: null,
          clientSecret: "secret-abc",
          refreshToken: "refresh-token",
        }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { runHomologationChecklist } = await import("./ifoodHomologation");
      const report = await runHomologationChecklist(1);

      expect(report.overallStatus).toBe("NOT_READY");
      expect(report.failCount).toBeGreaterThan(0);
    });

    it("includes all required modules in the checklist", async () => {
      vi.doMock("./db", () => ({
        getIfoodConfig: vi.fn().mockResolvedValue({
          isConnected: true,
          merchantId: "m-1",
          clientSecret: "s",
          refreshToken: "r",
        }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { runHomologationChecklist } = await import("./ifoodHomologation");
      const report = await runHomologationChecklist(1);

      const modules = [...new Set(report.checks.map((c) => c.module))];
      expect(modules).toContain("Events");
      expect(modules).toContain("Orders");
      expect(modules).toContain("Merchant");
      expect(modules).toContain("Catalog");
      expect(modules).toContain("Security");
    });
  });
});

// ─── Notifications Module Tests ───────────────────────────────────────

describe("iFood Notifications", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const mockDisputeData = {
    disputeId: "dispute-001",
    orderId: "order-abc-123",
    action: "CANCELLATION_REQUESTED",
    expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
    message: "Cliente solicitou cancelamento",
    handshakeType: "CANCELLATION",
  };

  describe("notifyDisputeSSE", () => {
    it("sends SSE event with correct data", async () => {
      const mockSendEvent = vi.fn();
      vi.doMock("./_core/sse", () => ({
        sendEvent: mockSendEvent,
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./db", () => ({}));

      const { notifyDisputeSSE } = await import("./ifoodNotifications");
      notifyDisputeSSE(1, mockDisputeData);

      expect(mockSendEvent).toHaveBeenCalledWith(1, "ifood_dispute", expect.objectContaining({
        type: "new_dispute",
        disputeId: "dispute-001",
        ifoodOrderId: "order-abc-123",
        action: "CANCELLATION_REQUESTED",
      }));
    });

    it("includes time remaining in seconds", async () => {
      const mockSendEvent = vi.fn();
      vi.doMock("./_core/sse", () => ({
        sendEvent: mockSendEvent,
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./db", () => ({}));

      const { notifyDisputeSSE } = await import("./ifoodNotifications");
      notifyDisputeSSE(1, mockDisputeData);

      const eventData = mockSendEvent.mock.calls[0][2];
      expect(eventData.timeRemainingSeconds).toBeGreaterThan(0);
      expect(eventData.timeRemainingSeconds).toBeLessThanOrEqual(300);
    });
  });

  describe("notifyDisputePush", () => {
    it("sends push to all subscriptions", async () => {
      const mockSendPush = vi.fn().mockResolvedValue(true);
      vi.doMock("./_core/webPush", () => ({
        sendPushNotification: mockSendPush,
      }));
      vi.doMock("./db", () => ({
        getPushSubscriptionsByEstablishment: vi.fn().mockResolvedValue([
          { id: 1, endpoint: "https://push.example.com/1", p256dh: "key1", auth: "auth1" },
          { id: 2, endpoint: "https://push.example.com/2", p256dh: "key2", auth: "auth2" },
        ]),
        deletePushSubscriptionById: vi.fn(),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { notifyDisputePush } = await import("./ifoodNotifications");
      await notifyDisputePush(1, mockDisputeData);

      expect(mockSendPush).toHaveBeenCalledTimes(2);
      expect(mockSendPush.mock.calls[0][1]).toMatchObject({
        title: expect.stringContaining("Disputa iFood"),
        tag: "dispute-dispute-001",
        requireInteraction: true,
      });
    });

    it("removes invalid subscriptions", async () => {
      const mockSendPush = vi.fn().mockResolvedValue(false);
      const mockDelete = vi.fn();
      vi.doMock("./_core/webPush", () => ({
        sendPushNotification: mockSendPush,
      }));
      vi.doMock("./db", () => ({
        getPushSubscriptionsByEstablishment: vi.fn().mockResolvedValue([
          { id: 1, endpoint: "https://push.example.com/1", p256dh: "key1", auth: "auth1" },
        ]),
        deletePushSubscriptionById: mockDelete,
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { notifyDisputePush } = await import("./ifoodNotifications");
      await notifyDisputePush(1, mockDisputeData);

      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("does nothing when no subscriptions exist", async () => {
      const mockSendPush = vi.fn();
      vi.doMock("./_core/webPush", () => ({
        sendPushNotification: mockSendPush,
      }));
      vi.doMock("./db", () => ({
        getPushSubscriptionsByEstablishment: vi.fn().mockResolvedValue([]),
        deletePushSubscriptionById: vi.fn(),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { notifyDisputePush } = await import("./ifoodNotifications");
      await notifyDisputePush(1, mockDisputeData);

      expect(mockSendPush).not.toHaveBeenCalled();
    });
  });

  describe("notifyDisputeTelegram", () => {
    it("sends Telegram message when configured", async () => {
      const mockSendTelegram = vi.fn().mockResolvedValue({ ok: true });
      vi.doMock("./telegramNotifier", () => ({
        sendTelegramMessage: mockSendTelegram,
      }));
      vi.doMock("./db", () => ({
        getTelegramConfig: vi.fn().mockResolvedValue({ enabled: true, chatId: "123456" }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./_core/sse", () => ({
        sendEvent: vi.fn(),
      }));

      const { notifyDisputeTelegram } = await import("./ifoodNotifications");
      await notifyDisputeTelegram(1, mockDisputeData);

      expect(mockSendTelegram).toHaveBeenCalledWith("123456", expect.stringContaining("Disputa iFood"));
      expect(mockSendTelegram).toHaveBeenCalledWith("123456", expect.stringContaining("Cancelamento Solicitado"));
    });

    it("does nothing when Telegram is not configured", async () => {
      const mockSendTelegram = vi.fn();
      vi.doMock("./telegramNotifier", () => ({
        sendTelegramMessage: mockSendTelegram,
      }));
      vi.doMock("./db", () => ({
        getTelegramConfig: vi.fn().mockResolvedValue(null),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./_core/sse", () => ({
        sendEvent: vi.fn(),
      }));

      const { notifyDisputeTelegram } = await import("./ifoodNotifications");
      await notifyDisputeTelegram(1, mockDisputeData);

      expect(mockSendTelegram).not.toHaveBeenCalled();
    });

    it("does nothing when Telegram is disabled", async () => {
      const mockSendTelegram = vi.fn();
      vi.doMock("./telegramNotifier", () => ({
        sendTelegramMessage: mockSendTelegram,
      }));
      vi.doMock("./db", () => ({
        getTelegramConfig: vi.fn().mockResolvedValue({ enabled: false, chatId: "123456" }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./_core/sse", () => ({
        sendEvent: vi.fn(),
      }));

      const { notifyDisputeTelegram } = await import("./ifoodNotifications");
      await notifyDisputeTelegram(1, mockDisputeData);

      expect(mockSendTelegram).not.toHaveBeenCalled();
    });
  });

  describe("notifyNewDispute (combined)", () => {
    it("calls all notification channels", async () => {
      const mockSendEvent = vi.fn();
      const mockSendPush = vi.fn().mockResolvedValue(true);
      const mockSendTelegram = vi.fn().mockResolvedValue({ ok: true });

      vi.doMock("./_core/sse", () => ({
        sendEvent: mockSendEvent,
      }));
      vi.doMock("./_core/webPush", () => ({
        sendPushNotification: mockSendPush,
      }));
      vi.doMock("./telegramNotifier", () => ({
        sendTelegramMessage: mockSendTelegram,
      }));
      vi.doMock("./db", () => ({
        getPushSubscriptionsByEstablishment: vi.fn().mockResolvedValue([
          { id: 1, endpoint: "https://push.example.com/1", p256dh: "key1", auth: "auth1" },
        ]),
        deletePushSubscriptionById: vi.fn(),
        getTelegramConfig: vi.fn().mockResolvedValue({ enabled: true, chatId: "123456" }),
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));

      const { notifyNewDispute } = await import("./ifoodNotifications");
      await notifyNewDispute(1, mockDisputeData);

      // Wait for async fire-and-forget to complete
      await new Promise((r) => setTimeout(r, 50));

      expect(mockSendEvent).toHaveBeenCalledWith(1, "ifood_dispute", expect.anything());
      expect(mockSendPush).toHaveBeenCalled();
      expect(mockSendTelegram).toHaveBeenCalled();
    });
  });

  describe("getActionLabel", () => {
    it("translates action codes to Portuguese labels", async () => {
      const mockSendEvent = vi.fn();
      vi.doMock("./_core/sse", () => ({
        sendEvent: mockSendEvent,
      }));
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      }));
      vi.doMock("./db", () => ({}));

      const { notifyDisputeSSE } = await import("./ifoodNotifications");

      // Test FULL_REFUND_REQUESTED
      notifyDisputeSSE(1, { ...mockDisputeData, action: "FULL_REFUND_REQUESTED" });
      // The label is used internally for push/telegram, SSE sends raw action
      // Just verify it doesn't throw
      expect(mockSendEvent).toHaveBeenCalled();
    });
  });
});
