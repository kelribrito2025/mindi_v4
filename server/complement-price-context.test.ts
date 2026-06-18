import { describe, it, expect } from "vitest";

/**
 * Testa a lógica de cálculo de preço de complemento considerando
 * priceMode e gratuidade por tipo de entrega (freeOnDelivery/freeOnPickup/freeOnDineIn).
 * 
 * Esta função é usada no backend (publicMenu.ts e stripeConnect.ts) para validar
 * se o preço enviado pelo frontend é consistente com o banco de dados.
 */

// Replica exata da função getServerComplementPrice usada nos routers
function getServerComplementPrice(
  item: { price: string; priceMode: string; freeOnDelivery: boolean; freeOnPickup: boolean; freeOnDineIn: boolean },
  deliveryType: 'delivery' | 'pickup' | 'dine_in'
): number {
  if (item.priceMode === 'free') {
    if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
    if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
    if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return parseFloat(item.price);
  }
  if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
  if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
  if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
  return parseFloat(item.price);
}

// Helper para criar item de complemento com defaults
function makeComplement(overrides: Partial<{
  price: string;
  priceMode: string;
  freeOnDelivery: boolean;
  freeOnPickup: boolean;
  freeOnDineIn: boolean;
}> = {}) {
  return {
    price: "3.00",
    priceMode: "normal",
    freeOnDelivery: false,
    freeOnPickup: false,
    freeOnDineIn: false,
    ...overrides,
  };
}

