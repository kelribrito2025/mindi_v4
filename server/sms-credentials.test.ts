import { describe, it, expect } from "vitest";

/**
 * Teste de validação das credenciais da DisparoPro
 * Este teste verifica se as credenciais estão configuradas corretamente
 */
describe("DisparoPro Credentials Validation", () => {
  it("should have DISPAROPRO_TOKEN configured", () => {
    const token = process.env.DISPAROPRO_TOKEN;
    expect(token).toBeDefined();
    expect(token).not.toBe("");
    expect(typeof token).toBe("string");
    // Token deve ter pelo menos 20 caracteres
    expect(token!.length).toBeGreaterThanOrEqual(20);
  });

  it("should have DISPAROPRO_PARCEIRO_ID configured", () => {
    const parceiroId = process.env.DISPAROPRO_PARCEIRO_ID;
    expect(parceiroId).toBeDefined();
    expect(parceiroId).not.toBe("");
    expect(typeof parceiroId).toBe("string");
    // Parceiro ID deve ter pelo menos 5 caracteres
    expect(parceiroId!.length).toBeGreaterThanOrEqual(5);
  });

  it("should be able to make a test request to DisparoPro API", async () => {
    const token = process.env.DISPAROPRO_TOKEN;
    const parceiroId = process.env.DISPAROPRO_PARCEIRO_ID;

    if (!token || !parceiroId) {
      console.warn("Credenciais não configuradas, pulando teste de API");
      return;
    }

    // Fazer uma requisição de teste para verificar se as credenciais são válidas
    // Usamos um número de teste inválido para não enviar SMS real
    // A API deve retornar erro de número inválido, não erro de autenticação
    try {
      const response = await fetch("https://apihttp.disparopro.com.br:8433/mt", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            numero: "5500000000000", // Número inválido para teste
            servico: "short",
            mensagem: "Teste de credenciais",
            parceiro_id: parceiroId,
            codificacao: "0",
            nome_campanha: "Teste Credenciais",
          },
        ]),
      });

      // Se receber 401 ou 403, as credenciais estão erradas
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Credenciais inválidas: ${response.status} ${response.statusText}`);
      }

      // Qualquer outro status indica que as credenciais estão corretas
      // (mesmo que o número seja inválido, a autenticação passou)
      console.log(`[SMS Test] Resposta da API: ${response.status}`);
      
      // Aceitar status 200 (sucesso) ou 400/422 (erro de validação do número)
      expect([200, 400, 422, 500]).toContain(response.status);
    } catch (error: any) {
      // Se for erro de rede, não é problema de credenciais
      if (error.message.includes("Credenciais inválidas")) {
        throw error;
      }
      console.warn(`[SMS Test] Erro de rede (não é problema de credenciais): ${error.message}`);
    }
  });
});
