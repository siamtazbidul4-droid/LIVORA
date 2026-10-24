import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, CartItem } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot_password';
  redirectAfterLogin: string | null;
  pendingCartItem: CartItem | null;
}

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('novara_token');
  } catch {
    return null;
  }
};

const token = getStoredToken();

const initialState: AuthState = {
  user: null,
  token,
  isAuthenticated: false,
  isLoading: Boolean(token),
  authModalOpen: false,
  authModalView: 'register',
  redirectAfterLogin: null,
  pendingCartItem: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      try {
        localStorage.setItem('novara_token', action.payload.token);
      } catch (e) {
        console.error('Failed to save auth to storage:', e);
      }
    },

    updateUserProfile: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      try {
        localStorage.removeItem('novara_token');
        localStorage.removeItem('novara_user');
      } catch (e) {
        console.error('Failed to remove auth from storage:', e);
      }
    },

    openAuthModal: (
      state,
      action: PayloadAction<{
        view?: 'login' | 'register' | 'forgot_password';
        redirect?: string;
        pendingCartItem?: CartItem;
      } | undefined>
    ) => {
      state.authModalOpen = true;
      state.authModalView = action?.payload?.view || 'register';
      state.redirectAfterLogin = action?.payload?.redirect || null;
      if (action?.payload?.pendingCartItem) {
        state.pendingCartItem = action.payload.pendingCartItem;
      }
    },

    closeAuthModal: (state) => {
      state.authModalOpen = false;
      state.redirectAfterLogin = null;
      state.pendingCartItem = null;
    },

    setPendingCartItem: (state, action: PayloadAction<CartItem | null>) => {
      state.pendingCartItem = action.payload;
    },

    clearPendingCartItem: (state) => {
      state.pendingCartItem = null;
    },

    setAuthModalView: (
      state,
      action: PayloadAction<'login' | 'register' | 'forgot_password'>
    ) => {
      state.authModalView = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCredentials,
  updateUserProfile,
  logout,
  openAuthModal,
  closeAuthModal,
  setAuthModalView,
  setPendingCartItem,
  clearPendingCartItem,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;
