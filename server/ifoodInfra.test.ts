import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// ============================================================
// 1. HMAC Signature Validation Tests
// ============================================================

describe("iFood Infrastructure - HMAC Signature Validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates a correct HMAC-SHA256 signature", async () => {
    // Mock ENV
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test-secret-key-123" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { validateWebhookSignature } = await import("./ifoodInfra");

    const body = '{"id":"evt-123","code":"PLC","orderId":"order-456"}';
    const expectedSignature = crypto
      .createHmac("sha256", "test-secret-key-123")
      .update(body)
      .digest("hex");

    const result = validateWebhookSignature(Buffer.from(body), expectedSignature);
    expect(result).toBe(true);

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });

  it("rejects an invalid HMAC signature", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test-secret-key-123" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { validateWebhookSignature } = await import("./ifoodInfra");

    const body = '{"id":"evt-123","code":"PLC","orderId":"order-456"}';
    const wrongSignature = "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678";

    const result = validateWebhookSignature(Buffer.from(body), wrongSignature);
    expect(result).toBe(false);

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });

  it("rejects when no signature is provided", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test-secret-key-123" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { validateWebhookSignature } = await import("./ifoodInfra");

    const body = '{"id":"evt-123"}';
    const result = validateWebhookSignature(Buffer.from(body), undefined);
    expect(result).toBe(false);

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });

  it("handles string body correctly", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "my-secret" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { validateWebhookSignature } = await import("./ifoodInfra");

    const body = "test-body-string";
    const expectedSignature = crypto
      .createHmac("sha256", "my-secret")
      .update(body)
      .digest("hex");

    const result = validateWebhookSignature(body, expectedSignature);
    expect(result).toBe(true);

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });
});

// ============================================================
// 2. Retry with Exponential Backoff Tests
// ============================================================

describe("iFood Infrastructure - fetchWithRetry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns immediately on successful response", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { fetchWithRetry } = await import("./ifoodInfra");

    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://api.test.com/endpoint", { method: "GET" });

    expect(result.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });

  it("does not retry on non-retryable status codes (e.g., 404)", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { fetchWithRetry } = await import("./ifoodInfra");

    const mockResponse = new Response("Not Found", { status: 404 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://api.test.com/endpoint", { method: "GET" });

    expect(result.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });
});

// ============================================================
// 3. Rate Limiting Awareness Tests
// ============================================================

describe("iFood Infrastructure - Rate Limiting", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks rate limit state from response headers", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { updateRateLimitFromResponse, getThrottleDelay } = await import("./ifoodInfra");

    // Simulate a response with rate limit headers
    const mockResponse = new Response("OK", {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": "50",
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
      },
    });

    updateRateLimitFromResponse("https://api.ifood.com/order/v1.0/orders/123", mockResponse);

    // Should not throttle with 50 remaining
    const delay = getThrottleDelay("https://api.ifood.com/order/v1.0/orders/456");
    expect(delay).toBe(0);

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });

  it("returns throttle delay when near rate limit", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { updateRateLimitFromResponse, getThrottleDelay } = await import("./ifoodInfra");

    // Simulate near-limit response
    const mockResponse = new Response("OK", {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": "3",
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
      },
    });

    updateRateLimitFromResponse("https://api.ifood.com/merchant/v1.0/merchants", mockResponse);

    const delay = getThrottleDelay("https://api.ifood.com/merchant/v1.0/merchants/123");
    expect(delay).toBe(200); // Should throttle at 200ms when < 5 remaining

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });
});

// ============================================================
// 4. Endpoint Category Tests
// ============================================================

describe("iFood Infrastructure - Endpoint Categorization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("correctly categorizes different endpoint URLs", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([]),
    }));

    const { updateRateLimitFromResponse, getThrottleDelay } = await import("./ifoodInfra");

    // Order endpoint
    const orderResponse = new Response("OK", {
      status: 200,
      headers: { "X-RateLimit-Remaining": "2" },
    });
    updateRateLimitFromResponse("https://api.ifood.com/order/v1.0/orders/123", orderResponse);

    // Merchant endpoint should not be affected
    const merchantDelay = getThrottleDelay("https://api.ifood.com/merchant/v1.0/merchants");
    expect(merchantDelay).toBe(0); // Different category, no throttle

    // Order endpoint should be throttled
    const orderDelay = getThrottleDelay("https://api.ifood.com/order/v1.0/orders/456");
    expect(orderDelay).toBe(200);

    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
  });
});

// ============================================================
// 5. Event Polling Batch Acknowledgment Tests
// ============================================================

describe("iFood Infrastructure - Event Polling Acknowledgment", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("./_core/env");
    vi.doUnmock("./_core/logger");
    vi.doUnmock("./db");
    vi.doUnmock("./ifood");
  });

  it("acknowledges processed polling events in one batch and leaves failed events unacknowledged", async () => {
    const acknowledgeIfoodEvents = vi.fn().mockResolvedValue(undefined);

    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test", ifoodClientId: "client", ifoodApiBaseUrl: "https://merchant-api.ifood.com.br" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([{ merchantId: "merchant-1" }]),
    }));
    vi.doMock("./ifood", () => ({
      getIfoodAccessToken: vi.fn().mockResolvedValue("access-token"),
      acknowledgeIfoodEvents,
    }));

    const events = [
      { id: "evt-ok-1", code: "PLC", orderId: "order-1", merchantId: "merchant-1" },
      { id: "evt-fail-1", code: "PLC", orderId: "order-2", merchantId: "merchant-1" },
      { id: "evt-ok-2", code: "CFM", orderId: "order-3", merchantId: "merchant-1" },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(events), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { startEventPolling, stopEventPolling } = await import("./ifoodInfra");
    const processEvent = vi.fn(async (event: any) => {
      if (event.id === "evt-fail-1") {
        throw new Error("simulated processing failure");
      }
    });

    startEventPolling(processEvent, 60000);

    await vi.waitFor(() => {
      expect(acknowledgeIfoodEvents).toHaveBeenCalledTimes(1);
    });

    expect(processEvent).toHaveBeenCalledTimes(3);
    expect(acknowledgeIfoodEvents).toHaveBeenCalledWith(["evt-ok-1", "evt-ok-2"]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    stopEventPolling();
    fetchSpy.mockRestore();
  });

  it("ignores empty successful polling responses without throwing or acknowledging events", async () => {
    const acknowledgeIfoodEvents = vi.fn().mockResolvedValue(undefined);

    vi.doMock("./_core/env", () => ({
      ENV: { ifoodClientSecret: "test", ifoodClientId: "client", ifoodApiBaseUrl: "https://merchant-api.ifood.com.br" },
    }));
    vi.doMock("./_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    }));
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getActiveIfoodConfigs: vi.fn().mockResolvedValue([{ merchantId: "merchant-1" }]),
    }));
    vi.doMock("./ifood", () => ({
      getIfoodAccessToken: vi.fn().mockResolvedValue("access-token"),
      acknowledgeIfoodEvents,
    }));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { startEventPolling, stopEventPolling } = await import("./ifoodInfra");
    const processEvent = vi.fn();

    startEventPolling(processEvent, 60000);

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(processEvent).not.toHaveBeenCalled();
    expect(acknowledgeIfoodEvents).not.toHaveBeenCalled();

    stopEventPolling();
    fetchSpy.mockRestore();
  });
});
