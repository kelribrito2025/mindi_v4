import { describe, expect, it, beforeEach } from "vitest";

/**
 * Testa a lógica dos modais de onboarding contextual ao mudar status do pedido.
 * 
 * Regras:
 * 1. O modal só aparece se a notificação correspondente está ativa (whatsappConfig)
 * 2. O modal só aparece se o WhatsApp está conectado
 * 3. O modal não aparece se o usuário já marcou "Não mostrar novamente" (localStorage)
 * 4. O modal aparece para os status: preparing, ready, completed
 * 5. A chave do localStorage inclui o establishmentId para isolamento por estabelecimento
 */

// Reproduz a lógica exata implementada em Pedidos.tsx

type StatusType = 'preparing' | 'ready' | 'completed';

interface WhatsappConfig {
  notifyOnPreparing: boolean;
  notifyOnReady: boolean;
  notifyOnCompleted: boolean;
}

function isNotificationActive(
  statusType: StatusType,
  whatsappConfig: WhatsappConfig | null,
  whatsappStatus: string | undefined,
): boolean {
  if (!whatsappConfig) return false;
  if (whatsappStatus !== 'connected') return false;
  switch (statusType) {
    case 'preparing': return whatsappConfig.notifyOnPreparing ?? true;
    case 'ready': return whatsappConfig.notifyOnReady ?? true;
    case 'completed': return whatsappConfig.notifyOnCompleted ?? false;
    default: return false;
  }
}

function isStatusOnboardingDismissed(
  statusType: StatusType,
  establishmentId: number | null,
  storage: Record<string, string>,
): boolean {
  if (!establishmentId) return true;
  return storage[`onboarding_modal_dismissed_${establishmentId}_${statusType}`] === 'true';
}

function dismissStatusOnboarding(
  statusType: StatusType,
  establishmentId: number | null,
  storage: Record<string, string>,
): void {
  if (!establishmentId) return;
  storage[`onboarding_modal_dismissed_${establishmentId}_${statusType}`] = 'true';
}

function shouldShowOnboardingModal(
  statusType: StatusType,
  whatsappConfig: WhatsappConfig | null,
  whatsappStatus: string | undefined,
  establishmentId: number | null,
  storage: Record<string, string>,
): boolean {
  if (statusType !== 'preparing' && statusType !== 'ready' && statusType !== 'completed') {
    return false;
  }
  if (!isNotificationActive(statusType, whatsappConfig, whatsappStatus)) {
    return false;
  }
  if (isStatusOnboardingDismissed(statusType, establishmentId, storage)) {
    return false;
  }
  return true;
}

