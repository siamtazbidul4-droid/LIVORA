import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // default 4000ms
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
}

const initialState: ToastState = {
  toasts: [],
};

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<{
        type: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
        duration?: number;
      }>
    ) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      // Keep max 5 toasts visible to prevent spamming
      if (state.toasts.length >= 5) {
        state.toasts.shift();
      }
      state.toasts.push({
        id,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration ?? 4000,
        createdAt: Date.now(),
      });
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearAllToasts } = toastSlice.actions;
export default toastSlice.reducer;
