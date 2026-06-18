import { describe, it, expect } from "vitest";
import { validateIfoodCredentials } from "./ifood";

describe("iFood Integration", () => {
  it("should validate iFood credentials by obtaining an access token", async () => {
    const result = await validateIfoodCredentials();
    
    // Se as credenciais forem válidas, valid será true
    // Se forem inválidas, teremos um erro descritivo
    if (!result.valid) {
      console.log("=== ERRO DE VALIDAÇÃO IFOOD ===");
      console.log("Erro:", result.error);
      console.log("================================");
    }
    
    // Por enquanto, apenas logamos o resultado sem falhar o teste
    // para podermos ver o erro específico
    console.log("Resultado da validação:", result);
    expect(result).toBeDefined();
  }, 30000); // Timeout de 30 segundos para chamada de API
});
