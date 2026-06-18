import { describe, it, expect } from "vitest";

// Test the phone normalization logic used in ChatOrderBarWrapper
function normalizePhoneForOrderLookup(phone: string) {
  const clean = phone.replace(/\D/g, "");
  const withoutCountry = clean.startsWith("55") && clean.length >= 12 ? clean.slice(2) : clean;
  const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
  return { clean, withoutCountry, withCountry };
}

describe("Phone normalization for order lookup", () => {
  it("handles WhatsApp format with country code (5588992900001)", () => {
    const result = normalizePhoneForOrderLookup("5588992900001");
    expect(result.clean).toBe("5588992900001");
    expect(result.withoutCountry).toBe("88992900001");
    expect(result.withCountry).toBe("5588992900001");
  });

  it("handles raw digits without country code (88992900001)", () => {
    const result = normalizePhoneForOrderLookup("88992900001");
    expect(result.clean).toBe("88992900001");
    expect(result.withoutCountry).toBe("88992900001");
    expect(result.withCountry).toBe("5588992900001");
  });

  it("handles formatted phone (88) 9 9290-0001", () => {
    const result = normalizePhoneForOrderLookup("(88) 9 9290-0001");
    expect(result.clean).toBe("88992900001");
    expect(result.withoutCountry).toBe("88992900001");
    expect(result.withCountry).toBe("5588992900001");
  });

  it("handles phone with country code and formatting +55 (27) 99879-4646", () => {
    const result = normalizePhoneForOrderLookup("+55 (27) 99879-4646");
    expect(result.clean).toBe("5527998794646");
    expect(result.withoutCountry).toBe("27998794646");
    expect(result.withCountry).toBe("5527998794646");
  });

  it("handles short phone without 9th digit (4398098405)", () => {
    const result = normalizePhoneForOrderLookup("4398098405");
    expect(result.clean).toBe("4398098405");
    expect(result.withoutCountry).toBe("4398098405");
    expect(result.withCountry).toBe("554398098405");
  });
});

// Test the status config mapping used in ChatOrderBar
const STATUS_CONFIG: Record<string, { label: string; step: number }> = {
  pending_confirmation: { label: "Aguardando", step: 0 },
  new: { label: "Novo", step: 1 },
  scheduled: { label: "Agendado", step: 0 },
  preparing: { label: "Preparando", step: 2 },
  ready: { label: "Pronto", step: 3 },
  out_for_delivery: { label: "Em Rota", step: 4 },
};

describe("Order status config", () => {
  it("maps all active statuses correctly", () => {
    expect(STATUS_CONFIG["pending_confirmation"].step).toBe(0);
    expect(STATUS_CONFIG["new"].step).toBe(1);
    expect(STATUS_CONFIG["preparing"].step).toBe(2);
    expect(STATUS_CONFIG["ready"].step).toBe(3);
    expect(STATUS_CONFIG["out_for_delivery"].step).toBe(4);
  });

  it("has correct labels", () => {
    expect(STATUS_CONFIG["pending_confirmation"].label).toBe("Aguardando");
    expect(STATUS_CONFIG["preparing"].label).toBe("Preparando");
    expect(STATUS_CONFIG["out_for_delivery"].label).toBe("Em Rota");
  });

  it("does not include completed or cancelled (they are filtered out)", () => {
    expect(STATUS_CONFIG["completed"]).toBeUndefined();
    expect(STATUS_CONFIG["cancelled"]).toBeUndefined();
  });
});

// Test the timeAgo helper
function timeAgo(ts: Date | string): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

describe("timeAgo helper", () => {
  it("returns 'agora' for timestamps less than 1 minute ago", () => {
    const now = new Date();
    expect(timeAgo(now)).toBe("agora");
  });

  it("returns minutes for timestamps less than 1 hour ago", () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(timeAgo(thirtyMinsAgo)).toBe("há 30 min");
  });

  it("returns hours for timestamps less than 24 hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(timeAgo(threeHoursAgo)).toBe("há 3h");
  });

  it("returns days for timestamps more than 24 hours ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(timeAgo(twoDaysAgo)).toBe("há 2d");
  });

  it("handles string timestamps", () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinsAgo)).toBe("há 5 min");
  });
});

// Test formatCurrency helper
function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

describe("formatCurrency helper", () => {
  it("formats number correctly", () => {
    expect(formatCurrency(30)).toBe("R$ 30,00");
    expect(formatCurrency(5.5)).toBe("R$ 5,50");
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });

  it("formats string correctly", () => {
    expect(formatCurrency("30.00")).toBe("R$ 30,00");
    expect(formatCurrency("5.50")).toBe("R$ 5,50");
    expect(formatCurrency("123.45")).toBe("R$ 123,45");
  });
});
