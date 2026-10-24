import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './features/cart/CartDrawer';
import { AuthModal } from './features/auth/AuthModal';
import { ToastContainer } from './components/feedback/ToastContainer';
import { StartupLoadingScreen } from './components/StartupLoadingScreen';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { logout, setCredentials, setLoading } from './features/auth/authSlice';
import { api, ApiError } from './services/api';
import type { User } from './types';

const AuthSessionBootstrap: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    let active = true;
    if (!token) {
      dispatch(setLoading(false));
      return () => {
        active = false;
      };
    }

    api
      .get<{ user: User }>('/auth/me')
      .then(({ user }) => {
        if (active) dispatch(setCredentials({ user, token }));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          dispatch(logout());
          return;
        }
        console.error('Saved authentication session could not be validated:', error);
        dispatch(setLoading(false));
      });

    return () => {
      active = false;
    };
  }, [dispatch, token]);

  return null;
};

// Customer Pages
import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderHistoryPage } from './pages/account/OrderHistoryPage';
import { SavedAddressesPage } from './pages/account/SavedAddressesPage';
import { WishlistPage } from './pages/account/WishlistPage';
import { AccountSettingsPage } from './pages/account/AccountSettingsPage';
import { SupportPage } from './pages/SupportPage';

// Admin Pages
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminCMSPage } from './pages/admin/AdminCMSPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';

// Storefront Shell with Header, Footer, Cart Drawer, Auth Modal, and Toasts
const StorefrontLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StartupLoadingScreen />
      <AuthSessionBootstrap />
      <Routes>
        {/* Storefront Layout */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<ProductListingPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account/orders" element={<OrderHistoryPage />} />
          <Route path="/account/orders/:orderId" element={<OrderHistoryPage />} />
          <Route path="/account/addresses" element={<SavedAddressesPage />} />
          <Route path="/account/wishlist" element={<WishlistPage />} />
          <Route path="/account/settings" element={<AccountSettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>

        {/* Admin Operational Modules */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="cms" element={<AdminCMSPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
