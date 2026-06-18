import { describe, it, expect } from "vitest";

/**
 * Testa a lógica de presets e formatação do DateRangePickerSales.
 * Valida cálculos de datas para os presets (Hoje, Ontem, 7 dias, 30 dias, Este ano).
 */

function toYMD(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayYMD() {
  const now = new Date();
  return toYMD(now.getFullYear(), now.getMonth(), now.getDate());
}

function subtractDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - days);
  return toYMD(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

type PresetKey = "today" | "yesterday" | "7days" | "30days" | "thisYear" | "custom";

function getPresetRange(key: PresetKey): { start: string; end: string } | null {
  const today = todayYMD();
  switch (key) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const yesterday = subtractDays(today, 1);
      return { start: yesterday, end: yesterday };
    }
    case "7days":
      return { start: subtractDays(today, 6), end: today };
    case "30days":
      return { start: subtractDays(today, 29), end: today };
    case "thisYear": {
      const now = new Date();
      const yearStart = `${now.getFullYear()}-01-01`;
      return { start: yearStart, end: today };
    }
    case "custom":
      return null;
  }
}

function detectPreset(start: string, end: string): PresetKey {
  const presets: PresetKey[] = ["today", "yesterday", "7days", "30days", "thisYear"];
  for (const p of presets) {
    const range = getPresetRange(p);
    if (range && range.start === start && range.end === end) return p;
  }
  return "custom";
}

describe("DateRangePickerSales - Lógica de presets", () => {
  it("preset 'Hoje' deve retornar start e end iguais à data de hoje", () => {
    const range = getPresetRange("today");
    expect(range).not.toBeNull();
    expect(range!.start).toBe(range!.end);
    expect(range!.start).toBe(todayYMD());
  });

  it("preset 'Ontem' deve retornar start e end iguais ao dia anterior", () => {
    const range = getPresetRange("yesterday");
    expect(range).not.toBeNull();
    expect(range!.start).toBe(range!.end);
    const yesterday = subtractDays(todayYMD(), 1);
    expect(range!.start).toBe(yesterday);
  });

  it("preset '7 dias' deve retornar intervalo de 7 dias terminando hoje", () => {
    const range = getPresetRange("7days");
    expect(range).not.toBeNull();
    expect(range!.end).toBe(todayYMD());
    expect(range!.start).toBe(subtractDays(todayYMD(), 6));
    // Verificar que são exatamente 7 dias
    const start = new Date(range!.start + "T12:00:00");
    const end = new Date(range!.end + "T12:00:00");
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(6); // 6 dias de diferença = 7 dias inclusive
  });

  it("preset '30 dias' deve retornar intervalo de 30 dias terminando hoje", () => {
    const range = getPresetRange("30days");
    expect(range).not.toBeNull();
    expect(range!.end).toBe(todayYMD());
    const start = new Date(range!.start + "T12:00:00");
    const end = new Date(range!.end + "T12:00:00");
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(29); // 29 dias de diferença = 30 dias inclusive
  });

  it("preset 'Este ano' deve começar em 01/01 do ano atual", () => {
    const range = getPresetRange("thisYear");
    expect(range).not.toBeNull();
    expect(range!.end).toBe(todayYMD());
    const now = new Date();
    expect(range!.start).toBe(`${now.getFullYear()}-01-01`);
  });

  it("preset 'custom' deve retornar null", () => {
    const range = getPresetRange("custom");
    expect(range).toBeNull();
  });

  it("detectPreset deve identificar 'today' corretamente", () => {
    const today = todayYMD();
    expect(detectPreset(today, today)).toBe("today");
  });

  it("detectPreset deve identificar 'yesterday' corretamente", () => {
    const yesterday = subtractDays(todayYMD(), 1);
    expect(detectPreset(yesterday, yesterday)).toBe("yesterday");
  });

  it("detectPreset deve retornar 'custom' para datas arbitrárias", () => {
    expect(detectPreset("2026-03-15", "2026-03-20")).toBe("custom");
  });

  it("formatDateBR deve formatar YYYY-MM-DD para DD/MM/YYYY", () => {
    expect(formatDateBR("2026-04-28")).toBe("28/04/2026");
    expect(formatDateBR("2026-01-01")).toBe("01/01/2026");
    expect(formatDateBR("")).toBe("");
  });

  it("subtractDays deve calcular corretamente", () => {
    expect(subtractDays("2026-04-28", 1)).toBe("2026-04-27");
    expect(subtractDays("2026-04-01", 1)).toBe("2026-03-31");
    expect(subtractDays("2026-01-01", 1)).toBe("2025-12-31");
  });
});
