import { describe, expect, it } from "vitest";

/**
 * Testes unitários para os templates de SMS sugeridos.
 * Validam que todos os templates respeitam o limite de caracteres,
 * possuem os campos obrigatórios e NÃO contêm emojis.
 */

const SMS_CHAR_LIMIT = 152;

const SMS_TEMPLATES = [
  {
    emoji: "VIP",
    title: "Cliente VIP",
    text: "Voce e cliente VIP! Preparamos um desconto especial so pra voce. Use o cupom VIP15 no seu proximo pedido.",
  },
  {
    emoji: "OFF",
    title: "Oferta Ativa",
    text: "So passando pra avisar! Tem uma oferta ativa por tempo limitado no nosso cardapio. Corre aproveitar!",
  },
  {
    emoji: "#10",
    title: "Sentimos sua falta",
    text: "Sentimos sua falta! Volte a pedir hoje e ganhe R$10 OFF no seu proximo pedido. Cupom: VOLTA10. Valido por 48h. Aproveite!",
  },
  {
    emoji: "OLA",
    title: "Reativação",
    text: "Oi! Ja faz um tempo que voce nao pede com a gente. Que tal matar a saudade hoje? Tem novidade no cardapio esperando por voce!",
  },
  {
    emoji: "GO",
    title: "Delivery",
    text: "Dia perfeito pra pedir em casa! Delivery rapido e quentinho esperando por voce. Faca seu pedido agora!",
  },
  {
    emoji: "NEW",
    title: "Novidade no Cardápio",
    text: "Novidade no cardapio! Acabamos de lancar um item novo. Vem experimentar hoje e conta pra gente o que achou!",
  },
  {
    emoji: "HH",
    title: "Happy Hour",
    text: "Happy Hour liberado! Pedidos com desconto ate as 19h. Aproveite enquanto e tempo!",
  },
];

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

describe("SMS Templates", () => {
  it("deve ter exatamente 7 templates", () => {
    expect(SMS_TEMPLATES).toHaveLength(7);
  });

  it("cada template deve ter emoji (badge), título e texto", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.emoji).toBeTruthy();
      expect(template.title).toBeTruthy();
      expect(template.text).toBeTruthy();
    });
  });

  it("cada template deve respeitar o limite de caracteres do SMS", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.text.length).toBeLessThanOrEqual(SMS_CHAR_LIMIT);
    });
  });

  it("nenhum template deve ter texto vazio", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.text.trim().length).toBeGreaterThan(0);
    });
  });

  it("cada template deve ter um título único", () => {
    const titles = SMS_TEMPLATES.map((t) => t.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it("nenhum template deve conter emojis no texto", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(EMOJI_REGEX.test(template.text)).toBe(false);
      // Reset lastIndex pois regex é global
      EMOJI_REGEX.lastIndex = 0;
    });
  });

  it("nenhum template deve conter quebras de linha no texto", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.text).not.toContain("\n");
    });
  });

  it("template 'Cliente VIP' deve conter cupom VIP15", () => {
    const vipTemplate = SMS_TEMPLATES.find((t) => t.title === "Cliente VIP");
    expect(vipTemplate).toBeDefined();
    expect(vipTemplate!.text).toContain("VIP15");
  });

  it("template 'Sentimos sua falta' deve conter cupom VOLTA10", () => {
    const faltaTemplate = SMS_TEMPLATES.find((t) => t.title === "Sentimos sua falta");
    expect(faltaTemplate).toBeDefined();
    expect(faltaTemplate!.text).toContain("VOLTA10");
  });

  it("template 'Happy Hour' deve mencionar horário", () => {
    const hhTemplate = SMS_TEMPLATES.find((t) => t.title === "Happy Hour");
    expect(hhTemplate).toBeDefined();
    expect(hhTemplate!.text).toContain("19h");
  });

  it("função de limpeza de emojis deve remover emojis corretamente", () => {
    const emojiRegex = new RegExp('[\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{FE00}-\\u{FE0F}\\u{1F900}-\\u{1F9FF}\\u{1FA00}-\\u{1FA6F}\\u{1FA70}-\\u{1FAFF}\\u{200D}\\u{20E3}\\u{E0020}-\\u{E007F}]', 'gu');
    
    expect("Olá 😊 mundo".replace(emojiRegex, '')).toBe("Olá  mundo");
    expect("Sem emojis aqui".replace(emojiRegex, '')).toBe("Sem emojis aqui");
    expect("🍕🍔🍻".replace(emojiRegex, '')).toBe("");
    expect("Texto normal!".replace(emojiRegex, '')).toBe("Texto normal!");
  });
});
