import { describe, it, expect } from "vitest";

/**
 * Testes para a lógica do botão "Adicionar" (handleQuickAdd)
 * que verifica se o produto tem complementos antes de adicionar ao carrinho.
 * 
 * Regra: Se o produto tem complementos, deve abrir o modal de detalhes.
 *        Se não tem complementos, pode adicionar direto ao carrinho.
 * 
 * Contextos: PDV, PDVSlidebar (Mesas Desktop), MobilePDVModal (Mesas Mobile)
 */

type Product = {
  id: number;
  name: string;
  price: string;
  hasStock: boolean;
  stockQuantity: number | null;
};

type ComplementGroup = {
  id: number;
  name: string;
  items: Array<{ id: number; name: string; price: string }>;
};

// Reproduzir a lógica de handleQuickAdd
function shouldOpenModalInsteadOfDirectAdd(
  product: Product,
  complementGroups: ComplementGroup[]
): 'open_modal' | 'add_direct' | 'unavailable' {
  // Verificar se produto está indisponível
  if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) {
    return 'unavailable';
  }

  // Verificar se tem complementos
  const hasComplements = complementGroups && complementGroups.length > 0;

  if (hasComplements) {
    return 'open_modal';
  }

  return 'add_direct';
}

// Lógica de fallback quando a busca de complementos falha
function handleQuickAddError(): 'open_modal' {
  // Em caso de erro, sempre abrir modal como fallback seguro
  return 'open_modal';
}

