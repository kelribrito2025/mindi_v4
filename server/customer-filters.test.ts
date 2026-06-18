import { describe, expect, it } from "vitest";

/**
 * Testes unitários para a lógica de filtragem de clientes.
 * Testamos a lógica de filtros em memória que é aplicada após a query SQL.
 */

// Tipo que representa um cliente retornado pela query
interface CustomerRow {
  id: number;
  name: string | null;
  phone: string;
  lastOrderAt: Date;
  orderCount: number;
  usedCoupon: boolean;
}

// Reproduz a lógica de filtragem do getFilteredCustomers
function applyFilters(
  customers: CustomerRow[],
  filters?: {
    inactiveDays?: number;
    minOrders?: number;
    usedCoupon?: boolean;
  }
): CustomerRow[] {
  let filtered = [...customers];

  // Filtro: clientes inativos há X dias
  if (filters?.inactiveDays && filters.inactiveDays > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.inactiveDays);
    filtered = filtered.filter(r => new Date(r.lastOrderAt) <= cutoffDate);
  }

  // Filtro: clientes com mais de N pedidos
  if (filters?.minOrders && filters.minOrders > 0) {
    filtered = filtered.filter(r => r.orderCount >= filters.minOrders!);
  }

  // Filtro: clientes que já usaram cupom
  if (filters?.usedCoupon) {
    filtered = filtered.filter(r => r.usedCoupon);
  }

  return filtered;
}

// Dados de teste
const now = new Date();
const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
};

const mockCustomers: CustomerRow[] = [
  { id: 1, name: "João", phone: "5588999990001", lastOrderAt: daysAgo(2), orderCount: 15, usedCoupon: true },
  { id: 2, name: "Maria", phone: "5588999990002", lastOrderAt: daysAgo(10), orderCount: 3, usedCoupon: false },
  { id: 3, name: "Pedro", phone: "5588999990003", lastOrderAt: daysAgo(45), orderCount: 8, usedCoupon: true },
  { id: 4, name: "Ana", phone: "5588999990004", lastOrderAt: daysAgo(90), orderCount: 1, usedCoupon: false },
  { id: 5, name: "Carlos", phone: "5588999990005", lastOrderAt: daysAgo(5), orderCount: 20, usedCoupon: true },
  { id: 6, name: "Lucia", phone: "5588999990006", lastOrderAt: daysAgo(60), orderCount: 5, usedCoupon: false },
  { id: 7, name: "Roberto", phone: "5588999990007", lastOrderAt: daysAgo(120), orderCount: 2, usedCoupon: true },
];

