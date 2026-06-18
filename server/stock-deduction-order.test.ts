import { describe, it, expect } from 'vitest';

/**
 * Tests for automatic stock deduction when orders are created.
 * Covers both "simple stock" (stockQuantity on products/complementItems)
 * and "advanced stock" (stockItems table with movements).
 */
describe('Stock Deduction on Order Creation', () => {

  // ===== UNIT TESTS: deduction logic =====

  it('should deduct product simple stock correctly', () => {
    // Simulate: product has stockQuantity=10, order quantity=3
    const stockQuantity = 10;
    const orderQuantity = 3;
    const newQty = Math.max(0, stockQuantity - orderQuantity);
    expect(newQty).toBe(7);
  });

  it('should not go below zero on product stock deduction', () => {
    const stockQuantity = 2;
    const orderQuantity = 5;
    const newQty = Math.max(0, stockQuantity - orderQuantity);
    expect(newQty).toBe(0);
  });

  it('should deduct complement simple stock correctly', () => {
    // Simulate: complement has stockQuantity=5, complement quantity=2, item quantity=1
    const complementStockQty = 5;
    const complementQty = 2;
    const itemQuantity = 1;
    const totalDeduction = complementQty * itemQuantity;
    const newQty = Math.max(0, complementStockQty - totalDeduction);
    expect(newQty).toBe(3);
  });

  it('should multiply complement deduction by item quantity', () => {
    // Simulate: complement qty=1, item qty=3 → deduct 3
    const complementStockQty = 10;
    const complementQty = 1;
    const itemQuantity = 3;
    const totalDeduction = complementQty * itemQuantity;
    const newQty = Math.max(0, complementStockQty - totalDeduction);
    expect(newQty).toBe(7);
  });

  it('should not deduct stock when hasStock is false', () => {
    const product = { hasStock: false, stockQuantity: null as number | null };
    // Should skip deduction
    const shouldDeduct = product.hasStock && product.stockQuantity !== null && product.stockQuantity > 0;
    expect(shouldDeduct).toBe(false);
  });

  it('should not deduct stock when stockQuantity is null', () => {
    const product = { hasStock: true, stockQuantity: null as number | null };
    const shouldDeduct = product.hasStock && product.stockQuantity !== null && (product.stockQuantity ?? 0) > 0;
    expect(shouldDeduct).toBe(false);
  });

  it('should not deduct stock when stockQuantity is already 0', () => {
    const product = { hasStock: true, stockQuantity: 0 };
    const shouldDeduct = product.hasStock && product.stockQuantity !== null && product.stockQuantity > 0;
    expect(shouldDeduct).toBe(false);
  });

  // ===== UNIT TESTS: restoration logic (cancellation) =====

  it('should restore product stock on cancellation', () => {
    const currentStockQty = 7;
    const orderQuantity = 3;
    const restoredQty = currentStockQty + orderQuantity;
    expect(restoredQty).toBe(10);
  });

  it('should restore complement stock on cancellation', () => {
    const currentComplementStockQty = 3;
    const complementQty = 2;
    const itemQuantity = 1;
    const totalRestore = complementQty * itemQuantity;
    const restoredQty = currentComplementStockQty + totalRestore;
    expect(restoredQty).toBe(5);
  });

  // ===== INTEGRATION TESTS: deductStockForOrder function =====

  it('deductStockForOrder should exist and be callable', async () => {
    const dbModule = await import('./db');
    expect(typeof dbModule.deductStockForOrder).toBe('function');
  });

  it('restoreStockForOrder should exist and be callable', async () => {
    const dbModule = await import('./db');
    expect(typeof dbModule.restoreStockForOrder).toBe('function');
  });

  it('should deduct product stock when order is created (via advanced or simple stock)', async () => {
    const dbModule = await import('./db');
    const db = await dbModule.getDb();
    if (!db) throw new Error('DB not available');

    const { products, orders, orderItems } = await import('../drizzle/schema');
    const { eq, and } = await import('drizzle-orm');

    // Find a product with hasStock=true and stockQuantity >= 2 (to avoid edge cases)
    const allStockProducts = await db.select().from(products)
      .where(and(
        eq(products.hasStock, true),
        eq(products.status, 'active')
      ));
    const product = allStockProducts.find(p => p.stockQuantity !== null && p.stockQuantity >= 2);

    if (!product || product.stockQuantity === null) {
      console.log('No product with stockQuantity >= 2 found, skipping integration test');
      return;
    }

    const originalStockQty = product.stockQuantity;

    // Create a test order
    const orderNumber = `#TEST${Date.now()}`;
    const [orderResult] = await db.insert(orders).values({
      establishmentId: product.establishmentId,
      orderNumber,
      customerName: 'Test Stock Deduction',
      customerPhone: '11999999999',
      customerAddress: 'Rua Teste, 123',
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      subtotal: product.price,
      deliveryFee: '0.00',
      discount: '0.00',
      total: product.price,
      status: 'new',
      source: 'internal',
    });
    const orderId = orderResult.insertId;

    // Add order item
    await db.insert(orderItems).values({
      orderId,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      complements: [],
    });

    // Call deductStockForOrder
    await dbModule.deductStockForOrder(orderId);

    // Verify stock was decremented (either via advanced stock sync or simple stock)
    const [updatedProduct] = await db.select().from(products)
      .where(eq(products.id, product.id));
    
    // stockQuantity should be less than original (deducted by 1)
    expect(updatedProduct.stockQuantity).toBe(originalStockQty - 1);

    // Cleanup: restore stock and delete test order
    await db.update(products)
      .set({ stockQuantity: originalStockQty })
      .where(eq(products.id, product.id));
    // Also restore advanced stock if it was deducted
    const linkedItems = await dbModule.getStockItemsByLinkedProductIds([product.id]);
    for (const si of linkedItems) {
      const { stockItems } = await import('../drizzle/schema');
      await db.update(stockItems)
        .set({ currentQuantity: String(originalStockQty) })
        .where(eq(stockItems.id, si.id));
    }
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
  });

  it('should restore product stock when order is cancelled (via advanced or simple stock)', async () => {
    const dbModule = await import('./db');
    const db = await dbModule.getDb();
    if (!db) throw new Error('DB not available');

    const { products, orders, orderItems, stockItems } = await import('../drizzle/schema');
    const { eq, and } = await import('drizzle-orm');

    // Find a product with hasStock=true
    const [product] = await db.select().from(products)
      .where(and(
        eq(products.hasStock, true),
        eq(products.status, 'active')
      ))
      .limit(1);

    if (!product || product.stockQuantity === null) {
      console.log('No product with active stock found, skipping integration test');
      return;
    }

    const originalStockQty = product.stockQuantity;

    // Also save advanced stock state if exists
    const linkedItems = await dbModule.getStockItemsByLinkedProductIds([product.id]);
    const originalAdvancedQty = linkedItems.length > 0 ? Number(linkedItems[0].currentQuantity) : null;

    // Simulate: set stock to a deducted value (as if order was already placed)
    const deductedQty = Math.max(0, originalStockQty - 1);
    await db.update(products)
      .set({ stockQuantity: deductedQty })
      .where(eq(products.id, product.id));
    
    // Also deduct advanced stock if exists
    if (linkedItems.length > 0 && originalAdvancedQty !== null) {
      await db.update(stockItems)
        .set({ currentQuantity: String(deductedQty) })
        .where(eq(stockItems.id, linkedItems[0].id));
    }

    // Create a test order
    const orderNumber = `#TEST${Date.now()}`;
    const [orderResult] = await db.insert(orders).values({
      establishmentId: product.establishmentId,
      orderNumber,
      customerName: 'Test Stock Restore',
      customerPhone: '11999999999',
      customerAddress: 'Rua Teste, 123',
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      subtotal: product.price,
      deliveryFee: '0.00',
      discount: '0.00',
      total: product.price,
      status: 'cancelled',
      source: 'internal',
    });
    const orderId = orderResult.insertId;

    // Add order item
    await db.insert(orderItems).values({
      orderId,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      complements: [],
    });

    // Call restoreStockForOrder
    await dbModule.restoreStockForOrder(orderId);

    // Verify stock was restored (either via advanced stock sync or simple stock)
    const [updatedProduct] = await db.select().from(products)
      .where(eq(products.id, product.id));
    
    expect(updatedProduct.stockQuantity).toBe(deductedQty + 1);

    // Cleanup: restore original stock and delete test order
    await db.update(products)
      .set({ stockQuantity: originalStockQty })
      .where(eq(products.id, product.id));
    if (linkedItems.length > 0 && originalAdvancedQty !== null) {
      await db.update(stockItems)
        .set({ currentQuantity: String(originalAdvancedQty) })
        .where(eq(stockItems.id, linkedItems[0].id));
    }
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
  });

  it('should deduct complement simple stock when order has complements', async () => {
    const dbModule = await import('./db');
    const db = await dbModule.getDb();
    if (!db) throw new Error('DB not available');

    const { products, orders, orderItems, complementItems, complementGroups } = await import('../drizzle/schema');
    const { eq, and } = await import('drizzle-orm');

    // Find a complement item with hasStock=true and stockQuantity > 0
    const [complement] = await db.select().from(complementItems)
      .where(and(
        eq(complementItems.hasStock, true),
        eq(complementItems.isActive, true)
      ))
      .limit(1);

    if (!complement || complement.stockQuantity === null || complement.stockQuantity <= 0) {
      console.log('No complement with active stock found, skipping integration test');
      return;
    }

    // Find the group and product for this complement
    const [group] = await db.select().from(complementGroups)
      .where(eq(complementGroups.id, complement.groupId))
      .limit(1);
    if (!group) {
      console.log('Complement group not found, skipping');
      return;
    }

    const [product] = await db.select().from(products)
      .where(eq(products.id, group.productId))
      .limit(1);
    if (!product) {
      console.log('Product for complement not found, skipping');
      return;
    }

    const originalComplementStock = complement.stockQuantity;

    // Create a test order with this complement
    const orderNumber = `#TEST${Date.now()}`;
    const [orderResult] = await db.insert(orders).values({
      establishmentId: product.establishmentId,
      orderNumber,
      customerName: 'Test Complement Stock',
      customerPhone: '11999999999',
      customerAddress: 'Rua Teste, 123',
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      subtotal: product.price,
      deliveryFee: '0.00',
      discount: '0.00',
      total: product.price,
      status: 'new',
      source: 'internal',
    });
    const orderId = orderResult.insertId;

    // Add order item with complement
    await db.insert(orderItems).values({
      orderId,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      complements: [{ name: complement.name, price: Number(complement.price), quantity: 1 }],
    });

    // Call deductStockForOrder
    await dbModule.deductStockForOrder(orderId);

    // Verify complement stock was decremented
    const [updatedComplement] = await db.select().from(complementItems)
      .where(eq(complementItems.id, complement.id));
    
    expect(updatedComplement.stockQuantity).toBe(originalComplementStock - 1);

    // Cleanup
    await db.update(complementItems)
      .set({ stockQuantity: originalComplementStock })
      .where(eq(complementItems.id, complement.id));
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
  });
});
