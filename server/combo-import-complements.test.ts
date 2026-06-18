import { describe, expect, it, beforeAll } from "vitest";
import * as db from "./db";

describe("createCombo - importação de complementos dos itens", () => {
  // Usar o estabelecimento existente 30001 e produtos reais
  const establishmentId = 30001;

  it("deve verificar que produtos com complementos existem no banco", async () => {
    // Verificar que o produto 'Refrigerantes' (id 120101) tem complementGroups
    const groups = await db.getComplementGroupsByProduct(120101);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].name).toBeTruthy();
    
    // Verificar que os grupos têm itens
    const items = await db.getComplementItemsByGroup(groups[0].id);
    expect(items.length).toBeGreaterThan(0);
  });

  it("deve importar complementGroups dos itens ao criar combo", async () => {
    // Buscar uma categoria existente para usar
    const categories = await db.getCategoriesByEstablishment(establishmentId);
    expect(categories.length).toBeGreaterThan(0);
    const categoryId = categories[0].id;

    // Buscar complementos do produto 'Refrigerantes' (id 120101) antes da criação
    const originalComplements = await db.getComplementGroupsByProduct(120101);
    expect(originalComplements.length).toBeGreaterThan(0);

    // Criar combo com o produto que tem complementos
    const result = await db.createCombo({
      establishmentId,
      categoryId,
      name: "Combo Teste Import " + Date.now(),
      description: "Teste de importação de complementos",
      price: "25.00",
      groups: [{
        name: "Grupo Teste",
        isRequired: true,
        maxQuantity: 1,
        sortOrder: 0,
        items: [{ productId: 120101, sortOrder: 0 }], // Refrigerantes - tem complementos
      }],
    });

    expect(result.id).toBeTruthy();
    const comboProductId = Number(result.id);

    // Verificar que os comboGroups foram criados
    const comboGroups = await db.getComboGroupsByProductId(comboProductId);
    expect(comboGroups.length).toBe(1);
    expect(comboGroups[0].name).toBe("Grupo Teste");

    // Verificar que os complementGroups do item foram importados para o combo
    const importedComplements = await db.getComplementGroupsByProduct(comboProductId);
    expect(importedComplements.length).toBeGreaterThan(0);
    
    // Verificar que o nome do grupo importado corresponde ao original
    expect(importedComplements[0].name).toBe(originalComplements[0].name);

    // Verificar que os itens do complemento também foram importados
    const importedItems = await db.getComplementItemsByGroup(importedComplements[0].id);
    const originalItems = await db.getComplementItemsByGroup(originalComplements[0].id);
    expect(importedItems.length).toBe(originalItems.length);

    // Limpar: deletar o combo criado no teste
    await db.deleteCombo(comboProductId);
  });

  it("não deve importar complementos se o item não tem complementos", async () => {
    const categories = await db.getCategoriesByEstablishment(establishmentId);
    const categoryId = categories[0].id;

    // Buscar um produto SEM complementos (BATATA FRITA - id 120064)
    const noComplements = await db.getComplementGroupsByProduct(120064);
    
    // Se o produto não tem complementos, testar que nada é importado
    if (noComplements.length === 0) {
      const result = await db.createCombo({
        establishmentId,
        categoryId,
        name: "Combo Sem Complementos " + Date.now(),
        price: "15.00",
        groups: [{
          name: "Grupo Simples",
          isRequired: true,
          maxQuantity: 1,
          sortOrder: 0,
          items: [{ productId: 120064, sortOrder: 0 }],
        }],
      });

      const comboProductId = Number(result.id);

      // Verificar que NÃO foram importados complementGroups
      const importedComplements = await db.getComplementGroupsByProduct(comboProductId);
      expect(importedComplements.length).toBe(0);

      // Limpar
      await db.deleteCombo(comboProductId);
    }
  });
});
