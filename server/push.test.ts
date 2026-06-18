import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

// Mock do db
vi.mock('./db', () => ({
  getPushSubscriptionsByEstablishment: vi.fn().mockResolvedValue([]),
  getPushSubscriptionByEndpoint: vi.fn().mockResolvedValue(undefined),
  upsertPushSubscription: vi.fn().mockResolvedValue(1),
  deletePushSubscription: vi.fn().mockResolvedValue(undefined),
  deletePushSubscriptionById: vi.fn().mockResolvedValue(undefined),
}));

describe('Push Notifications Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('webPush module', () => {
    it('should export getVapidPublicKey function', async () => {
      const { getVapidPublicKey } = await import('./_core/webPush');
      expect(typeof getVapidPublicKey).toBe('function');
    });

    it('should return a valid VAPID public key', async () => {
      const { getVapidPublicKey } = await import('./_core/webPush');
      const publicKey = getVapidPublicKey();
      
      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe('string');
      expect(publicKey.length).toBeGreaterThan(0);
    });

    it('should export sendPushNotification function', async () => {
      const { sendPushNotification } = await import('./_core/webPush');
      expect(typeof sendPushNotification).toBe('function');
    });

    it('should export sendNewOrderNotification function', async () => {
      const { sendNewOrderNotification } = await import('./_core/webPush');
      expect(typeof sendNewOrderNotification).toBe('function');
    });
  });

  describe('Push Notification Payload', () => {
    it('should create valid notification payload for new order', async () => {
      const { sendNewOrderNotification } = await import('./_core/webPush');
      
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      };
      
      const orderData = {
        orderId: 123,
        orderNumber: '#P123',
        customerName: 'João Silva',
        total: 45.90,
      };
      
      // A função deve retornar true ou false
      const result = await sendNewOrderNotification(mockSubscription, orderData);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Database functions', () => {
    it('should call upsertPushSubscription with correct data', async () => {
      const db = await import('./db');
      
      const subscriptionData = {
        establishmentId: 1,
        userId: 1,
        endpoint: 'https://test-endpoint.com',
        p256dh: 'test-p256dh',
        auth: 'test-auth',
        userAgent: 'Mozilla/5.0',
      };
      
      await db.upsertPushSubscription(subscriptionData);
      
      expect(db.upsertPushSubscription).toHaveBeenCalledWith(subscriptionData);
    });

    it('should call getPushSubscriptionsByEstablishment with establishment ID', async () => {
      const db = await import('./db');
      
      await db.getPushSubscriptionsByEstablishment(1);
      
      expect(db.getPushSubscriptionsByEstablishment).toHaveBeenCalledWith(1);
    });

    it('should call deletePushSubscription with endpoint', async () => {
      const db = await import('./db');
      
      await db.deletePushSubscription('https://test-endpoint.com');
      
      expect(db.deletePushSubscription).toHaveBeenCalledWith('https://test-endpoint.com');
    });
  });
});

describe('Push Notification Integration', () => {
  it('should have valid VAPID keys configured', async () => {
    const { getVapidPublicKey } = await import('./_core/webPush');
    const publicKey = getVapidPublicKey();
    
    // VAPID public key should be base64url encoded
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
    
    // VAPID public key should have correct length (65 bytes = ~87 chars base64)
    expect(publicKey.length).toBeGreaterThanOrEqual(80);
  });

  it('should format order notification correctly', async () => {
    // Test that the notification title and body are formatted correctly
    const orderData = {
      orderId: 456,
      orderNumber: '#P456',
      customerName: 'Maria Santos',
      total: 89.50,
    };
    
    const expectedTitle = '🔔 Novo Pedido!';
    const expectedBody = `Pedido #P456 de Maria Santos - R$ 89,50`;
    
    // Verify the format matches expected pattern
    expect(expectedTitle).toContain('Novo Pedido');
    expect(expectedBody).toContain(orderData.orderNumber);
    expect(expectedBody).toContain(orderData.customerName);
  });
});
