import { describe, it, expect } from 'vitest';
import { buildDriverDeliveryMessage, buildGoogleMapsUrl } from './driverMessage';
import { buildDriverButtons, buildDeliveryStartedButtons } from './driverButtons';

describe('buildDriverDeliveryMessage', () => {
  const baseOrder = {
    orderNumber: '#P3',
    customerName: 'Kelri',
    customerPhone: '88 99929-0000',
    customerAddress: 'fdsf, 234, Bairro do Cruzeiro (Ref: fdsf)',
    paymentMethod: 'cash',
    total: '92.00',
    deliveryFee: '2.00',
    notes: null,
    changeAmount: null,
  };

  it('should include NOVA ENTREGA header with emoji', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('*NOVA ENTREGA!*');
    expect(msg).toContain('🛵');
  });

  it('should include order number without double hash', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Pedido: #P3');
    expect(msg).not.toContain('##P3');
  });

  it('should include customer name and phone', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Cliente: Kelri');
    expect(msg).toContain('Telefone: 88 99929-0000');
  });

  it('should parse address into structured format with street, neighborhood, and reference', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('*Endereço:*');
    expect(msg).toContain('fdsf, 234');
    expect(msg).toContain('Bairro do Cruzeiro');
    expect(msg).toContain('Ref: fdsf');
  });

  it('should show "Dinheiro" for cash payment', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Pagamento: Dinheiro');
  });

  it('should show total and delivery fee', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Total: R$ 92,00');
    expect(msg).toContain('Taxa de entrega: R$ 2,00');
  });

  it('should show "Troco: Não precisa" when cash payment with no changeAmount', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('💵');
    expect(msg).toContain('*Troco:* Não precisa');
  });

  it('should show troco value when cash payment with changeAmount', () => {
    const order = { ...baseOrder, changeAmount: '100.00' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('💵');
    expect(msg).toContain('*Troco para:* R$ 100,00');
    expect(msg).not.toContain('Não precisa');
  });

  it('should NOT show troco info when payment is card', () => {
    const order = { ...baseOrder, paymentMethod: 'card', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Cartão');
    expect(msg).not.toContain('Troco');
    expect(msg).not.toContain('💵');
  });

  it('should NOT show troco info when payment is pix', () => {
    const order = { ...baseOrder, paymentMethod: 'pix', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Pix');
    expect(msg).not.toContain('Troco');
    expect(msg).not.toContain('💵');
  });

  it('should show card_online as "Cartão Online"', () => {
    const order = { ...baseOrder, paymentMethod: 'card_online', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Cartão Online');
  });

  it('should show boleto as "Boleto"', () => {
    const order = { ...baseOrder, paymentMethod: 'boleto', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Boleto');
  });

  it('should include notes/observations when present', () => {
    const order = { ...baseOrder, notes: 'Sem cebola' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Observações:* Sem cebola');
  });

  it('should NOT include notes section when notes is null', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).not.toContain('Observações');
  });

  it('should NOT include Google Maps link in the message body', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).not.toContain('google.com/maps');
  });

  it('should show N/A for missing address', () => {
    const order = { ...baseOrder, customerAddress: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Endereço:* N/A');
  });

  it('should show N/A for missing customer name', () => {
    const order = { ...baseOrder, customerName: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Cliente: N/A');
  });

  it('should show N/A for missing phone', () => {
    const order = { ...baseOrder, customerPhone: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Telefone: N/A');
  });

  it('should use deliveryFeeOverride when provided', () => {
    const msg = buildDriverDeliveryMessage(baseOrder, 5.50);
    expect(msg).toContain('Taxa de entrega: R$ 5,50');
    expect(msg).not.toContain('Taxa de entrega: R$ 2,00');
  });

  it('should include iFood localizer and confirmation URL for iFood delivery orders', () => {
    const order = {
      ...baseOrder,
      source: 'ifood',
      externalDisplayId: '1234',
      externalData: {
        orderType: 'DELIVERY',
        displayId: '1234',
        merchant: { id: '30001' },
        customer: { phone: { localizer: 'ABCD' } },
      },
    };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Confirmação iFood*');
    expect(msg).toContain('Localizador do pedido: ABCD');
    expect(msg).toContain('Código/Pedido iFood: 1234');
    expect(msg).toContain('https://confirmacao-entrega-propria.ifood.com.br/');
  });

  it('should handle address without reference', () => {
    const order = { ...baseOrder, customerAddress: 'Rua das Flores, 123, Centro' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Rua das Flores, 123');
    expect(msg).toContain('Centro');
    expect(msg).not.toContain('Ref:');
  });

  it('should handle address with complement', () => {
    const order = { ...baseOrder, customerAddress: 'Rua X, 100 - Apto 301, Bairro Y (Ref: perto do mercado)' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Rua X, 100 - Apto 301');
    expect(msg).toContain('Bairro Y');
    expect(msg).toContain('Ref: perto do mercado');
  });

  it('should handle changeAmount with "0" as no change needed', () => {
    const order = { ...baseOrder, changeAmount: '0' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Troco:* Não precisa');
  });

  it('should handle changeAmount with "0.00" as no change needed', () => {
    const order = { ...baseOrder, changeAmount: '0.00' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Troco:* Não precisa');
  });

  it('should format large troco values correctly', () => {
    const order = { ...baseOrder, changeAmount: '200.00' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Troco para:* R$ 200,00');
  });

  it('should produce the expected full message format for cash with troco', () => {
    const order = {
      orderNumber: '#P3',
      customerName: 'Kelri',
      customerPhone: '88 99929-0000',
      customerAddress: 'fdsf, 234, Bairro do Cruzeiro (Ref: fdsf)',
      paymentMethod: 'cash',
      total: '92.00',
      deliveryFee: '2.00',
      notes: null,
      changeAmount: '100.00',
    };
    const msg = buildDriverDeliveryMessage(order);
    
    // Verify key sections are in order
    const novaEntregaIdx = msg.indexOf('*NOVA ENTREGA*');
    const pedidoIdx = msg.indexOf('Pedido:');
    const clienteIdx = msg.indexOf('Cliente:');
    const telefoneIdx = msg.indexOf('Telefone:');
    const enderecoIdx = msg.indexOf('*Endereço:*');
    const pagamentoIdx = msg.indexOf('Pagamento:');
    const totalIdx = msg.indexOf('Total:');
    const taxaIdx = msg.indexOf('Taxa de entrega:');
    const trocoIdx = msg.indexOf('*Troco para:*');
    
    expect(novaEntregaIdx).toBeLessThan(pedidoIdx);
    expect(pedidoIdx).toBeLessThan(clienteIdx);
    expect(clienteIdx).toBeLessThan(telefoneIdx);
    expect(telefoneIdx).toBeLessThan(enderecoIdx);
    expect(enderecoIdx).toBeLessThan(pagamentoIdx);
    expect(pagamentoIdx).toBeLessThan(totalIdx);
    expect(totalIdx).toBeLessThan(taxaIdx);
    expect(taxaIdx).toBeLessThan(trocoIdx);
  });
});

describe('buildGoogleMapsUrl', () => {
  it('should return a valid Google Maps URL for a normal address', () => {
    const url = buildGoogleMapsUrl('Rua Major Felinto, 186, Várzea');
    expect(url).toContain('https://www.google.com/maps/dir/?api=1&destination=');
    expect(url).toContain('Major%20Felinto');
  });

  it('should strip reference (Ref: ...) from the address', () => {
    const url = buildGoogleMapsUrl('Rua X, 123, Centro (Ref: próximo ao mercado)');
    expect(url).not.toContain('mercado');
    expect(url).not.toContain('Ref');
    expect(url).toContain('Rua%20X');
  });

  it('should return null for null address', () => {
    expect(buildGoogleMapsUrl(null)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(buildGoogleMapsUrl('')).toBeNull();
  });

  it('should return null for N/A', () => {
    expect(buildGoogleMapsUrl('N/A')).toBeNull();
  });

  it('should handle address with only reference (edge case)', () => {
    const url = buildGoogleMapsUrl('(Ref: teste)');
    expect(url).toBeNull();
  });
});

describe('buildDriverButtons (nova entrega)', () => {
  it('should include Maps button and Sair para entrega when address is valid', () => {
    const buttons = buildDriverButtons('#P17', 'Rua Major Felinto, 34, Casa verde, Bairro do cruzeiro');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text).toBe('📍 Abrir rota');
    expect(buttons[0].id).toContain('https://www.google.com/maps/dir/');
    expect(buttons[1].text).toBe('🛵 Sair para entrega');
  });

  it('should NOT include "O pedido foi entregue" button', () => {
    const buttons = buildDriverButtons('#P17', 'Rua Major Felinto, 34, Casa verde, Bairro do cruzeiro');
    expect(buttons.find(b => b.text.includes('entregue'))).toBeUndefined();
  });

  it('should NOT include Maps button when address is null', () => {
    const buttons = buildDriverButtons('#P17', null);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text).toBe('🛵 Sair para entrega');
  });

  it('should have Maps button BEFORE Sair para entrega', () => {
    const buttons = buildDriverButtons('#P5', 'Rua Teste, 100, Centro');
    const mapsIdx = buttons.findIndex(b => b.text.includes('rota'));
    const sairIdx = buttons.findIndex(b => b.text.includes('Sair'));
    expect(mapsIdx).toBeLessThan(sairIdx);
  });

  it('should include delivery_start in button id', () => {
    const buttons = buildDriverButtons('#P99', 'Rua X, 1, Centro');
    expect(buttons.find(b => b.id.includes('delivery_start_#P99'))).toBeDefined();
  });
});

describe('buildDeliveryStartedButtons (entrega iniciada)', () => {
  it('should return only the "O pedido foi entregue" button', () => {
    const buttons = buildDeliveryStartedButtons('#P17');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text).toBe('✅ O pedido foi entregue');
    expect(buttons[0].id).toBe('delivery_done_#P17');
  });

  it('should include order number in button id', () => {
    const buttons = buildDeliveryStartedButtons('#P99');
    expect(buttons[0].id).toContain('delivery_done_#P99');
  });

  it('should use the official iFood confirmation URL when provided', () => {
    const buttons = buildDeliveryStartedButtons('#P99', {
      ifoodConfirmationUrl: 'https://confirmacao-entrega-propria.ifood.com.br/',
    });
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text).toBe('✅ O pedido foi entregue');
    expect(buttons[0].id).toBe('https://confirmacao-entrega-propria.ifood.com.br/');
  });
});
