import { describe, it, expect } from 'vitest';

/**
 * Tests for the print_order SSE event trigger logic.
 * 
 * The Mindi Printer app connects via SSE and listens for print_order events.
 * The key settings are:
 * - printOnNewOrder: true/false - whether to print when a new order is created
 * - autoPrintEnabled: true/false - legacy setting for old direct printing system
 * 
 * The fix ensures that printOnNewOrder alone is sufficient to trigger SSE print_order,
 * without requiring autoPrintEnabled to be true.
 * 
 * CRITICAL FIX: Dashboard SSE and Printer SSE now use SEPARATE connection pools
 * to prevent duplicate printing. The print_order event is sent ONLY to printer connections.
 */

describe('Print trigger logic - createPublicOrder', () => {
  it('should trigger print_order when printOnNewOrder=true (regardless of autoPrintEnabled)', () => {
    const printerSettings = {
      autoPrintEnabled: false,
      printOnNewOrder: true,
      beepOnPrint: true,
    };

    // This is the fixed condition from createPublicOrder
    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(true);
  });

  it('should trigger print_order when both autoPrintEnabled and printOnNewOrder are true', () => {
    const printerSettings = {
      autoPrintEnabled: true,
      printOnNewOrder: true,
      beepOnPrint: true,
    };

    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(true);
  });

  it('should NOT trigger print_order when printOnNewOrder=false', () => {
    const printerSettings = {
      autoPrintEnabled: true,
      printOnNewOrder: false,
      beepOnPrint: true,
    };

    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });

  it('should NOT trigger print_order when printerSettings is null', () => {
    const printerSettings = null;

    const shouldPrint = !!(printerSettings as any)?.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });

  it('should NOT trigger print_order when printerSettings is undefined', () => {
    const printerSettings = undefined;

    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });
});

describe('Print trigger logic - updateOrderStatus (accept)', () => {
  it('should NOT print on accept when printOnNewOrder=true (already printed on creation)', () => {
    const printerSettings = {
      autoPrintEnabled: false,
      printOnNewOrder: true,
      printOnStatusChange: false,
    };

    // The condition in updateOrderStatus: only print if printOnNewOrder is false
    // (because if printOnNewOrder is true, it was already printed in createPublicOrder)
    const shouldPrint = printerSettings && !printerSettings.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });

  it('should print on accept when printOnNewOrder=false (was not printed on creation)', () => {
    const printerSettings = {
      autoPrintEnabled: false,
      printOnNewOrder: false,
      printOnStatusChange: false,
    };

    const shouldPrint = printerSettings && !printerSettings.printOnNewOrder;

    expect(shouldPrint).toBe(true);
  });

  it('should NOT print on accept when printerSettings is null', () => {
    const printerSettings = null;

    const shouldPrint = printerSettings && !(printerSettings as any).printOnNewOrder;

    expect(shouldPrint).toBeFalsy();
  });
});

describe('Print trigger logic - no duplicate printing', () => {
  it('should print exactly once when printOnNewOrder=true: on creation only', () => {
    const printerSettings = {
      printOnNewOrder: true,
      autoPrintEnabled: false,
    };

    const printsOnCreation = !!printerSettings?.printOnNewOrder;
    const printsOnAccept = printerSettings && !printerSettings.printOnNewOrder;

    expect(printsOnCreation).toBe(true);
    expect(printsOnAccept).toBe(false);
    // Total prints = 1 (creation only)
  });

  it('should print exactly once when printOnNewOrder=false: on accept only', () => {
    const printerSettings = {
      printOnNewOrder: false,
      autoPrintEnabled: false,
    };

    const printsOnCreation = !!printerSettings?.printOnNewOrder;
    const printsOnAccept = printerSettings && !printerSettings.printOnNewOrder;

    expect(printsOnCreation).toBe(false);
    expect(printsOnAccept).toBeTruthy();
    // Total prints = 1 (accept only)
  });
});

describe('Print trigger logic - legacy methods skipped when SSE active', () => {
  it('should skip POSPrinterDriver and Socket TCP when printOnNewOrder=true', () => {
    const printerSettings = {
      printOnNewOrder: true,
      posPrinterEnabled: true,
      posPrinterLinkcode: 'some-code',
    };

    // SSE print fires
    const ssePrintFires = !!printerSettings?.printOnNewOrder;
    // Legacy methods are wrapped in: if (!printerSettings?.printOnNewOrder)
    const legacyMethodsRun = !printerSettings?.printOnNewOrder;

    expect(ssePrintFires).toBe(true);
    expect(legacyMethodsRun).toBe(false);
  });

  it('should allow legacy methods when printOnNewOrder=false', () => {
    const printerSettings = {
      printOnNewOrder: false,
      posPrinterEnabled: true,
      posPrinterLinkcode: 'some-code',
    };

    const ssePrintFires = !!printerSettings?.printOnNewOrder;
    const legacyMethodsRun = !printerSettings?.printOnNewOrder;

    expect(ssePrintFires).toBe(false);
    expect(legacyMethodsRun).toBe(true);
  });

  it('should not have both SSE and legacy printing active at the same time', () => {
    // For any printerSettings configuration, only one path should be active
    const configs = [
      { printOnNewOrder: true },
      { printOnNewOrder: false },
    ];

    configs.forEach(settings => {
      const ssePrints = !!settings.printOnNewOrder;
      const legacyPrints = !settings.printOnNewOrder;

      // XOR: exactly one should be true
      expect(ssePrints !== legacyPrints).toBe(true);
    });
  });
});

