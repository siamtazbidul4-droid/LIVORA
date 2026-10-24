import { afterEach, describe, expect, it, vi } from 'vitest';

describe('cart drawer behavior', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the drawer closed on add and preserves an explicitly opened drawer', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: vi.fn(),
    });
    const { addToCart, cartSlice, toggleCartDrawer } = await import('../../features/cart/cartSlice');
    const item = {
      productId: 'product-1',
      name: 'Test product',
      price: 100,
      image: 'https://example.test/product.jpg',
      quantity: 1,
      maxStock: 5,
    };

    let state = cartSlice.reducer(undefined, { type: 'test/initialize' });
    state = cartSlice.reducer(state, addToCart(item));
    expect(state.isDrawerOpen).toBe(false);

    state = cartSlice.reducer(state, toggleCartDrawer(true));
    state = cartSlice.reducer(state, addToCart(item));
    expect(state.isDrawerOpen).toBe(true);
    expect(state.items[0].quantity).toBe(2);
  });
});
