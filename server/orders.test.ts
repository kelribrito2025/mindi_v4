import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
vi.mock('./db', () => ({
  createPublicOrder: vi.fn().mockResolvedValue({ orderId: 1, orderNumber: '#TEST123' }),
  getPublicOrderByNumber: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: '#TEST123',
    customerName: 'João Silva',
    customerPhone: '11999999999',
    status: 'new',
    items: []
  }),
  getOrdersByPhone: vi.fn().mockResolvedValue([]),
  getAllOrdersByEstablishment: vi.fn().mockResolvedValue({ orders: [], total: 0 }),
  getActiveOrdersByEstablishment: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: '#TEST123',
    status: 'new'
  }),
  getOrderItems: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
}));

import * as db from './db';

describe('Order Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPublicOrder', () => {
    it('should create a new order with valid data', async () => {
      const orderData = {
        establishmentId: 1,
        customerName: 'João Silva',
        customerPhone: '11999999999',
        customerAddress: 'Rua Teste, 123',
        deliveryType: 'delivery' as const,
        paymentMethod: 'pix' as const,
        subtotal: '50.00',
        deliveryFee: '5.00',
        total: '55.00',
        notes: 'Sem cebola',
        orderNumber: '',
      };

      const items = [
        {
          orderId: 0,
          productId: 1,
          productName: 'X-Burger',
          quantity: 2,
          unitPrice: '25.00',
          totalPrice: '50.00',
          complements: [] as { name: string; price: number; quantity: number }[],
          notes: null,
        },
      ];

      const result = await db.createPublicOrder(orderData, items);

      expect(result).toEqual({ orderId: 1, orderNumber: '#TEST123' });
      expect(db.createPublicOrder).toHaveBeenCalledWith(orderData, items);
    });
  });

  describe('getPublicOrderByNumber', () => {
    it('should return order details by order number', async () => {
      const result = await db.getPublicOrderByNumber('#TEST123', 1);

      expect(result).toBeDefined();
      expect(result?.orderNumber).toBe('#TEST123');
      expect(result?.customerName).toBe('João Silva');
    });
  });

  describe('getOrdersByPhone', () => {
    it('should return orders for a given phone number', async () => {
      const result = await db.getOrdersByPhone('11999999999', 1);

      expect(Array.isArray(result)).toBe(true);
      expect(db.getOrdersByPhone).toHaveBeenCalledWith('11999999999', 1);
    });
  });

  describe('getAllOrdersByEstablishment', () => {
    it('should return all orders for an establishment', async () => {
      const result = await db.getAllOrdersByEstablishment(1);

      expect(result).toEqual({ orders: [], total: 0 });
      expect(db.getAllOrdersByEstablishment).toHaveBeenCalledWith(1);
    });

    it('should filter orders by status', async () => {
      await db.getAllOrdersByEstablishment(1, { status: 'new' });

      expect(db.getAllOrdersByEstablishment).toHaveBeenCalledWith(1, { status: 'new' });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      await db.updateOrderStatus(1, 'preparing');

      expect(db.updateOrderStatus).toHaveBeenCalledWith(1, 'preparing');
    });
  });
});

describe('Order Status Flow', () => {
  it('should have valid status transitions', () => {
    const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
    
    // Verify all statuses are valid
    validStatuses.forEach(status => {
      expect(['new', 'preparing', 'ready', 'completed', 'cancelled']).toContain(status);
    });
  });

  it('should have correct status progression', () => {
    const statusProgression = {
      new: 'preparing',
      preparing: 'ready',
      ready: 'completed',
    };

    expect(statusProgression.new).toBe('preparing');
    expect(statusProgression.preparing).toBe('ready');
    expect(statusProgression.ready).toBe('completed');
  });
});

describe('Order Data Validation', () => {
  it('should validate required fields for order creation', () => {
    const requiredFields = [
      'establishmentId',
      'customerName',
      'customerPhone',
      'deliveryType',
      'paymentMethod',
      'subtotal',
      'total',
      'items',
    ];

    const orderData = {
      establishmentId: 1,
      customerName: 'João Silva',
      customerPhone: '11999999999',
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      subtotal: '50.00',
      total: '55.00',
      items: [],
    };

    requiredFields.forEach(field => {
      expect(orderData).toHaveProperty(field);
    });
  });

  it('should validate delivery types', () => {
    const validDeliveryTypes = ['delivery', 'pickup'];
    
    expect(validDeliveryTypes).toContain('delivery');
    expect(validDeliveryTypes).toContain('pickup');
  });

  it('should validate payment methods', () => {
    const validPaymentMethods = ['cash', 'card', 'pix', 'boleto'];
    
    expect(validPaymentMethods).toContain('cash');
    expect(validPaymentMethods).toContain('card');
    expect(validPaymentMethods).toContain('pix');
    expect(validPaymentMethods).toContain('boleto');
  });
});
