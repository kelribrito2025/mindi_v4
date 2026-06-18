/**
 * iFood Infrastructure Module (Phase 1)
 * 
 * Provides:
 * - HMAC-SHA256 webhook signature validation
 * - Event deduplication (database-backed)
 * - Retry with exponential backoff for API calls
 * - Rate limiting awareness
 * - Event polling fallback
 */

import crypto from "crypto";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";
import * as db from "./db";
import { ifoodProcessedEvents } from "../drizzle/schema";
import { eq, lt } from "drizzle-orm";

// ============================================================
// 1. HMAC-SHA256 WEBHOOK SIGNATURE VALIDATION
// ============================================================

/**
 * Validates the HMAC-SHA256 signature of an iFood webhook request.
 * Uses the IFOOD_CLIENT_SECRET as the signing key.
 * 
 * @param rawBody - The raw request body as Buffer (MUST be raw, not parsed JSON)
 * @param signature - The value of the X-IFood-Signature header
 * @returns true if signature is valid, false otherwise
 */
export function validateWebhookSignature(rawBody: Buffer | string, signature: string | undefined): boolean {
  if (!signature) {
    logger.warn("[iFood HMAC] No signature header present");
    return false;
  }

  const secret = ENV.ifoodClientSecret;
  if (!secret) {
    logger.error("[iFood HMAC] IFOOD_CLIENT_SECRET not configured — cannot validate signatures");
    return false;
  }

  try {
    const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");
    
    const expected = crypto
      .createHmac("sha256", secret)
      .update(bodyStr)
      .digest("hex");

    // Use constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "utf-8");
    const expectedBuffer = Buffer.from(expected, "utf-8");

    if (sigBuffer.length !== expectedBuffer.length) {
      logger.warn("[iFood HMAC] Signature length mismatch");
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    logger.error("[iFood HMAC] Error validating signature:", error);
    return false;
  }
}

// ============================================================
// 2. EVENT DEDUPLICATION
// ============================================================

// In-memory LRU cache for fast dedup (avoids DB hit for recent events)
const recentEventIds = new Map<string, number>(); // eventId -> timestamp
const MAX_MEMORY_CACHE_SIZE = 10000;
const MEMORY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Checks if an event has already been processed (deduplication).
 * Uses a two-tier approach:
 * 1. In-memory cache for fast checks on recent events
 * 2. Database lookup for persistent deduplication
 * 
 * @returns true if the event is a duplicate, false if it's new
 */
export async function isEventDuplicate(eventId: string): Promise<boolean> {
  // Tier 1: Check in-memory cache
  const cached = recentEventIds.get(eventId);
  if (cached && Date.now() - cached < MEMORY_CACHE_TTL_MS) {
    logger.info(`[iFood Dedup] Event ${eventId} found in memory cache — duplicate`);
    return true;
  }

  // Tier 2: Check database
  try {
    const dbInstance = await db.getDb();
    if (!dbInstance) return false;

    const existing = await dbInstance
      .select({ id: ifoodProcessedEvents.id })
      .from(ifoodProcessedEvents)
      .where(eq(ifoodProcessedEvents.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      // Add to memory cache for faster future lookups
      recentEventIds.set(eventId, Date.now());
      logger.info(`[iFood Dedup] Event ${eventId} found in database — duplicate`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("[iFood Dedup] Error checking duplicate:", error);
    // On error, allow processing (fail-open for availability)
    return false;
  }
}

/**
 * Marks an event as processed in both memory cache and database.
 * Events expire after 48 hours (TTL) for automatic cleanup.
 */
export async function markEventProcessed(
  eventId: string,
  eventCode: string,
  orderId?: string,
  merchantId?: string
): Promise<void> {
  // Add to memory cache
  recentEventIds.set(eventId, Date.now());

  // Evict old entries if cache is too large
  if (recentEventIds.size > MAX_MEMORY_CACHE_SIZE) {
    const cutoff = Date.now() - MEMORY_CACHE_TTL_MS;
    const entries = Array.from(recentEventIds.entries());
    for (const [key, ts] of entries) {
      if (ts < cutoff) recentEventIds.delete(key);
    }
  }

  // Persist to database
  try {
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h TTL

    await dbInstance.insert(ifoodProcessedEvents).values({
      eventId,
      eventCode,
      orderId: orderId || null,
      merchantId: merchantId || null,
      expiresAt,
    }).onDuplicateKeyUpdate({
      set: { processedAt: new Date() },
    });
  } catch (error) {
    logger.error("[iFood Dedup] Error marking event as processed:", error);
  }
}

/**
 * Cleans up expired events from the database.
 * Should be called periodically (e.g., every hour).
 */
export async function cleanupExpiredEvents(): Promise<number> {
  try {
    const dbInstance = await db.getDb();
    if (!dbInstance) return 0;

    const result = await dbInstance
      .delete(ifoodProcessedEvents)
      .where(lt(ifoodProcessedEvents.expiresAt, new Date()));

    const deletedCount = result[0]?.affectedRows || 0;
    if (deletedCount > 0) {
      logger.info(`[iFood Dedup] Cleaned up ${deletedCount} expired events`);
    }
    return deletedCount;
  } catch (error) {
    logger.error("[iFood Dedup] Error cleaning up expired events:", error);
    return 0;
  }
}

// ============================================================
// 3. RETRY WITH EXPONENTIAL BACKOFF
// ============================================================

interface RetryOptions {
  maxRetries?: number;       // Default: 3
  baseDelayMs?: number;      // Default: 1000 (1 second)
  maxDelayMs?: number;       // Default: 30000 (30 seconds)
  retryableStatuses?: number[]; // HTTP statuses to retry on
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Wraps a fetch call with exponential backoff retry logic.
 * Automatically handles:
 * - Retry-After header (from 429 responses)
 * - Exponential backoff with jitter
 * - Rate limit awareness
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      // Success — return immediately
      if (response.ok) {
        return response;
      }

      lastResponse = response;

      // Check if we should retry this status
      if (!opts.retryableStatuses.includes(response.status)) {
        return response; // Non-retryable error, return as-is
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        if (retryAfter) {
          const waitMs = parseInt(retryAfter, 10) * 1000;
          if (!isNaN(waitMs) && waitMs > 0) {
            logger.warn(`[iFood Retry] Rate limited. Waiting ${waitMs}ms (Retry-After header)`);
            await sleep(Math.min(waitMs, opts.maxDelayMs));
            continue;
          }
        }
      }

      // If we've exhausted retries, return the last response
      if (attempt === opts.maxRetries) {
        logger.warn(`[iFood Retry] Exhausted ${opts.maxRetries} retries for ${url} — last status: ${response.status}`);
        return response;
      }

      // Calculate exponential backoff with jitter
      const delay = calculateBackoff(attempt, opts.baseDelayMs, opts.maxDelayMs);
      logger.info(`[iFood Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed (${response.status}). Retrying in ${delay}ms...`);
      await sleep(delay);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries) {
        logger.error(`[iFood Retry] Exhausted ${opts.maxRetries} retries for ${url} — network error:`, lastError.message);
        throw lastError;
      }

      const delay = calculateBackoff(attempt, opts.baseDelayMs, opts.maxDelayMs);
      logger.info(`[iFood Retry] Attempt ${attempt + 1}/${opts.maxRetries} network error. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // Should not reach here, but just in case
  if (lastResponse) return lastResponse;
  throw lastError || new Error("fetchWithRetry: unexpected state");
}

/**
 * Calculates exponential backoff delay with jitter.
 * Formula: min(maxDelay, baseDelay * 2^attempt + random jitter)
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs; // Add random jitter to prevent thundering herd
  return Math.min(maxDelayMs, exponentialDelay + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 4. RATE LIMITING AWARENESS
// ============================================================

// Track rate limit state per endpoint category
interface RateLimitState {
  remaining: number;
  resetAt: number; // Unix timestamp ms
  lastUpdated: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Updates rate limit state from response headers.
 * Call this after every API response to track limits.
 */
export function updateRateLimitFromResponse(endpoint: string, response: Response): void {
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const reset = response.headers.get("X-RateLimit-Reset");

  if (remaining !== null) {
    const category = getEndpointCategory(endpoint);
    rateLimitStates.set(category, {
      remaining: parseInt(remaining, 10),
      resetAt: reset ? parseInt(reset, 10) * 1000 : Date.now() + 60000,
      lastUpdated: Date.now(),
    });

    // Warn when approaching limit
    const rem = parseInt(remaining, 10);
    if (rem < 10) {
      logger.warn(`[iFood RateLimit] ${category}: only ${rem} requests remaining. Resets at ${new Date(parseInt(reset || "0", 10) * 1000).toISOString()}`);
    }
  }
}

/**
 * Checks if we should throttle requests to a given endpoint.
 * Returns the number of milliseconds to wait, or 0 if OK to proceed.
 */
export function getThrottleDelay(endpoint: string): number {
  const category = getEndpointCategory(endpoint);
  const state = rateLimitStates.get(category);

  if (!state) return 0;

  // If we're out of requests and reset hasn't happened yet
  if (state.remaining <= 0 && state.resetAt > Date.now()) {
    return state.resetAt - Date.now();
  }

  // If very few requests remaining, add a small delay
  if (state.remaining < 5 && state.remaining > 0) {
    return 200; // 200ms throttle when near limit
  }

  return 0;
}

/**
 * Categorizes an endpoint URL for rate limit tracking.
 */
function getEndpointCategory(url: string): string {
  if (url.includes("/order/")) return "order";
  if (url.includes("/merchant/")) return "merchant";
  if (url.includes("/catalog/")) return "catalog";
  if (url.includes("/authentication/")) return "auth";
  if (url.includes("/events/")) return "events";
  return "general";
}

// ============================================================
// 5. ENHANCED IFOOD API CALLER
// ============================================================

/**
 * Makes an authenticated API call to iFood with retry, rate limiting,
 * and proper error handling.
 */
export async function ifoodApiCall(
  url: string,
  init: RequestInit & { token?: string },
  retryOptions?: RetryOptions
): Promise<Response> {
  // Check throttle before making request
  const throttleMs = getThrottleDelay(url);
  if (throttleMs > 0) {
    logger.info(`[iFood API] Throttling ${throttleMs}ms before ${url}`);
    await sleep(throttleMs);
  }

  // Ensure auth header is set
  const headers = new Headers(init.headers);
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetchWithRetry(
    url,
    { ...init, headers },
    retryOptions
  );

  // Update rate limit tracking
  updateRateLimitFromResponse(url, response);

  return response;
}

// ============================================================
// 6. EVENT POLLING FALLBACK
// ============================================================

const IFOOD_API_BASE_URL = "https://merchant-api.ifood.com.br";

// Polling state
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let isPollingActive = false;

/**
 * Polls iFood events API as a fallback when webhooks are unreliable.
 * Uses the /events/v1.0/events:polling endpoint.
 * 
 * @param processEvent - Callback function to process each event
 * @param intervalMs - Polling interval in milliseconds (default: 30s)
 */
export function startEventPolling(
  processEvent: (event: any) => Promise<void>,
  intervalMs: number = 30000
): void {
  if (isPollingActive) {
    logger.info("[iFood Polling] Already active, skipping start");
    return;
  }

  isPollingActive = true;
  logger.info(`[iFood Polling] Starting event polling (interval: ${intervalMs}ms)`);

  const poll = async () => {
    try {
      const activeConfigs = await db.getActiveIfoodConfigs();
      if (activeConfigs.length === 0) return;

      // Collect all active merchant IDs
      const merchantIds = activeConfigs
        .filter(c => c.merchantId)
        .map(c => c.merchantId!);

      if (merchantIds.length === 0) return;

      // Get token (using global credentials)
      const { getIfoodAccessToken } = await import("./ifood");
      const token = await getIfoodAccessToken();

      // Poll events with x-polling-merchants header
      const response = await ifoodApiCall(
        `${IFOOD_API_BASE_URL}/events/v1.0/events:polling`,
        {
          method: "GET",
          token,
          headers: {
            "x-polling-merchants": merchantIds.join(","),
          },
        },
        { maxRetries: 1, baseDelayMs: 2000 }
      );

      if (!response.ok) {
        if (response.status === 304) {
          // No new events — this is normal
          return;
        }
        logger.warn(`[iFood Polling] Failed to poll events: ${response.status}`);
        return;
      }

      if (response.status === 204) return;

      const responseBody = await response.text();
      if (!responseBody.trim()) return;

      let events: unknown;
      try {
        events = JSON.parse(responseBody);
      } catch (parseError) {
        logger.warn(`[iFood Polling] Ignoring malformed polling response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        return;
      }

      if (!Array.isArray(events) || events.length === 0) return;

      logger.info(`[iFood Polling] Received ${events.length} events`);

      const eventIdsToAcknowledge = new Set<string>();

      for (const event of events) {
        if (!event.id) continue;

        // Deduplication check
        const isDuplicate = await isEventDuplicate(event.id);
        if (isDuplicate) {
          logger.info(`[iFood Polling] Skipping duplicate event ${event.id}`);
          eventIdsToAcknowledge.add(event.id);
          continue;
        }

        try {
          await processEvent(event);
          await markEventProcessed(event.id, event.code, event.orderId, event.merchantId);
          eventIdsToAcknowledge.add(event.id);
        } catch (error) {
          logger.error(`[iFood Polling] Error processing event ${event.id}:`, error);
        }
      }

      // Acknowledge only events that were processed successfully or already deduplicated.
      // Failed events are left unacknowledged so iFood can retry them.
      if (eventIdsToAcknowledge.size > 0) {
        try {
          const { acknowledgeIfoodEvents } = await import("./ifood");
          const acknowledgedIds = Array.from(eventIdsToAcknowledge);
          await acknowledgeIfoodEvents(acknowledgedIds);
          logger.info(`[iFood Polling] Acknowledged ${acknowledgedIds.length} event(s) in batch`);
        } catch (ackError) {
          logger.error("[iFood Polling] Error acknowledging events:", ackError);
        }
      }

    } catch (error) {
      logger.error("[iFood Polling] Error during poll cycle:", error);
    }
  };

  // Run first poll immediately
  poll();

  // Set up interval
  pollingInterval = setInterval(poll, intervalMs);
}

/**
 * Stops event polling.
 */
export function stopEventPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  isPollingActive = false;
  logger.info("[iFood Polling] Stopped event polling");
}

/**
 * Returns whether polling is currently active.
 */
export function isPollingEnabled(): boolean {
  return isPollingActive;
}

// ============================================================
// 7. PERIODIC CLEANUP JOB
// ============================================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts periodic cleanup of expired deduplication records.
 * Runs every hour by default.
 */
export function startCleanupJob(intervalMs: number = 60 * 60 * 1000): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(async () => {
    await cleanupExpiredEvents();
  }, intervalMs);

  logger.info("[iFood Cleanup] Started periodic cleanup job");
}

/**
 * Stops the cleanup job.
 */
export function stopCleanupJob(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
