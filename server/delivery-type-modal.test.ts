import { describe, expect, it } from "vitest";

/**
 * Testes para a lógica do modal de seleção obrigatória de tipo de entrega
 * e a função getComplementPrice que calcula preços baseados no contexto.
 */

// Reproduzir a função getComplementPrice do PublicMenu.tsx
function getComplementPrice(
  item: { price: string | number; priceMode?: string; freeOnDelivery?: boolean; freeOnPickup?: boolean; freeOnDineIn?: boolean },
  deliveryType: 'delivery' | 'pickup' | 'dine_in'
): number {
  if (item.priceMode === 'free') {
    if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
    if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
    if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
}

// Lógica de determinar se o modal deve ser mostrado
function shouldShowDeliveryTypeModal(
  deliveryTypeChosen: boolean,
  establishment: { allowsDelivery: boolean; allowsPickup: boolean; allowsDineIn: boolean } | null
): boolean {
  if (deliveryTypeChosen) return false;
  if (!establishment) return false;
  const options = [establishment.allowsDelivery, establishment.allowsPickup, establishment.allowsDineIn].filter(Boolean).length;
  return options > 1;
}

// Lógica de auto-seleção quando só há 1 opção
function getAutoSelectedDeliveryType(
  establishment: { allowsDelivery: boolean; allowsPickup: boolean; allowsDineIn: boolean }
): { type: 'delivery' | 'pickup' | 'dine_in'; autoChosen: boolean } {
  const options = [establishment.allowsDelivery, establishment.allowsPickup, establishment.allowsDineIn].filter(Boolean).length;
  
  let type: 'delivery' | 'pickup' | 'dine_in' = 'pickup';
  if (establishment.allowsDelivery) type = 'delivery';
  else if (establishment.allowsPickup) type = 'pickup';
  else if (establishment.allowsDineIn) type = 'dine_in';
  
  return { type, autoChosen: options <= 1 };
}

describe("getComplementPrice", () => {
  it("retorna preço normal quando priceMode não é 'free'", () => {
    const item = { price: "5.00", priceMode: "normal" };
    expect(getComplementPrice(item, "delivery")).toBe(5);
    expect(getComplementPrice(item, "pickup")).toBe(5);
    expect(getComplementPrice(item, "dine_in")).toBe(5);
  });

  it("retorna 0 quando priceMode é 'free' e nenhum contexto específico", () => {
    const item = { price: "5.00", priceMode: "free" };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(0);
  });

  it("retorna 0 apenas no contexto delivery quando freeOnDelivery=true", () => {
    const item = { price: "5.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: false, freeOnDineIn: false };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(5);
    expect(getComplementPrice(item, "dine_in")).toBe(5);
  });

  it("retorna 0 apenas no contexto pickup quando freeOnPickup=true", () => {
    const item = { price: "3.50", priceMode: "free", freeOnDelivery: false, freeOnPickup: true, freeOnDineIn: false };
    expect(getComplementPrice(item, "delivery")).toBe(3.5);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(3.5);
  });

  it("retorna 0 apenas no contexto dine_in quando freeOnDineIn=true", () => {
    const item = { price: "2.00", priceMode: "free", freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: true };
    expect(getComplementPrice(item, "delivery")).toBe(2);
    expect(getComplementPrice(item, "pickup")).toBe(2);
    expect(getComplementPrice(item, "dine_in")).toBe(0);
  });

  it("retorna 0 em delivery e pickup quando ambos são grátis", () => {
    const item = { price: "4.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: true, freeOnDineIn: false };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(4);
  });

  it("retorna 0 em todos os contextos quando todos são grátis", () => {
    const item = { price: "6.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: true, freeOnDineIn: true };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(0);
  });

  it("lida com preço como número em vez de string", () => {
    const item = { price: 7.5, priceMode: "free", freeOnDelivery: true };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(7.5);
  });
});

describe("shouldShowDeliveryTypeModal", () => {
  it("não mostra modal quando deliveryTypeChosen é true", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: true };
    expect(shouldShowDeliveryTypeModal(true, est)).toBe(false);
  });

  it("não mostra modal quando establishment é null", () => {
    expect(shouldShowDeliveryTypeModal(false, null)).toBe(false);
  });

  it("não mostra modal quando só há 1 opção de entrega (delivery)", () => {
    const est = { allowsDelivery: true, allowsPickup: false, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(false);
  });

  it("não mostra modal quando só há 1 opção de entrega (pickup)", () => {
    const est = { allowsDelivery: false, allowsPickup: true, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(false);
  });

  it("mostra modal quando há 2 opções de entrega", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(true);
  });

  it("mostra modal quando há 3 opções de entrega", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: true };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(true);
  });

  it("não mostra modal quando nenhuma opção está habilitada", () => {
    const est = { allowsDelivery: false, allowsPickup: false, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(false);
  });
});

describe("getAutoSelectedDeliveryType", () => {
  it("auto-seleciona delivery quando é a única opção", () => {
    const est = { allowsDelivery: true, allowsPickup: false, allowsDineIn: false };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("delivery");
    expect(result.autoChosen).toBe(true);
  });

  it("auto-seleciona pickup quando é a única opção", () => {
    const est = { allowsDelivery: false, allowsPickup: true, allowsDineIn: false };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("pickup");
    expect(result.autoChosen).toBe(true);
  });

  it("auto-seleciona dine_in quando é a única opção", () => {
    const est = { allowsDelivery: false, allowsPickup: false, allowsDineIn: true };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("dine_in");
    expect(result.autoChosen).toBe(true);
  });

  it("prioriza delivery quando há múltiplas opções e não auto-seleciona", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: true };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("delivery");
    expect(result.autoChosen).toBe(false);
  });

  it("seleciona pickup quando delivery não disponível e há múltiplas opções", () => {
    const est = { allowsDelivery: false, allowsPickup: true, allowsDineIn: true };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("pickup");
    expect(result.autoChosen).toBe(false);
  });

  it("auto-seleciona quando nenhuma opção disponível (edge case)", () => {
    const est = { allowsDelivery: false, allowsPickup: false, allowsDineIn: false };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.autoChosen).toBe(true);
  });
});

