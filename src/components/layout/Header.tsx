import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleCartDrawer, selectCartBadgeCount } from '../../features/cart/cartSlice';
import { openAuthModal, logout } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { api } from '../../services/api';
import { Product } from '../../types';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Package,
  MapPin,
  Settings,
  ShieldCheck,
  LogOut,
  Armchair,
  Home,
  Lamp,
  Bed,
  UtensilsCrossed,
  Bath,
  Archive,
  Grid,
  Sun,
  Percent,
} from 'lucide-react';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const cartBadgeCount = useAppSelector(selectCartBadgeCount);
  const wishlistCount = useAppSelector((state) => state.wishlist.itemIds.length);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Account dropdown state
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debounced Search Suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/search/suggest', { q: searchQuery.trim(), limit: 8 });
        setSuggestions(res.products || []);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search & account menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSuggestion = (product: Product) => {
    setShowDropdown(false);
    setSearchQuery('');
    navigate(`/products/${product.slug}`);
  };

  const handleSignOut = async () => {
    let serverLogoutFailed = false;
    try {
      await api.post('/auth/logout');
    } catch (error) {
      serverLogoutFailed = true;
      console.error('Server session revocation failed:', error);
    }
    dispatch(logout());
    setAccountMenuOpen(false);
    dispatch(
      addToast({
        type: serverLogoutFailed ? 'warning' : 'info',
        title: serverLogoutFailed ? 'Signed Out Locally' : 'Signed Out',
        message: serverLogoutFailed
          ? 'This browser was signed out, but the server could not revoke the session. Sign in again when service is restored.'
          : 'Your session has been closed.',
      })
    );
    navigate('/');
  };

  const isStaff = user && ['super_admin', 'admin', 'order_manager', 'inventory_manager', 'catalog_manager', 'customer_support'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 bg-[#FCFBF7] border-b border-stone-200/80 shadow-xs">
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#133E32] text-stone-100 text-[11px] sm:text-xs py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-medium tracking-wide">
              Free Shipping on Orders Over ৳5,000 | Stylish Homes. Happier Lives.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-stone-200 text-xs">
            <Link to="/account/orders" className="hover:text-white transition-colors">
              Track Order
            </Link>
            <span className="text-stone-500">|</span>
            <Link to="/support" className="hover:text-white transition-colors">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-8">
          {/* Mobile hamburger & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-stone-700 hover:bg-stone-100 shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex flex-col group min-w-0">
              <span className="text-xl sm:text-2xl font-serif font-bold tracking-[0.08em] text-[#133E32] leading-none truncate">
                LIVORA
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.14em] sm:tracking-[0.2em] font-medium text-stone-500 uppercase mt-0.5 whitespace-nowrap">
                Live a Better Home
              </span>
            </Link>
          </div>

          {/* Search Bar with Cross-lingual Autocomplete */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center min-w-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search furniture, decor, lighting, or 'মোটিভেশনাল বই'..."
                className="w-full rounded-full border border-stone-300 bg-white pl-5 pr-12 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#133E32] focus:outline-none focus:ring-1 focus:ring-[#133E32] transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 p-1.5 rounded-full bg-[#133E32] text-white hover:bg-[#0d2e24] transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Bounded Autocomplete Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                <div className="p-2 border-b border-stone-100 flex items-center justify-between text-[11px] text-stone-500 bg-stone-50/70">
                  <span>
                    {isSearching ? 'Searching...' : `Suggestions for "${searchQuery}"`}
                  </span>
                  <span className="text-[10px] text-stone-400">Esc to close</span>
                </div>

                {suggestions.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-xs text-stone-500">
                    No products found matching "{searchQuery}". Try "sofa", "bed", "lamp", or "বই".
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {suggestions.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleSelectSuggestion(item)}
                        className="p-2.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition-colors"
                      >
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-12 h-12 rounded object-cover bg-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-stone-900 truncate">
                            {item.name}
                          </h4>
                          {item.nameBn && (
                            <p className="text-[10px] text-stone-500">{item.nameBn}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-[#133E32]">
                              ৳{(item.salePrice || item.basePrice).toLocaleString()}
                            </span>
                            {item.salePrice && item.salePrice < item.basePrice && (
                              <span className="text-[10px] text-stone-400 line-through">
                                ৳{item.basePrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={handleSearchSubmit}
                      className="p-2 text-center text-xs font-medium text-[#133E32] hover:bg-stone-100/70 cursor-pointer"
                    >
                      View all results for "{searchQuery}" →
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons: Account, Wishlist, Cart */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
            {/* Account Popup Trigger */}
            <div ref={accountMenuRef} className="relative">
              <button
                onClick={() => {
                  if (!authLoading) setAccountMenuOpen(!accountMenuOpen);
                }}
                disabled={authLoading}
                className="flex items-center gap-1.5 text-stone-700 hover:text-[#133E32] p-1 rounded-lg transition-colors"
                aria-label={authLoading ? 'Checking authentication session' : 'Account menu'}
              >
                <User className="w-5 h-5 text-stone-700" />
                <span className="hidden sm:inline text-xs font-medium text-stone-700 truncate max-w-[86px]">
                  {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />
              </button>

              {/* Account Dropdown Panel */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-100 py-2 z-50 text-xs">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                          Signed in as
                        </p>
                        <p className="font-semibold text-stone-900 truncate mt-0.5">
                          {user?.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          {user?.role.toUpperCase()}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/account/orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50"
                        >
                          <Package className="w-4 h-4 text-stone-400" />
                          <span>My Orders & Tracking</span>
                        </Link>
                        <Link
                          to="/account/addresses"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50"
                        >
                          <MapPin className="w-4 h-4 text-stone-400" />
                          <span>Saved Addresses</span>
                        </Link>
                        <Link
                          to="/account/settings"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50"
                        >
                          <Settings className="w-4 h-4 text-stone-400" />
                          <span>Account Settings</span>
                        </Link>

                        {isStaff && (
                          <div className="border-t border-stone-100 my-1 pt-1">
                            <Link
                              to="/admin"
                              onClick={() => setAccountMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-[#133E32] font-semibold hover:bg-stone-50"
                            >
                              <ShieldCheck className="w-4 h-4 text-[#133E32]" />
                              <span>Admin Operations Panel</span>
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-stone-600">
                        Sign in to access your orders, saved addresses and seamless checkout.
                      </p>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          dispatch(openAuthModal({ view: 'register' }));
                        }}
                        className="w-full rounded-lg bg-[#133E32] py-2 text-xs font-semibold text-white hover:bg-[#0d2e24] transition-colors"
                      >
                        Sign In / Register
                      </button>
                      <div className="pt-2 border-t border-stone-100 space-y-1">
                        <Link
                          to="/account/orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-stone-600 hover:text-stone-900"
                        >
                          <Package className="w-3.5 h-3.5 text-stone-400" />
                          <span>Track Your Order</span>
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-stone-600 hover:text-stone-900"
                        >
                          <Home className="w-3.5 h-3.5 text-stone-400" />
                          <span>Customer Service & FAQs</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/account/wishlist"
              className="flex items-center gap-1 text-stone-700 hover:text-[#133E32] relative p-1"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-stone-700" />
              <span className="hidden sm:inline text-xs font-medium text-stone-700">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => dispatch(toggleCartDrawer(true))}
              data-cart-target
              className="flex items-center gap-1.5 text-stone-700 hover:text-[#133E32] relative p-1"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5 text-stone-700" />
              <span className="hidden sm:inline text-xs font-medium text-stone-700">Cart</span>
              {cartBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#133E32] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {cartBadgeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search furniture, decor, lighting..."
              className="w-full rounded-full border border-stone-300 bg-white pl-4 pr-10 py-1.5 text-xs text-stone-800"
            />
            <button
              type="submit"
              className="absolute right-1 p-1 rounded-full bg-[#133E32] text-white"
              aria-label="Search products"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Primary Category Navigation Bar */}
      <nav className="border-t border-stone-200/60 bg-[#FAF8F5] hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-between text-xs font-medium text-stone-700 py-2.5">
            <li>
              <Link to="/products?category=furniture" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Armchair className="w-4 h-4 text-stone-500" />
                <span>Furniture</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=home-decor" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Home className="w-4 h-4 text-stone-500" />
                <span>Decor</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=lighting" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Lamp className="w-4 h-4 text-stone-500" />
                <span>Lighting</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=bedding" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Bed className="w-4 h-4 text-stone-500" />
                <span>Bedding</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=kitchen" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <UtensilsCrossed className="w-4 h-4 text-stone-500" />
                <span>Kitchen</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=bath" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Bath className="w-4 h-4 text-stone-500" />
                <span>Bath</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=storage" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Archive className="w-4 h-4 text-stone-500" />
                <span>Storage</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=rugs" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Grid className="w-4 h-4 text-stone-500" />
                <span>Rugs</span>
              </Link>
            </li>
            <li>
              <Link to="/products?category=outdoor" className="flex items-center gap-1.5 hover:text-[#133E32] transition-colors py-1">
                <Sun className="w-4 h-4 text-stone-500" />
                <span>Outdoor</span>
              </Link>
            </li>
            <li>
              <Link to="/products?sale=true" className="flex items-center gap-1.5 text-rose-600 font-semibold hover:text-rose-700 transition-colors py-1">
                <Percent className="w-4 h-4 text-rose-600" />
                <span>Sale</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Categories
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link to="/products?category=furniture" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Furniture</Link>
            <Link to="/products?category=home-decor" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Decor</Link>
            <Link to="/products?category=lighting" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Lighting</Link>
            <Link to="/products?category=bedding" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Bedding</Link>
            <Link to="/products?category=kitchen" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Kitchen</Link>
            <Link to="/products?category=bath" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Bath</Link>
            <Link to="/products?category=storage" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Storage</Link>
            <Link to="/products?category=rugs" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Rugs</Link>
            <Link to="/products?category=outdoor" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-stone-700">Outdoor</Link>
            <Link to="/products?sale=true" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-rose-600 font-semibold">Sale</Link>
          </div>
          {isStaff && (
            <div className="pt-2 border-t border-stone-100">
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-[#133E32] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Admin Operations
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
