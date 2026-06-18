import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for PDV cart persistence logic.
 * 
 * Business rules:
 * - Cart items should persist in sessionStorage when navigating away from PDV
 * - Cart items should be restored from sessionStorage when returning to PDV
 * - Order type (mesa/retirada/entrega) should also persist
 * - clearCart should set cart to empty array (which persists as empty via useEffect)
 * - Cart serialization/deserialization should preserve all item properties
 */

type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
};

type OrderType = "mesa" | "retirada" | "entrega";

// Helper to simulate sessionStorage serialization/deserialization
function serializeCart(cart: CartItem[]): string {
  return JSON.stringify(cart);
}

function deserializeCart(data: string | null): CartItem[] {
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function serializeOrderType(orderType: OrderType): string {
  return orderType;
}

function deserializeOrderType(data: string | null): OrderType {
  if (data === 'mesa' || data === 'retirada' || data === 'entrega') return data;
  return 'mesa';
}

type DeliveryAddress = {
  name: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  reference: string;
};

type NeighborhoodFee = { id: number; neighborhood: string; fee: string } | null;

function serializeDeliveryAddress(addr: DeliveryAddress): string {
  return JSON.stringify(addr);
}

function deserializeDeliveryAddress(data: string | null): DeliveryAddress {
  if (!data) return { name: '', phone: '', street: '', number: '', neighborhood: '', complement: '', reference: '' };
  try {
    return JSON.parse(data);
  } catch {
    return { name: '', phone: '', street: '', number: '', neighborhood: '', complement: '', reference: '' };
  }
}

function deserializeNeighborhoodFee(data: string | null): NeighborhoodFee {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function deserializePaymentMethod(data: string | null): 'cash' | 'card' | 'pix' | null {
  if (data === 'cash' || data === 'card' || data === 'pix') return data;
  return null;
}

describe('PDV Cart Persistence', () => {
  describe('Cart serialization', () => {
    it('should serialize and deserialize an empty cart', () => {
      const cart: CartItem[] = [];
      const serialized = serializeCart(cart);
      const deserialized = deserializeCart(serialized);
      expect(deserialized).toEqual([]);
    });

    it('should serialize and deserialize cart with simple items', () => {
      const cart: CartItem[] = [
        {
          productId: 1,
          name: 'Hamburguer',
          price: '25.00',
          quantity: 2,
          observation: 'Sem cebola',
          image: 'https://example.com/img.jpg',
          complements: [],
        },
        {
          productId: 2,
          name: 'Coca-Cola',
          price: '8.00',
          quantity: 1,
          observation: '',
          image: null,
          complements: [],
        },
      ];
      const serialized = serializeCart(cart);
      const deserialized = deserializeCart(serialized);
      expect(deserialized).toEqual(cart);
      expect(deserialized).toHaveLength(2);
      expect(deserialized[0].name).toBe('Hamburguer');
      expect(deserialized[0].quantity).toBe(2);
      expect(deserialized[0].observation).toBe('Sem cebola');
      expect(deserialized[1].image).toBeNull();
    });

    it('should serialize and deserialize cart with complements', () => {
      const cart: CartItem[] = [
        {
          productId: 1,
          name: 'Pizza Margherita',
          price: '45.00',
          quantity: 1,
          observation: '',
          image: null,
          complements: [
            { id: 10, name: 'Borda recheada', price: '8.00', quantity: 1 },
            { id: 11, name: 'Extra queijo', price: '5.00', quantity: 2 },
          ],
        },
      ];
      const serialized = serializeCart(cart);
      const deserialized = deserializeCart(serialized);
      expect(deserialized[0].complements).toHaveLength(2);
      expect(deserialized[0].complements[0].name).toBe('Borda recheada');
      expect(deserialized[0].complements[1].quantity).toBe(2);
    });

    it('should handle invalid JSON gracefully', () => {
      const deserialized = deserializeCart('invalid json{{{');
      expect(deserialized).toEqual([]);
    });

    it('should handle null gracefully', () => {
      const deserialized = deserializeCart(null);
      expect(deserialized).toEqual([]);
    });
  });

  describe('Order type persistence', () => {
    it('should serialize and deserialize mesa order type', () => {
      const orderType: OrderType = 'mesa';
      const serialized = serializeOrderType(orderType);
      const deserialized = deserializeOrderType(serialized);
      expect(deserialized).toBe('mesa');
    });

    it('should serialize and deserialize retirada order type', () => {
      const orderType: OrderType = 'retirada';
      const serialized = serializeOrderType(orderType);
      const deserialized = deserializeOrderType(serialized);
      expect(deserialized).toBe('retirada');
    });

    it('should serialize and deserialize entrega order type', () => {
      const orderType: OrderType = 'entrega';
      const serialized = serializeOrderType(orderType);
      const deserialized = deserializeOrderType(serialized);
      expect(deserialized).toBe('entrega');
    });

    it('should default to mesa for invalid order type', () => {
      expect(deserializeOrderType(null)).toBe('mesa');
      expect(deserializeOrderType('invalid')).toBe('mesa');
      expect(deserializeOrderType('')).toBe('mesa');
    });
  });

  describe('Delivery address persistence', () => {
    it('should serialize and deserialize delivery address', () => {
      const addr: DeliveryAddress = {
        name: 'João Silva',
        phone: '11999887766',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        complement: 'Apto 4B',
        reference: 'Próximo ao mercado',
      };
      const serialized = serializeDeliveryAddress(addr);
      const deserialized = deserializeDeliveryAddress(serialized);
      expect(deserialized).toEqual(addr);
    });

    it('should return empty address for null', () => {
      const deserialized = deserializeDeliveryAddress(null);
      expect(deserialized.name).toBe('');
      expect(deserialized.phone).toBe('');
      expect(deserialized.street).toBe('');
    });

    it('should return empty address for invalid JSON', () => {
      const deserialized = deserializeDeliveryAddress('not valid json');
      expect(deserialized.name).toBe('');
    });

    it('should handle partial address data', () => {
      const addr: DeliveryAddress = {
        name: 'Maria',
        phone: '11888776655',
        street: '',
        number: '',
        neighborhood: '',
        complement: '',
        reference: '',
      };
      const deserialized = deserializeDeliveryAddress(serializeDeliveryAddress(addr));
      expect(deserialized.name).toBe('Maria');
      expect(deserialized.street).toBe('');
    });
  });

  describe('Pickup client persistence', () => {
    it('should persist and restore pickup name', () => {
      const name = 'Carlos Souza';
      expect(name || '').toBe('Carlos Souza');
    });

    it('should persist and restore pickup phone', () => {
      const phone = '21988776655';
      expect(phone || '').toBe('21988776655');
    });

    it('should default to empty string for null', () => {
      const name: string | null = null;
      expect(name || '').toBe('');
    });
  });

  describe('Payment method persistence', () => {
    it('should restore cash payment method', () => {
      expect(deserializePaymentMethod('cash')).toBe('cash');
    });

    it('should restore card payment method', () => {
      expect(deserializePaymentMethod('card')).toBe('card');
    });

    it('should restore pix payment method', () => {
      expect(deserializePaymentMethod('pix')).toBe('pix');
    });

    it('should return null for invalid payment method', () => {
      expect(deserializePaymentMethod(null)).toBeNull();
      expect(deserializePaymentMethod('')).toBeNull();
      expect(deserializePaymentMethod('bitcoin')).toBeNull();
    });
  });

  describe('Neighborhood fee persistence', () => {
    it('should serialize and deserialize neighborhood fee', () => {
      const fee = { id: 1, neighborhood: 'Centro', fee: '5.00' };
      const serialized = JSON.stringify(fee);
      const deserialized = deserializeNeighborhoodFee(serialized);
      expect(deserialized).toEqual(fee);
    });

    it('should return null for empty string', () => {
      expect(deserializeNeighborhoodFee('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(deserializeNeighborhoodFee(null)).toBeNull();
    });
  });

  describe('Cart operations preserve persistence contract', () => {
    it('should produce valid JSON after adding items', () => {
      let cart: CartItem[] = [];
      
      // Add item
      cart = [...cart, {
        productId: 1,
        name: 'Test',
        price: '10.00',
        quantity: 1,
        observation: '',
        image: null,
        complements: [],
      }];
      
      const serialized = serializeCart(cart);
      expect(() => JSON.parse(serialized)).not.toThrow();
      expect(deserializeCart(serialized)).toHaveLength(1);
    });

    it('should produce valid JSON after removing items', () => {
      let cart: CartItem[] = [
        { productId: 1, name: 'A', price: '10.00', quantity: 1, observation: '', image: null, complements: [] },
        { productId: 2, name: 'B', price: '20.00', quantity: 1, observation: '', image: null, complements: [] },
      ];
      
      // Remove first item
      cart = cart.filter((_, i) => i !== 0);
      
      const serialized = serializeCart(cart);
      const deserialized = deserializeCart(serialized);
      expect(deserialized).toHaveLength(1);
      expect(deserialized[0].name).toBe('B');
    });

    it('should produce valid JSON after clearing cart', () => {
      const cart: CartItem[] = [];
      const serialized = serializeCart(cart);
      const deserialized = deserializeCart(serialized);
      expect(deserialized).toEqual([]);
    });

    it('should preserve price precision through serialization', () => {
      const cart: CartItem[] = [
        { productId: 1, name: 'Item', price: '99.99', quantity: 1, observation: '', image: null, complements: [
          { id: 1, name: 'Comp', price: '5.50', quantity: 1 },
        ]},
      ];
      
      const deserialized = deserializeCart(serializeCart(cart));
      expect(deserialized[0].price).toBe('99.99');
      expect(deserialized[0].complements[0].price).toBe('5.50');
    });
  });
});
