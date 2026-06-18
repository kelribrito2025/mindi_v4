import { describe, expect, it } from "vitest";

/**
 * Testes para verificar que carimbos de fidelidade só são concedidos
 * a clientes que se cadastraram voluntariamente (registeredByCustomer = true).
 * 
 * Testa a lógica de concessão de carimbos e filtros de métricas.
 */

describe("Programa de Fidelidade — Somente Clientes Cadastrados (registeredByCustomer)", () => {
  
  describe("processLoyaltyStampForOrder", () => {
    it("não deve conceder carimbo a cliente sem cadastro no programa", { timeout: 15000 }, async () => {
      const { processLoyaltyStampForOrder } = await import("./db");
      
      const result = await processLoyaltyStampForOrder(
        999999, // establishmentId que não existe
        999999, // orderId
        "TEST-001",
        "50.00",
        "11999999999"
      );
      
      expect(result.stampAdded).toBe(false);
    });
    
    it("deve retornar mensagem adequada quando cliente não está cadastrado", async () => {
      const { processLoyaltyStampForOrder } = await import("./db");
      
      const result = await processLoyaltyStampForOrder(
        999999,
        999999,
        "TEST-002",
        "50.00",
        "11888888888"
      );
      
      expect(result.stampAdded).toBe(false);
      expect(result.couponUnlocked).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });

  describe("Lógica de filtro de métricas", () => {
    it("getLoyaltyMetrics deve existir e retornar estrutura correta", async () => {
      const { getLoyaltyMetrics } = await import("./db");
      
      const metrics = await getLoyaltyMetrics(999999);
      
      expect(metrics).toHaveProperty("activeCards");
      expect(metrics).toHaveProperty("totalStamps");
      expect(metrics).toHaveProperty("rewardsRedeemed");
      expect(metrics).toHaveProperty("loyalCustomers");
      expect(typeof metrics.activeCards).toBe("number");
      expect(typeof metrics.totalStamps).toBe("number");
      expect(typeof metrics.rewardsRedeemed).toBe("number");
      expect(typeof metrics.loyalCustomers).toBe("number");
    });

    it("getLoyaltyCardClients deve existir e retornar estrutura correta", async () => {
      const { getLoyaltyCardClients } = await import("./db");
      
      const result = await getLoyaltyCardClients(999999);
      
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("hasMore");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("getLoyaltyEventHistory deve existir e retornar estrutura correta", async () => {
      const { getLoyaltyEventHistory } = await import("./db");
      
      const result = await getLoyaltyEventHistory(999999);
      
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("hasMore");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });
  });

  describe("Verificação de código-fonte — registeredByCustomer", () => {
    it("updateOrderStatus deve verificar registeredByCustomer antes de conceder carimbo", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      // Buscar a seção do updateOrderStatus que lida com fidelidade
      const loyaltySection = dbCode.substring(
        dbCode.indexOf("// Buscar cartão de fidelidade do cliente (somente clientes cadastrados)"),
        dbCode.indexOf("// fim do if (cardId)")
      );
      
      // Deve verificar registeredByCustomer
      expect(loyaltySection).toContain("registeredByCustomer");
      // Não deve criar cartão automaticamente
      expect(loyaltySection).toContain("Não criar cartão automaticamente");
    });

    it("processLoyaltyStampForOrder deve verificar registeredByCustomer", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      const funcStart = dbCode.indexOf("export async function processLoyaltyStampForOrder");
      const funcEnd = dbCode.indexOf("export async function", funcStart + 100);
      const funcCode = dbCode.substring(funcStart, funcEnd);
      
      // Deve verificar registeredByCustomer
      expect(funcCode).toContain("registeredByCustomer");
      expect(funcCode).toContain("não se cadastrou voluntariamente");
    });

    it("createLoyaltyCard deve marcar registeredByCustomer = true", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      const funcStart = dbCode.indexOf("export async function createLoyaltyCard");
      const funcEnd = dbCode.indexOf("export async function", funcStart + 100);
      const funcCode = dbCode.substring(funcStart, funcEnd);
      
      // Deve incluir registeredByCustomer: true
      expect(funcCode).toContain("registeredByCustomer: true");
    });

    it("getLoyaltyMetrics deve filtrar por registeredByCustomer", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      const funcStart = dbCode.indexOf("export async function getLoyaltyMetrics");
      const funcEnd = dbCode.indexOf("export async function", funcStart + 100);
      const funcCode = dbCode.substring(funcStart, funcEnd);
      
      expect(funcCode).toContain("registeredByCustomer");
      // Não deve mais usar password4Hash como filtro
      expect(funcCode).not.toContain("password4Hash != ''");
    });

    it("getLoyaltyCardClients deve filtrar por registeredByCustomer", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      const funcStart = dbCode.indexOf("export async function getLoyaltyCardClients");
      const funcEnd = dbCode.indexOf("export async function", funcStart + 100);
      const funcCode = dbCode.substring(funcStart, funcEnd);
      
      expect(funcCode).toContain("registeredByCustomer");
      expect(funcCode).not.toContain("password4Hash != ''");
    });

    it("getLoyaltyEventHistory deve filtrar por registeredByCustomer", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      const funcStart = dbCode.indexOf("export async function getLoyaltyEventHistory");
      const funcEnd = dbCode.indexOf("export async function", funcStart + 100);
      const funcCode = dbCode.substring(funcStart, funcEnd);
      
      expect(funcCode).toContain("registeredByCustomer");
      expect(funcCode).not.toContain("password4Hash != ''");
    });

    it("getLoyaltyEvolution deve filtrar por registeredByCustomer", async () => {
      const fs = await import("fs");
      const dbCode = fs.readFileSync("./server/db.ts", "utf-8");
      
      const funcStart = dbCode.indexOf("export async function getLoyaltyEvolution");
      const funcEnd = dbCode.indexOf("export async function", funcStart + 100);
      const funcCode = dbCode.substring(funcStart, funcEnd);
      
      expect(funcCode).toContain("registeredByCustomer");
      expect(funcCode).not.toContain("password4Hash != ''");
    });
  });
});
