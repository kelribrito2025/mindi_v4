import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import the generateStatusMessage function for testing
import { generateStatusMessage } from './_core/uazapi';

describe('Cashback WhatsApp Notification', () => {
  
  describe('generateStatusMessage with cashback info', () => {
    
    it('should append cashback block when status is completed and cashback > 0', () => {
      const message = generateStatusMessage(
        'completed',
        '#001',
        'João',
        'Restaurante Teste',
        null, // use default template
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '3.50', cashbackTotal: '15.80' }
      );
      
      expect(message).toContain('Cashback ganho: R$3,50');
      expect(message).toContain('Cashback acumulado: R$15,80');
      expect(message).toContain('💰');
    });
    
    it('should NOT append cashback block when cashbackEarned is 0', () => {
      const message = generateStatusMessage(
        'completed',
        '#002',
        'Maria',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '0.00', cashbackTotal: '10.00' }
      );
      
      expect(message).not.toContain('Cashback ganho');
      expect(message).not.toContain('💰');
    });
    
    it('should NOT append cashback block when cashbackInfo is null', () => {
      const message = generateStatusMessage(
        'completed',
        '#003',
        'Pedro',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        null
      );
      
      expect(message).not.toContain('Cashback ganho');
      expect(message).not.toContain('💰');
    });
    
    it('should NOT append cashback block for non-completed status', () => {
      const message = generateStatusMessage(
        'preparing',
        '#004',
        'Ana',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '5.00', cashbackTotal: '20.00' }
      );
      
      expect(message).not.toContain('Cashback ganho');
      expect(message).not.toContain('💰');
    });
    
    it('should replace {{cashbackEarned}} and {{cashbackTotal}} in custom template', () => {
      const customTemplate = `Pedido {{orderNumber}} finalizado!\n\n{{cashbackEarned}}\n{{cashbackTotal}}\n\n{{establishmentName}}`;
      
      const message = generateStatusMessage(
        'completed',
        '#005',
        'Carlos',
        'Restaurante Teste',
        customTemplate,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '2.75', cashbackTotal: '8.25' }
      );
      
      expect(message).toContain('Cashback ganho: R$2,75');
      expect(message).toContain('Cashback acumulado: R$8,25');
      // Should NOT duplicate the cashback block since template already uses the variables
      const cashbackCount = (message.match(/Cashback ganho: R\$/g) || []).length;
      expect(cashbackCount).toBe(1);
    });
    
    it('should format values with 2 decimal places and comma separator (BR format)', () => {
      const message = generateStatusMessage(
        'completed',
        '#006',
        'Lucas',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '1.5', cashbackTotal: '0' }
      );
      
      expect(message).toContain('R$1,50');
    });
    
    it('should show R$0,00 for zero accumulated balance', () => {
      const message = generateStatusMessage(
        'completed',
        '#007',
        'Fernanda',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '3.00', cashbackTotal: '0' }
      );
      
      // cashbackEarned > 0 so block is shown
      expect(message).toContain('Cashback ganho: R$3,00');
      expect(message).toContain('Cashback acumulado: R$0,00');
    });
    
    it('should remove {{cashbackEarned}} and {{cashbackTotal}} from template when no cashback info', () => {
      const customTemplate = `Pedido {{orderNumber}} finalizado!\n\n{{cashbackEarned}}\n{{cashbackTotal}}\n\n{{establishmentName}}`;
      
      const message = generateStatusMessage(
        'completed',
        '#008',
        'Roberto',
        'Restaurante Teste',
        customTemplate,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        null
      );
      
      expect(message).not.toContain('{{cashbackEarned}}');
      expect(message).not.toContain('{{cashbackTotal}}');
    });
    
    it('should NOT have excessive blank lines when cashback variables are removed', () => {
      const customTemplate = `Pedido {{orderNumber}} finalizado!\n\n{{cashbackEarned}}\n{{cashbackTotal}}\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*`;
      
      const message = generateStatusMessage(
        'completed',
        '#009',
        'Sandra',
        'Restaurante Teste',
        customTemplate,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        null
      );
      
      // Should not have 3+ consecutive newlines
      expect(message).not.toMatch(/\n{3,}/);
      // Should still contain the other content
      expect(message).toContain('Pedido #009 finalizado!');
      expect(message).toContain('Obrigado pela preferência!');
      expect(message).toContain('Restaurante Teste');
    });
    
    it('should NOT have excessive blank lines in default template when no cashback', () => {
      const message = generateStatusMessage(
        'completed',
        '#010',
        'Marcos',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        null
      );
      
      // Should not have 3+ consecutive newlines
      expect(message).not.toMatch(/\n{3,}/);
      // Should be trimmed (no leading/trailing whitespace)
      expect(message).toBe(message.trim());
    });
  });
  
  describe('sendOrderStatusNotification interface', () => {
    it('should accept cashbackInfo in data parameter', () => {
      const uazapiSource = readFileSync(join(__dirname, '_core/uazapi.ts'), 'utf-8');
      
      // Verify the function signature includes cashbackInfo
      expect(uazapiSource).toContain('cashbackInfo?:');
      expect(uazapiSource).toContain('cashbackEarned: string');
      expect(uazapiSource).toContain('cashbackTotal: string');
    });
  });
  
  describe('Router passes cashback info on completed status', () => {
    it('should fetch cashback transaction and balance for completed orders', () => {
      const routersSource = readFileSync(join(__dirname, 'routers.ts'), 'utf-8');
      
      // Verify the router fetches cashback info
      expect(routersSource).toContain('getCashbackTransactionByOrderId');
      expect(routersSource).toContain('getCashbackBalance');
      expect(routersSource).toContain('cashbackInfo');
      expect(routersSource).toContain("rewardProgramType === 'cashback'");
    });
  });
  
  describe('getCashbackTransactionByOrderId helper exists', () => {
    it('should be exported from db.ts', () => {
      const dbSource = readFileSync(join(__dirname, 'db.ts'), 'utf-8');
      
      expect(dbSource).toContain('export async function getCashbackTransactionByOrderId');
      expect(dbSource).toContain('cashbackTransactions');
      expect(dbSource).toContain('type, "credit"');
    });
  });
  
  describe('Default template for completed orders', () => {
    it('should exist in db.ts', () => {
      const dbSource = readFileSync(join(__dirname, 'db.ts'), 'utf-8');
      
      expect(dbSource).toContain('defaultTemplateCompleted');
      expect(dbSource).toContain('foi finalizado');
    });
  });

  describe('{{totalPagamento}} variable', () => {
    it('should replace {{totalPagamento}} with total and payment method', () => {
      const template = 'Pedido {{orderNumber}}\n\n{{totalPagamento}}\n\n{{establishmentName}}';
      const message = generateStatusMessage(
        'completed',
        '#100',
        'Carlos',
        'Sushi Haruno',
        template,
        null,
        null,
        [{ productName: 'Pizza', quantity: 1, unitPrice: '50.00', totalPrice: '50.00' }],
        '129.00',
        undefined,
        'pix',
        undefined,
        null
      );
      
      expect(message).toContain('Total: R$ 129,00');
      expect(message).toContain('Pagamento via:');
      expect(message).toContain('PIX');
      expect(message).toContain('\ud83e\uddfe'); // receipt emoji
      expect(message).toContain('\ud83d\udcb0'); // money bag emoji
    });

    it('should show only total when no payment method', () => {
      const template = 'Pedido {{orderNumber}}\n\n{{totalPagamento}}';
      const message = generateStatusMessage(
        'completed',
        '#101',
        'Ana',
        'Restaurante',
        template,
        null,
        null,
        [{ productName: 'Burger', quantity: 1, unitPrice: '30.00', totalPrice: '30.00' }],
        '30.00',
        undefined,
        null, // no payment method
        undefined,
        null
      );
      
      expect(message).toContain('Total: R$ 30,00');
      expect(message).not.toContain('Pagamento via');
    });

    it('should be empty when no total and no payment method', () => {
      const template = 'Pedido {{orderNumber}}\n\n{{totalPagamento}}\n\nObrigado!';
      const message = generateStatusMessage(
        'completed',
        '#102',
        'Pedro',
        'Restaurante',
        template,
        null,
        null,
        null,
        null, // no total
        undefined,
        null, // no payment method
        undefined,
        null
      );
      
      expect(message).not.toContain('Total:');
      expect(message).not.toContain('Pagamento via');
      expect(message).toContain('Obrigado!');
    });

    it('should handle cash payment method', () => {
      const template = '{{totalPagamento}}';
      const message = generateStatusMessage(
        'completed',
        '#103',
        'Lucia',
        'Restaurante',
        template,
        null,
        null,
        [{ productName: 'Salada', quantity: 1, unitPrice: '25.00', totalPrice: '25.00' }],
        '25.00',
        undefined,
        'cash',
        undefined,
        null
      );
      
      expect(message).toContain('Total: R$ 25,00');
      expect(message).toContain('Dinheiro');
    });
  });
});