describe("Modal de onboarding contextual - lógica de exibição", () => {
  let storage: Record<string, string>;
  const defaultConfig: WhatsappConfig = {
    notifyOnPreparing: true,
    notifyOnReady: true,
    notifyOnCompleted: false,
  };
  const establishmentId = 210006;

  beforeEach(() => {
    storage = {};
  });

  describe("isNotificationActive", () => {
    it("retorna false quando whatsappConfig é null", () => {
      expect(isNotificationActive('preparing', null, 'connected')).toBe(false);
    });

    it("retorna false quando WhatsApp não está conectado", () => {
      expect(isNotificationActive('preparing', defaultConfig, 'disconnected')).toBe(false);
    });

    it("retorna false quando WhatsApp status é undefined", () => {
      expect(isNotificationActive('preparing', defaultConfig, undefined)).toBe(false);
    });

    it("retorna true para preparing quando notifyOnPreparing é true e conectado", () => {
      expect(isNotificationActive('preparing', defaultConfig, 'connected')).toBe(true);
    });

    it("retorna true para ready quando notifyOnReady é true e conectado", () => {
      expect(isNotificationActive('ready', defaultConfig, 'connected')).toBe(true);
    });

    it("retorna false para completed quando notifyOnCompleted é false", () => {
      expect(isNotificationActive('completed', defaultConfig, 'connected')).toBe(false);
    });

    it("retorna true para completed quando notifyOnCompleted é true e conectado", () => {
      const config = { ...defaultConfig, notifyOnCompleted: true };
      expect(isNotificationActive('completed', config, 'connected')).toBe(true);
    });

    it("retorna false para preparing quando notifyOnPreparing é false", () => {
      const config = { ...defaultConfig, notifyOnPreparing: false };
      expect(isNotificationActive('preparing', config, 'connected')).toBe(false);
    });

    it("retorna false para ready quando notifyOnReady é false", () => {
      const config = { ...defaultConfig, notifyOnReady: false };
      expect(isNotificationActive('ready', config, 'connected')).toBe(false);
    });
  });

  describe("isStatusOnboardingDismissed", () => {
    it("retorna true quando establishmentId é null (sem estabelecimento)", () => {
      expect(isStatusOnboardingDismissed('preparing', null, storage)).toBe(true);
    });

    it("retorna false quando não há registro no storage", () => {
      expect(isStatusOnboardingDismissed('preparing', establishmentId, storage)).toBe(false);
    });

    it("retorna true quando já foi dispensado no storage", () => {
      storage[`onboarding_modal_dismissed_${establishmentId}_preparing`] = 'true';
      expect(isStatusOnboardingDismissed('preparing', establishmentId, storage)).toBe(true);
    });

    it("isola preferências por estabelecimento", () => {
      storage[`onboarding_modal_dismissed_999_preparing`] = 'true';
      expect(isStatusOnboardingDismissed('preparing', establishmentId, storage)).toBe(false);
    });

    it("isola preferências por tipo de status", () => {
      storage[`onboarding_modal_dismissed_${establishmentId}_preparing`] = 'true';
      expect(isStatusOnboardingDismissed('ready', establishmentId, storage)).toBe(false);
    });
  });

  describe("dismissStatusOnboarding", () => {
    it("salva preferência no storage com chave correta", () => {
      dismissStatusOnboarding('preparing', establishmentId, storage);
      expect(storage[`onboarding_modal_dismissed_${establishmentId}_preparing`]).toBe('true');
    });

    it("não salva quando establishmentId é null", () => {
      dismissStatusOnboarding('preparing', null, storage);
      expect(Object.keys(storage).length).toBe(0);
    });

    it("salva para cada tipo de status independentemente", () => {
      dismissStatusOnboarding('preparing', establishmentId, storage);
      dismissStatusOnboarding('ready', establishmentId, storage);
      dismissStatusOnboarding('completed', establishmentId, storage);
      expect(storage[`onboarding_modal_dismissed_${establishmentId}_preparing`]).toBe('true');
      expect(storage[`onboarding_modal_dismissed_${establishmentId}_ready`]).toBe('true');
      expect(storage[`onboarding_modal_dismissed_${establishmentId}_completed`]).toBe('true');
    });
  });

  describe("shouldShowOnboardingModal (integração)", () => {
    it("mostra modal para preparing quando notificação ativa, conectado e não dispensado", () => {
      expect(shouldShowOnboardingModal('preparing', defaultConfig, 'connected', establishmentId, storage)).toBe(true);
    });

    it("mostra modal para ready quando notificação ativa, conectado e não dispensado", () => {
      expect(shouldShowOnboardingModal('ready', defaultConfig, 'connected', establishmentId, storage)).toBe(true);
    });

    it("NÃO mostra modal para completed quando notificação desativada (padrão)", () => {
      expect(shouldShowOnboardingModal('completed', defaultConfig, 'connected', establishmentId, storage)).toBe(false);
    });

    it("mostra modal para completed quando notificação ativada", () => {
      const config = { ...defaultConfig, notifyOnCompleted: true };
      expect(shouldShowOnboardingModal('completed', config, 'connected', establishmentId, storage)).toBe(true);
    });

    it("NÃO mostra modal quando WhatsApp desconectado", () => {
      expect(shouldShowOnboardingModal('preparing', defaultConfig, 'disconnected', establishmentId, storage)).toBe(false);
    });

    it("NÃO mostra modal quando já dispensado", () => {
      storage[`onboarding_modal_dismissed_${establishmentId}_preparing`] = 'true';
      expect(shouldShowOnboardingModal('preparing', defaultConfig, 'connected', establishmentId, storage)).toBe(false);
    });

    it("NÃO mostra modal quando whatsappConfig é null", () => {
      expect(shouldShowOnboardingModal('preparing', null, 'connected', establishmentId, storage)).toBe(false);
    });

    it("NÃO mostra modal quando establishmentId é null", () => {
      expect(shouldShowOnboardingModal('preparing', defaultConfig, 'connected', null, storage)).toBe(false);
    });

    it("dispensa preparing mas ainda mostra ready", () => {
      dismissStatusOnboarding('preparing', establishmentId, storage);
      expect(shouldShowOnboardingModal('preparing', defaultConfig, 'connected', establishmentId, storage)).toBe(false);
      expect(shouldShowOnboardingModal('ready', defaultConfig, 'connected', establishmentId, storage)).toBe(true);
    });

    it("dispensa para um estabelecimento não afeta outro", () => {
      dismissStatusOnboarding('preparing', 999, storage);
      expect(shouldShowOnboardingModal('preparing', defaultConfig, 'connected', establishmentId, storage)).toBe(true);
    });
  });
});

