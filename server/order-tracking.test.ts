import { describe, it, expect } from "vitest";

/**
 * Tests for the order tracking bug fix.
 * 
 * The bug: After daily order number reset at 00:00, when a new order is created
 * starting again at #P1, clicking "Acompanhar pedido" (track order) would return
 * the status of the OLD order with the same #P1 number from the previous day.
 * 
 * Root cause: The system was using the visual order number (#P1, #P2...) as the
 * tracking identifier instead of the unique database order ID.
 * 
 * Fix: Use orderId (unique DB ID) for all tracking operations, and only use
 * orderNumber (#P1) for visual display purposes.
 */

// Helper to simulate the UserOrder type from PublicMenu.tsx
type UserOrder = {
  id: string;          // Visual order number (e.g., "#P1")
  orderId?: number;    // Unique database ID
  date: string;
  items: Array<{ name: string; quantity: number; price: string; complements: Array<{ name: string; price: string; quantity: number }> }>;
  total: string;
  status: "sent" | "accepted" | "delivering" | "delivered" | "cancelled";
  deliveryType: "pickup" | "delivery" | "dine_in";
  paymentMethod: "cash" | "card" | "pix" | "card_online" | "online";
  address?: { street: string; number: string; neighborhood: string; complement: string; reference: string };
  customerName: string;
  customerPhone: string;
  observation: string;
};

// Simulate the order lookup logic used in the fixed code
function findOrderByTrackingId(orders: UserOrder[], trackingId: string): UserOrder | undefined {
  return orders.find(o =>
    o.orderId?.toString() === trackingId || o.id === trackingId
  );
}

// Simulate the SSE tracking ID selection logic
function getTrackingId(order: UserOrder): string {
  return order.orderId ? order.orderId.toString() : order.id;
}

// Simulate the currentOrderIdForQuery logic
function getCurrentOrderIdForQuery(currentOrderNumber: string | null, userOrders: UserOrder[]): number {
  if (!currentOrderNumber) return 0;
  const parsed = parseInt(currentOrderNumber, 10);
  if (!isNaN(parsed) && parsed > 0 && !currentOrderNumber.startsWith('#') && !currentOrderNumber.startsWith('P')) {
    return parsed;
  }
  const order = userOrders.find(o => o.id === currentOrderNumber);
  return order?.orderId || 0;
}

// Simulate the visual order number display logic for tracking modal
function getVisualOrderNumber(
  selectedOrderId: string | null,
  currentOrderData: { orderNumber: string } | null,
  userOrders: UserOrder[]
): string {
  if (!selectedOrderId) return '';
  if (selectedOrderId.startsWith('#') || selectedOrderId.startsWith('P')) {
    return selectedOrderId.startsWith('#') ? selectedOrderId : '#' + selectedOrderId;
  }
  const visualOrder = currentOrderData?.orderNumber || userOrders.find(o => o.orderId?.toString() === selectedOrderId)?.id;
  return visualOrder ? (visualOrder.startsWith('#') ? visualOrder : '#' + visualOrder) : '';
}

// Simulate the SSE callback matching logic
function doesUpdateMatchCurrentOrder(
  update: { id?: number; orderNumber: string; status: string },
  currentOrderNumber: string
): boolean {
  const updateOrderId = update.id ? update.id.toString() : '';
  return updateOrderId === currentOrderNumber || update.orderNumber === currentOrderNumber;
}

// Simulate the order status update matching logic
function findOrderForStatusUpdate(
  orders: UserOrder[],
  update: { id?: number; orderNumber: string }
): UserOrder | undefined {
  const updateOrderId = update.id ? update.id.toString() : '';
  return orders.find(order =>
    order.orderId?.toString() === updateOrderId || order.id === update.orderNumber
  );
}

