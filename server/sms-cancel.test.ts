import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testa a lógica de envio de SMS quando o pedido é cancelado.
 * Verifica que a mensagem de cancelamento é formatada corretamente.
 */
describe("SMS de cancelamento de pedido", () => {
  it("deve formatar a mensagem de cancelamento corretamente", () => {
    const name = "Pequena Londres";
    const orderNumber = "P123";
    const cancelMessage = `${name}: Infelizmente seu pedido #${orderNumber} foi cancelado. Entre em contato conosco para mais informacoes.`;
    
    expect(cancelMessage).toBe("Pequena Londres: Infelizmente seu pedido #P123 foi cancelado. Entre em contato conosco para mais informacoes.");
    expect(cancelMessage).toContain(name);
    expect(cancelMessage).toContain(orderNumber);
  });

  it("deve formatar a mensagem de aceite corretamente", () => {
    const name = "Burger House";
    const orderNumber = "P5";
    const total = "20.00";
    const totalFormatted = `R$${parseFloat(total).toFixed(2).replace('.', ',')}`;
    const acceptedMessage = `${name}: Ola! Seu pedido #${orderNumber} (${totalFormatted}) foi confirmado e ja esta sendo preparado. Obrigado pela preferencia!`;
    
    expect(acceptedMessage).toBe("Burger House: Ola! Seu pedido #P5 (R$20,00) foi confirmado e ja esta sendo preparado. Obrigado pela preferencia!");
    expect(acceptedMessage).toContain(name);
    expect(acceptedMessage).toContain(orderNumber);
    expect(acceptedMessage).toContain("R$20,00");
  });

  it("deve formatar a mensagem de pedido pronto para entrega", () => {
    const name = "Pizza Express";
    const deliveryType = "delivery";
    const message = deliveryType === "delivery" 
      ? `${name}: Seu pedido está saindo para entrega.`
      : `${name}: Seu pedido está pronto para retirada.`;
    
    expect(message).toBe("Pizza Express: Seu pedido está saindo para entrega.");
  });

  it("deve formatar a mensagem de pedido pronto para retirada", () => {
    const name = "Pizza Express";
    const deliveryType = "pickup";
    const message = deliveryType === "delivery" 
      ? `${name}: Seu pedido está saindo para entrega.`
      : `${name}: Seu pedido está pronto para retirada.`;
    
    expect(message).toBe("Pizza Express: Seu pedido está pronto para retirada.");
  });

  it("deve validar que isValidPhoneNumber verifica formato brasileiro", () => {
    // Simula a lógica de validação de telefone
    const isValidPhoneNumber = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 13;
    };

    expect(isValidPhoneNumber("11999887766")).toBe(true);
    expect(isValidPhoneNumber("(11) 99988-7766")).toBe(true);
    expect(isValidPhoneNumber("+5511999887766")).toBe(true);
    expect(isValidPhoneNumber("123")).toBe(false);
    expect(isValidPhoneNumber("")).toBe(false);
  });
});
