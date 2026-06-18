import { describe, it, expect } from "vitest";

describe("VAPID environment variables", () => {
  it("should have VAPID_PUBLIC_KEY set", () => {
    expect(process.env.VAPID_PUBLIC_KEY).toBeDefined();
    expect(process.env.VAPID_PUBLIC_KEY!.length).toBeGreaterThan(10);
  });

  it("should have VAPID_PRIVATE_KEY set", () => {
    expect(process.env.VAPID_PRIVATE_KEY).toBeDefined();
    expect(process.env.VAPID_PRIVATE_KEY!.length).toBeGreaterThan(10);
  });
});
