import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
  itemIds: string[];
}

const loadWishlist = (): string[] => {
  try {
    const raw = localStorage.getItem('novara_wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const initialState: WishlistState = {
  itemIds: loadWishlist(),
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.itemIds.indexOf(id);
      if (index > -1) {
        state.itemIds.splice(index, 1);
      } else {
        state.itemIds.push(id);
      }
      try {
        localStorage.setItem('novara_wishlist', JSON.stringify(state.itemIds));
      } catch (e) {
        console.error(e);
      }
    },
    clearWishlist: (state) => {
      state.itemIds = [];
      try {
        localStorage.removeItem('novara_wishlist');
      } catch (e) {
        console.error(e);
      }
    },
  },
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
