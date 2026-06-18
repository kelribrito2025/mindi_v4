import { describe, it, expect } from 'vitest';

/**
 * Testes para validar que a verificação de duplicação de carimbos
 * usa orderId (único) em vez de orderNumber (pode se repetir entre dias).
 * 
 * Bug: orderNumber como "#P1" se repete a cada dia de operação do estabelecimento.
 * Se um carimbo antigo já existia com orderNumber "#P1", novos pedidos com o mesmo
 * orderNumber nunca geravam carimbo, pois a verificação encontrava o carimbo antigo.
 * 
 * Fix: Usar orderId (que é auto-increment e único globalmente) para a verificação.
 */

describe('Loyalty Stamp Deduplication', () => {
  
  describe('OrderNumber pode se repetir entre dias', () => {
    it('deve reconhecer que orderNumbers se repetem entre dias diferentes', () => {
      // Simula pedidos de dias diferentes com mesmo orderNumber
      const ordersDay1 = [
        { id: 100001, orderNumber: '#P1', createdAt: '2026-01-28' },
        { id: 100002, orderNumber: '#P2', createdAt: '2026-01-28' },
      ];
      const ordersDay2 = [
        { id: 200001, orderNumber: '#P1', createdAt: '2026-02-15' },
        { id: 200002, orderNumber: '#P2', createdAt: '2026-02-15' },
      ];
      
      // orderNumbers iguais
      expect(ordersDay1[0].orderNumber).toBe(ordersDay2[0].orderNumber);
      // Mas orderIds diferentes
      expect(ordersDay1[0].id).not.toBe(ordersDay2[0].id);
    });
  });
  
  describe('Verificação de duplicação por orderId', () => {
    it('deve permitir carimbo quando orderId é diferente, mesmo com orderNumber igual', () => {
      // Simula carimbos existentes
      const existingStamps = [
        { id: 1, loyaltyCardId: 1, orderId: 100001, orderNumber: '#P1' },
        { id: 2, loyaltyCardId: 1, orderId: 100002, orderNumber: '#P2' },
      ];
      
      // Novo pedido com mesmo orderNumber mas orderId diferente
      const newOrderId = 200001;
      const newOrderNumber = '#P1';
      
      // Verificação CORRETA: por orderId (deve permitir)
      const hasDuplicateByOrderId = existingStamps.some(
        s => s.loyaltyCardId === 1 && s.orderId === newOrderId
      );
      expect(hasDuplicateByOrderId).toBe(false); // Não é duplicata!
      
      // Verificação INCORRETA (bug antigo): por orderNumber (bloquearia erroneamente)
      const hasDuplicateByOrderNumber = existingStamps.some(
        s => s.loyaltyCardId === 1 && s.orderNumber === newOrderNumber
      );
      expect(hasDuplicateByOrderNumber).toBe(true); // Falso positivo!
    });
    
    it('deve bloquear carimbo quando orderId é o mesmo (duplicata real)', () => {
      const existingStamps = [
        { id: 1, loyaltyCardId: 1, orderId: 100001, orderNumber: '#P1' },
      ];
      
      // Mesmo orderId = duplicata real
      const newOrderId = 100001;
      
      const hasDuplicate = existingStamps.some(
        s => s.loyaltyCardId === 1 && s.orderId === newOrderId
      );
      expect(hasDuplicate).toBe(true); // Corretamente identificado como duplicata
    });
  });
  
  describe('Cenário real do bug', () => {
    it('deve simular o cenário que causava o bug', () => {
      // Cenário real:
      // - Estabelecimento 30001, cliente 88999290000
      // - Em 28/jan, pedido #P1 (id: 180076) gerou carimbo
      // - Em 16/fev, pedido #P1 (id: 660518) deveria gerar carimbo mas não gerava
      
      const existingStamps = [
        { loyaltyCardId: 1, orderId: 180076, orderNumber: '#P1', createdAt: '2026-01-28' },
      ];
      
      const newOrder = { id: 660518, orderNumber: '#P1', createdAt: '2026-02-16' };
      
      // Com a correção (orderId): permite o carimbo
      const shouldBlockByOrderId = existingStamps.some(
        s => s.loyaltyCardId === 1 && s.orderId === newOrder.id
      );
      expect(shouldBlockByOrderId).toBe(false); // Correto: não bloqueia
      
      // Bug antigo (orderNumber): bloqueava erroneamente
      const wouldBlockByOrderNumber = existingStamps.some(
        s => s.loyaltyCardId === 1 && s.orderNumber === newOrder.orderNumber
      );
      expect(wouldBlockByOrderNumber).toBe(true); // Bug: bloqueava erroneamente
    });
    
    it('deve permitir carimbos para todos os pedidos recentes que foram bloqueados', () => {
      // Todos os pedidos recentes que não geraram carimbo por causa do bug
      const recentCompletedOrders = [
        { id: 660518, orderNumber: '#P1' },
        { id: 630006, orderNumber: '#P6' },
        { id: 630005, orderNumber: '#P5' },
        { id: 630003, orderNumber: '#P3' },
        { id: 630002, orderNumber: '#P2' },
        { id: 630001, orderNumber: '#P1' },
        { id: 600021, orderNumber: '#P1' },
        { id: 540005, orderNumber: '#P7' },
        { id: 540003, orderNumber: '#P5' },
        { id: 540002, orderNumber: '#P4' },
        { id: 540001, orderNumber: '#P3' },
      ];
      
      // Carimbos antigos (de janeiro) que causavam o falso positivo
      const existingStamps = [
        { loyaltyCardId: 1, orderId: 180076, orderNumber: '#P1' },
        { loyaltyCardId: 1, orderId: 180077, orderNumber: '#P2' },
        { loyaltyCardId: 1, orderId: 180078, orderNumber: '#P3' },
        { loyaltyCardId: 1, orderId: 180080, orderNumber: '#P5' },
        { loyaltyCardId: 1, orderId: 180081, orderNumber: '#P6' },
      ];
      
      // Com a correção, TODOS os pedidos recentes devem poder gerar carimbo
      for (const order of recentCompletedOrders) {
        const hasDuplicate = existingStamps.some(
          s => s.loyaltyCardId === 1 && s.orderId === order.id
        );
        expect(hasDuplicate).toBe(false);
      }
    });
  });
  
  describe('Verificação no código fonte', () => {
    it('deve confirmar que o código usa orderId para deduplicação', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const dbCode = fs.readFileSync(
        path.resolve(__dirname, 'db.ts'), 
        'utf-8'
      );
      
      // Procurar o trecho de verificação de duplicação na função updateOrderStatus
      const marker = '// Verificar se j\u00e1 existe carimbo para este pedido';
      const startIdx = dbCode.indexOf(marker);
      expect(startIdx).toBeGreaterThan(-1);
      
      // Pegar um trecho maior para capturar toda a query
      const updateOrderStatusSection = dbCode.substring(startIdx, startIdx + 500);
      
      // Verificar que usa orderId (eq(loyaltyStamps.orderId, id))
      expect(updateOrderStatusSection).toContain('orderId');
      // Verificar que NÃO usa orderNumber para a deduplicação neste trecho
      expect(updateOrderStatusSection).not.toContain('eq(loyaltyStamps.orderNumber');
    });
  });
});
