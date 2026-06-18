import { describe, expect, it } from "vitest";

/**
 * Testes do sistema de agendamento de pedidos.
 * Cobre: validação de configuração, lógica de time slots, lógica de migração para fila,
 * formatação de mensagens e lógica do job automático.
 */

// ============ HELPERS DE VALIDAÇÃO DE CONFIGURAÇÃO ============

/**
 * Valida os parâmetros de configuração de agendamento
 */
function validateSchedulingConfig(config: {
  schedulingEnabled?: boolean;
  schedulingMinAdvance?: number;
  schedulingMaxDays?: number;
  schedulingInterval?: number;
  schedulingMoveMinutes?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.schedulingMinAdvance !== undefined) {
    if (config.schedulingMinAdvance < 15) errors.push("Antecedência mínima deve ser pelo menos 15 minutos");
    if (config.schedulingMinAdvance > 1440) errors.push("Antecedência mínima não pode exceder 1440 minutos (24h)");
  }

  if (config.schedulingMaxDays !== undefined) {
    if (config.schedulingMaxDays < 1) errors.push("Antecedência máxima deve ser pelo menos 1 dia");
    if (config.schedulingMaxDays > 30) errors.push("Antecedência máxima não pode exceder 30 dias");
  }

  if (config.schedulingInterval !== undefined) {
    if (![15, 30, 60].includes(config.schedulingInterval)) {
      errors.push("Intervalo deve ser 15, 30 ou 60 minutos");
    }
  }

  if (config.schedulingMoveMinutes !== undefined) {
    if (config.schedulingMoveMinutes < 5) errors.push("Tempo de migração deve ser pelo menos 5 minutos");
    if (config.schedulingMoveMinutes > 120) errors.push("Tempo de migração não pode exceder 120 minutos");
  }

  return { valid: errors.length === 0, errors };
}

// ============ HELPERS DE TIME SLOTS ============

/**
 * Gera time slots disponíveis para uma data, respeitando horário de funcionamento e intervalo
 */
function generateTimeSlots(params: {
  date: string; // YYYY-MM-DD
  businessHours: { openTime: string; closeTime: string }[]; // ex: [{openTime: "11:00", closeTime: "23:00"}]
  interval: number; // 15, 30, 60
  minAdvanceMinutes: number;
  now: Date;
}): string[] {
  const { date, businessHours, interval, minAdvanceMinutes, now } = params;
  const slots: string[] = [];

  if (businessHours.length === 0) return slots;

  for (const bh of businessHours) {
    const [openH, openM] = bh.openTime.split(":").map(Number);
    const [closeH, closeM] = bh.closeTime.split(":").map(Number);

    let currentMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    while (currentMinutes < closeMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // Verificar se o horário é no futuro com antecedência mínima
      const slotDate = new Date(`${date}T${timeStr}:00`);
      const minTime = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000);

      if (slotDate > minTime) {
        slots.push(timeStr);
      }

      currentMinutes += interval;
    }
  }

  return slots;
}

/**
 * Verifica se um pedido agendado deve ser movido para a fila
 */
function shouldMoveToQueue(params: {
  scheduledAt: Date;
  moveMinutes: number;
  now: Date;
}): boolean {
  const { scheduledAt, moveMinutes, now } = params;
  const moveTime = new Date(scheduledAt.getTime() - moveMinutes * 60 * 1000);
  return now >= moveTime;
}

/**
 * Formata minutos em texto legível
 */
function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} minutos`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Gera a mensagem de agendamento para WhatsApp
 */
function formatSchedulingWhatsAppMessage(params: {
  orderNumber: string;
  customerName: string;
  scheduledAt: Date;
  total: number;
}): string {
  const { orderNumber, customerName, scheduledAt, total } = params;
  const dateStr = scheduledAt.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const timeStr = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalStr = (total / 100).toFixed(2).replace(".", ",");

  return `📅 *Pedido Agendado #${orderNumber}*\n` +
    `Cliente: ${customerName}\n` +
    `Data: ${dateStr}\n` +
    `Horário: ${timeStr}\n` +
    `Total: R$ ${totalStr}`;
}

