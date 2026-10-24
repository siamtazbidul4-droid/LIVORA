import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Tag,
  Star,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-sm text-stone-600" role="status">
        Checking your sign-in session...
      </div>
    );
  }

  // Permission check
  const isStaff = user && ['super_admin', 'admin', 'order_manager', 'inventory_manager', 'catalog_manager', 'customer_support', 'finance'].includes(user.role);

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-stone-100 shadow-md">
          <ShieldCheck className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
            Restricted Admin Area
          </h2>
          <p className="text-xs text-stone-600 mb-6">
            Authorized staff permissions required to access administrative operations.
          </p>
          <Link
            to="/"
            className="rounded-xl bg-[#133E32] px-6 py-2.5 text-xs font-semibold text-white inline-block"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products & SKUs', path: '/admin/products', icon: Package },
    { name: 'Orders & Fulfillment', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Inventory & Stock', path: '/admin/inventory', icon: Boxes },
    { name: 'Categories & Brands', path: '/admin/categories', icon: Layers },
    { name: 'Marketing & Coupons', path: '/admin/coupons', icon: Tag },
    { name: 'Review Moderation', path: '/admin/reviews', icon: Star },
    { name: 'CMS & Homepage Ads', path: '/admin/cms', icon: FileText },
    { name: 'Staff & RBAC Roles', path: '/admin/staff', icon: Users },
  ];

  const handleSignOut = async () => {
    let serverLogoutFailed = false;
    try {
      await api.post('/auth/logout');
    } catch (error) {
      serverLogoutFailed = true;
      console.error('Server session revocation failed:', error);
    }
    dispatch(logout());
    dispatch(
      addToast({
        type: serverLogoutFailed ? 'warning' : 'info',
        title: serverLogoutFailed ? 'Signed Out Locally' : 'Signed Out',
        message: serverLogoutFailed
          ? 'This browser was signed out, but the server could not revoke the session.'
          : 'Admin session closed.',
      })
    );
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0E2E24] text-stone-300 flex flex-col justify-between transition-transform transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-[#133E32] flex items-center justify-between">
            <Link to="/admin" className="flex flex-col">
              <span className="text-xl font-serif font-bold text-white tracking-wider">
                NOVARA OPS
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold mt-0.5">
                Staff Administration
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-stone-400 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1 text-xs">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    active
                      ? 'bg-[#184F3F] text-white shadow-xs font-semibold'
                      : 'text-stone-300 hover:bg-[#133E32] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-300" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar (User Badge & Logout) */}
        <div className="p-4 border-t border-[#133E32] space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-stone-300 hover:text-white hover:bg-[#133E32] text-xs"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              Live Storefront
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
          </Link>

          <div className="px-3 py-2 bg-[#0A241C] rounded-xl flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <p className="font-semibold text-white truncate leading-tight">
                {user?.name}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">
                {user?.role.toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-stone-400 hover:text-rose-400 p-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xs border-b border-stone-200/80 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-stone-700 hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Admin Portal</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-stone-900 capitalize">
                {location.pathname.replace('/admin', '').replace('/', '') || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Backend Live (Atlas DB Connected)
            </span>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="p-6 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
