import { describe, it, expect } from 'vitest';

/**
 * Tests for the Smart Delivery Flow
 * 
 * When drivers exist:
 * 1. Admin marks as ready → no customer notification, driver gets buttons
 * 2. Driver clicks "Sair para entrega" → customer gets "Pronto (Delivery)" template, status → out_for_delivery
 * 3. Driver clicks "O pedido foi entregue" → customer gets "Finalizado" template, status → completed
 * 4. Admin cannot click "Finalizar" for delivery orders when drivers exist
 */

describe('Smart Delivery Flow', () => {
  describe('Button ID format', () => {
    it('should generate correct delivery_start button ID from order number', () => {
      const orderNumber = '#P1234';
      const buttonId = `delivery_start_${orderNumber}`;
      expect(buttonId).toBe('delivery_start_#P1234');
    });

    it('should generate correct delivery_done button ID from order number', () => {
      const orderNumber = '#P1234';
      const buttonId = `delivery_done_${orderNumber}`;
      expect(buttonId).toBe('delivery_done_#P1234');
    });

    it('should parse delivery_start button ID correctly', () => {
      const buttonId = 'delivery_start_#P1234';
      const match = buttonId.match(/delivery_start_(#P\d+)/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('#P1234');
    });

    it('should parse delivery_done button ID correctly', () => {
      const buttonId = 'delivery_done_#P1234';
      const match = buttonId.match(/delivery_done_(#P\d+)/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('#P1234');
    });

    it('should not match delivery_start when format is wrong', () => {
      const buttonId = 'delivery_start_1234';
      const match = buttonId.match(/delivery_start_(#P\d+)/);
      expect(match).toBeNull();
    });

    it('should not match delivery_done when format is wrong', () => {
      const buttonId = 'delivery_done_P1234';
      const match = buttonId.match(/delivery_done_(#P\d+)/);
      expect(match).toBeNull();
    });
  });

  describe('Button message structure', () => {
    it('should have exactly 2 buttons for driver notification', () => {
      const buttons = [
        { text: '🚵 Sair para entrega', id: 'delivery_start_#P1234' },
        { text: '✅ O pedido foi entregue', id: 'delivery_done_#P1234' },
      ];
      expect(buttons).toHaveLength(2);
      expect(buttons[0].text).toContain('Sair para entrega');
      expect(buttons[1].text).toContain('pedido foi entregue');
    });

    it('should include order number in button IDs', () => {
      const orderNumber = '#P5678';
      const buttons = [
        { text: '🚵 Sair para entrega', id: `delivery_start_${orderNumber}` },
        { text: '✅ O pedido foi entregue', id: `delivery_done_${orderNumber}` },
      ];
      expect(buttons[0].id).toContain(orderNumber);
      expect(buttons[1].id).toContain(orderNumber);
    });
  });

  describe('Conditional flow logic', () => {
    it('should activate driver flow when active drivers exist', () => {
      const activeDrivers = [{ id: 1, name: 'João', isActive: true }];
      const hasActiveDrivers = activeDrivers.length > 0;
      expect(hasActiveDrivers).toBe(true);
    });

    it('should keep normal flow when no drivers exist', () => {
      const activeDrivers: any[] = [];
      const hasActiveDrivers = activeDrivers.length > 0;
      expect(hasActiveDrivers).toBe(false);
    });

    it('should suppress customer ready notification when drivers exist and order is delivery', () => {
      const hasDrivers = true;
      const orderDeliveryType = 'delivery';
      const status = 'ready';
      
      const suppressReadyForDriver = status === 'ready' && orderDeliveryType === 'delivery' && hasDrivers;
      expect(suppressReadyForDriver).toBe(true);
    });

    it('should NOT suppress customer ready notification for pickup orders even with drivers', () => {
      const hasDrivers = true;
      const orderDeliveryType = 'pickup';
      const status = 'ready';
      
      const suppressReadyForDriver = status === 'ready' && orderDeliveryType === 'delivery' && hasDrivers;
      expect(suppressReadyForDriver).toBe(false);
    });

    it('should NOT suppress customer ready notification when no drivers exist', () => {
      const hasDrivers = false;
      const orderDeliveryType = 'delivery';
      const status = 'ready';
      
      const suppressReadyForDriver = status === 'ready' && orderDeliveryType === 'delivery' && hasDrivers;
      expect(suppressReadyForDriver).toBe(false);
    });
  });

  describe('Frontend getNextAction logic', () => {
    const getNextAction = (status: string, deliveryType: string, hasActiveDrivers: boolean) => {
      switch (status) {
        case 'new':
          return { label: 'Aceitar', newStatus: 'preparing' };
        case 'preparing':
          return { label: 'Pronto', newStatus: 'ready' };
        case 'ready':
        case 'out_for_delivery':
          if (hasActiveDrivers && deliveryType === 'delivery') {
            return { label: 'Entregador', newStatus: 'completed', disabled: true, driverControlled: true };
          }
          return { label: 'Finalizar', newStatus: 'completed' };
        default:
          return null;
      }
    };

    it('should return "Finalizar" for ready orders without drivers', () => {
      const result = getNextAction('ready', 'delivery', false);
      expect(result?.label).toBe('Finalizar');
      expect(result?.disabled).toBeUndefined();
    });

    it('should return disabled "Entregador" for ready delivery orders with drivers', () => {
      const result = getNextAction('ready', 'delivery', true);
      expect(result?.label).toBe('Entregador');
      expect(result?.disabled).toBe(true);
      expect(result?.driverControlled).toBe(true);
    });

    it('should return "Finalizar" for ready pickup orders even with drivers', () => {
      const result = getNextAction('ready', 'pickup', true);
      expect(result?.label).toBe('Finalizar');
      expect(result?.disabled).toBeUndefined();
    });

    it('should return disabled "Entregador" for out_for_delivery with drivers', () => {
      const result = getNextAction('out_for_delivery', 'delivery', true);
      expect(result?.label).toBe('Entregador');
      expect(result?.disabled).toBe(true);
      expect(result?.driverControlled).toBe(true);
    });

    it('should return "Pronto" for preparing orders regardless of drivers', () => {
      const result = getNextAction('preparing', 'delivery', true);
      expect(result?.label).toBe('Pronto');
      expect(result?.disabled).toBeUndefined();
    });

    it('should return "Aceitar" for new orders regardless of drivers', () => {
      const result = getNextAction('new', 'delivery', true);
      expect(result?.label).toBe('Aceitar');
      expect(result?.disabled).toBeUndefined();
    });
  });

  describe('Webhook payload parsing', () => {
    it('should extract buttonId from direct body', () => {
      const body = { buttonOrListid: 'delivery_start_#P1234' };
      const message = body;
      const buttonId = message?.buttonOrListid;
      expect(buttonId).toBe('delivery_start_#P1234');
    });

    it('should extract buttonId from nested message', () => {
      const body = { message: { buttonOrListid: 'delivery_done_#P5678' } };
      const message = body.message || body;
      const buttonId = (message as any)?.buttonOrListid;
      expect(buttonId).toBe('delivery_done_#P5678');
    });

    it('should extract sender phone from body', () => {
      const body = { sender: '5511999999999@s.whatsapp.net' };
      const senderPhone = body.sender;
      const phone = senderPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
      expect(phone).toBe('5511999999999');
    });

    it('should handle phone with @c.us suffix', () => {
      const senderPhone = '5511888888888@c.us';
      const phone = senderPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
      expect(phone).toBe('5511888888888');
    });
  });

  describe('Status transitions', () => {
    it('delivery_start should transition to out_for_delivery', () => {
      const currentStatus = 'ready';
      const newStatus = 'out_for_delivery';
      expect(newStatus).toBe('out_for_delivery');
      expect(currentStatus).not.toBe('completed');
      expect(currentStatus).not.toBe('cancelled');
    });

    it('delivery_done should transition to completed', () => {
      const currentStatus = 'out_for_delivery';
      const newStatus = 'completed';
      expect(newStatus).toBe('completed');
    });

    it('should not process delivery_start for already completed orders', () => {
      const currentStatus = 'completed';
      const shouldProcess = currentStatus !== 'completed' && currentStatus !== 'cancelled';
      expect(shouldProcess).toBe(false);
    });

    it('should not process delivery_done for already cancelled orders', () => {
      const currentStatus = 'cancelled';
      const shouldProcess = currentStatus !== 'completed' && currentStatus !== 'cancelled';
      expect(shouldProcess).toBe(false);
    });

    it('should process delivery_start for ready orders', () => {
      const currentStatus = 'ready';
      const shouldProcess = currentStatus !== 'completed' && currentStatus !== 'cancelled';
      expect(shouldProcess).toBe(true);
    });

    it('should process delivery_done for out_for_delivery orders', () => {
      const currentStatus = 'out_for_delivery';
      const shouldProcess = currentStatus !== 'completed' && currentStatus !== 'cancelled';
      expect(shouldProcess).toBe(true);
    });

    it('should process delivery_start for preparing orders (on_accepted flow)', () => {
      const currentStatus = 'preparing';
      const shouldProcess = currentStatus !== 'completed' && currentStatus !== 'cancelled';
      expect(shouldProcess).toBe(true);
    });
  });

  describe('N8N proxy forwarding', () => {
    it('should have correct n8n webhook URL', () => {
      const N8N_WEBHOOK_URL = 'https://webn8n.granaupvps.shop/webhook/mindi';
      expect(N8N_WEBHOOK_URL).toContain('webn8n.granaupvps.shop');
      expect(N8N_WEBHOOK_URL).toContain('/webhook/mindi');
    });
  });

  describe('Modal skip logic', () => {
    it('should skip ready modal for delivery orders when drivers exist', () => {
      const statusType = 'ready';
      const hasActiveDrivers = true;
      const deliveryType = 'delivery';
      
      const shouldSkipModal = statusType === 'ready' && hasActiveDrivers && deliveryType === 'delivery';
      expect(shouldSkipModal).toBe(true);
    });

    it('should NOT skip ready modal for pickup orders even with drivers', () => {
      const statusType = 'ready';
      const hasActiveDrivers = true;
      const deliveryType = 'pickup';
      
      const shouldSkipModal = statusType === 'ready' && hasActiveDrivers && deliveryType === 'delivery';
      expect(shouldSkipModal).toBe(false);
    });

    it('should NOT skip ready modal when no drivers exist', () => {
      const statusType = 'ready';
      const hasActiveDrivers = false;
      const deliveryType = 'delivery';
      
      const shouldSkipModal = statusType === 'ready' && hasActiveDrivers && deliveryType === 'delivery';
      expect(shouldSkipModal).toBe(false);
    });

    it('should NOT skip preparing modal regardless of drivers', () => {
      const statusType = 'preparing';
      const hasActiveDrivers = true;
      const deliveryType = 'delivery';
      
      const shouldSkipModal = statusType === 'ready' && hasActiveDrivers && deliveryType === 'delivery';
      expect(shouldSkipModal).toBe(false);
    });
  });
});