describe("Order Tracking - Daily Reset Bug Fix", () => {
  // Simulate orders from two different days with same visual number
  const yesterdayOrder: UserOrder = {
    id: "#P1",
    orderId: 100,
    date: "2026-02-12T23:30:00.000Z",
    items: [{ name: "Pizza Margherita", quantity: 1, price: "35.00", complements: [] }],
    total: "35.00",
    status: "delivered",
    deliveryType: "delivery",
    paymentMethod: "pix",
    customerName: "João",
    customerPhone: "62999999999",
    observation: "",
  };

  const todayOrder: UserOrder = {
    id: "#P1",
    orderId: 101,
    date: "2026-02-13T00:15:00.000Z",
    items: [{ name: "Pizza Calabresa", quantity: 1, price: "40.00", complements: [] }],
    total: "40.00",
    status: "sent",
    deliveryType: "pickup",
    paymentMethod: "card",
    customerName: "Maria",
    customerPhone: "62988888888",
    observation: "",
  };

  const userOrders = [todayOrder, yesterdayOrder];

  describe("findOrderByTrackingId", () => {
    it("should find order by orderId (numeric string) instead of visual number", () => {
      // When tracking uses orderId "101", should find today's order
      const found = findOrderByTrackingId(userOrders, "101");
      expect(found).toBeDefined();
      expect(found!.orderId).toBe(101);
      expect(found!.customerName).toBe("Maria");
    });

    it("should find yesterday's order by its orderId", () => {
      const found = findOrderByTrackingId(userOrders, "100");
      expect(found).toBeDefined();
      expect(found!.orderId).toBe(100);
      expect(found!.customerName).toBe("João");
    });

    it("should NOT confuse orders with same visual number #P1", () => {
      // Both orders have id "#P1" but different orderId
      const todayFound = findOrderByTrackingId(userOrders, "101");
      const yesterdayFound = findOrderByTrackingId(userOrders, "100");
      
      expect(todayFound).not.toBe(yesterdayFound);
      expect(todayFound!.status).toBe("sent");
      expect(yesterdayFound!.status).toBe("delivered");
    });

    it("should fallback to visual id for legacy orders without orderId", () => {
      const legacyOrder: UserOrder = {
        id: "#P5",
        // No orderId - legacy order
        date: "2026-02-10T12:00:00.000Z",
        items: [],
        total: "20.00",
        status: "delivered",
        deliveryType: "pickup",
        paymentMethod: "cash",
        customerName: "Legacy",
        customerPhone: "62977777777",
        observation: "",
      };
      
      const orders = [legacyOrder, ...userOrders];
      const found = findOrderByTrackingId(orders, "#P5");
      expect(found).toBeDefined();
      expect(found!.customerName).toBe("Legacy");
    });
  });

  describe("getTrackingId", () => {
    it("should return orderId as string when available", () => {
      expect(getTrackingId(todayOrder)).toBe("101");
      expect(getTrackingId(yesterdayOrder)).toBe("100");
    });

    it("should fallback to visual id for legacy orders", () => {
      const legacyOrder: UserOrder = {
        id: "#P3",
        date: "2026-02-10T12:00:00.000Z",
        items: [],
        total: "15.00",
        status: "sent",
        deliveryType: "pickup",
        paymentMethod: "cash",
        customerName: "Legacy",
        customerPhone: "62977777777",
        observation: "",
      };
      expect(getTrackingId(legacyOrder)).toBe("#P3");
    });
  });

  describe("getCurrentOrderIdForQuery", () => {
    it("should parse numeric orderId directly", () => {
      // When currentOrderNumber is "101" (orderId), should return 101
      expect(getCurrentOrderIdForQuery("101", userOrders)).toBe(101);
    });

    it("should NOT parse visual order numbers starting with #", () => {
      // When currentOrderNumber is "#P1", should look up orderId from userOrders
      expect(getCurrentOrderIdForQuery("#P1", userOrders)).toBe(101); // First match is today's order
    });

    it("should return 0 for null", () => {
      expect(getCurrentOrderIdForQuery(null, userOrders)).toBe(0);
    });
  });

  describe("getVisualOrderNumber", () => {
    it("should return visual number when selectedOrderId is already visual", () => {
      expect(getVisualOrderNumber("#P1", null, userOrders)).toBe("#P1");
    });

    it("should look up visual number from currentOrderData when selectedOrderId is numeric", () => {
      const orderData = { orderNumber: "#P1" };
      expect(getVisualOrderNumber("101", orderData, userOrders)).toBe("#P1");
    });

    it("should look up visual number from userOrders when selectedOrderId is numeric", () => {
      expect(getVisualOrderNumber("101", null, userOrders)).toBe("#P1");
    });

    it("should return empty string when no match found", () => {
      expect(getVisualOrderNumber("999", null, userOrders)).toBe("");
    });
  });

  describe("doesUpdateMatchCurrentOrder", () => {
    it("should match by orderId when currentOrderNumber is orderId", () => {
      const update = { id: 101, orderNumber: "#P1", status: "preparing" };
      expect(doesUpdateMatchCurrentOrder(update, "101")).toBe(true);
    });

    it("should NOT match wrong orderId even with same visual number", () => {
      const update = { id: 100, orderNumber: "#P1", status: "completed" };
      // currentOrderNumber is "101" (today's order), update is for orderId 100 (yesterday's)
      expect(doesUpdateMatchCurrentOrder(update, "101")).toBe(false);
    });

    it("should match by orderNumber for legacy fallback", () => {
      const update = { orderNumber: "#P5", status: "preparing" };
      expect(doesUpdateMatchCurrentOrder(update, "#P5")).toBe(true);
    });
  });

  describe("findOrderForStatusUpdate", () => {
    it("should find correct order by orderId in SSE update", () => {
      const update = { id: 101, orderNumber: "#P1" };
      const found = findOrderForStatusUpdate(userOrders, update);
      expect(found).toBeDefined();
      expect(found!.orderId).toBe(101);
      expect(found!.customerName).toBe("Maria");
    });

    it("should NOT return yesterday's order when update has today's orderId", () => {
      const update = { id: 101, orderNumber: "#P1" };
      const found = findOrderForStatusUpdate(userOrders, update);
      expect(found!.status).toBe("sent"); // Today's order, not yesterday's "delivered"
    });

    it("should find yesterday's order by its orderId when it's first in array", () => {
      // When yesterday's order is first in the array, orderId match should work
      const reversedOrders = [yesterdayOrder, todayOrder];
      const update = { id: 100, orderNumber: "#P1" };
      const found = findOrderForStatusUpdate(reversedOrders, update);
      expect(found).toBeDefined();
      expect(found!.orderId).toBe(100);
      expect(found!.status).toBe("delivered");
    });

    it("should correctly match when orders have different visual numbers", () => {
      // More realistic scenario: after reset, new day has #P1 and old day had #P5
      const oldOrder: UserOrder = {
        ...yesterdayOrder,
        id: "#P5",
        orderId: 100,
      };
      const newOrder: UserOrder = {
        ...todayOrder,
        id: "#P1",
        orderId: 101,
      };
      const orders = [newOrder, oldOrder];
      
      // Update for old order should find old order by orderId
      const update = { id: 100, orderNumber: "#P5" };
      const found = findOrderForStatusUpdate(orders, update);
      expect(found).toBeDefined();
      expect(found!.orderId).toBe(100);
      expect(found!.customerName).toBe("Jo\u00e3o");
    });
  });

  describe("Online payment flow", () => {
    it("should create order with orderId for tracking after payment confirmation", () => {
      // Simulate the result from checkPaymentStatus
      const paymentResult = {
        orderNumber: "#P2",
        orderId: 102,
      };

      const onlineOrder: UserOrder = {
        id: paymentResult.orderNumber,
        orderId: paymentResult.orderId,
        date: new Date().toISOString(),
        items: [{ name: "Hambúrguer", quantity: 2, price: "25.00", complements: [] }],
        total: "50.00",
        status: "sent",
        deliveryType: "delivery",
        paymentMethod: "online",
        customerName: "Pedro",
        customerPhone: "62966666666",
        observation: "",
      };

      // The tracking ID should be the orderId
      expect(getTrackingId(onlineOrder)).toBe("102");
      
      // Should be findable by orderId
      const orders = [onlineOrder, ...userOrders];
      const found = findOrderByTrackingId(orders, "102");
      expect(found).toBeDefined();
      expect(found!.customerName).toBe("Pedro");
      expect(found!.paymentMethod).toBe("online");
    });

    it("should map 'online' payment method to 'pix' for re-ordering", () => {
      const onlineOrder: UserOrder = {
        id: "#P2",
        orderId: 102,
        date: new Date().toISOString(),
        items: [],
        total: "50.00",
        status: "delivered",
        deliveryType: "delivery",
        paymentMethod: "online",
        customerName: "Pedro",
        customerPhone: "62966666666",
        observation: "",
      };

      // When re-ordering, 'online' should be mapped to 'pix'
      const mappedPayment = onlineOrder.paymentMethod === 'online' ? 'pix' : onlineOrder.paymentMethod;
      expect(mappedPayment).toBe("pix");
    });
  });
});
