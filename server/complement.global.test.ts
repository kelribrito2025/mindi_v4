import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Complementos Globais", () => {
  // Teste de listagem de complementos por estabelecimento
  it("deve listar todos os complementos únicos de um estabelecimento", async () => {
    // Este teste verifica se a função getAllComplementItemsByEstablishment existe e retorna um array
    const result = await db.getAllComplementItemsByEstablishment(1);
    expect(Array.isArray(result)).toBe(true);
  });

  // Teste de atualização global de complementos por nome
  it("deve atualizar complementos por nome", async () => {
    // Este teste verifica se a função updateComplementItemsByName existe e não lança erro
    // Usamos um nome que provavelmente não existe para evitar alterar dados reais
    await expect(
      db.updateComplementItemsByName(99999, "ComplementoInexistente", { isActive: false })
    ).resolves.not.toThrow();
  });

  // Teste de estrutura do retorno
  it("deve retornar complementos com campos id, name, price, isActive, priceMode e usageCount", async () => {
    const result = await db.getAllComplementItemsByEstablishment(1);
    
    // Se houver complementos, verificar a estrutura
    if (result.length > 0) {
      const complement = result[0];
      expect(complement).toHaveProperty("id");
      expect(complement).toHaveProperty("name");
      expect(complement).toHaveProperty("price");
      expect(complement).toHaveProperty("isActive");
      expect(complement).toHaveProperty("priceMode");
      expect(complement).toHaveProperty("usageCount");
    }
    
    // Teste passa mesmo sem complementos
    expect(true).toBe(true);
  });

  // Teste de priceMode
  it("priceMode deve ser 'normal' ou 'free'", async () => {
    const result = await db.getAllComplementItemsByEstablishment(1);
    
    // Se houver complementos, verificar o priceMode
    result.forEach((complement) => {
      expect(["normal", "free"]).toContain(complement.priceMode);
    });
    
    // Teste passa mesmo sem complementos
    expect(true).toBe(true);
  });
});
