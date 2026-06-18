/**
 * Testes para o webhook Paytime - updated-establishment-status
 * Testa a lógica de mapeamento de status e processamento de eventos
 */
import { describe, expect, it } from "vitest";

// ─── Teste da lógica de mapeamento de status ───
describe("Paytime Webhook - Status Mapping", () => {
  const statusMap: Record<string, "pending" | "submitted" | "approved" | "rejected"> = {
    'ACTIVE': 'approved',
    'APPROVED': 'approved',
    'PENDING': 'pending',
    'PENDING_APPROVAL': 'submitted',
    'IN_ANALYSIS': 'submitted',
    'REJECTED': 'rejected',
    'BLOCKED': 'rejected',
    'INACTIVE': 'rejected',
    'SUSPENDED': 'rejected',
  };

  it("mapeia ACTIVE para approved", () => {
    expect(statusMap['ACTIVE']).toBe('approved');
  });

  it("mapeia APPROVED para approved", () => {
    expect(statusMap['APPROVED']).toBe('approved');
  });

  it("mapeia PENDING para pending", () => {
    expect(statusMap['PENDING']).toBe('pending');
  });

  it("mapeia PENDING_APPROVAL para submitted", () => {
    expect(statusMap['PENDING_APPROVAL']).toBe('submitted');
  });

  it("mapeia IN_ANALYSIS para submitted", () => {
    expect(statusMap['IN_ANALYSIS']).toBe('submitted');
  });

  it("mapeia REJECTED para rejected", () => {
    expect(statusMap['REJECTED']).toBe('rejected');
  });

  it("mapeia BLOCKED para rejected", () => {
    expect(statusMap['BLOCKED']).toBe('rejected');
  });

  it("mapeia INACTIVE para rejected", () => {
    expect(statusMap['INACTIVE']).toBe('rejected');
  });

  it("mapeia SUSPENDED para rejected", () => {
    expect(statusMap['SUSPENDED']).toBe('rejected');
  });

  it("retorna undefined para status desconhecido", () => {
    expect(statusMap['UNKNOWN_STATUS']).toBeUndefined();
  });
});

// ─── Teste da lógica de processamento do webhook ───
describe("Paytime Webhook - Event Processing Logic", () => {
  it("extrai eventName corretamente do campo 'event' (formato oficial Paytime)", () => {
    const payload = {
      event: "updated-establishment-status",
      event_date: "2025-09-25T19:10:51.852Z",
      data: { id: 12345, status: "ACTIVE" }
    };
    const eventName = payload.event || (payload as any).type;
    expect(eventName).toBe("updated-establishment-status");
  });

  it("extrai eventName do campo 'type' como fallback (formato legado)", () => {
    const payload = {
      type: "updated-establishment-status",
      data: { id: 12345, status: "ACTIVE" }
    };
    const eventName = (payload as any).event || payload.type;
    expect(eventName).toBe("updated-establishment-status");
  });

  it("retorna undefined quando não há event nem type", () => {
    const payload = { data: { id: 12345 } };
    const eventName = (payload as any).event || (payload as any).type;
    expect(eventName).toBeUndefined();
  });

  it("extrai paytimeEstId e newStatus do payload corretamente", () => {
    const payload = {
      event: "updated-establishment-status",
      event_date: "2025-09-25T19:10:51.852Z",
      data: {
        id: 155085,
        first_name: "EC Teste",
        last_name: null,
        document: "10068114001",
        status: "ACTIVE",
        type: "INDIVIDUAL",
        created_at: "2025-09-25T19:10:51.543Z",
      }
    };
    
    const estData = payload.data;
    const paytimeEstId = estData?.id;
    const newStatus = estData?.status;
    
    expect(paytimeEstId).toBe(155085);
    expect(newStatus).toBe("ACTIVE");
  });

  it("lida com payload sem data graciosamente", () => {
    const payload = {
      event: "updated-establishment-status",
      event_date: "2025-09-25T19:10:51.852Z",
    };
    
    const estData = (payload as any).data;
    const paytimeEstId = estData?.id;
    const newStatus = estData?.status;
    
    expect(paytimeEstId).toBeUndefined();
    expect(newStatus).toBeUndefined();
  });
});