// ============================================================
// Testes para a lógica de detecção de mudança de preço ao trocar tipo de entrega
// ============================================================

type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
};

type ComplementInfo = {
  id: number;
  name: string;
  price: string;
  priceMode: string;
  freeOnDelivery: boolean;
  freeOnPickup: boolean;
  freeOnDineIn: boolean;
};

// Reproduzir a lógica de detectPriceChanges do handleDeliveryTypeChange
function detectPriceChanges(
  cart: CartItem[],
  complementsInfo: ComplementInfo[],
  oldType: 'delivery' | 'pickup' | 'dine_in',
  newType: 'delivery' | 'pickup' | 'dine_in'
): Array<{ name: string; oldPrice: number; newPrice: number }> {
  const changes: Array<{ name: string; oldPrice: number; newPrice: number }> = [];
  
  cart.forEach(item => {
    item.complements.forEach(cartComplement => {
      const fullInfo = complementsInfo.find(ci => ci.id === cartComplement.id);
      if (fullInfo) {
        const oldPrice = getComplementPrice(fullInfo, oldType);
        const newPrice = getComplementPrice(fullInfo, newType);
        if (oldPrice !== newPrice) {
          if (!changes.find(c => c.name === fullInfo.name && c.oldPrice === oldPrice && c.newPrice === newPrice)) {
            changes.push({ name: fullInfo.name, oldPrice, newPrice });
          }
        }
      }
    });
  });
  
  return changes;
}

// Reproduzir a lógica de atualização de preços no carrinho
function updateCartPrices(
  cart: CartItem[],
  complementsInfo: ComplementInfo[],
  newType: 'delivery' | 'pickup' | 'dine_in'
): CartItem[] {
  return cart.map(item => ({
    ...item,
    complements: item.complements.map(c => {
      const fullInfo = complementsInfo.find(ci => ci.id === c.id);
      if (fullInfo) {
        const newPrice = getComplementPrice(fullInfo, newType);
        return { ...c, price: String(newPrice) };
      }
      return c;
    }),
  }));
}

