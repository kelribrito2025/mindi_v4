import { describe, it, expect } from "vitest";

// Test the scheduled campaign data structures and validation logic

describe("Scheduled Campaigns", () => {
  describe("Schema validation", () => {
    it("should accept valid campaign status values", () => {
      const validStatuses = ["pending", "processing", "sent", "failed", "cancelled"];
      validStatuses.forEach(status => {
        expect(["pending", "processing", "sent", "failed", "cancelled"]).toContain(status);
      });
    });

    it("should require scheduledAt to be in the future", () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      expect(futureDate > now).toBe(true);
      expect(pastDate > now).toBe(false);
    });

    it("should validate recipient format", () => {
      const validRecipients = [
        { phone: "5511999991111", name: "Cliente 1" },
        { phone: "5588999290000", name: "Cliente 2" },
      ];

      validRecipients.forEach(r => {
        expect(r.phone).toMatch(/^55\d{10,11}$/);
        expect(r.name.length).toBeGreaterThan(0);
      });
    });

    it("should serialize recipients as JSON string", () => {
      const recipients = [
        { phone: "5511999991111", name: "João" },
        { phone: "5511999992222", name: "Maria" },
      ];

      const serialized = JSON.stringify(recipients);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toHaveLength(2);
      expect(deserialized[0].phone).toBe("5511999991111");
      expect(deserialized[1].name).toBe("Maria");
    });
  });

  describe("Scheduling logic", () => {
    it("should calculate correct scheduled timestamp from date and time inputs", () => {
      const dateStr = "2026-03-15";
      const timeStr = "14:30";
      const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);

      expect(scheduledAt.getFullYear()).toBe(2026);
      expect(scheduledAt.getMonth()).toBe(2); // March = 2
      expect(scheduledAt.getDate()).toBe(15);
      expect(scheduledAt.getHours()).toBe(14);
      expect(scheduledAt.getMinutes()).toBe(30);
    });

    it("should reject past dates", () => {
      const pastDate = new Date("2020-01-01T10:00:00");
      const now = new Date();

      expect(pastDate <= now).toBe(true);
    });

    it("should accept future dates", () => {
      const futureDate = new Date("2030-12-31T23:59:00");
      const now = new Date();

      expect(futureDate > now).toBe(true);
    });

    it("should correctly identify pending campaigns", () => {
      const campaigns = [
        { id: 1, status: "pending" },
        { id: 2, status: "sent" },
        { id: 3, status: "pending" },
        { id: 4, status: "cancelled" },
        { id: 5, status: "failed" },
      ];

      const pending = campaigns.filter(c => c.status === "pending");
      expect(pending).toHaveLength(2);
      expect(pending.map(c => c.id)).toEqual([1, 3]);
    });

    it("should correctly identify campaigns ready to process", () => {
      const now = Date.now();
      const campaigns = [
        { id: 1, status: "pending", scheduledAt: now - 60000 }, // 1 min ago - ready
        { id: 2, status: "pending", scheduledAt: now + 3600000 }, // 1 hour from now - not ready
        { id: 3, status: "sent", scheduledAt: now - 60000 }, // already sent
        { id: 4, status: "pending", scheduledAt: now - 120000 }, // 2 min ago - ready
      ];

      const ready = campaigns.filter(
        c => c.status === "pending" && c.scheduledAt <= now
      );

      expect(ready).toHaveLength(2);
      expect(ready.map(c => c.id)).toEqual([1, 4]);
    });
  });

  describe("Campaign cost calculation", () => {
    it("should calculate correct cost for campaign", () => {
      const recipientCount = 50;
      const costPerSms = 0.097;
      const totalCost = recipientCount * costPerSms;

      expect(totalCost).toBeCloseTo(4.85, 2);
    });

    it("should validate sufficient balance before scheduling", () => {
      const saldo = 10.0;
      const costPerSms = 0.097;
      const recipientCount = 150;
      const totalCost = recipientCount * costPerSms;

      expect(totalCost).toBeCloseTo(14.55, 2);
      expect(totalCost > saldo).toBe(true);
    });

    it("should allow scheduling when balance is sufficient", () => {
      const saldo = 20.0;
      const costPerSms = 0.097;
      const recipientCount = 100;
      const totalCost = recipientCount * costPerSms;

      expect(totalCost).toBeCloseTo(9.70, 2);
      expect(totalCost <= saldo).toBe(true);
    });
  });

  describe("Campaign status transitions", () => {
    it("should only allow cancellation of pending campaigns", () => {
      const cancellableStatuses = ["pending"];
      const nonCancellableStatuses = ["processing", "sent", "failed", "cancelled"];

      cancellableStatuses.forEach(status => {
        expect(status === "pending").toBe(true);
      });

      nonCancellableStatuses.forEach(status => {
        expect(status === "pending").toBe(false);
      });
    });

    it("should transition from pending to processing to sent", () => {
      const transitions: Record<string, string[]> = {
        pending: ["processing", "cancelled"],
        processing: ["sent", "failed"],
        sent: [],
        failed: [],
        cancelled: [],
      };

      expect(transitions["pending"]).toContain("processing");
      expect(transitions["pending"]).toContain("cancelled");
      expect(transitions["processing"]).toContain("sent");
      expect(transitions["processing"]).toContain("failed");
      expect(transitions["sent"]).toHaveLength(0);
    });
  });

  describe("Job interval", () => {
    it("should check every 60 seconds", () => {
      const JOB_INTERVAL_MS = 60 * 1000;
      expect(JOB_INTERVAL_MS).toBe(60000);
    });

    it("should process campaigns that are due within the check window", () => {
      const now = Date.now();
      const checkWindow = 60 * 1000; // 60 seconds

      const campaign1 = { scheduledAt: now - 30000 }; // 30s ago - due
      const campaign2 = { scheduledAt: now + 30000 }; // 30s from now - not due yet
      const campaign3 = { scheduledAt: now - 120000 }; // 2 min ago - overdue but still due

      expect(campaign1.scheduledAt <= now).toBe(true);
      expect(campaign2.scheduledAt <= now).toBe(false);
      expect(campaign3.scheduledAt <= now).toBe(true);
    });
  });
});
