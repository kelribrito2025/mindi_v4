import { describe, it, expect } from 'vitest';
import { 
  EscPosGenerator, 
  generatePlainTextReceipt, 
  generateEscPosReceipt,
  INIT,
  ALIGN_CENTER,
  BOLD_ON,
  BOLD_OFF,
  TEXT_2X,
  TEXT_NORMAL,
  CUT_FEED_PARTIAL,
  LF
} from './escpos';

describe('ESC/POS Generator', () => {
  describe('EscPosGenerator class', () => {
    it('should initialize with default config', () => {
      const generator = new EscPosGenerator();
      expect(generator).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const generator = new EscPosGenerator({
        paperWidth: '58mm',
        showDividers: false
      });
      expect(generator).toBeDefined();
    });

    it('should generate init command', () => {
      const generator = new EscPosGenerator();
      const result = generator.init().build();
      expect(result).toContain(INIT);
    });

    it('should generate alignment commands', () => {
      const generator = new EscPosGenerator();
      const result = generator.align('center').build();
      expect(result).toContain(ALIGN_CENTER);
    });

    it('should generate bold commands', () => {
      const generator = new EscPosGenerator();
      const result = generator.bold(true).text('Test').bold(false).build();
      expect(result).toContain(BOLD_ON);
      expect(result).toContain('Test');
      expect(result).toContain(BOLD_OFF);
    });

    it('should generate size commands', () => {
      const generator = new EscPosGenerator();
      const result = generator.size('2x').text('Big').size('normal').build();
      expect(result).toContain(TEXT_2X);
      expect(result).toContain(TEXT_NORMAL);
    });

    it('should add line feed', () => {
      const generator = new EscPosGenerator();
      const result = generator.line('Test line').build();
      expect(result).toContain('Test line');
      expect(result).toContain(LF);
    });

    it('should add divider for 80mm paper', () => {
      const generator = new EscPosGenerator({ paperWidth: '80mm', showDividers: true });
      const result = generator.divider('-').build();
      expect(result).toContain('-'.repeat(48)); // 48 chars for 80mm
    });

    it('should add divider for 58mm paper', () => {
      const generator = new EscPosGenerator({ paperWidth: '58mm', showDividers: true });
      const result = generator.divider('-').build();
      expect(result).toContain('-'.repeat(32)); // 32 chars for 58mm
    });

    it('should not add divider when showDividers is false', () => {
      const generator = new EscPosGenerator({ showDividers: false });
      const result = generator.divider('-').build();
      expect(result).toBe('');
    });

    it('should generate cut command', () => {
      const generator = new EscPosGenerator();
      const result = generator.cut().build();
      expect(result).toContain(CUT_FEED_PARTIAL);
    });

    it('should normalize accented characters', () => {
      const generator = new EscPosGenerator();
      const result = generator.line('João Açúcar Café').build();
      expect(result).toContain('Joao Acucar Cafe');
      expect(result).not.toContain('ã');
      expect(result).not.toContain('ç');
      expect(result).not.toContain('ú');
      expect(result).not.toContain('é');
    });

    it('should generate left-right aligned text', () => {
      const generator = new EscPosGenerator({ paperWidth: '80mm' });
      const result = generator.leftRight('Item', 'R$ 10,00').build();
      expect(result).toContain('Item');
      expect(result).toContain('R$ 10,00');
    });

    it('should clear buffer', () => {
      const generator = new EscPosGenerator();
      generator.line('Test').clear();
      const result = generator.build();
      expect(result).toBe('');
    });
  });

  describe('generatePlainTextReceipt', () => {
    const sampleOrder = {
      orderNumber: 'P123',
      createdAt: new Date('2024-01-15T14:30:00'),
      deliveryType: 'delivery' as const,
      customerName: 'João Silva',
      customerPhone: '11999998888',
      address: 'Rua das Flores, 123',
      paymentMethod: 'pix',
      items: [
        {
          productName: 'X-Burger',
          quantity: 2,
          totalPrice: 50.00,
          notes: 'Sem cebola',
        },
        {
          productName: 'Batata Frita',
          quantity: 1,
          totalPrice: 15.00,
        }
      ],
      subtotal: 65.00,
      deliveryFee: 5.00,
      total: 70.00,
    };

    const sampleEstablishment = {
      name: 'Hamburgueria do João',
    };

    it('should generate plain text receipt for 80mm paper', () => {
      const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment, '80mm');
      
      expect(receipt).toContain('HAMBURGUERIA DO JOAO'); // Normalized + uppercase
      expect(receipt).toContain('P123');
      expect(receipt).toContain('ENTREGA');
      expect(receipt).toContain('Joao Silva'); // Normalized
      // Items without complements should have price on same line
      expect(receipt).toContain('2x X-BURGER');
      expect(receipt).toContain('R$ 50,00');
      expect(receipt).toContain('1x BATATA FRITA');
      expect(receipt).toContain('R$ 15,00');
      expect(receipt).toContain('Subtotal:');
      expect(receipt).toContain('R$ 65,00');
      expect(receipt).toContain('Taxa entrega:');
      expect(receipt).toContain('R$ 5,00');
      expect(receipt).toContain('TOTAL');
      expect(receipt).toContain('R$ 70,00');
      expect(receipt).toContain('PIX');
      expect(receipt).toContain('Obrigado pela preferencia!');
      // Verify items without complements have price on same line
      const lines = receipt.split('\n');
      const burgerLine = lines.find(l => l.includes('2x X-BURGER'));
      expect(burgerLine).toContain('R$ 50,00');
      const friesLine = lines.find(l => l.includes('1x BATATA FRITA'));
      expect(friesLine).toContain('R$ 15,00');
    });

    it('should generate plain text receipt for 58mm paper', () => {
      const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment, '58mm');
      
      // 58mm paper has 32 chars per line
      expect(receipt).toContain('-'.repeat(32));
      expect(receipt).toContain('P123');
    });

    it('should handle pickup delivery type', () => {
      const pickupOrder = { ...sampleOrder, deliveryType: 'pickup' as const };
      const receipt = generatePlainTextReceipt(pickupOrder, sampleEstablishment, '80mm');
      
      expect(receipt).toContain('RETIRADA');
      expect(receipt).not.toContain('ENDERECO DE ENTREGA');
    });

    it('should handle dine_in delivery type', () => {
      const dineInOrder = { ...sampleOrder, deliveryType: 'dine_in' as const };
      const receipt = generatePlainTextReceipt(dineInOrder, sampleEstablishment, '80mm');
      
      expect(receipt).toContain('CONSUMO');
    });

    it('should handle cash payment with change', () => {
      const cashOrder = { 
        ...sampleOrder, 
        paymentMethod: 'cash',
        changeFor: 100.00
      };
      const receipt = generatePlainTextReceipt(cashOrder, sampleEstablishment, '80mm');
      
      expect(receipt).toContain('DINHEIRO');
      expect(receipt).toContain('Troco para: R$ 100,00');
      expect(receipt).toContain('Troco a devolver: R$ 30,00');
    });

    it('should handle discount', () => {
      const discountOrder = { 
        ...sampleOrder, 
        discount: 10.00,
        total: 60.00
      };
      const receipt = generatePlainTextReceipt(discountOrder, sampleEstablishment, '80mm');
      
      expect(receipt).toContain('Desconto:');
      expect(receipt).toContain('-R$ 10,00');
    });

    it('should handle item with complements', () => {
      const orderWithComplements = {
        ...sampleOrder,
        items: [
          {
            productName: 'X-Burger',
            quantity: 1,
            totalPrice: 30.00,
            complements: JSON.stringify([
              { name: 'Bacon extra', price: 5.00 },
              { name: 'Queijo cheddar', price: 3.00 }
            ])
          }
        ]
      };
      const receipt = generatePlainTextReceipt(orderWithComplements, sampleEstablishment, '80mm');
      
      expect(receipt).toContain('+ Bacon extra');
      expect(receipt).toContain('R$ 5,00');
      expect(receipt).toContain('+ Queijo cheddar');
      expect(receipt).toContain('R$ 3,00');
    });

    it('should handle item observations', () => {
      const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment, '80mm');
      expect(receipt).toContain('Obs: Sem cebola');
    });
  });

  describe('generateEscPosReceipt', () => {
    const sampleOrder = {
      orderNumber: 'P456',
      createdAt: new Date('2024-01-15T14:30:00'),
      deliveryType: 'pickup' as const,
      customerName: 'Maria Santos',
      customerPhone: '11888887777',
      paymentMethod: 'card',
      items: [
        {
          productName: 'Pizza Margherita',
          quantity: 1,
          totalPrice: 45.00,
        }
      ],
      subtotal: 45.00,
      total: 45.00,
    };

    const sampleEstablishment = {
      name: 'Pizzaria Bella',
    };

    it('should generate ESC/POS receipt string', () => {
      const receipt = generateEscPosReceipt(sampleOrder, sampleEstablishment);
      
      expect(receipt).toBeDefined();
      expect(typeof receipt).toBe('string');
      expect(receipt.length).toBeGreaterThan(0);
      // Should contain init command
      expect(receipt).toContain(INIT);
    });

    it('should respect paper width config', () => {
      const receipt58 = generateEscPosReceipt(sampleOrder, sampleEstablishment, { paperWidth: '58mm' });
      const receipt80 = generateEscPosReceipt(sampleOrder, sampleEstablishment, { paperWidth: '80mm' });
      
      // Both should be valid but may differ in formatting
      expect(receipt58).toBeDefined();
      expect(receipt80).toBeDefined();
    });
  });

  describe('Payment method translations', () => {
    const baseOrder = {
      orderNumber: 'P789',
      createdAt: new Date(),
      deliveryType: 'pickup' as const,
      items: [{ productName: 'Item', quantity: 1, totalPrice: 10.00 }],
      subtotal: 10.00,
      total: 10.00,
    };

    const establishment = { name: 'Test' };

    it('should translate cash payment', () => {
      const receipt = generatePlainTextReceipt({ ...baseOrder, paymentMethod: 'cash' }, establishment, '80mm');
      expect(receipt).toContain('DINHEIRO');
    });

    it('should translate credit card payment', () => {
      const receipt = generatePlainTextReceipt({ ...baseOrder, paymentMethod: 'credit' }, establishment, '80mm');
      expect(receipt).toContain('CARTAO CREDITO');
    });

    it('should translate debit card payment', () => {
      const receipt = generatePlainTextReceipt({ ...baseOrder, paymentMethod: 'debit' }, establishment, '80mm');
      expect(receipt).toContain('CARTAO DEBITO');
    });

    it('should translate PIX payment', () => {
      const receipt = generatePlainTextReceipt({ ...baseOrder, paymentMethod: 'pix' }, establishment, '80mm');
      expect(receipt).toContain('PIX');
    });

    it('should translate boleto payment', () => {
      const receipt = generatePlainTextReceipt({ ...baseOrder, paymentMethod: 'boleto' }, establishment, '80mm');
      expect(receipt).toContain('BOLETO');
    });
  });
});