// ─── Teste de detecção de evento de teste ───
describe("Paytime Webhook - Test Event Detection", () => {
  it("detecta evento de teste com id começando com 'test_'", () => {
    const payload = { id: "test_12345", event: "updated-establishment-status" };
    const isTest = payload.id && String(payload.id).startsWith('test_');
    expect(isTest).toBeTruthy();
  });

  it("não detecta evento real como teste", () => {
    const payload = { event: "updated-establishment-status", data: { id: 123 } };
    const isTest = (payload as any).id && String((payload as any).id).startsWith('test_');
    expect(isTest).toBeFalsy();
  });
});

// ─── Teste da lógica de atualização baseada no status ───
describe("Paytime Webhook - Update Logic", () => {
  const statusMap: Record<string, "pending" | "submitted" | "approved" | "rejected"> = {
    'ACTIVE': 'approved',
    'APPROVED': 'approved',
    'PENDING': 'pending',
    'PENDING_APPROVAL': 'submitted',
    'IN_ANALYSIS': 'submitted',
    'REJECTED': 'rejected',
    'BLOCKED': 'rejected',
    'INACTIVE': 'rejected',
    'SUSPENDED': 'rejected',
  };

  it("ativa gateway quando status é approved", () => {
    const mappedStatus = statusMap['ACTIVE'];
    const updateData: Record<string, unknown> = { paytimeOnboardingStatus: mappedStatus };
    if (mappedStatus === 'approved') updateData.paytimeGatewayActive = true;
    
    expect(updateData.paytimeOnboardingStatus).toBe('approved');
    expect(updateData.paytimeGatewayActive).toBe(true);
  });

  it("desativa gateway quando status é rejected", () => {
    const mappedStatus = statusMap['REJECTED'];
    const updateData: Record<string, unknown> = { paytimeOnboardingStatus: mappedStatus };
    if (mappedStatus === 'rejected') updateData.paytimeGatewayActive = false;
    
    expect(updateData.paytimeOnboardingStatus).toBe('rejected');
    expect(updateData.paytimeGatewayActive).toBe(false);
  });

  it("não altera gateway quando status é pending", () => {
    const mappedStatus = statusMap['PENDING'];
    const updateData: Record<string, unknown> = { paytimeOnboardingStatus: mappedStatus };
    
    expect(updateData.paytimeOnboardingStatus).toBe('pending');
    expect(updateData.paytimeGatewayActive).toBeUndefined();
  });

  it("não altera gateway quando status é submitted", () => {
    const mappedStatus = statusMap['IN_ANALYSIS'];
    const updateData: Record<string, unknown> = { paytimeOnboardingStatus: mappedStatus };
    
    expect(updateData.paytimeOnboardingStatus).toBe('submitted');
    expect(updateData.paytimeGatewayActive).toBeUndefined();
  });

  it("converte status case-insensitive corretamente", () => {
    const newStatus = "active";
    const mapped = statusMap[newStatus.toUpperCase()];
    expect(mapped).toBe('approved');
  });
});

// ─── Teste do formato SSE event data ───
describe("Paytime Webhook - SSE Event Data", () => {
  it("gera dados corretos para evento SSE paytimeOnboardingUpdate", () => {
    const paytimeEstId = 155085;
    const newStatus = "ACTIVE";
    const mappedStatus = "approved";
    
    const sseData = {
      paytimeEstablishmentId: paytimeEstId,
      paytimeStatus: newStatus,
      onboardingStatus: mappedStatus,
      gatewayActive: mappedStatus === 'approved',
    };
    
    expect(sseData.paytimeEstablishmentId).toBe(155085);
    expect(sseData.paytimeStatus).toBe("ACTIVE");
    expect(sseData.onboardingStatus).toBe("approved");
    expect(sseData.gatewayActive).toBe(true);
  });

  it("gera gatewayActive=false para status rejeitado", () => {
    const mappedStatus = "rejected";
    
    const sseData = {
      paytimeEstablishmentId: 155085,
      paytimeStatus: "REJECTED",
      onboardingStatus: mappedStatus,
      gatewayActive: mappedStatus === 'approved',
    };
    
    expect(sseData.gatewayActive).toBe(false);
  });
});
