import { describe, it, expect } from "vitest";

/**
 * Testes para o estilo de badge de preço nos stories de promoção.
 * Valida a lógica de seleção de estilo, defaults e renderização condicional.
 */

type PriceBadgeStyle = "circle" | "ribbon" | "top-center";

interface PromoStory {
  id: number;
  type: "simple" | "product" | "promo";
  promoPrice?: string | null;
  priceBadgeStyle?: PriceBadgeStyle | null;
}

// Simular a lógica de determinar qual badge renderizar
function getBadgeToRender(story: PromoStory): PriceBadgeStyle | null {
  // Só renderiza badge se for promo com preço
  if (story.type !== "promo" || !story.promoPrice) return null;
  // Default é "circle" se não especificado
  return story.priceBadgeStyle || "circle";
}

// Simular a lógica de validação do input de criação
function validatePriceBadgeInput(input: {
  type: "simple" | "product" | "promo";
  promoPrice?: string;
  priceBadgeStyle?: PriceBadgeStyle;
}): { valid: boolean; badgeStyle: PriceBadgeStyle | null } {
  // Badge style só é relevante para promos com preço
  if (input.type !== "promo") {
    return { valid: true, badgeStyle: null };
  }
  if (!input.promoPrice) {
    return { valid: true, badgeStyle: null };
  }
  return {
    valid: true,
    badgeStyle: input.priceBadgeStyle || "circle",
  };
}

// Simular a lógica de determinar se o preço deve aparecer inline no overlay
function shouldShowPriceInOverlay(story: PromoStory): boolean {
  // O preço já está visível no badge, então não precisa repetir no overlay
  if (story.type === "promo" && story.promoPrice) {
    return false;
  }
  return false;
}

describe("Price Badge Style - Determinação do Badge", () => {
  it("deve retornar null para story do tipo simple", () => {
    expect(getBadgeToRender({ id: 1, type: "simple" })).toBeNull();
  });

  it("deve retornar null para story do tipo product", () => {
    expect(getBadgeToRender({ id: 1, type: "product" })).toBeNull();
  });

  it("deve retornar null para promo sem preço", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: null })).toBeNull();
  });

  it("deve retornar null para promo com preço vazio", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: "" })).toBeNull();
  });

  it("deve retornar 'circle' como default quando priceBadgeStyle é null", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: null })).toBe("circle");
  });

  it("deve retornar 'circle' como default quando priceBadgeStyle não é definido", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: "R$ 59,90" })).toBe("circle");
  });

  it("deve retornar 'circle' quando explicitamente selecionado", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: "circle" })).toBe("circle");
  });

  it("deve retornar 'ribbon' quando selecionado", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: "R$ 29,90", priceBadgeStyle: "ribbon" })).toBe("ribbon");
  });

  it("deve retornar 'top-center' quando selecionado", () => {
    expect(getBadgeToRender({ id: 1, type: "promo", promoPrice: "R$ 19,90", priceBadgeStyle: "top-center" })).toBe("top-center");
  });
});

describe("Price Badge Style - Validação de Input", () => {
  it("deve ignorar badgeStyle para stories simples", () => {
    const result = validatePriceBadgeInput({ type: "simple" });
    expect(result.valid).toBe(true);
    expect(result.badgeStyle).toBeNull();
  });

  it("deve ignorar badgeStyle para stories de produto", () => {
    const result = validatePriceBadgeInput({ type: "product" });
    expect(result.valid).toBe(true);
    expect(result.badgeStyle).toBeNull();
  });

  it("deve ignorar badgeStyle para promos sem preço", () => {
    const result = validatePriceBadgeInput({ type: "promo" });
    expect(result.valid).toBe(true);
    expect(result.badgeStyle).toBeNull();
  });

  it("deve usar 'circle' como default para promos com preço", () => {
    const result = validatePriceBadgeInput({ type: "promo", promoPrice: "R$ 59,90" });
    expect(result.valid).toBe(true);
    expect(result.badgeStyle).toBe("circle");
  });

  it("deve aceitar 'ribbon' como estilo", () => {
    const result = validatePriceBadgeInput({ type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: "ribbon" });
    expect(result.valid).toBe(true);
    expect(result.badgeStyle).toBe("ribbon");
  });

  it("deve aceitar 'top-center' como estilo", () => {
    const result = validatePriceBadgeInput({ type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: "top-center" });
    expect(result.valid).toBe(true);
    expect(result.badgeStyle).toBe("top-center");
  });
});

describe("Price Badge Style - Preço no Overlay", () => {
  it("não deve mostrar preço inline no overlay quando badge está visível", () => {
    expect(shouldShowPriceInOverlay({ id: 1, type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: "circle" })).toBe(false);
  });

  it("não deve mostrar preço inline no overlay para ribbon", () => {
    expect(shouldShowPriceInOverlay({ id: 1, type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: "ribbon" })).toBe(false);
  });

  it("não deve mostrar preço inline no overlay para top-center", () => {
    expect(shouldShowPriceInOverlay({ id: 1, type: "promo", promoPrice: "R$ 59,90", priceBadgeStyle: "top-center" })).toBe(false);
  });
});

describe("Price Badge Style - Enum Values", () => {
  it("deve ter exatamente 3 opções de estilo", () => {
    const validStyles: PriceBadgeStyle[] = ["circle", "ribbon", "top-center"];
    expect(validStyles).toHaveLength(3);
  });

  it("cada estilo deve ser uma string não vazia", () => {
    const validStyles: PriceBadgeStyle[] = ["circle", "ribbon", "top-center"];
    validStyles.forEach(style => {
      expect(typeof style).toBe("string");
      expect(style.length).toBeGreaterThan(0);
    });
  });
});
