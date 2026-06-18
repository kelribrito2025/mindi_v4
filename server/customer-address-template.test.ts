import { describe, it, expect } from "vitest";
import { generateStatusMessage } from "./_core/uazapi";

describe("{{customerAddress}} template variable", () => {
  const baseArgs = {
    status: 'new' as const,
    orderNumber: '#1234',
    customerName: 'João Silva',
    establishmentName: 'Restaurante Teste',
  };

  it("should replace {{customerAddress}} with formatted address block", () => {
    const template = "Olá {{customerName}}!\n\n{{customerAddress}}";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'delivery',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      "Rua Lindolfo Veras, 1876 - Casa verde, Cidade Nova (Ref: Ao lado de casa)"
    );

    expect(result).toContain("📌 *Endereço:*");
    expect(result).toContain("*Rua:* Rua Lindolfo Veras | N.º 1876");
    expect(result).toContain("*Bairro:* Cidade Nova");
    expect(result).toContain("*Complemento:* Casa verde");
    expect(result).toContain("*Ponto de referência:* Ao lado de casa");
  });

  it("should handle address without complement and reference", () => {
    const template = "{{customerAddress}}";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'delivery',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      "Rua das Flores, 123, Centro"
    );

    expect(result).toContain("📌 *Endereço:*");
    expect(result).toContain("*Rua:* Rua das Flores | N.º 123");
    expect(result).toContain("*Bairro:* Centro");
    expect(result).not.toContain("*Complemento:*");
    expect(result).not.toContain("*Ponto de referência:*");
  });

  it("should handle address with reference but no complement", () => {
    const template = "{{customerAddress}}";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'delivery',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      "Rua X, 100, Bairro Y (Ref: perto do mercado)"
    );

    expect(result).toContain("📌 *Endereço:*");
    expect(result).toContain("*Rua:* Rua X | N.º 100");
    expect(result).toContain("*Bairro:* Bairro Y");
    expect(result).not.toContain("*Complemento:*");
    expect(result).toContain("*Ponto de referência:* perto do mercado");
  });

  it("should remove {{customerAddress}} when address is null", () => {
    const template = "Pedido: {{orderNumber}}\n\n{{customerAddress}}\n\nObrigado!";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'pickup',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      null
    );

    expect(result).not.toContain("{{customerAddress}}");
    expect(result).not.toContain("📌");
    expect(result).toContain("Pedido: #1234");
    expect(result).toContain("Obrigado!");
  });

  it("should remove {{customerAddress}} when address is empty string", () => {
    const template = "{{customerAddress}}";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'pickup',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      ""
    );

    expect(result).not.toContain("📌");
    expect(result).not.toContain("*Endereço:*");
  });

  it("should handle address with complement using dash separator", () => {
    const template = "{{customerAddress}}";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'delivery',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      "Rua ABC, 500 - Apto 301, Bairro Z"
    );

    expect(result).toContain("*Rua:* Rua ABC | N.º 500");
    expect(result).toContain("*Complemento:* Apto 301");
    expect(result).toContain("*Bairro:* Bairro Z");
  });

  it("should work alongside other template variables", () => {
    const template = "Olá {{customerName}}!\n\nPedido {{orderNumber}}\n\n{{customerAddress}}\n\n{{establishmentName}}";
    const result = generateStatusMessage(
      baseArgs.status,
      baseArgs.orderNumber,
      baseArgs.customerName,
      baseArgs.establishmentName,
      template,
      'delivery',
      null,
      null,
      null,
      undefined,
      null,
      undefined,
      null,
      "Rua Teste, 42, Centro"
    );

    expect(result).toContain("Olá João Silva!");
    expect(result).toContain("Pedido #1234");
    expect(result).toContain("📌 *Endereço:*");
    expect(result).toContain("Restaurante Teste");
  });
});