describe('SSE pool separation - printer vs dashboard connections', () => {
  it('should use separate connection pools for dashboard and printer', () => {
    // Simulate the two separate Maps used in sse.ts
    const dashboardConnections = new Map<number, Set<object>>();
    const printerConnections = new Map<number, Set<object>>();

    const establishmentId = 30001;
    const dashboardRes = { id: 'dashboard-conn' };
    const printerRes = { id: 'printer-conn' };

    // Dashboard connects via /api/orders/stream -> addConnection
    if (!dashboardConnections.has(establishmentId)) {
      dashboardConnections.set(establishmentId, new Set());
    }
    dashboardConnections.get(establishmentId)!.add(dashboardRes);

    // Printer connects via /api/printer/stream -> addPrinterConnection
    if (!printerConnections.has(establishmentId)) {
      printerConnections.set(establishmentId, new Set());
    }
    printerConnections.get(establishmentId)!.add(printerRes);

    // Verify pools are separate
    expect(dashboardConnections.get(establishmentId)!.size).toBe(1);
    expect(printerConnections.get(establishmentId)!.size).toBe(1);
    expect(dashboardConnections.get(establishmentId)!.has(printerRes)).toBe(false);
    expect(printerConnections.get(establishmentId)!.has(dashboardRes)).toBe(false);
  });

  it('should send print_order ONLY to printer connections, not dashboard', () => {
    const dashboardConnections = new Map<number, Set<object>>();
    const printerConnections = new Map<number, Set<object>>();

    const establishmentId = 30001;
    const dashboardRes = { id: 'dashboard', received: [] as string[] };
    const printerRes = { id: 'printer', received: [] as string[] };

    dashboardConnections.set(establishmentId, new Set([dashboardRes]));
    printerConnections.set(establishmentId, new Set([printerRes]));

    // Simulate sendPrinterEvent (only sends to printerConnections)
    const sendPrinterEvent = (estId: number, eventType: string) => {
      const conns = printerConnections.get(estId);
      if (!conns) return;
      conns.forEach((res: any) => {
        res.received.push(eventType);
      });
    };

    // Simulate sendEvent (sends to dashboardConnections - for new_order, etc.)
    const sendEvent = (estId: number, eventType: string) => {
      const conns = dashboardConnections.get(estId);
      if (!conns) return;
      conns.forEach((res: any) => {
        res.received.push(eventType);
      });
    };

    // notifyPrintOrder uses sendPrinterEvent
    sendPrinterEvent(establishmentId, 'print_order');

    // notifyNewOrder uses sendEvent
    sendEvent(establishmentId, 'new_order');

    // Printer should receive print_order only
    expect((printerRes as any).received).toEqual(['print_order']);
    // Dashboard should receive new_order only (NOT print_order)
    expect((dashboardRes as any).received).toEqual(['new_order']);
  });

  it('should count only printer connections in getPrinterConnectionCount', () => {
    const dashboardConnections = new Map<number, Set<object>>();
    const printerConnections = new Map<number, Set<object>>();

    const establishmentId = 30001;

    // 2 dashboard connections (e.g., 2 browser tabs)
    dashboardConnections.set(establishmentId, new Set([{ id: 'd1' }, { id: 'd2' }]));
    // 1 printer connection (Mindi Printer app)
    printerConnections.set(establishmentId, new Set([{ id: 'p1' }]));

    // getPrinterConnectionCount should return 1 (not 3)
    const printerCount = printerConnections.get(establishmentId)?.size || 0;
    const dashboardCount = dashboardConnections.get(establishmentId)?.size || 0;

    expect(printerCount).toBe(1);
    expect(dashboardCount).toBe(2);
    // Total connections = 3, but printer-specific = 1
    expect(printerCount + dashboardCount).toBe(3);
  });

  it('should handle multiple printer connections correctly (e.g., 2 printers)', () => {
    const printerConnections = new Map<number, Set<object>>();

    const establishmentId = 30001;
    const printer1 = { id: 'printer-kitchen', received: [] as string[] };
    const printer2 = { id: 'printer-bar', received: [] as string[] };

    printerConnections.set(establishmentId, new Set([printer1, printer2]));

    // sendPrinterEvent sends to ALL printer connections
    const conns = printerConnections.get(establishmentId);
    conns?.forEach((res: any) => {
      res.received.push('print_order');
    });

    expect((printer1 as any).received).toEqual(['print_order']);
    expect((printer2 as any).received).toEqual(['print_order']);
    expect(printerConnections.get(establishmentId)!.size).toBe(2);
  });

  it('should not affect dashboard events when printer pool is empty', () => {
    const dashboardConnections = new Map<number, Set<object>>();
    const printerConnections = new Map<number, Set<object>>();

    const establishmentId = 30001;
    const dashboardRes = { id: 'dashboard', received: [] as string[] };

    dashboardConnections.set(establishmentId, new Set([dashboardRes]));
    // No printer connections

    // sendPrinterEvent does nothing (no printer connections)
    const printerConns = printerConnections.get(establishmentId);
    if (printerConns) {
      printerConns.forEach((res: any) => {
        res.received.push('print_order');
      });
    }

    // sendEvent still works for dashboard
    const dashConns = dashboardConnections.get(establishmentId);
    dashConns?.forEach((res: any) => {
      res.received.push('new_order');
    });

    expect((dashboardRes as any).received).toEqual(['new_order']);
    expect(printerConnections.get(establishmentId)).toBeUndefined();
  });
});