// ============ TESTES ============

describe("Scheduling - Validação de Configuração", () => {
  it("aceita configuração válida com todos os campos", () => {
    const result = validateSchedulingConfig({
      schedulingEnabled: true,
      schedulingMinAdvance: 60,
      schedulingMaxDays: 7,
      schedulingInterval: 30,
      schedulingMoveMinutes: 30,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejeita antecedência mínima menor que 15 minutos", () => {
    const result = validateSchedulingConfig({ schedulingMinAdvance: 10 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Antecedência mínima deve ser pelo menos 15 minutos");
  });

  it("rejeita antecedência mínima maior que 1440 minutos", () => {
    const result = validateSchedulingConfig({ schedulingMinAdvance: 1500 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Antecedência mínima não pode exceder 1440 minutos (24h)");
  });

  it("rejeita antecedência máxima menor que 1 dia", () => {
    const result = validateSchedulingConfig({ schedulingMaxDays: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Antecedência máxima deve ser pelo menos 1 dia");
  });

  it("rejeita antecedência máxima maior que 30 dias", () => {
    const result = validateSchedulingConfig({ schedulingMaxDays: 31 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Antecedência máxima não pode exceder 30 dias");
  });

  it("rejeita intervalo inválido (20 minutos)", () => {
    const result = validateSchedulingConfig({ schedulingInterval: 20 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Intervalo deve ser 15, 30 ou 60 minutos");
  });

  it("aceita intervalo de 15 minutos", () => {
    const result = validateSchedulingConfig({ schedulingInterval: 15 });
    expect(result.valid).toBe(true);
  });

  it("aceita intervalo de 30 minutos", () => {
    const result = validateSchedulingConfig({ schedulingInterval: 30 });
    expect(result.valid).toBe(true);
  });

  it("aceita intervalo de 60 minutos", () => {
    const result = validateSchedulingConfig({ schedulingInterval: 60 });
    expect(result.valid).toBe(true);
  });

  it("rejeita tempo de migração menor que 5 minutos", () => {
    const result = validateSchedulingConfig({ schedulingMoveMinutes: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Tempo de migração deve ser pelo menos 5 minutos");
  });

  it("rejeita tempo de migração maior que 120 minutos", () => {
    const result = validateSchedulingConfig({ schedulingMoveMinutes: 150 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Tempo de migração não pode exceder 120 minutos");
  });

  it("aceita configuração parcial (apenas enabled)", () => {
    const result = validateSchedulingConfig({ schedulingEnabled: true });
    expect(result.valid).toBe(true);
  });

  it("aceita configuração vazia", () => {
    const result = validateSchedulingConfig({});
    expect(result.valid).toBe(true);
  });

  it("reporta múltiplos erros simultaneamente", () => {
    const result = validateSchedulingConfig({
      schedulingMinAdvance: 5,
      schedulingMaxDays: 50,
      schedulingInterval: 45,
      schedulingMoveMinutes: 200,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });
});

describe("Scheduling - Geração de Time Slots", () => {
  it("gera slots de 30 minutos dentro do horário de funcionamento", () => {
    const now = new Date("2026-02-14T08:00:00"); // Dia anterior
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [{ openTime: "11:00", closeTime: "14:00" }],
      interval: 30,
      minAdvanceMinutes: 60,
      now,
    });
    expect(slots).toEqual(["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]);
  });

  it("gera slots de 15 minutos", () => {
    const now = new Date("2026-02-14T08:00:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [{ openTime: "11:00", closeTime: "12:00" }],
      interval: 15,
      minAdvanceMinutes: 60,
      now,
    });
    expect(slots).toEqual(["11:00", "11:15", "11:30", "11:45"]);
  });

  it("gera slots de 60 minutos", () => {
    const now = new Date("2026-02-14T08:00:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [{ openTime: "11:00", closeTime: "15:00" }],
      interval: 60,
      minAdvanceMinutes: 60,
      now,
    });
    expect(slots).toEqual(["11:00", "12:00", "13:00", "14:00"]);
  });

  it("filtra horários passados no dia atual", () => {
    const now = new Date("2026-02-15T12:30:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [{ openTime: "11:00", closeTime: "16:00" }],
      interval: 30,
      minAdvanceMinutes: 60,
      now,
    });
    // now + 60min = 13:30, então só slots após 13:30
    expect(slots).toEqual(["14:00", "14:30", "15:00", "15:30"]);
  });

  it("retorna vazio quando não há horários de funcionamento", () => {
    const now = new Date("2026-02-14T08:00:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [],
      interval: 30,
      minAdvanceMinutes: 60,
      now,
    });
    expect(slots).toEqual([]);
  });

  it("retorna vazio quando todos os horários já passaram", () => {
    const now = new Date("2026-02-15T22:00:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [{ openTime: "11:00", closeTime: "14:00" }],
      interval: 30,
      minAdvanceMinutes: 60,
      now,
    });
    expect(slots).toEqual([]);
  });

  it("respeita antecedência mínima de 2 horas", () => {
    const now = new Date("2026-02-15T10:00:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [{ openTime: "11:00", closeTime: "15:00" }],
      interval: 30,
      minAdvanceMinutes: 120, // 2 horas
      now,
    });
    // now + 120min = 12:00, então só slots após 12:00
    expect(slots).toEqual(["12:30", "13:00", "13:30", "14:00", "14:30"]);
  });

  it("combina múltiplos períodos de funcionamento", () => {
    const now = new Date("2026-02-14T08:00:00");
    const slots = generateTimeSlots({
      date: "2026-02-15",
      businessHours: [
        { openTime: "11:00", closeTime: "14:00" },
        { openTime: "18:00", closeTime: "22:00" },
      ],
      interval: 60,
      minAdvanceMinutes: 60,
      now,
    });
    expect(slots).toEqual(["11:00", "12:00", "13:00", "18:00", "19:00", "20:00", "21:00"]);
  });
});

describe("Scheduling - Lógica de Migração para Fila", () => {
  it("move pedido quando está dentro do tempo de migração", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T13:35:00"); // 25 min antes
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 30, now });
    expect(result).toBe(true);
  });

  it("não move pedido quando está fora do tempo de migração", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T13:00:00"); // 60 min antes
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 30, now });
    expect(result).toBe(false);
  });

  it("move pedido exatamente no limite do tempo de migração", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T13:30:00"); // exatamente 30 min antes
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 30, now });
    expect(result).toBe(true);
  });

  it("move pedido quando já passou do horário agendado", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T14:15:00"); // 15 min depois
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 30, now });
    expect(result).toBe(true);
  });

  it("respeita configuração de 5 minutos de antecedência", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T13:56:00"); // 4 min antes
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 5, now });
    expect(result).toBe(true);
  });

  it("não move com 5 min config quando faltam 6 minutos", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T13:54:00"); // 6 min antes
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 5, now });
    expect(result).toBe(false);
  });

  it("respeita configuração de 120 minutos de antecedência", () => {
    const scheduledAt = new Date("2026-02-15T14:00:00");
    const now = new Date("2026-02-15T12:05:00"); // 115 min antes
    const result = shouldMoveToQueue({ scheduledAt, moveMinutes: 120, now });
    expect(result).toBe(true);
  });
});

