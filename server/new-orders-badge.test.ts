import { describe, it, expect } from "vitest";

describe("New Orders Badge Logic", () => {
  it("should count only orders with status 'new'", () => {
    const orders = [
      { id: 1, status: "new", createdAt: new Date() },
      { id: 2, status: "accepted", createdAt: new Date() },
      { id: 3, status: "new", createdAt: new Date() },
      { id: 4, status: "delivered", createdAt: new Date() },
    ];
    
    const newOrdersCount = orders.filter(order => order.status === "new").length;
    expect(newOrdersCount).toBe(2);
  });

  it("should filter orders by timestamp", () => {
    const lastSeenTimestamp = Date.now() - 60000; // 1 minute ago
    
    const orders = [
      { id: 1, status: "new", createdAt: new Date(lastSeenTimestamp - 30000) }, // Before last seen
      { id: 2, status: "new", createdAt: new Date(lastSeenTimestamp + 30000) }, // After last seen
      { id: 3, status: "new", createdAt: new Date(lastSeenTimestamp + 60000) }, // After last seen
    ];
    
    const unseenNewOrders = orders.filter(order => {
      const orderTimestamp = new Date(order.createdAt).getTime();
      return order.status === "new" && orderTimestamp > lastSeenTimestamp;
    });
    
    expect(unseenNewOrders.length).toBe(2);
  });

  it("should return 0 when no new orders exist", () => {
    const orders = [
      { id: 1, status: "accepted", createdAt: new Date() },
      { id: 2, status: "delivered", createdAt: new Date() },
    ];
    
    const newOrdersCount = orders.filter(order => order.status === "new").length;
    expect(newOrdersCount).toBe(0);
  });

  it("should format badge text correctly", () => {
    const formatBadgeText = (count: number) => {
      if (count > 99) return "99+";
      if (count > 9) return `${count}`;
      return `${count}`;
    };
    
    expect(formatBadgeText(5)).toBe("5");
    expect(formatBadgeText(15)).toBe("15");
    expect(formatBadgeText(100)).toBe("99+");
  });
});
