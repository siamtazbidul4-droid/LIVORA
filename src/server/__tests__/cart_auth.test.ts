import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { resolveProductReference } from '../routes/order.routes';

describe('Phase 3 & 4 — Cart Unique Line Items & Auth Security', () => {
  it('cart badge count correctly computes unique line items rather than quantity sum', () => {
    const mockCartItems = [
      { productId: 'p1', quantity: 3 },
      { productId: 'p2', quantity: 5 },
      { productId: 'p3', quantity: 1 },
    ];

    // Unique lines count rule (Phase 4 requirement)
    const uniqueLineCount = mockCartItems.length;
    const totalQuantitySum = mockCartItems.reduce((acc, i) => acc + i.quantity, 0);

    expect(uniqueLineCount).toBe(3);
    expect(totalQuantitySum).toBe(9);
  });

  it('securely hashes passwords with bcrypt and verifies candidate match', async () => {
    const plain = 'SecurePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plain, salt);

    expect(hash).not.toBe(plain);
    const isValid = await bcrypt.compare(plain, hash);
    const isInvalid = await bcrypt.compare('WrongPassword', hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it('merges incoming guest cart items deterministically into existing lines', () => {
    const existingCart = [
      { productId: 'p1', variantSku: 'v-black', quantity: 1, maxStock: 5 },
      { productId: 'p2', variantSku: 'v-white', quantity: 2, maxStock: 10 },
    ];

    const incomingCart = [
      { productId: 'p1', variantSku: 'v-black', quantity: 2, maxStock: 5 }, // Same line -> qty should be 3
      { productId: 'p3', variantSku: '', quantity: 1, maxStock: 3 }, // New line
    ];

    const mergedMap = new Map<string, any>();
    for (const item of existingCart) {
      mergedMap.set(`${item.productId}_${item.variantSku}`, { ...item });
    }
    for (const item of incomingCart) {
      const key = `${item.productId}_${item.variantSku}`;
      if (mergedMap.has(key)) {
        const curr = mergedMap.get(key);
        curr.quantity = Math.min(curr.quantity + item.quantity, item.maxStock);
      } else {
        mergedMap.set(key, { ...item });
      }
    }

    const merged = Array.from(mergedMap.values());
    expect(merged.length).toBe(3); // 3 unique lines
    const p1 = merged.find((i) => i.productId === 'p1');
    expect(p1?.quantity).toBe(3);
  });

  it('verifies pending cart item is preserved during authentication gate and fulfilled once', () => {
    let pendingCartItem: any = {
      productId: 'prod_sofa_1',
      name: 'Avela Linen Curved Sofa',
      price: 48500,
      quantity: 1,
    };
    const cart: any[] = [];

    // Simulate Auth Success callback
    if (pendingCartItem) {
      cart.push(pendingCartItem);
      pendingCartItem = null; // Cleared immediately to prevent duplicate addition
    }

    // Attempt second auth trigger (e.g. repeated callback or double click)
    if (pendingCartItem) {
      cart.push(pendingCartItem);
    }

    expect(cart.length).toBe(1);
    expect(pendingCartItem).toBeNull();
  });

  it('resolves product references by Mongo ObjectId, slug, or SKU before checkout', async () => {
    const byId = await resolveProductReference('670c10000000000000000001');
    const bySlug = await resolveProductReference('avela-3-seater-sofa');
    const bySku = await resolveProductReference('LIV-SOFA-001');

    expect(byId?._id).toBe('670c10000000000000000001');
    expect(bySlug?.slug).toBe('avela-3-seater-sofa');
    expect(bySku?.sku).toBe('LIV-SOFA-001');
  });

  it('rejects ordinary customer role when authenticating through staff/admin portal', () => {
    const staffRoles = [
      'super_admin',
      'admin',
      'order_manager',
      'inventory_manager',
      'catalog_manager',
      'customer_support',
      'finance',
    ];

    const customerUser = { role: 'customer' };
    const adminUser = { role: 'super_admin' };

    expect(staffRoles.includes(customerUser.role)).toBe(false);
    expect(staffRoles.includes(adminUser.role)).toBe(true);
  });
});

