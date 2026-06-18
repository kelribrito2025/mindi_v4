import { describe, it, expect } from "vitest";

/**
 * Testes para os novos tipos de Story (simple, product, promo)
 * Valida a lógica de criação, validação e filtragem de stories por tipo.
 */

// Simular a lógica de validação do servidor
function validateStoryInput(input: {
  type: "simple" | "product" | "promo";
  productId?: number;
  promoTitle?: string;
  promoText?: string;
  promoPrice?: string;
  promoExpiresAt?: Date;
  actionLabel?: string;
}): { valid: boolean; error?: string } {
  if (input.type === "product" && !input.productId) {
    return { valid: false, error: "Selecione um produto para o story do tipo 'Destacar produto'." };
  }
  if (input.type === "promo" && !input.promoTitle) {
    return { valid: false, error: "Informe o título da promoção." };
  }
  return { valid: true };
}

// Simular a lógica de filtragem de promos expiradas
function filterActiveStories(stories: Array<{
  id: number;
  type: "simple" | "product" | "promo";
  expiresAt: Date;
  promoExpiresAt?: Date | null;
}>): Array<{ id: number; type: string }> {
  const now = new Date();
  return stories
    .filter(s => s.expiresAt.getTime() > now.getTime())
    .filter(s => {
      if (s.type === "promo" && s.promoExpiresAt) {
        return s.promoExpiresAt.getTime() > now.getTime();
      }
      return true;
    });
}

// Simular a lógica de determinar se um story tem ação
function storyHasAction(story: {
  type: "simple" | "product" | "promo";
  productId?: number | null;
}): boolean {
  return (story.type === "product" || story.type === "promo") && !!story.productId;
}

// Simular a lógica de label do botão
function getActionLabel(story: {
  type: "simple" | "product" | "promo";
  actionLabel?: string | null;
}): string {
  if (story.actionLabel) return story.actionLabel;
  return story.type === "product" ? "Ver produto" : "Pedir agora";
}

// Simular a lógica de countdown de promoção
function promoTimeRemaining(expiresAt: Date): string | null {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Expirada";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Termina em ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Termina em ${diffH}h`;
  return `Válida até ${expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

describe("Story Types - Validação de Input", () => {
  it("deve aceitar story do tipo simple sem campos extras", () => {
    const result = validateStoryInput({ type: "simple" });
    expect(result.valid).toBe(true);
  });

  it("deve rejeitar story do tipo product sem productId", () => {
    const result = validateStoryInput({ type: "product" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("produto");
  });

  it("deve aceitar story do tipo product com productId", () => {
    const result = validateStoryInput({ type: "product", productId: 42 });
    expect(result.valid).toBe(true);
  });

  it("deve rejeitar story do tipo promo sem promoTitle", () => {
    const result = validateStoryInput({ type: "promo" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("título");
  });

  it("deve aceitar story do tipo promo com promoTitle", () => {
    const result = validateStoryInput({
      type: "promo",
      promoTitle: "Promoção do dia",
      promoText: "Pizza grande + refri",
      promoPrice: "R$ 59,90",
    });
    expect(result.valid).toBe(true);
  });

  it("deve aceitar story do tipo promo com validade", () => {
    const result = validateStoryInput({
      type: "promo",
      promoTitle: "Flash Sale",
      promoExpiresAt: new Date(Date.now() + 3600000),
    });
    expect(result.valid).toBe(true);
  });
});

describe("Story Types - Filtragem de Stories Ativos", () => {
  it("deve filtrar stories com expiresAt no passado", () => {
    const stories = [
      { id: 1, type: "simple" as const, expiresAt: new Date(Date.now() + 3600000) },
      { id: 2, type: "simple" as const, expiresAt: new Date(Date.now() - 3600000) },
    ];
    const active = filterActiveStories(stories);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(1);
  });

  it("deve filtrar promos com promoExpiresAt no passado", () => {
    const stories = [
      {
        id: 1,
        type: "promo" as const,
        expiresAt: new Date(Date.now() + 86400000), // story ainda ativo
        promoExpiresAt: new Date(Date.now() - 3600000), // promo expirada
      },
      {
        id: 2,
        type: "promo" as const,
        expiresAt: new Date(Date.now() + 86400000),
        promoExpiresAt: new Date(Date.now() + 3600000), // promo ativa
      },
    ];
    const active = filterActiveStories(stories);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(2);
  });

  it("deve manter promos sem promoExpiresAt (sem limite)", () => {
    const stories = [
      {
        id: 1,
        type: "promo" as const,
        expiresAt: new Date(Date.now() + 86400000),
        promoExpiresAt: null,
      },
    ];
    const active = filterActiveStories(stories);
    expect(active).toHaveLength(1);
  });

  it("deve manter stories simple e product sem verificar promoExpiresAt", () => {
    const stories = [
      { id: 1, type: "simple" as const, expiresAt: new Date(Date.now() + 86400000) },
      { id: 2, type: "product" as const, expiresAt: new Date(Date.now() + 86400000) },
    ];
    const active = filterActiveStories(stories);
    expect(active).toHaveLength(2);
  });
});

describe("Story Types - Botão de Ação", () => {
  it("story simple não deve ter ação", () => {
    expect(storyHasAction({ type: "simple" })).toBe(false);
  });

  it("story product com productId deve ter ação", () => {
    expect(storyHasAction({ type: "product", productId: 42 })).toBe(true);
  });

  it("story product sem productId não deve ter ação", () => {
    expect(storyHasAction({ type: "product", productId: null })).toBe(false);
  });

  it("story promo com productId deve ter ação", () => {
    expect(storyHasAction({ type: "promo", productId: 10 })).toBe(true);
  });

  it("story promo sem productId não deve ter ação (apenas exibe promo)", () => {
    expect(storyHasAction({ type: "promo", productId: null })).toBe(false);
  });
});

describe("Story Types - Label do Botão", () => {
  it("deve usar label customizado quando fornecido", () => {
    expect(getActionLabel({ type: "product", actionLabel: "Comprar" })).toBe("Comprar");
  });

  it("deve usar 'Ver produto' como default para tipo product", () => {
    expect(getActionLabel({ type: "product" })).toBe("Ver produto");
  });

  it("deve usar 'Pedir agora' como default para tipo promo", () => {
    expect(getActionLabel({ type: "promo" })).toBe("Pedir agora");
  });

  it("deve usar label null como default", () => {
    expect(getActionLabel({ type: "product", actionLabel: null })).toBe("Ver produto");
  });
});

describe("Story Types - Countdown de Promoção", () => {
  it("deve retornar 'Expirada' para promos no passado", () => {
    const past = new Date(Date.now() - 60000);
    expect(promoTimeRemaining(past)).toBe("Expirada");
  });

  it("deve retornar minutos para promos próximas de expirar", () => {
    const soon = new Date(Date.now() + 30 * 60000); // 30 min
    const result = promoTimeRemaining(soon);
    expect(result).toMatch(/Termina em \d+min/);
  });

  it("deve retornar horas para promos com algumas horas restantes", () => {
    const hours = new Date(Date.now() + 3 * 3600000); // 3 horas
    const result = promoTimeRemaining(hours);
    expect(result).toMatch(/Termina em \d+h/);
  });

  it("deve retornar data para promos com mais de 24h", () => {
    const days = new Date(Date.now() + 48 * 3600000); // 2 dias
    const result = promoTimeRemaining(days);
    expect(result).toMatch(/Válida até/);
  });
});
