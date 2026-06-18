import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateStatusMessage } from './_core/uazapi';

describe('WhatsApp Integration', () => {
  describe('generateStatusMessage', () => {
    it('should generate message with default template for new order', () => {
      const message = generateStatusMessage(
        'new',
        '#P123',
        'João',
        'Restaurante Teste'
      );
      
      expect(message).toContain('João');
      expect(message).toContain('#P123');
      expect(message).toContain('Restaurante Teste');
      expect(message).toContain('recebido');
    });
    
    it('should generate message with default template for preparing', () => {
      const message = generateStatusMessage(
        'preparing',
        '#P456',
        'Maria',
        'Pizzaria'
      );
      
      expect(message).toContain('Maria');
      expect(message).toContain('#P456');
      expect(message).toContain('Pizzaria');
      expect(message).toContain('preparado');
    });
    
    it('should generate message with default template for ready', () => {
      const message = generateStatusMessage(
        'ready',
        '#P789',
        'Carlos',
        'Sushi Bar'
      );
      
      expect(message).toContain('Carlos');
      expect(message).toContain('#P789');
      expect(message).toContain('Sushi Bar');
      expect(message).toContain('pronto');
    });
    
    it('should generate message with default template for completed', () => {
      const message = generateStatusMessage(
        'completed',
        '#P101',
        'Ana',
        'Burger House'
      );
      
      expect(message).toContain('#P101');
      expect(message).toContain('Burger House');
      expect(message).toContain('finalizado');
      expect(message).toContain('Obrigado pela preferência');
    });
    
    it('should generate message with default template for cancelled', () => {
      const message = generateStatusMessage(
        'cancelled',
        '#P202',
        'Pedro',
        'Café Central'
      );
      
      expect(message).toContain('Pedro');
      expect(message).toContain('#P202');
      expect(message).toContain('Café Central');
      expect(message).toContain('cancelado');
    });
    
    it('should use custom template when provided', () => {
      const customTemplate = 'Olá {{customerName}}, seu pedido {{orderNumber}} está na {{establishmentName}}!';
      
      const message = generateStatusMessage(
        'ready',
        '#P303',
        'Lucas',
        'Padaria',
        customTemplate
      );
      
      expect(message).toBe('Olá Lucas, seu pedido #P303 está na Padaria!');
    });
    
    it('should replace all occurrences of placeholders', () => {
      const customTemplate = '{{customerName}} - {{customerName}} - {{orderNumber}} - {{orderNumber}}';
      
      const message = generateStatusMessage(
        'new',
        '#P404',
        'Julia',
        'Lanchonete',
        customTemplate
      );
      
      expect(message).toBe('Julia - Julia - #P404 - #P404');
    });
    
    it('should handle empty customer name gracefully', () => {
      const message = generateStatusMessage(
        'new',
        '#P505',
        '',
        'Restaurante'
      );
      
      expect(message).toContain('#P505');
      expect(message).toContain('Restaurante');
    });

    it('should include payment method in itensPedido when provided', () => {
      const template = '{{itensPedido}}';
      const message = generateStatusMessage(
        'new',
        '#P600',
        'Ana',
        'Restaurante',
        template,
        undefined, // deliveryType
        undefined, // cancellationReason
        [{ productName: 'Pizza', quantity: 1, unitPrice: '30.00', totalPrice: '30.00' }],
        '30.00',
        undefined, // timezone
        'pix'
      );
      
      expect(message).toContain('Total: R$ 30,00');
      expect(message).toContain('Pagamento via: *PIX*');
    });

    it('should include payment method as Cartão for credit', () => {
      const template = '{{itensPedido}}';
      const message = generateStatusMessage(
        'new',
        '#P601',
        'Bruno',
        'Restaurante',
        template,
        undefined,
        undefined,
        [{ productName: 'Hambúrguer', quantity: 2, unitPrice: '20.00', totalPrice: '40.00' }],
        '40.00',
        undefined,
        'credit'
      );
      
      expect(message).toContain('Pagamento via: *Cartão*');
    });

    it('should include payment method as Dinheiro for cash', () => {
      const template = '{{itensPedido}}';
      const message = generateStatusMessage(
        'new',
        '#P602',
        'Carlos',
        'Restaurante',
        template,
        undefined,
        undefined,
        [{ productName: 'Suco', quantity: 1, unitPrice: '10.00', totalPrice: '10.00' }],
        '10.00',
        undefined,
        'cash'
      );
      
      expect(message).toContain('Pagamento via: *Dinheiro*');
    });

    it('should not include payment method when not provided', () => {
      const template = '{{itensPedido}}';
      const message = generateStatusMessage(
        'new',
        '#P603',
        'Diana',
        'Restaurante',
        template,
        undefined,
        undefined,
        [{ productName: 'Açaí', quantity: 1, unitPrice: '25.00', totalPrice: '25.00' }],
        '25.00'
      );
      
      expect(message).toContain('Total: R$ 25,00');
      expect(message).not.toContain('Pagamento via');
    });
  });
});