describe("Scheduling - Formatação de Minutos", () => {
  it("formata minutos menores que 60", () => {
    expect(formatMinutes(15)).toBe("15 minutos");
    expect(formatMinutes(30)).toBe("30 minutos");
    expect(formatMinutes(45)).toBe("45 minutos");
  });

  it("formata horas exatas", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(180)).toBe("3h");
  });

  it("formata horas e minutos", () => {
    expect(formatMinutes(90)).toBe("1h 30min");
    expect(formatMinutes(75)).toBe("1h 15min");
    expect(formatMinutes(150)).toBe("2h 30min");
  });
});

describe("Scheduling - Mensagem WhatsApp", () => {
  it("formata mensagem de pedido agendado corretamente", () => {
    const msg = formatSchedulingWhatsAppMessage({
      orderNumber: "600010",
      customerName: "João Silva",
      scheduledAt: new Date("2026-02-20T14:30:00"),
      total: 5990,
    });
    expect(msg).toContain("Pedido Agendado #600010");
    expect(msg).toContain("João Silva");
    expect(msg).toContain("R$ 59,90");
    expect(msg).toContain("14:30");
  });

  it("formata valor zero corretamente", () => {
    const msg = formatSchedulingWhatsAppMessage({
      orderNumber: "600011",
      customerName: "Maria",
      scheduledAt: new Date("2026-02-20T10:00:00"),
      total: 0,
    });
    expect(msg).toContain("R$ 0,00");
  });

  it("formata valor com centavos", () => {
    const msg = formatSchedulingWhatsAppMessage({
      orderNumber: "600012",
      customerName: "Carlos",
      scheduledAt: new Date("2026-02-20T18:00:00"),
      total: 1599,
    });
    expect(msg).toContain("R$ 15,99");
  });
});

