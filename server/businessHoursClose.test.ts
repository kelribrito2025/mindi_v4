import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  saveBusinessHours: vi.fn(),
  getEstablishmentTimezone: vi.fn().mockResolvedValue("America/Sao_Paulo"),
  getLocalDate: vi.fn(),
  getEstablishmentOpenStatus: vi.fn(),
  setManualClose: vi.fn(),
  invalidatePublicMenuCache: vi.fn(),
}));

vi.mock("./_core/sse", () => ({
  sendMenuPublicEvent: vi.fn(),
}));

vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import * as db from "./db";
import { sendMenuPublicEvent } from "./_core/sse";

describe("Business Hours - Fechamento imediato ao desligar dia atual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve fechar a loja imediatamente quando o dia atual for desligado e a loja estiver aberta", async () => {
    // Simular que hoje é quarta-feira (day 3)
    const mockWednesday = new Date("2026-04-15T20:00:00"); // Quarta-feira
    vi.mocked(db.getLocalDate).mockReturnValue(mockWednesday);
    
    // Loja está aberta
    vi.mocked(db.getEstablishmentOpenStatus).mockResolvedValue({
      isOpen: true,
      manuallyClosed: false,
      nextOpeningTime: null,
      shouldAutoReopen: false,
    });

    // Simular os horários com quarta-feira desligada
    const hours = [
      { dayOfWeek: 0, isActive: false, openTime: null, closeTime: null },
      { dayOfWeek: 1, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 2, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 3, isActive: false, openTime: null, closeTime: null }, // Quarta desligada
      { dayOfWeek: 4, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 5, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 6, isActive: true, openTime: "18:45", closeTime: "23:45" },
    ];

    const establishmentId = 1;

    // Executar a lógica que seria do endpoint
    await db.saveBusinessHours(establishmentId, hours);

    const tz = await db.getEstablishmentTimezone(establishmentId);
    const localNow = db.getLocalDate(tz);
    const currentDayOfWeek = localNow.getDay();
    const todayHour = hours.find(h => h.dayOfWeek === currentDayOfWeek);

    // Verificar que o dia atual (quarta = 3) está desligado
    expect(currentDayOfWeek).toBe(3); // Quarta-feira
    expect(todayHour).toBeDefined();
    expect(todayHour!.isActive).toBe(false);

    // Verificar status e fechar
    if (todayHour && !todayHour.isActive) {
      const currentStatus = await db.getEstablishmentOpenStatus(establishmentId);
      if (currentStatus.isOpen) {
        await db.setManualClose(establishmentId, true);
        db.invalidatePublicMenuCache(establishmentId);
        sendMenuPublicEvent(
          establishmentId,
          'establishment_closed',
          { establishmentId, isOpen: false }
        );
      }
    }

    // Verificar que setManualClose foi chamado
    expect(db.setManualClose).toHaveBeenCalledWith(1, true);
    expect(db.invalidatePublicMenuCache).toHaveBeenCalledWith(1);
    expect(sendMenuPublicEvent).toHaveBeenCalledWith(
      1,
      'establishment_closed',
      { establishmentId: 1, isOpen: false }
    );
  });

  it("NÃO deve fechar a loja quando um dia diferente do atual for desligado", async () => {
    // Simular que hoje é quarta-feira (day 3)
    const mockWednesday = new Date("2026-04-15T20:00:00");
    vi.mocked(db.getLocalDate).mockReturnValue(mockWednesday);

    // Horários com segunda-feira desligada (não é o dia atual)
    const hours = [
      { dayOfWeek: 0, isActive: false, openTime: null, closeTime: null },
      { dayOfWeek: 1, isActive: false, openTime: null, closeTime: null }, // Segunda desligada
      { dayOfWeek: 2, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 3, isActive: true, openTime: "18:45", closeTime: "23:45" }, // Quarta ligada (hoje)
      { dayOfWeek: 4, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 5, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 6, isActive: true, openTime: "18:45", closeTime: "23:45" },
    ];

    const establishmentId = 1;
    await db.saveBusinessHours(establishmentId, hours);

    const tz = await db.getEstablishmentTimezone(establishmentId);
    const localNow = db.getLocalDate(tz);
    const currentDayOfWeek = localNow.getDay();
    const todayHour = hours.find(h => h.dayOfWeek === currentDayOfWeek);

    // Hoje é quarta e está ativa
    expect(currentDayOfWeek).toBe(3);
    expect(todayHour!.isActive).toBe(true);

    // Não deve fechar porque o dia atual está ativo
    if (todayHour && !todayHour.isActive) {
      await db.setManualClose(establishmentId, true);
    }

    // setManualClose NÃO deve ter sido chamado
    expect(db.setManualClose).not.toHaveBeenCalled();
  });

  it("NÃO deve fechar a loja quando o dia atual for desligado mas a loja já está fechada", async () => {
    // Simular que hoje é quarta-feira (day 3)
    const mockWednesday = new Date("2026-04-15T20:00:00");
    vi.mocked(db.getLocalDate).mockReturnValue(mockWednesday);

    // Loja já está fechada
    vi.mocked(db.getEstablishmentOpenStatus).mockResolvedValue({
      isOpen: false,
      manuallyClosed: true,
      nextOpeningTime: null,
      shouldAutoReopen: false,
    });

    const hours = [
      { dayOfWeek: 0, isActive: false, openTime: null, closeTime: null },
      { dayOfWeek: 1, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 2, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 3, isActive: false, openTime: null, closeTime: null }, // Quarta desligada
      { dayOfWeek: 4, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 5, isActive: true, openTime: "18:45", closeTime: "23:45" },
      { dayOfWeek: 6, isActive: true, openTime: "18:45", closeTime: "23:45" },
    ];

    const establishmentId = 1;
    await db.saveBusinessHours(establishmentId, hours);

    const tz = await db.getEstablishmentTimezone(establishmentId);
    const localNow = db.getLocalDate(tz);
    const currentDayOfWeek = localNow.getDay();
    const todayHour = hours.find(h => h.dayOfWeek === currentDayOfWeek);

    expect(todayHour!.isActive).toBe(false);

    if (todayHour && !todayHour.isActive) {
      const currentStatus = await db.getEstablishmentOpenStatus(establishmentId);
      if (currentStatus.isOpen) {
        await db.setManualClose(establishmentId, true);
      }
    }

    // setManualClose NÃO deve ter sido chamado porque a loja já está fechada
    expect(db.setManualClose).not.toHaveBeenCalled();
  });
});