describe("detectPriceChanges - Detecção de mudança de preço ao trocar tipo de entrega", () => {
  const complementsInfo: ComplementInfo[] = [
    { id: 1, name: "Queijo extra", price: "3.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: false, freeOnDineIn: false },
    { id: 2, name: "Bacon", price: "5.00", priceMode: "normal", freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: false },
    { id: 3, name: "Molho especial", price: "2.50", priceMode: "free", freeOnDelivery: true, freeOnPickup: true, freeOnDineIn: false },
    { id: 4, name: "Refrigerante", price: "6.00", priceMode: "free", freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: false },
  ];

  const baseCart: CartItem[] = [
    {
      productId: 100,
      name: "Hamburguer",
      price: "25.00",
      quantity: 1,
      observation: "",
      image: null,
      complements: [
        { id: 1, name: "Queijo extra", price: "0", quantity: 1 },
        { id: 2, name: "Bacon", price: "5.00", quantity: 1 },
      ],
    },
  ];

  it("detecta mudança quando complemento grátis no delivery passa a cobrar na retirada", () => {
    const changes = detectPriceChanges(baseCart, complementsInfo, 'delivery', 'pickup');
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ name: "Queijo extra", oldPrice: 0, newPrice: 3 });
  });

  it("detecta mudança quando complemento cobrado na retirada fica grátis no delivery", () => {
    const pickupCart: CartItem[] = [{
      ...baseCart[0],
      complements: [
        { id: 1, name: "Queijo extra", price: "3.00", quantity: 1 },
      ],
    }];
    const changes = detectPriceChanges(pickupCart, complementsInfo, 'pickup', 'delivery');
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ name: "Queijo extra", oldPrice: 3, newPrice: 0 });
  });

  it("não detecta mudança para complementos com priceMode normal", () => {
    const cartWithNormal: CartItem[] = [{
      ...baseCart[0],
      complements: [
        { id: 2, name: "Bacon", price: "5.00", quantity: 1 },
      ],
    }];
    const changes = detectPriceChanges(cartWithNormal, complementsInfo, 'delivery', 'pickup');
    expect(changes).toHaveLength(0);
  });

  it("não detecta mudança para complementos grátis em todos os contextos", () => {
    const cartWithGlobal: CartItem[] = [{
      ...baseCart[0],
      complements: [
        { id: 4, name: "Refrigerante", price: "0", quantity: 1 },
      ],
    }];
    const changes = detectPriceChanges(cartWithGlobal, complementsInfo, 'delivery', 'pickup');
    expect(changes).toHaveLength(0);
  });

  it("não detecta mudança quando tipo de entrega é o mesmo", () => {
    const changes = detectPriceChanges(baseCart, complementsInfo, 'delivery', 'delivery');
    expect(changes).toHaveLength(0);
  });

  it("detecta múltiplas mudanças de preço", () => {
    const cartMultiple: CartItem[] = [{
      ...baseCart[0],
      complements: [
        { id: 1, name: "Queijo extra", price: "0", quantity: 1 },
        { id: 3, name: "Molho especial", price: "0", quantity: 1 },
      ],
    }];
    const changes = detectPriceChanges(cartMultiple, complementsInfo, 'delivery', 'dine_in');
    // Queijo extra: delivery=0, dine_in=3 (muda)
    // Molho especial: delivery=0, dine_in=2.5 (muda)
    expect(changes).toHaveLength(2);
    expect(changes[0]).toEqual({ name: "Queijo extra", oldPrice: 0, newPrice: 3 });
    expect(changes[1]).toEqual({ name: "Molho especial", oldPrice: 0, newPrice: 2.5 });
  });

  it("não duplica mudanças quando o mesmo complemento está em múltiplos itens do carrinho", () => {
    const cartDuplicate: CartItem[] = [
      {
        productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
        complements: [{ id: 1, name: "Queijo extra", price: "0", quantity: 1 }],
      },
      {
        productId: 101, name: "Hot Dog", price: "15.00", quantity: 1, observation: "", image: null,
        complements: [{ id: 1, name: "Queijo extra", price: "0", quantity: 1 }],
      },
    ];
    const changes = detectPriceChanges(cartDuplicate, complementsInfo, 'delivery', 'pickup');
    expect(changes).toHaveLength(1); // Apenas 1 entrada, não duplicada
  });

  it("retorna array vazio quando carrinho está vazio", () => {
    const changes = detectPriceChanges([], complementsInfo, 'delivery', 'pickup');
    expect(changes).toHaveLength(0);
  });

  it("retorna array vazio quando não há info de complementos", () => {
    const changes = detectPriceChanges(baseCart, [], 'delivery', 'pickup');
    expect(changes).toHaveLength(0);
  });

  it("retorna array vazio quando carrinho não tem complementos", () => {
    const cartNoComplements: CartItem[] = [{
      productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
      complements: [],
    }];
    const changes = detectPriceChanges(cartNoComplements, complementsInfo, 'delivery', 'pickup');
    expect(changes).toHaveLength(0);
  });
});

