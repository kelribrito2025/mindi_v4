import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addConnection,
  removeConnection,
  sendEvent,
  notifyNewOrder,
  notifyOrderUpdate,
  sendHeartbeat,
  getConnectionCount,
  getTotalConnections,
  addOrderConnection,
  addOrderConnectionForMultiple,
  removeOrderConnection,
  removeOrderConnectionFromMultiple,
  sendOrderEvent,
  notifyOrderStatusUpdate,
  sendOrderHeartbeat,
  getOrderConnectionCount,
  getTotalOrderConnections,
} from "./_core/sse";

// Mock Response object
function createMockResponse() {
  return {
    write: vi.fn(),
    end: vi.fn(),
  } as unknown as import("express").Response;
}

describe("SSE - Estabelecimento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addConnection", () => {
    it("adds a connection for an establishment", () => {
      const res = createMockResponse();
      const establishmentId = 100;

      addConnection(establishmentId, res);

      expect(getConnectionCount(establishmentId)).toBe(1);
    });

    it("adds multiple connections for the same establishment", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const establishmentId = 101;

      addConnection(establishmentId, res1);
      addConnection(establishmentId, res2);

      expect(getConnectionCount(establishmentId)).toBe(2);
    });
  });

  describe("removeConnection", () => {
    it("removes a connection from an establishment", () => {
      const res = createMockResponse();
      const establishmentId = 200;

      addConnection(establishmentId, res);
      expect(getConnectionCount(establishmentId)).toBe(1);

      removeConnection(establishmentId, res);
      expect(getConnectionCount(establishmentId)).toBe(0);
    });

    it("handles removing non-existent connection gracefully", () => {
      const res = createMockResponse();
      const establishmentId = 201;

      // Should not throw
      expect(() => removeConnection(establishmentId, res)).not.toThrow();
    });
  });

  describe("sendEvent", () => {
    it("sends event to all connections of an establishment", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const establishmentId = 300;
      const eventType = "test_event";
      const data = { message: "Hello" };

      addConnection(establishmentId, res1);
      addConnection(establishmentId, res2);

      sendEvent(establishmentId, eventType, data);

      expect(res1.write).toHaveBeenCalledWith(
        `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
      );
      expect(res2.write).toHaveBeenCalledWith(
        `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
      );
    });

    it("does nothing when no connections exist", () => {
      const establishmentId = 301;
      const eventType = "test_event";
      const data = { message: "Hello" };

      // Should not throw
      expect(() => sendEvent(establishmentId, eventType, data)).not.toThrow();
    });
  });

  describe("notifyNewOrder", () => {
    it("sends new_order event", () => {
      const res = createMockResponse();
      const establishmentId = 400;
      const order = {
        id: 1,
        orderNumber: "#P00001",
        total: "50.00",
      };

      addConnection(establishmentId, res);
      notifyNewOrder(establishmentId, order);

      expect(res.write).toHaveBeenCalledWith(
        `event: new_order\ndata: ${JSON.stringify(order)}\n\n`
      );
    });
  });

  describe("notifyOrderUpdate", () => {
    it("sends order_update event", () => {
      const res = createMockResponse();
      const establishmentId = 500;
      const order = {
        id: 1,
        status: "preparing",
      };

      addConnection(establishmentId, res);
      notifyOrderUpdate(establishmentId, order);

      expect(res.write).toHaveBeenCalledWith(
        `event: order_update\ndata: ${JSON.stringify(order)}\n\n`
      );
    });
  });

  describe("sendHeartbeat", () => {
    it("sends heartbeat event", () => {
      const res = createMockResponse();
      const establishmentId = 600;

      addConnection(establishmentId, res);
      sendHeartbeat(establishmentId);

      expect(res.write).toHaveBeenCalled();
      const callArg = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg).toContain("event: heartbeat");
      expect(callArg).toContain("timestamp");
    });
  });

  describe("getTotalConnections", () => {
    it("returns total connections across all establishments", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const res3 = createMockResponse();

      addConnection(700, res1);
      addConnection(700, res2);
      addConnection(701, res3);

      const total = getTotalConnections();
      expect(total).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("SSE - Pedidos (por orderNumber)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addOrderConnection", () => {
    it("adds a connection for an order", () => {
      const res = createMockResponse();
      const orderNumber = "#P00001";

      addOrderConnection(orderNumber, res);

      expect(getOrderConnectionCount(orderNumber)).toBe(1);
    });

    it("adds multiple connections for the same order", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const orderNumber = "#P00002";

      addOrderConnection(orderNumber, res1);
      addOrderConnection(orderNumber, res2);

      expect(getOrderConnectionCount(orderNumber)).toBe(2);
    });
  });

  describe("addOrderConnectionForMultiple", () => {
    it("adds a connection for multiple orders at once", () => {
      const res = createMockResponse();
      const orderNumbers = ["#P00010", "#P00011", "#P00012"];

      addOrderConnectionForMultiple(orderNumbers, res);

      expect(getOrderConnectionCount("#P00010")).toBe(1);
      expect(getOrderConnectionCount("#P00011")).toBe(1);
      expect(getOrderConnectionCount("#P00012")).toBe(1);
    });
  });

  describe("removeOrderConnection", () => {
    it("removes a connection from an order", () => {
      const res = createMockResponse();
      const orderNumber = "#P00020";

      addOrderConnection(orderNumber, res);
      expect(getOrderConnectionCount(orderNumber)).toBe(1);

      removeOrderConnection(orderNumber, res);
      expect(getOrderConnectionCount(orderNumber)).toBe(0);
    });

    it("handles removing non-existent connection gracefully", () => {
      const res = createMockResponse();
      const orderNumber = "#P00021";

      expect(() => removeOrderConnection(orderNumber, res)).not.toThrow();
    });
  });

  describe("removeOrderConnectionFromMultiple", () => {
    it("removes a connection from multiple orders at once", () => {
      const res = createMockResponse();
      const orderNumbers = ["#P00030", "#P00031", "#P00032"];

      addOrderConnectionForMultiple(orderNumbers, res);
      expect(getOrderConnectionCount("#P00030")).toBe(1);
      expect(getOrderConnectionCount("#P00031")).toBe(1);

      removeOrderConnectionFromMultiple(orderNumbers, res);
      expect(getOrderConnectionCount("#P00030")).toBe(0);
      expect(getOrderConnectionCount("#P00031")).toBe(0);
      expect(getOrderConnectionCount("#P00032")).toBe(0);
    });
  });

  describe("sendOrderEvent", () => {
    it("sends event to all connections of an order", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const orderNumber = "#P00040";
      const eventType = "order_status_update";
      const data = { orderNumber, status: "preparing" };

      addOrderConnection(orderNumber, res1);
      addOrderConnection(orderNumber, res2);

      sendOrderEvent(orderNumber, eventType, data);

      expect(res1.write).toHaveBeenCalledWith(
        `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
      );
      expect(res2.write).toHaveBeenCalledWith(
        `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
      );
    });

    it("does nothing when no connections exist for the order", () => {
      const orderNumber = "#P00041";
      const eventType = "order_status_update";
      const data = { orderNumber, status: "preparing" };

      expect(() => sendOrderEvent(orderNumber, eventType, data)).not.toThrow();
    });
  });

  describe("notifyOrderStatusUpdate", () => {
    it("sends order_status_update event with correct data", () => {
      const res = createMockResponse();
      const orderNumber = "#P00050";
      const orderUpdate = {
        id: 1,
        orderNumber,
        status: "preparing",
        updatedAt: new Date(),
      };

      addOrderConnection(orderNumber, res);
      notifyOrderStatusUpdate(orderNumber, orderUpdate);

      expect(res.write).toHaveBeenCalled();
      const callArg = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg).toContain("event: order_status_update");
      expect(callArg).toContain(orderNumber);
      expect(callArg).toContain("preparing");
    });

    it("sends order_status_update event with cancellation reason", () => {
      const res = createMockResponse();
      const orderNumber = "#P00051";
      const orderUpdate = {
        id: 2,
        orderNumber,
        status: "cancelled",
        cancellationReason: "Produto indisponível",
        updatedAt: new Date(),
      };

      addOrderConnection(orderNumber, res);
      notifyOrderStatusUpdate(orderNumber, orderUpdate);

      expect(res.write).toHaveBeenCalled();
      const callArg = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg).toContain("event: order_status_update");
      expect(callArg).toContain("cancelled");
      expect(callArg).toContain("Produto indisponível");
    });
  });

  describe("sendOrderHeartbeat", () => {
    it("sends heartbeat event to order connection", () => {
      const res = createMockResponse();
      const orderNumber = "#P00060";

      addOrderConnection(orderNumber, res);
      sendOrderHeartbeat(orderNumber);

      expect(res.write).toHaveBeenCalled();
      const callArg = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg).toContain("event: heartbeat");
      expect(callArg).toContain("timestamp");
    });
  });

  describe("getTotalOrderConnections", () => {
    it("returns total connections across all orders", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const res3 = createMockResponse();

      addOrderConnection("#P00070", res1);
      addOrderConnection("#P00070", res2);
      addOrderConnection("#P00071", res3);

      const total = getTotalOrderConnections();
      expect(total).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Cenário de uso real", () => {
    it("simula cliente abrindo conexão para múltiplos pedidos e recebendo atualizações", () => {
      const clientRes = createMockResponse();
      const orderNumbers = ["#P00100", "#P00101", "#P00102"];

      // Cliente abre conexão para seus 3 pedidos
      addOrderConnectionForMultiple(orderNumbers, clientRes);

      // Restaurante atualiza status do pedido #P00101
      notifyOrderStatusUpdate("#P00101", {
        id: 101,
        orderNumber: "#P00101",
        status: "preparing",
        updatedAt: new Date(),
      });

      // Cliente deve receber a atualização
      expect(clientRes.write).toHaveBeenCalled();
      const callArg = (clientRes.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg).toContain("#P00101");
      expect(callArg).toContain("preparing");

      // Limpar
      removeOrderConnectionFromMultiple(orderNumbers, clientRes);
    });

    it("simula múltiplos clientes acompanhando o mesmo pedido", () => {
      const client1Res = createMockResponse();
      const client2Res = createMockResponse();
      const orderNumber = "#P00200";

      // Dois clientes abrem conexão para o mesmo pedido (ex: dois dispositivos)
      addOrderConnection(orderNumber, client1Res);
      addOrderConnection(orderNumber, client2Res);

      // Restaurante atualiza status
      notifyOrderStatusUpdate(orderNumber, {
        id: 200,
        orderNumber,
        status: "ready",
        updatedAt: new Date(),
      });

      // Ambos clientes devem receber a atualização
      expect(client1Res.write).toHaveBeenCalled();
      expect(client2Res.write).toHaveBeenCalled();

      // Limpar
      removeOrderConnection(orderNumber, client1Res);
      removeOrderConnection(orderNumber, client2Res);
    });
  });
});