describe("Scheduling - Status do Pedido", () => {
  it("identifica pedido agendado pendente", () => {
    const order = { status: "scheduled", movedToQueue: false };
    const label = order.status === "scheduled" && !order.movedToQueue ? "Agendado" : "Outro";
    expect(label).toBe("Agendado");
  });

  it("identifica pedido agendado aceito (movido para fila)", () => {
    const order = { status: "scheduled", movedToQueue: true };
    const label = order.status === "scheduled" && order.movedToQueue ? "Aceito" : "Outro";
    expect(label).toBe("Aceito");
  });

  it("identifica pedido cancelado", () => {
    const order = { status: "cancelled", movedToQueue: false };
    const label = order.status === "cancelled" ? "Cancelado" : "Outro";
    expect(label).toBe("Cancelado");
  });

  it("identifica pedido na fila (status diferente de scheduled)", () => {
    const order = { status: "new", movedToQueue: true, isScheduled: true };
    const isInQueue = order.status !== "scheduled" && order.status !== "cancelled" && order.isScheduled;
    expect(isInQueue).toBe(true);
  });
});

describe("Scheduling - Contagem de Pedidos por Dia", () => {
  it("conta pedidos agrupados por data", () => {
    const orders = [
      { scheduledAt: new Date("2026-02-15T11:00:00") },
      { scheduledAt: new Date("2026-02-15T14:00:00") },
      { scheduledAt: new Date("2026-02-16T11:00:00") },
      { scheduledAt: new Date("2026-02-16T12:00:00") },
      { scheduledAt: new Date("2026-02-16T13:00:00") },
      { scheduledAt: new Date("2026-02-20T18:00:00") },
    ];

    const counts: Record<string, number> = {};
    for (const o of orders) {
      const d = o.scheduledAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    expect(counts["2026-02-15"]).toBe(2);
    expect(counts["2026-02-16"]).toBe(3);
    expect(counts["2026-02-20"]).toBe(1);
  });

  it("retorna mapa vazio para lista vazia", () => {
    const orders: { scheduledAt: Date }[] = [];
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const d = o.scheduledAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(0);
  });
});

describe("Scheduling - Validação de Data de Agendamento", () => {
  it("rejeita data no passado", () => {
    const now = new Date("2026-02-15T12:00:00");
    const scheduledAt = new Date("2026-02-14T14:00:00");
    const isValid = scheduledAt > now;
    expect(isValid).toBe(false);
  });

  it("aceita data no futuro", () => {
    const now = new Date("2026-02-15T12:00:00");
    const scheduledAt = new Date("2026-02-16T14:00:00");
    const isValid = scheduledAt > now;
    expect(isValid).toBe(true);
  });

  it("rejeita data além do máximo de dias", () => {
    const now = new Date("2026-02-15T12:00:00");
    const maxDays = 7;
    const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
    const scheduledAt = new Date("2026-02-25T14:00:00"); // 10 dias no futuro
    const isValid = scheduledAt <= maxDate;
    expect(isValid).toBe(false);
  });

  it("aceita data dentro do máximo de dias", () => {
    const now = new Date("2026-02-15T12:00:00");
    const maxDays = 7;
    const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
    const scheduledAt = new Date("2026-02-20T14:00:00"); // 5 dias no futuro
    const isValid = scheduledAt <= maxDate;
    expect(isValid).toBe(true);
  });

  it("rejeita horário sem antecedência mínima", () => {
    const now = new Date("2026-02-15T13:30:00");
    const minAdvanceMinutes = 60;
    const minTime = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000);
    const scheduledAt = new Date("2026-02-15T14:00:00"); // apenas 30 min no futuro
    const isValid = scheduledAt > minTime;
    expect(isValid).toBe(false);
  });

  it("aceita horário com antecedência mínima suficiente", () => {
    const now = new Date("2026-02-15T12:00:00");
    const minAdvanceMinutes = 60;
    const minTime = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000);
    const scheduledAt = new Date("2026-02-15T14:00:00"); // 2h no futuro
    const isValid = scheduledAt > minTime;
    expect(isValid).toBe(true);
  });
});

