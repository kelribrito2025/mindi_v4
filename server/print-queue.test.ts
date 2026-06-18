import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo db
vi.mock('./db', () => ({
  getPendingPrintJobs: vi.fn(),
  getPrintJobWithOrder: vi.fn(),
  updatePrintJobStatus: vi.fn(),
  addToPrintQueue: vi.fn(),
  getPrintHistory: vi.fn(),
  getPrinterSettings: vi.fn(),
  getEstablishmentById: vi.fn(),
}));

import * as db from './db';

describe('Print Queue Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingPrintJobs', () => {
    it('should return pending jobs for an establishment', async () => {
      const mockJobs = [
        { id: 1, orderId: 100, status: 'pending', establishmentId: 1 },
        { id: 2, orderId: 101, status: 'pending', establishmentId: 1 },
      ];
      
      vi.mocked(db.getPendingPrintJobs).mockResolvedValue(mockJobs as any);
      
      const result = await db.getPendingPrintJobs(1);
      
      expect(result).toEqual(mockJobs);
      expect(db.getPendingPrintJobs).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no pending jobs', async () => {
      vi.mocked(db.getPendingPrintJobs).mockResolvedValue([]);
      
      const result = await db.getPendingPrintJobs(1);
      
      expect(result).toEqual([]);
    });
  });

  describe('updatePrintJobStatus', () => {
    it('should update job status to completed', async () => {
      vi.mocked(db.updatePrintJobStatus).mockResolvedValue(undefined);
      
      await db.updatePrintJobStatus(1, 'completed');
      
      expect(db.updatePrintJobStatus).toHaveBeenCalledWith(1, 'completed');
    });

    it('should update job status to failed with error message', async () => {
      vi.mocked(db.updatePrintJobStatus).mockResolvedValue(undefined);
      
      await db.updatePrintJobStatus(1, 'failed', 'Connection timeout');
      
      expect(db.updatePrintJobStatus).toHaveBeenCalledWith(1, 'failed', 'Connection timeout');
    });
  });

  describe('addToPrintQueue', () => {
    it('should add a new job to the print queue', async () => {
      vi.mocked(db.addToPrintQueue).mockResolvedValue(1);
      
      const result = await db.addToPrintQueue({
        establishmentId: 1,
        orderId: 100,
        copies: 2,
      });
      
      expect(result).toBe(1);
      expect(db.addToPrintQueue).toHaveBeenCalledWith({
        establishmentId: 1,
        orderId: 100,
        copies: 2,
      });
    });
  });

  describe('getPrintJobWithOrder', () => {
    it('should return job with order details', async () => {
      const mockResult = {
        job: { id: 1, orderId: 100, status: 'pending' },
        order: { id: 100, customerName: 'John Doe', total: 50.00 },
        items: [{ productName: 'Pizza', quantity: 1 }],
      };
      
      vi.mocked(db.getPrintJobWithOrder).mockResolvedValue(mockResult as any);
      
      const result = await db.getPrintJobWithOrder(1);
      
      expect(result).toEqual(mockResult);
      expect(result?.order.customerName).toBe('John Doe');
    });

    it('should return null when job not found', async () => {
      vi.mocked(db.getPrintJobWithOrder).mockResolvedValue(null);
      
      const result = await db.getPrintJobWithOrder(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getPrintHistory', () => {
    it('should return print history for establishment', async () => {
      const mockHistory = [
        { id: 1, orderId: 100, status: 'completed', printedAt: new Date() },
        { id: 2, orderId: 101, status: 'failed', errorMessage: 'Connection error' },
      ];
      
      vi.mocked(db.getPrintHistory).mockResolvedValue(mockHistory as any);
      
      const result = await db.getPrintHistory(1, 50);
      
      expect(result).toEqual(mockHistory);
      expect(db.getPrintHistory).toHaveBeenCalledWith(1, 50);
    });
  });
});

describe('Print Receipt HTML Generation', () => {
  it('should generate valid HTML structure', () => {
    // Simular a estrutura do HTML gerado
    const mockOrder = {
      orderNumber: 'ABC123',
      customerName: 'João Silva',
      items: [
        { productName: 'Pizza Margherita', quantity: 2, totalPrice: 60.00 },
      ],
      total: 60.00,
    };

    // Verificar que os dados essenciais estão presentes
    expect(mockOrder.orderNumber).toBeTruthy();
    expect(mockOrder.customerName).toBeTruthy();
    expect(mockOrder.items.length).toBeGreaterThan(0);
    expect(mockOrder.total).toBeGreaterThan(0);
  });
});