describe("Customer Filters - applyFilters", () => {
  describe("Sem filtros", () => {
    it("retorna todos os clientes quando nenhum filtro é aplicado", () => {
      const result = applyFilters(mockCustomers);
      expect(result).toHaveLength(7);
    });

    it("retorna todos os clientes quando filtros são undefined", () => {
      const result = applyFilters(mockCustomers, undefined);
      expect(result).toHaveLength(7);
    });

    it("retorna todos os clientes quando filtros estão vazios", () => {
      const result = applyFilters(mockCustomers, {});
      expect(result).toHaveLength(7);
    });
  });

  describe("Filtro: Inativos há X dias", () => {
    it("filtra clientes inativos há 30 dias", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 30 });
      // Pedro (45d), Ana (90d), Lucia (60d), Roberto (120d) = 4 clientes
      expect(result).toHaveLength(4);
      expect(result.map(c => c.name)).toEqual(
        expect.arrayContaining(["Pedro", "Ana", "Lucia", "Roberto"])
      );
    });

    it("filtra clientes inativos há 7 dias", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 7 });
      // Maria (10d), Pedro (45d), Ana (90d), Lucia (60d), Roberto (120d) = 5 clientes
      expect(result).toHaveLength(5);
      expect(result.map(c => c.name)).not.toContain("João"); // 2 dias
      expect(result.map(c => c.name)).not.toContain("Carlos"); // 5 dias
    });

    it("filtra clientes inativos há 365 dias (nenhum resultado)", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 365 });
      expect(result).toHaveLength(0);
    });

    it("ignora filtro quando inactiveDays é 0", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 0 });
      expect(result).toHaveLength(7);
    });
  });

  describe("Filtro: Mínimo de pedidos", () => {
    it("filtra clientes com 5 ou mais pedidos", () => {
      const result = applyFilters(mockCustomers, { minOrders: 5 });
      // João (15), Pedro (8), Carlos (20), Lucia (5) = 4 clientes
      expect(result).toHaveLength(4);
      expect(result.map(c => c.name)).toEqual(
        expect.arrayContaining(["João", "Pedro", "Carlos", "Lucia"])
      );
    });

    it("filtra clientes com 10 ou mais pedidos", () => {
      const result = applyFilters(mockCustomers, { minOrders: 10 });
      // João (15), Carlos (20) = 2 clientes
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(
        expect.arrayContaining(["João", "Carlos"])
      );
    });

    it("filtra clientes com 100 ou mais pedidos (nenhum resultado)", () => {
      const result = applyFilters(mockCustomers, { minOrders: 100 });
      expect(result).toHaveLength(0);
    });

    it("ignora filtro quando minOrders é 0", () => {
      const result = applyFilters(mockCustomers, { minOrders: 0 });
      expect(result).toHaveLength(7);
    });
  });

  describe("Filtro: Usou cupom", () => {
    it("filtra apenas clientes que usaram cupom", () => {
      const result = applyFilters(mockCustomers, { usedCoupon: true });
      // João, Pedro, Carlos, Roberto = 4 clientes
      expect(result).toHaveLength(4);
      expect(result.every(c => c.usedCoupon)).toBe(true);
    });

    it("retorna todos quando usedCoupon é false", () => {
      const result = applyFilters(mockCustomers, { usedCoupon: false });
      expect(result).toHaveLength(7);
    });
  });

  describe("Filtros combinados", () => {
    it("combina inativos + mínimo de pedidos", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 30, minOrders: 5 });
      // Inativos 30d: Pedro (8), Ana (1), Lucia (5), Roberto (2)
      // Com 5+ pedidos: Pedro (8), Lucia (5) = 2 clientes
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(
        expect.arrayContaining(["Pedro", "Lucia"])
      );
    });

    it("combina inativos + usou cupom", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 30, usedCoupon: true });
      // Inativos 30d: Pedro, Ana, Lucia, Roberto
      // Usou cupom: Pedro, Roberto = 2 clientes
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(
        expect.arrayContaining(["Pedro", "Roberto"])
      );
    });

    it("combina mínimo de pedidos + usou cupom", () => {
      const result = applyFilters(mockCustomers, { minOrders: 5, usedCoupon: true });
      // 5+ pedidos: João (15), Pedro (8), Carlos (20), Lucia (5)
      // Usou cupom: João, Pedro, Carlos = 3 clientes
      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).toEqual(
        expect.arrayContaining(["João", "Pedro", "Carlos"])
      );
    });

    it("combina todos os filtros", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 30, minOrders: 5, usedCoupon: true });
      // Inativos 30d: Pedro (8, cupom), Ana (1, sem), Lucia (5, sem), Roberto (2, cupom)
      // 5+ pedidos: Pedro (8)
      // Usou cupom: Pedro = 1 cliente
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Pedro");
    });

    it("retorna vazio quando filtros combinados são muito restritivos", () => {
      const result = applyFilters(mockCustomers, { inactiveDays: 30, minOrders: 50, usedCoupon: true });
      expect(result).toHaveLength(0);
    });
  });

  describe("Contagem de filtros ativos", () => {
    it("conta corretamente filtros ativos", () => {
      const countActiveFilters = (filters: { inactiveDays?: string; minOrders?: string; usedCoupon?: boolean }) => {
        return [
          filters.inactiveDays !== "" && Number(filters.inactiveDays) > 0,
          filters.minOrders !== "" && Number(filters.minOrders) > 0,
          filters.usedCoupon,
        ].filter(Boolean).length;
      };

      expect(countActiveFilters({ inactiveDays: "", minOrders: "", usedCoupon: false })).toBe(0);
      expect(countActiveFilters({ inactiveDays: "30", minOrders: "", usedCoupon: false })).toBe(1);
      expect(countActiveFilters({ inactiveDays: "30", minOrders: "5", usedCoupon: false })).toBe(2);
      expect(countActiveFilters({ inactiveDays: "30", minOrders: "5", usedCoupon: true })).toBe(3);
      expect(countActiveFilters({ inactiveDays: "0", minOrders: "0", usedCoupon: false })).toBe(0);
    });
  });
});