describe("getServerComplementPrice", () => {
  describe("priceMode = 'normal' (preço padrão)", () => {
    it("deve retornar o preço base quando nenhuma flag de gratuidade está ativa", () => {
      const item = makeComplement({ price: "5.00" });
      expect(getServerComplementPrice(item, "delivery")).toBe(5.00);
      expect(getServerComplementPrice(item, "pickup")).toBe(5.00);
      expect(getServerComplementPrice(item, "dine_in")).toBe(5.00);
    });

    it("deve retornar 0 quando freeOnDelivery=true e deliveryType=delivery", () => {
      const item = makeComplement({ price: "3.00", freeOnDelivery: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(0);
    });

    it("deve retornar preço normal quando freeOnDelivery=true mas deliveryType=pickup", () => {
      const item = makeComplement({ price: "3.00", freeOnDelivery: true });
      expect(getServerComplementPrice(item, "pickup")).toBe(3.00);
    });

    it("deve retornar 0 quando freeOnPickup=true e deliveryType=pickup", () => {
      const item = makeComplement({ price: "2.50", freeOnPickup: true });
      expect(getServerComplementPrice(item, "pickup")).toBe(0);
    });

    it("deve retornar preço normal quando freeOnPickup=true mas deliveryType=delivery", () => {
      const item = makeComplement({ price: "2.50", freeOnPickup: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(2.50);
    });

    it("deve retornar 0 quando freeOnDineIn=true e deliveryType=dine_in", () => {
      const item = makeComplement({ price: "4.00", freeOnDineIn: true });
      expect(getServerComplementPrice(item, "dine_in")).toBe(0);
    });

    it("deve retornar preço normal quando freeOnDineIn=true mas deliveryType=delivery", () => {
      const item = makeComplement({ price: "4.00", freeOnDineIn: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(4.00);
    });

    it("deve retornar 0 quando múltiplas flags ativas e deliveryType corresponde", () => {
      const item = makeComplement({ price: "3.00", freeOnDelivery: true, freeOnPickup: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(0);
      expect(getServerComplementPrice(item, "pickup")).toBe(0);
      expect(getServerComplementPrice(item, "dine_in")).toBe(3.00);
    });
  });

  describe("priceMode = 'free' (grátis global)", () => {
    it("deve retornar 0 quando nenhum contexto específico marcado (grátis em todos)", () => {
      const item = makeComplement({ priceMode: "free", price: "5.00" });
      expect(getServerComplementPrice(item, "delivery")).toBe(0);
      expect(getServerComplementPrice(item, "pickup")).toBe(0);
      expect(getServerComplementPrice(item, "dine_in")).toBe(0);
    });

    it("deve retornar 0 quando freeOnDelivery=true e deliveryType=delivery", () => {
      const item = makeComplement({ priceMode: "free", price: "3.00", freeOnDelivery: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(0);
    });

    it("deve cobrar preço normal quando freeOnDelivery=true mas deliveryType=pickup", () => {
      const item = makeComplement({ priceMode: "free", price: "3.00", freeOnDelivery: true });
      expect(getServerComplementPrice(item, "pickup")).toBe(3.00);
    });

    it("deve retornar 0 quando freeOnPickup=true e deliveryType=pickup", () => {
      const item = makeComplement({ priceMode: "free", price: "3.00", freeOnPickup: true });
      expect(getServerComplementPrice(item, "pickup")).toBe(0);
    });

    it("deve cobrar preço normal quando freeOnPickup=true mas deliveryType=dine_in", () => {
      const item = makeComplement({ priceMode: "free", price: "3.00", freeOnPickup: true });
      expect(getServerComplementPrice(item, "dine_in")).toBe(3.00);
    });

    it("deve retornar 0 quando freeOnDineIn=true e deliveryType=dine_in", () => {
      const item = makeComplement({ priceMode: "free", price: "3.00", freeOnDineIn: true });
      expect(getServerComplementPrice(item, "dine_in")).toBe(0);
    });

    it("deve cobrar preço normal quando freeOnDineIn=true mas deliveryType=delivery", () => {
      const item = makeComplement({ priceMode: "free", price: "3.00", freeOnDineIn: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(3.00);
    });

    it("deve retornar 0 para todos quando todas as flags estão ativas", () => {
      const item = makeComplement({ priceMode: "free", price: "5.00", freeOnDelivery: true, freeOnPickup: true, freeOnDineIn: true });
      expect(getServerComplementPrice(item, "delivery")).toBe(0);
      expect(getServerComplementPrice(item, "pickup")).toBe(0);
      expect(getServerComplementPrice(item, "dine_in")).toBe(0);
    });
  });

  describe("Cenário real: Açaí 300ml com complemento grátis na retirada", () => {
    it("complemento 'Leite condensado' freeOnPickup=true: pickup deve ser 0, delivery deve cobrar", () => {
      const leiteCondensado = makeComplement({
        price: "2.00",
        priceMode: "normal",
        freeOnPickup: true,
      });

      // Cliente escolheu Retirada → complemento grátis
      expect(getServerComplementPrice(leiteCondensado, "pickup")).toBe(0);

      // Cliente escolheu Delivery → complemento cobrado
      expect(getServerComplementPrice(leiteCondensado, "delivery")).toBe(2.00);
    });

    it("complemento 'Granola' sem gratuidade: deve cobrar em todos os contextos", () => {
      const granola = makeComplement({
        price: "3.50",
        priceMode: "normal",
      });

      expect(getServerComplementPrice(granola, "delivery")).toBe(3.50);
      expect(getServerComplementPrice(granola, "pickup")).toBe(3.50);
      expect(getServerComplementPrice(granola, "dine_in")).toBe(3.50);
    });
  });

  describe("Simulação de validação de preço unitário (como no createOrder)", () => {
    it("deve validar corretamente quando complemento é grátis na retirada", () => {
      const productPrice = 15.00; // Açaí 300ml
      const complement = makeComplement({ price: "2.00", freeOnPickup: true });
      const deliveryType = "pickup" as const;

      // Frontend calcula: preço produto + complemento grátis = 15.00
      const frontendUnitPrice = productPrice + 0; // complemento grátis no pickup

      // Backend deve calcular igual
      const serverComplementPrice = getServerComplementPrice(complement, deliveryType);
      const serverUnitPrice = productPrice + serverComplementPrice;

      expect(serverUnitPrice).toBe(frontendUnitPrice);
      expect(Math.abs(frontendUnitPrice - serverUnitPrice)).toBeLessThanOrEqual(0.02);
    });

    it("deve rejeitar quando complemento é cobrado mas frontend enviou grátis (tentativa de fraude)", () => {
      const productPrice = 15.00;
      const complement = makeComplement({ price: "2.00" }); // SEM gratuidade
      const deliveryType = "pickup" as const;

      // Fraudador tenta enviar como grátis
      const fraudUnitPrice = productPrice + 0;

      // Backend calcula corretamente: deve cobrar
      const serverComplementPrice = getServerComplementPrice(complement, deliveryType);
      const serverUnitPrice = productPrice + serverComplementPrice;

      expect(serverUnitPrice).toBe(17.00);
      expect(Math.abs(fraudUnitPrice - serverUnitPrice)).toBeGreaterThan(0.02);
    });
  });
});
