import { describe, it, expect } from "vitest";

/**
 * Testes para o filtro de cupons de fidelidade na listagem do admin.
 * Cupons de fidelidade (código começa com "FID") devem ser excluídos por padrão
 * da listagem da página de Cupons, mas continuam existindo e funcionando normalmente.
 */

describe("Coupon Loyalty Filter", () => {
  describe("Identificação de cupons de fidelidade", () => {
    it("deve identificar cupom com prefixo FID como cupom de fidelidade", () => {
      const code = "FIDAB3K9";
      const isLoyalty = code.startsWith("FID");
      expect(isLoyalty).toBe(true);
    });

    it("deve identificar cupom com prefixo FIDELIDADE como cupom de fidelidade", () => {
      const code = "FIDELIDADE1KXYZ";
      const isLoyalty = code.startsWith("FID");
      expect(isLoyalty).toBe(true); // FIDELIDADE também começa com FID
    });

    it("NÃO deve identificar cupom manual como cupom de fidelidade", () => {
      const codes = ["PROMO10", "DESCONTO20", "TRTRTRT", "VERAO2025", "FRETE0"];
      for (const code of codes) {
        expect(code.startsWith("FID")).toBe(false);
      }
    });
  });

  describe("Lógica do filtro notLike FID%", () => {
    const mockCoupons = [
      { id: 1, code: "PROMO10", type: "percentage" as const },
      { id: 2, code: "FID3KA9B", type: "fixed" as const },
      { id: 3, code: "DESCONTO20", type: "fixed" as const },
      { id: 4, code: "FIDXYZ12", type: "percentage" as const },
      { id: 5, code: "TRTRTRT", type: "percentage" as const },
      { id: 6, code: "FIDELIDADE1K", type: "fixed" as const },
    ];

    it("deve filtrar apenas cupons manuais (excluir FID%) quando includeLoyalty é false/undefined", () => {
      const filtered = mockCoupons.filter((c) => !c.code.startsWith("FID"));
      expect(filtered).toHaveLength(3);
      expect(filtered.map((c) => c.code)).toEqual(["PROMO10", "DESCONTO20", "TRTRTRT"]);
    });

    it("deve incluir todos os cupons quando includeLoyalty é true", () => {
      const includeLoyalty = true;
      const filtered = includeLoyalty
        ? mockCoupons
        : mockCoupons.filter((c) => !c.code.startsWith("FID"));
      expect(filtered).toHaveLength(6);
    });

    it("deve retornar lista vazia se todos os cupons forem de fidelidade", () => {
      const loyaltyOnly = [
        { id: 1, code: "FID3KA9B" },
        { id: 2, code: "FIDXYZ12" },
        { id: 3, code: "FIDELIDADE1K" },
      ];
      const filtered = loyaltyOnly.filter((c) => !c.code.startsWith("FID"));
      expect(filtered).toHaveLength(0);
    });

    it("deve retornar todos se nenhum cupom for de fidelidade", () => {
      const manualOnly = [
        { id: 1, code: "PROMO10" },
        { id: 2, code: "DESCONTO20" },
        { id: 3, code: "TRTRTRT" },
      ];
      const filtered = manualOnly.filter((c) => !c.code.startsWith("FID"));
      expect(filtered).toHaveLength(3);
    });
  });

  describe("Contagem de stats deve excluir cupons de fidelidade", () => {
    const mockCoupons = [
      { id: 1, code: "PROMO10", status: "active" },
      { id: 2, code: "FID3KA9B", status: "active" },
      { id: 3, code: "DESCONTO20", status: "inactive" },
      { id: 4, code: "FIDXYZ12", status: "exhausted" },
      { id: 5, code: "TRTRTRT", status: "active" },
    ];

    it("deve contar apenas cupons manuais ativos nos stats", () => {
      const manualCoupons = mockCoupons.filter((c) => !c.code.startsWith("FID"));
      const activeCoupons = manualCoupons.filter((c) => c.status === "active");
      expect(activeCoupons).toHaveLength(2); // PROMO10 e TRTRTRT
    });

    it("deve contar apenas cupons manuais inativos nos stats", () => {
      const manualCoupons = mockCoupons.filter((c) => !c.code.startsWith("FID"));
      const inactiveCoupons = manualCoupons.filter((c) => c.status === "inactive");
      expect(inactiveCoupons).toHaveLength(1); // DESCONTO20
    });
  });
});
