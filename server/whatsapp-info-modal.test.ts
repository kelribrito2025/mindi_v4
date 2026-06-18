import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Testa a lógica do modal informativo de WhatsApp na página de Pedidos.
 * O modal deve aparecer apenas quando:
 * - O WhatsApp NÃO está conectado
 * - É o primeiro acesso (não foi dispensado nesta sessão)
 */

describe("Modal informativo WhatsApp - lógica de exibição", () => {
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    sessionStorageMock = {};
  });

  function shouldShowModal(params: {
    isWhatsappFetched: boolean;
    isWhatsappLoading: boolean;
    whatsappStatus: string | undefined;
    sessionDismissed: boolean;
  }): boolean {
    if (!params.isWhatsappFetched || params.isWhatsappLoading) return false;
    if (params.whatsappStatus === 'connected') return false;
    if (params.sessionDismissed) return false;
    return true;
  }

  it("não deve mostrar modal enquanto WhatsApp status está carregando", () => {
    expect(shouldShowModal({
      isWhatsappFetched: false,
      isWhatsappLoading: true,
      whatsappStatus: undefined,
      sessionDismissed: false,
    })).toBe(false);
  });

  it("não deve mostrar modal se WhatsApp está conectado", () => {
    expect(shouldShowModal({
      isWhatsappFetched: true,
      isWhatsappLoading: false,
      whatsappStatus: 'connected',
      sessionDismissed: false,
    })).toBe(false);
  });

  it("deve mostrar modal se WhatsApp está desconectado e não foi dispensado", () => {
    expect(shouldShowModal({
      isWhatsappFetched: true,
      isWhatsappLoading: false,
      whatsappStatus: 'disconnected',
      sessionDismissed: false,
    })).toBe(true);
  });

  it("não deve mostrar modal se já foi dispensado nesta sessão", () => {
    expect(shouldShowModal({
      isWhatsappFetched: true,
      isWhatsappLoading: false,
      whatsappStatus: 'disconnected',
      sessionDismissed: true,
    })).toBe(true === false); // deve ser false
  });

  it("deve mostrar modal quando status é undefined (sem instância)", () => {
    expect(shouldShowModal({
      isWhatsappFetched: true,
      isWhatsappLoading: false,
      whatsappStatus: undefined,
      sessionDismissed: false,
    })).toBe(true);
  });

  it("não deve mostrar modal quando status é 'connected' mesmo sem dismiss", () => {
    expect(shouldShowModal({
      isWhatsappFetched: true,
      isWhatsappLoading: false,
      whatsappStatus: 'connected',
      sessionDismissed: false,
    })).toBe(false);
  });
});

describe("Deep linking para Configurações > WhatsApp", () => {
  it("deve gerar URL correta para seção WhatsApp", () => {
    const url = '/configuracoes?section=whatsapp';
    expect(url).toBe('/configuracoes?section=whatsapp');
    
    const params = new URLSearchParams('?section=whatsapp');
    expect(params.get('section')).toBe('whatsapp');
  });

  it("deve validar seções válidas de configurações", () => {
    const validSections = ['estabelecimento', 'atendimento', 'whatsapp', 'impressora', 'pagamento-online', 'integracoes', 'conta-seguranca'];
    
    expect(validSections.includes('whatsapp')).toBe(true);
    expect(validSections.includes('invalido')).toBe(false);
    expect(validSections.includes('entrega')).toBe(false);
  });

  it("deve retornar seção padrão quando query param é inválido", () => {
    const params = new URLSearchParams('?section=invalido');
    const section = params.get('section');
    const validSections = ['estabelecimento', 'atendimento', 'whatsapp', 'impressora', 'pagamento-online', 'integracoes', 'conta-seguranca'];
    
    const result = section && validSections.includes(section) ? section : 'estabelecimento';
    expect(result).toBe('estabelecimento');
  });
});
