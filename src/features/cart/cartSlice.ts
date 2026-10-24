import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../../types';

interface CartState {
  items: CartItem[];
  appliedCoupon: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
  } | null;
  shippingDivision: string;
  isDrawerOpen: boolean;
}

// Load initial guest cart from localStorage if present
const loadSavedCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('novara_cart');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse saved cart:', e);
  }
  return [];
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem('novara_cart', JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
};

const initialState: CartState = {
  items: loadSavedCart(),
  appliedCoupon: null,
  shippingDivision: 'Dhaka',
  isDrawerOpen: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantSku === newItem.variantSku
      );

      if (existingIndex > -1) {
        const currentQty = state.items[existingIndex].quantity;
        const newQty = Math.min(
          currentQty + newItem.quantity,
          newItem.maxStock || 99
        );
        state.items[existingIndex].quantity = newQty;
      } else {
        state.items.push({
          ...newItem,
          quantity: Math.min(newItem.quantity, newItem.maxStock || 99),
        });
      }
      saveCart(state.items);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; variantSku?: string; quantity: number }>
    ) => {
      const { productId, variantSku, quantity } = action.payload;
      const index = state.items.findIndex(
        (item) => item.productId === productId && item.variantSku === variantSku
      );

      if (index > -1) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          const max = state.items[index].maxStock || 99;
          state.items[index].quantity = Math.min(quantity, max);
        }
        saveCart(state.items);
      }
    },

    removeFromCart: (
      state,
      action: PayloadAction<{ productId: string; variantSku?: string }>
    ) => {
      const { productId, variantSku } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.productId === productId && item.variantSku === variantSku)
      );
      saveCart(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      saveCart([]);
    },

    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      saveCart(state.items);
    },

    applyCoupon: (
      state,
      action: PayloadAction<{
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        discountAmount: number;
      }>
    ) => {
      state.appliedCoupon = action.payload;
    },

    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },

    setShippingDivision: (state, action: PayloadAction<string>) => {
      state.shippingDivision = action.payload;
    },

    toggleCartDrawer: (state, action: PayloadAction<boolean | undefined>) => {
      if (typeof action.payload === 'boolean') {
        state.isDrawerOpen = action.payload;
      } else {
        state.isDrawerOpen = !state.isDrawerOpen;
      }
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  setCartItems,
  applyCoupon,
  removeCoupon,
  setShippingDivision,
  toggleCartDrawer,
} = cartSlice.actions;

export const selectCartBadgeCount = (state: { cart: CartState }) =>
  state.cart.items.length;

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectShippingFee = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state);
  if (subtotal >= 5000 || state.cart.items.length === 0) return 0;
  return state.cart.shippingDivision.toLowerCase() === 'dhaka' ? 80 : 150;
};

export const selectCartDiscount = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state);
  const coupon = state.cart.appliedCoupon;
  if (!coupon || subtotal === 0) return 0;
  if (coupon.discountType === 'percentage') {
    return Math.round((subtotal * coupon.discountValue) / 100);
  }
  return Math.min(coupon.discountValue, subtotal);
};

export const selectCartGrandTotal = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state);
  const shipping = selectShippingFee(state);
  const discount = selectCartDiscount(state);
  return Math.max(0, subtotal - discount + shipping);
};

export default cartSlice.reducer;
