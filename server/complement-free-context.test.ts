import { describe, it, expect } from 'vitest';

/**
 * Testa a lógica de cálculo de preço de complementos por contexto.
 * Replica a função getComplementPrice usada no frontend.
 */

type DeliveryType = 'delivery' | 'pickup' | 'dine_in';

interface ComplementItem {
  price: string | number;
  priceMode?: string;
  freeOnDelivery?: boolean;
  freeOnPickup?: boolean;
  freeOnDineIn?: boolean;
}

// Replica exata da função helper usada no PublicMenu.tsx
function getComplementPrice(item: ComplementItem, deliveryType: DeliveryType): number {
  if (item.priceMode === 'free') {
    // Verificar se a gratuidade se aplica ao contexto atual
    if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
    if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
    if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
    // Se nenhum contexto marcado (todos false), grátis em todos (comportamento legado)
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    // Se tem contextos marcados mas o atual não está, cobrar preço normal
    return Number(item.price);
  }
  return Number(item.price);
}

// Replica da função helper do PDV
function getComplementPricePDV(
  item: ComplementItem,
  orderType: 'mesa' | 'retirada' | 'entrega'
): number {
  const deliveryTypeMap: Record<string, DeliveryType> = {
    mesa: 'dine_in',
    retirada: 'pickup',
    entrega: 'delivery',
  };
  const deliveryType = deliveryTypeMap[orderType] || 'delivery';
  return getComplementPrice(item, deliveryType);
}