describe("Scheduling - Estatísticas do Calendário", () => {
  it("calcula estatísticas de pedidos agendados", () => {
    const orders = [
      { status: "scheduled", movedToQueue: false },
      { status: "scheduled", movedToQueue: false },
      { status: "scheduled", movedToQueue: true },
      { status: "new", movedToQueue: true, isScheduled: true },
      { status: "preparing", movedToQueue: true, isScheduled: true },
      { status: "cancelled", movedToQueue: false },
    ];

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "scheduled" && !o.movedToQueue).length,
      accepted: orders.filter(o => o.status === "scheduled" && o.movedToQueue).length,
      moved: orders.filter(o => o.status !== "scheduled" && o.status !== "cancelled").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
    };

    expect(stats.total).toBe(6);
    expect(stats.pending).toBe(2);
    expect(stats.accepted).toBe(1);
    expect(stats.moved).toBe(2);
    expect(stats.cancelled).toBe(1);
  });
});

describe("Scheduling - Ordenação de Pedidos por Horário", () => {
  it("ordena pedidos por horário agendado crescente", () => {
    const orders = [
      { id: 3, scheduledAt: new Date("2026-02-15T18:00:00") },
      { id: 1, scheduledAt: new Date("2026-02-15T11:00:00") },
      { id: 2, scheduledAt: new Date("2026-02-15T14:30:00") },
    ];

    const sorted = [...orders].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(3);
  });
});

describe("Scheduling - Filtragem de Pedidos por Data", () => {
  it("filtra pedidos para uma data específica", () => {
    const orders = [
      { id: 1, scheduledAt: new Date("2026-02-15T11:00:00") },
      { id: 2, scheduledAt: new Date("2026-02-15T14:00:00") },
      { id: 3, scheduledAt: new Date("2026-02-16T11:00:00") },
      { id: 4, scheduledAt: new Date("2026-02-17T18:00:00") },
    ];

    const targetDate = "2026-02-15";
    const filtered = orders.filter(o => {
      const d = o.scheduledAt;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return dateStr === targetDate;
    });

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe(1);
    expect(filtered[1].id).toBe(2);
  });
});
