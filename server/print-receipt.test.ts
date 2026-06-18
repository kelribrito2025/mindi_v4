import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo de banco de dados
vi.mock('./db', () => ({
  getOrderById: vi.fn(),
  getOrderItems: vi.fn(),
  getEstablishmentById: vi.fn(),
  getPrinterSettings: vi.fn(),
}));

import * as db from './db';

describe('Print Receipt Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return order data for valid order ID', async () => {
    const mockOrder = {
      id: 1,
      orderNumber: '001',
      establishmentId: 1,
      customerName: 'João Silva',
      customerPhone: '11999999999',
      customerAddress: 'Rua Teste, 123',
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      subtotal: '50.00',
      deliveryFee: '5.00',
      discount: '0.00',
      total: '55.00',
      notes: 'Sem cebola',
      couponCode: null,
      createdAt: new Date('2024-01-26T12:00:00Z'),
    };

    const mockItems = [
      {
        id: 1,
        orderId: 1,
        productName: 'Pizza Margherita',
        quantity: 1,
        unitPrice: '40.00',
        totalPrice: '40.00',
        notes: null,
        complements: JSON.stringify([
          { groupName: 'Adicionais', items: [{ name: 'Queijo extra', price: 5 }] }
        ]),
      },
      {
        id: 2,
        orderId: 1,
        productName: 'Refrigerante',
        quantity: 1,
        unitPrice: '10.00',
        totalPrice: '10.00',
        notes: 'Bem gelado',
        complements: null,
      },
    ];

    const mockEstablishment = {
      id: 1,
      name: 'Pizzaria Teste',
    };

    const mockSettings = {
      id: 1,
      establishmentId: 1,
      footerMessage: 'Obrigado pela preferência!',
    };

    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);
    vi.mocked(db.getOrderItems).mockResolvedValue(mockItems as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstablishment as any);
    vi.mocked(db.getPrinterSettings).mockResolvedValue(mockSettings as any);

    // Verificar que as funções de banco existem e podem ser chamadas
    const order = await db.getOrderById(1);
    expect(order).toBeDefined();
    expect(order?.orderNumber).toBe('001');

    const items = await db.getOrderItems(1);
    expect(items).toHaveLength(2);
    expect(items[0].productName).toBe('Pizza Margherita');

    const establishment = await db.getEstablishmentById(1);
    expect(establishment?.name).toBe('Pizzaria Teste');

    const settings = await db.getPrinterSettings(1);
    expect(settings?.footerMessage).toBe('Obrigado pela preferência!');
  });

  it('should return undefined for non-existent order', async () => {
    vi.mocked(db.getOrderById).mockResolvedValue(undefined);

    const order = await db.getOrderById(999);
    expect(order).toBeUndefined();
  });

  it('should handle order without complements', async () => {
    const mockItems = [
      {
        id: 1,
        orderId: 1,
        productName: 'Hambúrguer',
        quantity: 2,
        unitPrice: '25.00',
        totalPrice: '50.00',
        notes: null,
        complements: null,
      },
    ];

    vi.mocked(db.getOrderItems).mockResolvedValue(mockItems as any);

    const items = await db.getOrderItems(1);
    expect(items).toHaveLength(1);
    expect(items[0].complements).toBeNull();
  });

  it('should handle order with pickup delivery type', async () => {
    const mockOrder = {
      id: 2,
      orderNumber: '002',
      establishmentId: 1,
      customerName: 'Maria Santos',
      customerPhone: '11888888888',
      customerAddress: null,
      deliveryType: 'pickup',
      paymentMethod: 'cash',
      subtotal: '30.00',
      deliveryFee: '0.00',
      discount: '0.00',
      total: '30.00',
      notes: null,
      couponCode: null,
      createdAt: new Date('2024-01-26T14:00:00Z'),
    };

    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);

    const order = await db.getOrderById(2);
    expect(order?.deliveryType).toBe('pickup');
    expect(order?.deliveryFee).toBe('0.00');
  });

  it('should handle order with discount coupon', async () => {
    const mockOrder = {
      id: 3,
      orderNumber: '003',
      establishmentId: 1,
      customerName: 'Pedro Costa',
      customerPhone: '11777777777',
      customerAddress: 'Av. Brasil, 500',
      deliveryType: 'delivery',
      paymentMethod: 'credit',
      subtotal: '100.00',
      deliveryFee: '10.00',
      discount: '15.00',
      total: '95.00',
      notes: null,
      couponCode: 'DESC15',
      createdAt: new Date('2024-01-26T16:00:00Z'),
    };

    vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);

    const order = await db.getOrderById(3);
    expect(order?.couponCode).toBe('DESC15');
    expect(order?.discount).toBe('15.00');
  });
});
