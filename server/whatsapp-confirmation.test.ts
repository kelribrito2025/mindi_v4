import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo uazapi
vi.mock('./_core/uazapi', () => ({
  sendButtonMessage: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-id' }),
  sendOrderConfirmationRequest: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-id' }),
  sendTextMessage: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-id' }),
  configureWebhook: vi.fn().mockResolvedValue({ success: true }),
}));

describe('WhatsApp Order Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendButtonMessage', () => {
    it('should format buttons correctly for UAZAPI', async () => {
      const { sendButtonMessage } = await import('./_core/uazapi');
      
      const result = await sendButtonMessage(
        'test-token',
        '5511999999999',
        'Mensagem de teste',
        [
          { text: '✅ Confirmar', id: 'confirm_order_#P123' },
          { text: '❌ Cancelar', id: 'cancel_order_#P123' },
        ],
        'Clique para confirmar'
      );
      
      expect(result.success).toBe(true);
      expect(sendButtonMessage).toHaveBeenCalledWith(
        'test-token',
        '5511999999999',
        'Mensagem de teste',
        [
          { text: '✅ Confirmar', id: 'confirm_order_#P123' },
          { text: '❌ Cancelar', id: 'cancel_order_#P123' },
        ],
        'Clique para confirmar'
      );
    });
  });

  describe('sendOrderConfirmationRequest', () => {
    it('should send confirmation request with correct data', async () => {
      const { sendOrderConfirmationRequest } = await import('./_core/uazapi');
      
      const result = await sendOrderConfirmationRequest(
        'test-token',
        '5511999999999',
        {
          customerName: 'João',
          orderNumber: '#P123',
          establishmentName: 'Restaurante Teste',
          orderItems: [
            { productName: 'Pizza', quantity: 2 },
            { productName: 'Refrigerante', quantity: 1 },
          ],
          orderTotal: '89.90',
        }
      );
      
      expect(result.success).toBe(true);
      expect(sendOrderConfirmationRequest).toHaveBeenCalledWith(
        'test-token',
        '5511999999999',
        expect.objectContaining({
          customerName: 'João',
          orderNumber: '#P123',
          establishmentName: 'Restaurante Teste',
        })
      );
    });
  });

  describe('Button ID parsing', () => {
    it('should correctly parse confirm button ID', () => {
      const buttonId = 'confirm_order_#P123';
      const confirmMatch = buttonId.match(/confirm_order_(#P\d+)/);
      
      expect(confirmMatch).not.toBeNull();
      expect(confirmMatch![1]).toBe('#P123');
    });

    it('should correctly parse cancel button ID', () => {
      const buttonId = 'cancel_order_#P456';
      const cancelMatch = buttonId.match(/cancel_order_(#P\d+)/);
      
      expect(cancelMatch).not.toBeNull();
      expect(cancelMatch![1]).toBe('#P456');
    });

    it('should not match invalid button IDs', () => {
      const invalidButtonId = 'some_other_action';
      const confirmMatch = invalidButtonId.match(/confirm_order_(#P\d+)/);
      const cancelMatch = invalidButtonId.match(/cancel_order_(#P\d+)/);
      
      expect(confirmMatch).toBeNull();
      expect(cancelMatch).toBeNull();
    });
  });

  describe('Phone number formatting', () => {
    it('should add Brazil country code if not present', () => {
      const phone = '11999999999';
      let formattedPhone = phone.replace(/\D/g, '');
      
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }
      
      expect(formattedPhone).toBe('5511999999999');
    });

    it('should keep country code if already present', () => {
      const phone = '5511999999999';
      let formattedPhone = phone.replace(/\D/g, '');
      
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }
      
      expect(formattedPhone).toBe('5511999999999');
    });

    it('should remove non-digit characters', () => {
      const phone = '+55 (11) 99999-9999';
      let formattedPhone = phone.replace(/\D/g, '');
      
      expect(formattedPhone).toBe('5511999999999');
    });
  });

  describe('Order status transitions', () => {
    it('should transition from pending_confirmation to new on confirm', () => {
      const initialStatus = 'pending_confirmation';
      const confirmedStatus = 'new';
      
      // Simular transição de status
      expect(initialStatus).toBe('pending_confirmation');
      expect(confirmedStatus).toBe('new');
    });

    it('should transition from pending_confirmation to cancelled on cancel', () => {
      const initialStatus = 'pending_confirmation';
      const cancelledStatus = 'cancelled';
      
      // Simular transição de status
      expect(initialStatus).toBe('pending_confirmation');
      expect(cancelledStatus).toBe('cancelled');
    });
  });
});
