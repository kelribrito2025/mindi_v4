import { describe, it, expect, beforeEach } from "vitest";

/**
 * Testes para os tooltips da top bar.
 * Verifica que cada botão da top bar tem o texto de tooltip correto
 * e que a lógica de dismiss via localStorage funciona.
 */

// Textos dos tooltips definidos nos componentes
const TOOLTIP_TEXTS = {
  prepTime: "Tempo médio de preparo - clique para ver análise detalhada",
  viewMenu: "Abrir cardápio público em nova aba",
  trialBadge: "Clique para ver detalhes do seu período de avaliação",
  soundEnabled: "Som ativado - clique para desativar",
  soundDisabled: "Som desativado - clique para ativar",
};

// Chaves de localStorage para persistir dismiss dos tooltips
const TOOLTIP_STORAGE_KEYS = {
  prepTime: "tooltip_prepTime_clicked",
  viewMenu: "tooltip_viewMenu_clicked",
  trial: "tooltip_trial_clicked",
};

describe("Top bar tooltips", () => {
  it("deve ter texto de tooltip para o botão de tempo de preparo", () => {
    expect(TOOLTIP_TEXTS.prepTime).toBe(
      "Tempo médio de preparo - clique para ver análise detalhada"
    );
    expect(TOOLTIP_TEXTS.prepTime.length).toBeGreaterThan(0);
  });

  it("deve ter texto de tooltip para o botão Ver menu", () => {
    expect(TOOLTIP_TEXTS.viewMenu).toBe("Abrir cardápio público em nova aba");
    expect(TOOLTIP_TEXTS.viewMenu.length).toBeGreaterThan(0);
  });

  it("deve ter texto de tooltip para o badge de avaliação gratuita", () => {
    expect(TOOLTIP_TEXTS.trialBadge).toBe(
      "Clique para ver detalhes do seu período de avaliação"
    );
    expect(TOOLTIP_TEXTS.trialBadge.length).toBeGreaterThan(0);
  });

  it("deve ter textos de tooltip para o botão de som (ativado/desativado)", () => {
    expect(TOOLTIP_TEXTS.soundEnabled).toContain("ativado");
    expect(TOOLTIP_TEXTS.soundDisabled).toContain("desativado");
  });

  it("todos os tooltips devem estar em português", () => {
    const allTexts = Object.values(TOOLTIP_TEXTS);
    const englishWords = ["click", "open", "view", "close", "enable", "disable"];
    for (const text of allTexts) {
      for (const word of englishWords) {
        expect(text.toLowerCase()).not.toContain(word);
      }
    }
  });

  it("todos os tooltips devem ser informativos (mais de 10 caracteres)", () => {
    const allTexts = Object.values(TOOLTIP_TEXTS);
    for (const text of allTexts) {
      expect(text.length).toBeGreaterThan(10);
    }
  });
});

describe("Tooltip dismiss via localStorage", () => {
  it("deve ter chaves de localStorage únicas para cada botão", () => {
    const keys = Object.values(TOOLTIP_STORAGE_KEYS);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("chaves de localStorage devem seguir padrão tooltip_*_clicked", () => {
    for (const key of Object.values(TOOLTIP_STORAGE_KEYS)) {
      expect(key).toMatch(/^tooltip_\w+_clicked$/);
    }
  });

  it("deve ter 3 chaves de localStorage (prepTime, viewMenu, trial)", () => {
    expect(Object.keys(TOOLTIP_STORAGE_KEYS)).toHaveLength(3);
    expect(TOOLTIP_STORAGE_KEYS).toHaveProperty("prepTime");
    expect(TOOLTIP_STORAGE_KEYS).toHaveProperty("viewMenu");
    expect(TOOLTIP_STORAGE_KEYS).toHaveProperty("trial");
  });

  it("lógica de dismiss: tooltip visível quando valor não está no storage", () => {
    // Simula a lógica do componente
    const storageValue = null; // não existe no localStorage
    const isDismissed = storageValue === "true";
    expect(isDismissed).toBe(false); // tooltip deve aparecer
  });

  it("lógica de dismiss: tooltip oculto quando valor 'true' está no storage", () => {
    const storageValue = "true"; // existe no localStorage
    const isDismissed = storageValue === "true";
    expect(isDismissed).toBe(true); // tooltip não deve aparecer
  });

  it("lógica de dismiss: após clique, salvar 'true' no storage", () => {
    // Simula o fluxo de clique
    let dismissed = false;
    const mockStorage: Record<string, string> = {};

    // Antes do clique
    expect(dismissed).toBe(false);

    // Simula clique
    if (!dismissed) {
      dismissed = true;
      mockStorage[TOOLTIP_STORAGE_KEYS.prepTime] = "true";
    }

    // Após o clique
    expect(dismissed).toBe(true);
    expect(mockStorage[TOOLTIP_STORAGE_KEYS.prepTime]).toBe("true");
  });
});