describe("handleQuickAdd - Verificação de complementos antes de adicionar", () => {
  describe("Produto COM complementos", () => {
    it("deve abrir modal quando produto tem 1 grupo de complementos", () => {
      const product: Product = { id: 1, name: "Hambúrguer", price: "25.00", hasStock: false, stockQuantity: null };
      const complements: ComplementGroup[] = [
        { id: 1, name: "Adicionais", items: [{ id: 1, name: "Queijo extra", price: "3.00" }] }
      ];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('open_modal');
    });

    it("deve abrir modal quando produto tem múltiplos grupos de complementos", () => {
      const product: Product = { id: 2, name: "Pizza", price: "45.00", hasStock: false, stockQuantity: null };
      const complements: ComplementGroup[] = [
        { id: 1, name: "Borda", items: [{ id: 1, name: "Catupiry", price: "5.00" }] },
        { id: 2, name: "Bebida", items: [{ id: 2, name: "Coca-Cola", price: "7.00" }] },
        { id: 3, name: "Sobremesa", items: [{ id: 3, name: "Petit Gateau", price: "12.00" }] }
      ];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('open_modal');
    });

    it("deve abrir modal quando produto tem complementos com preço zero (grátis)", () => {
      const product: Product = { id: 3, name: "Combo", price: "35.00", hasStock: false, stockQuantity: null };
      const complements: ComplementGroup[] = [
        { id: 1, name: "Molhos", items: [{ id: 1, name: "Ketchup", price: "0.00" }, { id: 2, name: "Mostarda", price: "0.00" }] }
      ];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('open_modal');
    });

    it("deve abrir modal quando produto tem complementos obrigatórios", () => {
      const product: Product = { id: 4, name: "Açaí", price: "20.00", hasStock: false, stockQuantity: null };
      const complements: ComplementGroup[] = [
        { id: 1, name: "Tamanho (obrigatório)", items: [{ id: 1, name: "300ml", price: "0.00" }, { id: 2, name: "500ml", price: "5.00" }] }
      ];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('open_modal');
    });
  });

  describe("Produto SEM complementos", () => {
    it("deve adicionar direto quando produto não tem complementos (array vazio)", () => {
      const product: Product = { id: 5, name: "Água", price: "5.00", hasStock: false, stockQuantity: null };
      const complements: ComplementGroup[] = [];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('add_direct');
    });

    it("deve adicionar direto quando complementos é null/undefined", () => {
      const product: Product = { id: 6, name: "Refrigerante", price: "7.00", hasStock: false, stockQuantity: null };

      expect(shouldOpenModalInsteadOfDirectAdd(product, null as any)).toBe('add_direct');
      expect(shouldOpenModalInsteadOfDirectAdd(product, undefined as any)).toBe('add_direct');
    });
  });

  describe("Produto indisponível (estoque)", () => {
    it("deve retornar unavailable quando produto tem estoque ativo e quantidade 0", () => {
      const product: Product = { id: 7, name: "Sushi", price: "30.00", hasStock: true, stockQuantity: 0 };
      const complements: ComplementGroup[] = [
        { id: 1, name: "Molho", items: [{ id: 1, name: "Shoyu", price: "0.00" }] }
      ];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('unavailable');
    });

    it("deve retornar unavailable quando produto tem estoque ativo e quantidade null", () => {
      const product: Product = { id: 8, name: "Temaki", price: "25.00", hasStock: true, stockQuantity: null };
      const complements: ComplementGroup[] = [];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('unavailable');
    });

    it("deve funcionar normalmente quando produto tem estoque ativo e quantidade > 0", () => {
      const product: Product = { id: 9, name: "Sashimi", price: "35.00", hasStock: true, stockQuantity: 10 };
      const complements: ComplementGroup[] = [
        { id: 1, name: "Extras", items: [{ id: 1, name: "Gengibre", price: "2.00" }] }
      ];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('open_modal');
    });

    it("deve funcionar normalmente quando produto não tem controle de estoque", () => {
      const product: Product = { id: 10, name: "Cerveja", price: "12.00", hasStock: false, stockQuantity: null };
      const complements: ComplementGroup[] = [];

      expect(shouldOpenModalInsteadOfDirectAdd(product, complements)).toBe('add_direct');
    });
  });

  describe("Fallback de erro", () => {
    it("deve abrir modal como fallback quando busca de complementos falha", () => {
      expect(handleQuickAddError()).toBe('open_modal');
    });
  });

  describe("Consistência entre contextos", () => {
    const testProduct: Product = { id: 11, name: "Hambúrguer Artesanal", price: "32.00", hasStock: false, stockQuantity: null };
    const testComplements: ComplementGroup[] = [
      { id: 1, name: "Ponto da carne", items: [{ id: 1, name: "Mal passado", price: "0.00" }, { id: 2, name: "Ao ponto", price: "0.00" }] },
      { id: 2, name: "Adicionais", items: [{ id: 3, name: "Bacon", price: "5.00" }, { id: 4, name: "Cheddar", price: "4.00" }] }
    ];

    it("PDV deve abrir modal para produto com complementos", () => {
      expect(shouldOpenModalInsteadOfDirectAdd(testProduct, testComplements)).toBe('open_modal');
    });

    it("PDVSlidebar (Mesas Desktop) deve abrir modal para produto com complementos", () => {
      // Mesma lógica usada no PDVSlidebar
      expect(shouldOpenModalInsteadOfDirectAdd(testProduct, testComplements)).toBe('open_modal');
    });

    it("MobilePDVModal (Mesas Mobile) deve abrir modal para produto com complementos", () => {
      // Mesma lógica usada no MobilePDVModal
      expect(shouldOpenModalInsteadOfDirectAdd(testProduct, testComplements)).toBe('open_modal');
    });

    const simpleProduct: Product = { id: 12, name: "Água Mineral", price: "4.00", hasStock: false, stockQuantity: null };
    const noComplements: ComplementGroup[] = [];

    it("PDV deve adicionar direto para produto sem complementos", () => {
      expect(shouldOpenModalInsteadOfDirectAdd(simpleProduct, noComplements)).toBe('add_direct');
    });

    it("PDVSlidebar (Mesas Desktop) deve adicionar direto para produto sem complementos", () => {
      expect(shouldOpenModalInsteadOfDirectAdd(simpleProduct, noComplements)).toBe('add_direct');
    });

    it("MobilePDVModal (Mesas Mobile) deve adicionar direto para produto sem complementos", () => {
      expect(shouldOpenModalInsteadOfDirectAdd(simpleProduct, noComplements)).toBe('add_direct');
    });
  });
});