describe("updateCartPrices - Atualização de preços no carrinho", () => {
  const complementsInfo: ComplementInfo[] = [
    { id: 1, name: "Queijo extra", price: "3.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: false, freeOnDineIn: false },
    { id: 2, name: "Bacon", price: "5.00", priceMode: "normal", freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: false },
  ];

  it("atualiza preço do complemento grátis no delivery para cobrado na retirada", () => {
    const cart: CartItem[] = [{
      productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
      complements: [
        { id: 1, name: "Queijo extra", price: "0", quantity: 1 },
        { id: 2, name: "Bacon", price: "5.00", quantity: 1 },
      ],
    }];
    const updated = updateCartPrices(cart, complementsInfo, 'pickup');
    expect(updated[0].complements[0].price).toBe("3"); // Queijo extra agora cobra
    expect(updated[0].complements[1].price).toBe("5"); // Bacon não muda
  });

  it("atualiza preço do complemento cobrado na retirada para grátis no delivery", () => {
    const cart: CartItem[] = [{
      productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
      complements: [
        { id: 1, name: "Queijo extra", price: "3.00", quantity: 1 },
      ],
    }];
    const updated = updateCartPrices(cart, complementsInfo, 'delivery');
    expect(updated[0].complements[0].price).toBe("0"); // Queijo extra agora grátis
  });

  it("não modifica carrinho original (imutabilidade)", () => {
    const cart: CartItem[] = [{
      productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
      complements: [
        { id: 1, name: "Queijo extra", price: "0", quantity: 1 },
      ],
    }];
    const updated = updateCartPrices(cart, complementsInfo, 'pickup');
    expect(cart[0].complements[0].price).toBe("0"); // Original não mudou
    expect(updated[0].complements[0].price).toBe("3"); // Novo está atualizado
  });

  it("mantém complementos sem info na lista inalterados", () => {
    const cart: CartItem[] = [{
      productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
      complements: [
        { id: 999, name: "Desconhecido", price: "10.00", quantity: 1 },
      ],
    }];
    const updated = updateCartPrices(cart, complementsInfo, 'pickup');
    expect(updated[0].complements[0].price).toBe("10.00"); // Não mudou
  });

  it("atualiza múltiplos itens do carrinho corretamente", () => {
    const cart: CartItem[] = [
      {
        productId: 100, name: "Hamburguer", price: "25.00", quantity: 1, observation: "", image: null,
        complements: [{ id: 1, name: "Queijo extra", price: "0", quantity: 1 }],
      },
      {
        productId: 101, name: "Hot Dog", price: "15.00", quantity: 2, observation: "", image: null,
        complements: [{ id: 1, name: "Queijo extra", price: "0", quantity: 2 }],
      },
    ];
    const updated = updateCartPrices(cart, complementsInfo, 'pickup');
    expect(updated[0].complements[0].price).toBe("3");
    expect(updated[1].complements[0].price).toBe("3");
  });
});
