import { configureStore } from '@reduxjs/toolkit';
import watchReducer from './slices/watchSlice';

export const store = configureStore({
  reducer: {
    watch: watchReducer
  }
});

// Clear unused/large items from localStorage to prevent QuotaExceededError
try {
  localStorage.removeItem('khroniq_products');
  localStorage.removeItem('khroniq_orders');
  localStorage.removeItem('khroniq_coupons');
} catch (e) {
  console.warn('Failed to clean up localStorage:', e);
}

// Auto-sync Redux store state changes to localStorage
store.subscribe(() => {
  const state = store.getState().watch;
  localStorage.setItem('khroniq_cart', JSON.stringify(state.cart));
  localStorage.setItem('khroniq_wishlist', JSON.stringify(state.wishlist));
  if (state.currentUser) {
    localStorage.setItem('khroniq_user', JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem('khroniq_user');
  }
});
