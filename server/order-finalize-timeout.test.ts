import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * Testes para a lógica de finalização de pedidos em entrega há mais de 1 hora.
 * Quando um pedido está em status "out_for_delivery" há mais de 1 hora,
 * o botão "Entregador" deve mudar para "Finalizar" para permitir que o
 * dono do restaurante finalize diretamente.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;

interface OrderItem {
  id: number;
  status: string;
  deliveryType: string;
  createdAt: string;
  updatedAt: string;
}

// Simular a lógica de getNextAction extraída do Pedidos.tsx
function getNextAction(
  status: string,
  hasActiveDrivers: boolean,
  order?: OrderItem
): { label: string; newStatus: string; disabled?: boolean; driverControlled?: boolean } | null {
  switch (status) {
    case "new":
      return { label: "Aceitar", newStatus: "preparing" };
    case "preparing":
      return { label: "Pronto", newStatus: "ready" };
    case "ready":
    case "out_for_delivery":
      if (hasActiveDrivers && order?.deliveryType === 'delivery') {
        const orderAgeMs = Date.now() - new Date(order.updatedAt || order.createdAt).getTime();
        if (status === 'out_for_delivery' && orderAgeMs > ONE_HOUR_MS) {
          return { label: "Finalizar", newStatus: "completed" };
        }
        return { label: "Entregador", newStatus: "completed", disabled: true, driverControlled: true };
      }
      return { label: "Finalizar", newStatus: "completed" };
    default:
      return null;
  }
}

describe("Pedido em entrega - Timeout de 1 hora para finalização", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve mostrar 'Entregador' quando pedido está em entrega há menos de 1 hora", () => {
    const now = new Date('2026-03-02T12:00:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 1,
      status: "out_for_delivery",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T11:30:00Z').toISOString(), // 30 min atrás
    };

    const result = getNextAction("out_for_delivery", true, order);
    expect(result?.label).toBe("Entregador");
    expect(result?.driverControlled).toBe(true);
    expect(result?.disabled).toBe(true);
  });

  it("deve mostrar 'Finalizar' quando pedido está em entrega há mais de 1 hora", () => {
    const now = new Date('2026-03-02T14:00:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 2,
      status: "out_for_delivery",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T12:00:00Z').toISOString(), // 2h atrás
    };

    const result = getNextAction("out_for_delivery", true, order);
    expect(result?.label).toBe("Finalizar");
    expect(result?.driverControlled).toBeUndefined();
    expect(result?.disabled).toBeUndefined();
  });

  it("deve mostrar 'Finalizar' quando pedido está em entrega há exatamente 1h01min", () => {
    const now = new Date('2026-03-02T13:01:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 3,
      status: "out_for_delivery",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T12:00:00Z').toISOString(), // 1h01min atrás
    };

    const result = getNextAction("out_for_delivery", true, order);
    expect(result?.label).toBe("Finalizar");
  });

  it("deve mostrar 'Entregador' quando pedido está em entrega há exatamente 59 minutos", () => {
    const now = new Date('2026-03-02T12:59:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 4,
      status: "out_for_delivery",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T12:00:00Z').toISOString(), // 59 min atrás
    };

    const result = getNextAction("out_for_delivery", true, order);
    expect(result?.label).toBe("Entregador");
    expect(result?.driverControlled).toBe(true);
  });

  it("NÃO deve afetar pedidos de retirada (pickup) - sempre mostra Finalizar", () => {
    const now = new Date('2026-03-02T12:00:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 5,
      status: "out_for_delivery",
      deliveryType: "pickup",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T11:30:00Z').toISOString(),
    };

    const result = getNextAction("out_for_delivery", true, order);
    expect(result?.label).toBe("Finalizar");
  });

  it("NÃO deve afetar pedidos quando não há entregadores ativos", () => {
    const now = new Date('2026-03-02T12:00:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 6,
      status: "out_for_delivery",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T11:30:00Z').toISOString(),
    };

    const result = getNextAction("out_for_delivery", false, order);
    expect(result?.label).toBe("Finalizar");
  });

  it("deve manter 'Entregador' para pedidos em status 'ready' mesmo com mais de 1 hora", () => {
    const now = new Date('2026-03-02T14:00:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 7,
      status: "ready",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-02T12:00:00Z').toISOString(), // 2h atrás
    };

    // Status "ready" com entregador ativo = ainda mostra "Entregador"
    // porque o timeout só se aplica a "out_for_delivery"
    const result = getNextAction("ready", true, order);
    expect(result?.label).toBe("Entregador");
    expect(result?.driverControlled).toBe(true);
  });

  it("deve usar createdAt como fallback quando updatedAt não existe", () => {
    const now = new Date('2026-03-02T14:00:00Z');
    vi.setSystemTime(now);

    const order: OrderItem = {
      id: 8,
      status: "out_for_delivery",
      deliveryType: "delivery",
      createdAt: new Date('2026-03-02T12:00:00Z').toISOString(), // 2h atrás
      updatedAt: "", // vazio
    };

    const result = getNextAction("out_for_delivery", true, order);
    expect(result?.label).toBe("Finalizar");
  });
});