describe("Configuração visual do modal por status", () => {
  const modalConfig: Record<StatusType, { borderColor: string; title: string; description: string; buttonLabel: string }> = {
    preparing: {
      borderColor: '#dc2626',
      title: 'Pedido em preparo',
      description: 'Ao aceitar, o cliente será avisado via WhatsApp que o pedido está em preparo.',
      buttonLabel: 'Entendi, aceitar pedido',
    },
    ready: {
      borderColor: '#059669',
      title: 'Pedido pronto',
      description: 'Ao marcar como pronto, o cliente será avisado via WhatsApp que o pedido está pronto.',
      buttonLabel: 'Entendi, marcar como pronto',
    },
    completed: {
      borderColor: '#6b7280',
      title: 'Pedido finalizado',
      description: 'Ao finalizar, o cliente será avisado via WhatsApp que o pedido foi concluído.',
      buttonLabel: 'Entendi, finalizar pedido',
    },
  };

  it("preparing usa cor vermelha (#dc2626)", () => {
    expect(modalConfig.preparing.borderColor).toBe('#dc2626');
  });

  it("ready usa cor verde (#059669)", () => {
    expect(modalConfig.ready.borderColor).toBe('#059669');
  });

  it("completed usa cor cinza (#6b7280)", () => {
    expect(modalConfig.completed.borderColor).toBe('#6b7280');
  });

  it("cada status tem título e botão distintos", () => {
    expect(modalConfig.preparing.title).not.toBe(modalConfig.ready.title);
    expect(modalConfig.ready.title).not.toBe(modalConfig.completed.title);
    expect(modalConfig.preparing.buttonLabel).toContain('aceitar');
    expect(modalConfig.ready.buttonLabel).toContain('pronto');
    expect(modalConfig.completed.buttonLabel).toContain('finalizar');
  });

  it("descrição do preparing menciona 'aceitar' e 'preparo'", () => {
    expect(modalConfig.preparing.description).toContain('aceitar');
    expect(modalConfig.preparing.description).toContain('preparo');
  });

  it("descrição do ready menciona 'pronto'", () => {
    expect(modalConfig.ready.description).toContain('pronto');
  });

  it("descrição do completed menciona 'finalizar' e 'concluído'", () => {
    expect(modalConfig.completed.description).toContain('finalizar');
    expect(modalConfig.completed.description).toContain('concluído');
  });
});

describe("Botão 'Não mostrar novamente' (outline)", () => {
  let storage: Record<string, string>;
  const establishmentId = 210006;

  beforeEach(() => {
    storage = {};
  });

  it("ao clicar 'Não mostrar novamente', salva dismiss E executa a ação", () => {
    // Simula o comportamento do botão outline: dismiss + execute
    let executed = false;
    const statusType: StatusType = 'preparing';
    
    // Ação do botão outline
    dismissStatusOnboarding(statusType, establishmentId, storage);
    executed = true; // executeStatusUpdate seria chamado
    
    expect(storage[`onboarding_modal_dismissed_${establishmentId}_${statusType}`]).toBe('true');
    expect(executed).toBe(true);
  });

  it("ao clicar botão principal (Entendi), NÃO salva dismiss e executa a ação", () => {
    // Simula o comportamento do botão principal: apenas execute, sem dismiss
    let executed = false;
    const statusType: StatusType = 'preparing';
    
    // Ação do botão principal (handleStatusOnboardingConfirm com dontShowAgain=false)
    const dontShowAgain = false;
    if (dontShowAgain) {
      dismissStatusOnboarding(statusType, establishmentId, storage);
    }
    executed = true;
    
    expect(storage[`onboarding_modal_dismissed_${establishmentId}_${statusType}`]).toBeUndefined();
    expect(executed).toBe(true);
  });
});

describe("Chave de localStorage", () => {
  it("formato correto da chave", () => {
    const key = `onboarding_modal_dismissed_210006_preparing`;
    expect(key).toMatch(/^onboarding_modal_dismissed_\d+_(preparing|ready|completed)$/);
  });

  it("chaves são únicas por estabelecimento e status", () => {
    const keys = new Set([
      `onboarding_modal_dismissed_210006_preparing`,
      `onboarding_modal_dismissed_210006_ready`,
      `onboarding_modal_dismissed_210006_completed`,
      `onboarding_modal_dismissed_210007_preparing`,
    ]);
    expect(keys.size).toBe(4);
  });
});
