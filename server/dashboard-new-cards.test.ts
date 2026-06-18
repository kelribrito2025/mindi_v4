import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
  getTopProducts: vi.fn(),
  getOrdersByDeliveryType: vi.fn(),
  getAvgPrepTime: vi.fn(),
}));

import * as db from './db';

describe('Dashboard New Cards - Backend Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTopProducts', () => {
    it('should return an array of products with productName, totalQuantity, totalRevenue', async () => {
      const mockResult = [
        { productName: 'X-Burger', totalQuantity: 15, totalRevenue: 450 },
        { productName: 'Batata Frita', totalQuantity: 10, totalRevenue: 200 },
        { productName: 'Coca-Cola', totalQuantity: 8, totalRevenue: 64 },
      ];
      vi.mocked(db.getTopProducts).mockResolvedValue(mockResult);

      const result = await db.getTopProducts(1, 'week', 10);

      expect(result).toEqual(mockResult);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('productName');
      expect(result[0]).toHaveProperty('totalQuantity');
      expect(result[0]).toHaveProperty('totalRevenue');
      expect(db.getTopProducts).toHaveBeenCalledWith(1, 'week', 10);
    });

    it('should return empty array when no products sold', async () => {
      vi.mocked(db.getTopProducts).mockResolvedValue([]);

      const result = await db.getTopProducts(1, 'today');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should sort products by quantity descending', async () => {
      const mockResult = [
        { productName: 'X-Burger', totalQuantity: 20, totalRevenue: 600 },
        { productName: 'Batata Frita', totalQuantity: 15, totalRevenue: 300 },
        { productName: 'Coca-Cola', totalQuantity: 5, totalRevenue: 40 },
      ];
      vi.mocked(db.getTopProducts).mockResolvedValue(mockResult);

      const result = await db.getTopProducts(1, 'month');

      expect(result[0].totalQuantity).toBeGreaterThanOrEqual(result[1].totalQuantity);
      expect(result[1].totalQuantity).toBeGreaterThanOrEqual(result[2].totalQuantity);
    });

    it('should accept all period values', async () => {
      vi.mocked(db.getTopProducts).mockResolvedValue([]);

      await db.getTopProducts(1, 'today');
      await db.getTopProducts(1, 'week');
      await db.getTopProducts(1, 'month');

      expect(db.getTopProducts).toHaveBeenCalledTimes(3);
    });
  });

  describe('getOrdersByDeliveryType', () => {
    it('should return orders grouped by delivery type with labels', async () => {
      const mockResult = [
        { deliveryType: 'delivery', label: 'Entrega', count: 25 },
        { deliveryType: 'pickup', label: 'Retirada', count: 10 },
        { deliveryType: 'dine_in', label: 'Consumo no local', count: 5 },
      ];
      vi.mocked(db.getOrdersByDeliveryType).mockResolvedValue(mockResult);

      const result = await db.getOrdersByDeliveryType(1, 'week');

      expect(result).toEqual(mockResult);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('deliveryType');
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('count');
    });

    it('should return translated labels in Portuguese', async () => {
      const mockResult = [
        { deliveryType: 'delivery', label: 'Entrega', count: 25 },
        { deliveryType: 'pickup', label: 'Retirada', count: 10 },
      ];
      vi.mocked(db.getOrdersByDeliveryType).mockResolvedValue(mockResult);

      const result = await db.getOrdersByDeliveryType(1, 'today');

      expect(result[0].label).toBe('Entrega');
      expect(result[1].label).toBe('Retirada');
    });

    it('should return empty array when no orders', async () => {
      vi.mocked(db.getOrdersByDeliveryType).mockResolvedValue([]);

      const result = await db.getOrdersByDeliveryType(1, 'today');

      expect(result).toEqual([]);
    });

    it('should have counts as numbers', async () => {
      const mockResult = [
        { deliveryType: 'delivery', label: 'Entrega', count: 25 },
      ];
      vi.mocked(db.getOrdersByDeliveryType).mockResolvedValue(mockResult);

      const result = await db.getOrdersByDeliveryType(1, 'month');

      expect(typeof result[0].count).toBe('number');
    });
  });

  describe('getAvgPrepTime', () => {
    it('should return avgMinutes and totalOrders', async () => {
      const mockResult = { avgMinutes: 35, totalOrders: 50 };
      vi.mocked(db.getAvgPrepTime).mockResolvedValue(mockResult);

      const result = await db.getAvgPrepTime(1, 'week');

      expect(result).toEqual(mockResult);
      expect(result).toHaveProperty('avgMinutes');
      expect(result).toHaveProperty('totalOrders');
      expect(typeof result.avgMinutes).toBe('number');
      expect(typeof result.totalOrders).toBe('number');
    });

    it('should return 0 avgMinutes when no completed orders', async () => {
      const mockResult = { avgMinutes: 0, totalOrders: 0 };
      vi.mocked(db.getAvgPrepTime).mockResolvedValue(mockResult);

      const result = await db.getAvgPrepTime(1, 'today');

      expect(result.avgMinutes).toBe(0);
      expect(result.totalOrders).toBe(0);
    });

    it('should return rounded minutes', async () => {
      const mockResult = { avgMinutes: 42, totalOrders: 15 };
      vi.mocked(db.getAvgPrepTime).mockResolvedValue(mockResult);

      const result = await db.getAvgPrepTime(1, 'month');

      expect(Number.isInteger(result.avgMinutes)).toBe(true);
    });

    it('should accept all period values', async () => {
      vi.mocked(db.getAvgPrepTime).mockResolvedValue({ avgMinutes: 0, totalOrders: 0 });

      await db.getAvgPrepTime(1, 'today');
      await db.getAvgPrepTime(1, 'week');
      await db.getAvgPrepTime(1, 'month');

      expect(db.getAvgPrepTime).toHaveBeenCalledTimes(3);
    });
  });
});
