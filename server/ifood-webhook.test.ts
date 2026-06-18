import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

const TEST_SECRET = "test-ifood-client-secret-123";

async function importValidatorWithSecret(secret = TEST_SECRET) {
  vi.doMock("./_core/env", () => ({
    ENV: { ifoodClientSecret: secret },
  }));
  vi.doMock("./_core/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));
  vi.doMock("./db", () => ({
    getDb: vi.fn().mockResolvedValue(null),
    getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
  }));

  return import("./ifoodInfra");
}

describe("iFood Webhook HMAC Validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });

  it("validates a webhook signature using the configured iFood client secret", async () => {
    const { validateWebhookSignature } = await importValidatorWithSecret();
    const testPayload = JSON.stringify([{
      id: "test-event-123",
      code: "ORDER_PLACED",
      orderId: "test-order-123",
      merchantId: "test-merchant-123",
      createdAt: "2026-05-02T12:00:00Z",
    }]);

    const signature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(testPayload)
      .digest("hex");

    expect(validateWebhookSignature(Buffer.from(testPayload), signature)).toBe(true);
    expect(signature).toHaveLength(64);
  });

  it("rejects a webhook signature generated with a different secret", async () => {
    const { validateWebhookSignature } = await importValidatorWithSecret();
    const testPayload = JSON.stringify({
      id: "test-event-456",
      code: "ORDER_CONFIRMED",
      orderId: "test-order-456",
      merchantId: "test-merchant-456",
    });

    const invalidSignature = crypto
      .createHmac("sha256", "wrong-secret")
      .update(testPayload)
      .digest("hex");

    expect(validateWebhookSignature(Buffer.from(testPayload), invalidSignature)).toBe(false);
  });
});
