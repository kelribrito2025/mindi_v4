import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Out for Delivery WhatsApp Notification Fix', () => {
  const routersPath = path.join(__dirname, 'routers.ts');
  const routersSource = fs.readFileSync(routersPath, 'utf-8');
  
  const uazapiPath = path.join(__dirname, '_core/uazapi.ts');
  const uazapiSource = fs.readFileSync(uazapiPath, 'utf-8');
  
  const schemaPath = path.join(__dirname, '../drizzle/schema.ts');
  const schemaSource = fs.readFileSync(schemaPath, 'utf-8');

  describe('Schema has out_for_delivery notification fields', () => {
    it('should have notifyOnOutForDelivery field in schema', () => {
      expect(schemaSource).toContain('notifyOnOutForDelivery');
    });

    it('should have templateOutForDelivery field in schema', () => {
      expect(schemaSource).toContain('templateOutForDelivery');
    });

    it('notifyOnOutForDelivery should default to true', () => {
      expect(schemaSource).toContain('notifyOnOutForDelivery: boolean("notifyOnOutForDelivery").default(true)');
    });
  });

  describe('updateStatus includes out_for_delivery in shouldNotify', () => {
    it('should include out_for_delivery in the shouldNotify condition', () => {
      expect(routersSource).toContain("input.status === 'out_for_delivery'");
      expect(routersSource).toContain('notifyOnOutForDelivery');
    });

    it('should include templateOutForDelivery in template selection', () => {
      expect(routersSource).toContain('config.templateOutForDelivery');
    });
  });

  describe('markReadyAndAssign sends notification when no drivers', () => {
    it('should change status to out_for_delivery when no active drivers', () => {
      // Find the section where activeDrivers.length === 0
      const noDriversSection = routersSource.substring(
        routersSource.indexOf('if (activeDrivers.length === 0)'),
        routersSource.indexOf('} else if (activeDrivers.length === 1)')
      );
      
      // Should update to out_for_delivery, not just ready
      expect(noDriversSection).toContain("'out_for_delivery'");
      expect(noDriversSection).not.toMatch(/updateOrderStatus\(input\.orderId,\s*'ready'\)/);
    });

    it('should send WhatsApp notification to customer when no drivers', () => {
      const noDriversSection = routersSource.substring(
        routersSource.indexOf('if (activeDrivers.length === 0)'),
        routersSource.indexOf('} else if (activeDrivers.length === 1)')
      );
      
      expect(noDriversSection).toContain('sendOrderStatusNotification');
      expect(noDriversSection).toContain('order.customerPhone');
    });
  });

  describe('Default template for out_for_delivery exists', () => {
    it('should have a default template for out_for_delivery in uazapi', () => {
      expect(uazapiSource).toContain('out_for_delivery:');
    });

    it('should include delivery emoji and message in the template', () => {
      // Extract the out_for_delivery template
      const templateMatch = uazapiSource.match(/out_for_delivery:\s*`([^`]+)`/);
      expect(templateMatch).not.toBeNull();
      const template = templateMatch![1];
      
      // Should contain relevant content
      expect(template).toContain('saiu para entrega');
      expect(template).toContain('{{orderNumber}}');
      expect(template).toContain('{{customerName}}');
      expect(template).toContain('{{establishmentName}}');
    });
  });

  describe('Notification logic is independent of driver existence', () => {
    it('should not require driver assignment to send out_for_delivery notification', () => {
      // The no-drivers section should send notification directly without requiring a driver
      const noDriversSection = routersSource.substring(
        routersSource.indexOf('if (activeDrivers.length === 0)'),
        routersSource.indexOf('} else if (activeDrivers.length === 1)')
      );
      
      // Should NOT contain driver assignment logic
      expect(noDriversSection).not.toContain('createDelivery');
      expect(noDriversSection).not.toContain('getDriverById');
      
      // Should contain customer notification logic
      expect(noDriversSection).toContain('customerNotified');
    });
  });
});