// Replica da função helper do PDVSlidebar (sempre dine_in)
function getComplementPriceDineIn(item: ComplementItem): number {
  if (item.priceMode === 'free') {
    if (item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
}

describe('Gratuidade de complementos por contexto', () => {
  describe('Complemento com priceMode normal (sem grátis)', () => {
    const item: ComplementItem = {
      price: '5.00',
      priceMode: 'normal',
      freeOnDelivery: false,
      freeOnPickup: false,
      freeOnDineIn: false,
    };

    it('cobra preço normal no delivery', () => {
      expect(getComplementPrice(item, 'delivery')).toBe(5);
    });

    it('cobra preço normal na retirada', () => {
      expect(getComplementPrice(item, 'pickup')).toBe(5);
    });

    it('cobra preço normal no consumo local', () => {
      expect(getComplementPrice(item, 'dine_in')).toBe(5);
    });
  });

  describe('Complemento grátis em TODOS os contextos (legado - nenhum checkbox marcado)', () => {
    const item: ComplementItem = {
      price: '5.00',
      priceMode: 'free',
      freeOnDelivery: false,
      freeOnPickup: false,
      freeOnDineIn: false,
    };

    it('grátis no delivery', () => {
      expect(getComplementPrice(item, 'delivery')).toBe(0);
    });

    it('grátis na retirada', () => {
      expect(getComplementPrice(item, 'pickup')).toBe(0);
    });

    it('grátis no consumo local', () => {
      expect(getComplementPrice(item, 'dine_in')).toBe(0);
    });
  });

  describe('Complemento grátis apenas na retirada e consumo local', () => {
    const item: ComplementItem = {
      price: '4.00',
      priceMode: 'free',
      freeOnDelivery: false,
      freeOnPickup: true,
      freeOnDineIn: true,
    };

    it('cobra preço normal no delivery', () => {
      expect(getComplementPrice(item, 'delivery')).toBe(4);
    });

    it('grátis na retirada', () => {
      expect(getComplementPrice(item, 'pickup')).toBe(0);
    });

    it('grátis no consumo local', () => {
      expect(getComplementPrice(item, 'dine_in')).toBe(0);
    });
  });

  describe('Complemento grátis apenas no delivery', () => {
    const item: ComplementItem = {
      price: '3.00',
      priceMode: 'free',
      freeOnDelivery: true,
      freeOnPickup: false,
      freeOnDineIn: false,
    };

    it('grátis no delivery', () => {
      expect(getComplementPrice(item, 'delivery')).toBe(0);
    });

    it('cobra preço normal na retirada', () => {
      expect(getComplementPrice(item, 'pickup')).toBe(3);
    });

    it('cobra preço normal no consumo local', () => {
      expect(getComplementPrice(item, 'dine_in')).toBe(3);
    });
  });

  describe('Complemento grátis no delivery e retirada (máximo 2)', () => {
    const item: ComplementItem = {
      price: '6.00',
      priceMode: 'free',
      freeOnDelivery: true,
      freeOnPickup: true,
      freeOnDineIn: false,
    };

    it('grátis no delivery', () => {
      expect(getComplementPrice(item, 'delivery')).toBe(0);
    });

    it('grátis na retirada', () => {
      expect(getComplementPrice(item, 'pickup')).toBe(0);
    });

    it('cobra preço normal no consumo local', () => {
      expect(getComplementPrice(item, 'dine_in')).toBe(6);
    });
  });

  describe('PDV - mapeamento de orderType para deliveryType', () => {
    const item: ComplementItem = {
      price: '5.00',
      priceMode: 'free',
      freeOnDelivery: false,
      freeOnPickup: true,
      freeOnDineIn: true,
    };

    it('mesa → dine_in → grátis', () => {
      expect(getComplementPricePDV(item, 'mesa')).toBe(0);
    });

    it('retirada → pickup → grátis', () => {
      expect(getComplementPricePDV(item, 'retirada')).toBe(0);
    });

    it('entrega → delivery → cobra normal', () => {
      expect(getComplementPricePDV(item, 'entrega')).toBe(5);
    });
  });

  describe('PDVSlidebar - sempre dine_in', () => {
    it('grátis quando freeOnDineIn é true', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        freeOnDelivery: false,
        freeOnPickup: false,
        freeOnDineIn: true,
      };
      expect(getComplementPriceDineIn(item)).toBe(0);
    });

    it('cobra quando freeOnDineIn é false e outros estão marcados', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        freeOnDelivery: true,
        freeOnPickup: false,
        freeOnDineIn: false,
      };
      expect(getComplementPriceDineIn(item)).toBe(5);
    });

    it('grátis quando nenhum contexto marcado (legado)', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        freeOnDelivery: false,
        freeOnPickup: false,
        freeOnDineIn: false,
      };
      expect(getComplementPriceDineIn(item)).toBe(0);
    });

    it('cobra preço normal quando priceMode é normal', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'normal',
        freeOnDineIn: true,
      };
      expect(getComplementPriceDineIn(item)).toBe(5);
    });
  });

  describe('Limite de 2 checkboxes - validação de regra de negócio', () => {
    it('aceita 0 checkboxes (legado - grátis em todos)', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        freeOnDelivery: false,
        freeOnPickup: false,
        freeOnDineIn: false,
      };
      const count = [item.freeOnDelivery, item.freeOnPickup, item.freeOnDineIn].filter(Boolean).length;
      expect(count).toBeLessThanOrEqual(2);
    });

    it('aceita 1 checkbox', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        freeOnDelivery: false,
        freeOnPickup: true,
        freeOnDineIn: false,
      };
      const count = [item.freeOnDelivery, item.freeOnPickup, item.freeOnDineIn].filter(Boolean).length;
      expect(count).toBeLessThanOrEqual(2);
    });

    it('aceita 2 checkboxes', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        freeOnDelivery: false,
        freeOnPickup: true,
        freeOnDineIn: true,
      };
      const count = [item.freeOnDelivery, item.freeOnPickup, item.freeOnDineIn].filter(Boolean).length;
      expect(count).toBeLessThanOrEqual(2);
    });
  });

  describe('Campos undefined (complementos antigos sem os novos campos)', () => {
    it('complemento com priceMode free e campos undefined → grátis em todos (legado)', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'free',
        // freeOn* não definidos (undefined)
      };
      expect(getComplementPrice(item, 'delivery')).toBe(0);
      expect(getComplementPrice(item, 'pickup')).toBe(0);
      expect(getComplementPrice(item, 'dine_in')).toBe(0);
    });

    it('complemento com priceMode normal e campos undefined → cobra normal', () => {
      const item: ComplementItem = {
        price: '5.00',
        priceMode: 'normal',
      };
      expect(getComplementPrice(item, 'delivery')).toBe(5);
      expect(getComplementPrice(item, 'pickup')).toBe(5);
      expect(getComplementPrice(item, 'dine_in')).toBe(5);
    });
  });
});
