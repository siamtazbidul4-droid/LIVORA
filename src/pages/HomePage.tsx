import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addToCart } from '../features/cart/cartSlice';
import { animateCartFlight } from '../features/cart/cartFlight';
import { openAuthModal } from '../features/auth/authSlice';
import { toggleWishlist } from '../features/wishlist/wishlistSlice';
import { addToast } from '../features/toast/toastSlice';
import { api } from '../services/api';
import { Product, CMSConfig } from '../types';
import {
  Heart,
  Star,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Leaf,
  Smile,
  ExternalLink,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.wishlist.itemIds);

  const [cms, setCms] = useState<CMSConfig | null>(null);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [justForYou, setJustForYou] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmsRes, productsRes, recRes] = await Promise.all([
          api.get('/cms'),
          api.get('/products', { limit: 20 }),
          api.get('/recommendations/personalized', { limit: 6 }).catch(() => ({ products: [] })),
        ]);

        setCms(cmsRes);

        const all: Product[] = productsRes.products || [];
        setNewArrivals(all.slice(0, 5));
        setBestSellers(all.slice(5, 10));
        setJustForYou(recRes.products?.length > 0 ? recRes.products : all.slice(10, 16));
      } catch (err) {
        console.warn('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: product.salePrice || product.basePrice,
      originalPrice: product.basePrice,
      image: product.images[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      quantity: 1,
      maxStock: product.stock,
    };

    // Phase 3.1: Add to Cart authentication gate
    if (!isAuthenticated) {
      dispatch(
        openAuthModal({
          view: 'login',
          pendingCartItem: itemToAdd,
        })
      );
      dispatch(
        addToast({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in or create an account to add items to your shopping bag.',
        })
      );
      return;
    }

    animateCartFlight(e.currentTarget);
    dispatch(addToCart(itemToAdd));

    // Track recommendation interaction
    api.post('/recommendations/track', {
      productId: product._id,
      productName: product.name,
      category: product.category,
      brand: product.brand,
      eventType: 'add_to_cart',
      sessionId: localStorage.getItem('novara_session_id') || 'anon_session',
    }).catch(() => {});

    dispatch(
      addToast({
        type: 'success',
        title: 'Added to Bag',
        message: `${product.name} added to your cart`,
      })
    );
  };

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(toggleWishlist(productId));
    const isNowFav = !wishlist.includes(productId);
    dispatch(
      addToast({
        type: isNowFav ? 'success' : 'info',
        title: isNowFav ? 'Added to Wishlist' : 'Removed from Wishlist',
        message: isNowFav ? 'Saved to your personal collection' : 'Removed from wishlist',
      })
    );
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterSubmitting(true);
    try {
      await api.post('/support/newsletter', { email: newsletterEmail.trim() });
      dispatch(
        addToast({
          type: 'success',
          title: 'Welcome to Our Circle',
          message: 'Thank you for subscribing! Check your inbox for your 10% welcome voucher.',
        })
      );
      setNewsletterEmail('');
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Subscription Note',
          message: err?.message || 'Unable to register email at this time.',
        })
      );
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  // Circular Categories Matching Reference Image
  const circularCategories = [
    { name: 'Sofas & Seating', slug: 'furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=250&q=80' },
    { name: 'Beds & Mattresses', slug: 'bedding', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=250&q=80' },
    { name: 'Dining', slug: 'furniture', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=250&q=80' },
    { name: 'Storage', slug: 'storage', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=250&q=80' },
    { name: 'Home Decor', slug: 'home-decor', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=250&q=80' },
    { name: 'Lighting', slug: 'lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=250&q=80' },
    { name: 'Rugs', slug: 'rugs', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=250&q=80' },
    { name: 'Kitchen', slug: 'kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=250&q=80' },
    { name: 'Bath', slug: 'bath', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=250&q=80' },
    { name: 'Outdoor', slug: 'outdoor', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=250&q=80' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      {/* 1. Hero Campaign Section Matching Reference Image */}
      <section className="relative bg-[#EDE8DF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="relative rounded-3xl overflow-hidden min-h-[480px] lg:min-h-[580px] flex items-center shadow-lg border border-stone-200/60">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${
                  cms?.heroCampaign?.imageUrl ||
                  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=85'
                })`,
              }}
            >
              {/* Soft gradient wash */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 via-stone-900/30 to-transparent sm:from-white/70 sm:via-white/40 sm:to-transparent" />
            </div>

            {/* Hero Copy Overlay */}
            <div className="relative z-10 max-w-xl p-8 sm:p-14">
              <span className="inline-block text-[10px] tracking-[0.25em] font-semibold text-stone-700 sm:text-stone-800 uppercase mb-3 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-sm">
                {cms?.heroCampaign?.tagline || 'SPACES THAT FEEL LIKE YOU'}
              </span>

              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-stone-900 leading-[1.1] mb-4">
                {cms?.heroCampaign?.title || 'Beautiful Homes Brighter Lives'}
              </h1>

              <p className="text-sm sm:text-base text-stone-700 max-w-md font-normal leading-relaxed mb-8">
                {cms?.heroCampaign?.subtitle ||
                  'Timeless furniture and home essentials for every story.'}
              </p>

              <div className="flex items-center gap-4">
                <Link
                  to={cms?.heroCampaign?.ctaLink || '/products'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#133E32] px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#0d2e24] transition-all transform hover:-translate-y-0.5"
                >
                  <span>{cms?.heroCampaign?.ctaText || 'Shop the Collection'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Script Callout Accent (top right in reference image) */}
            <div className="absolute top-8 right-8 hidden md:block text-right">
              <span className="font-serif italic text-2xl lg:text-3xl text-stone-800 drop-shadow-xs">
                A more beautiful tomorrow
              </span>
            </div>

            {/* Pagination dots (bottom right) */}
            <div className="absolute bottom-6 right-8 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#133E32]" />
              <div className="w-2 h-2 rounded-full bg-stone-400/80" />
              <div className="w-2 h-2 rounded-full bg-stone-400/80" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Circular Category Shortcuts Grid */}
      <section className="py-10 border-b border-stone-200/60 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4 sm:gap-6 text-center">
            {circularCategories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center"
              >
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#133E32] shadow-xs transition-all transform group-hover:scale-105 bg-stone-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="mt-2 text-[11px] sm:text-xs font-medium text-stone-700 group-hover:text-[#133E32] transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. New Arrivals Carousel/Grid */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/products?sort=newest"
            className="text-xs font-semibold text-[#133E32] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {newArrivals.map((product) => {
            const isFav = wishlist.includes(product._id);
            return (
              <div
                key={product._id}
                data-cart-flight-card
                onClick={() => navigate(`/products/${product.slug}`)}
                className="group relative bg-white rounded-xl border border-stone-100 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-square bg-[#F4F1EA] overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-[#133E32] text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                    New
                  </span>
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(product._id, e)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-stone-600 hover:text-rose-600 shadow-xs transition-colors"
                    aria-label="Wishlist"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-rose-600 text-rose-600' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Card Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-stone-900 group-hover:text-[#133E32] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-stone-900">
                        ৳{(product.salePrice || product.basePrice).toLocaleString()}
                      </span>
                      {product.salePrice && product.salePrice < product.basePrice && (
                        <span className="text-[10px] text-stone-400 line-through">
                          ৳{product.basePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-50">
                    <div className="flex items-center text-amber-500 text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="ml-1 font-medium text-stone-600">
                        {product.rating.toFixed(1)} ({product.numReviews})
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="text-[10px] font-semibold text-[#133E32] hover:text-[#0d2e24] underline"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Split Promotional Banners (Make Every Corner Special & Comfort Lives Here) */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Banner: Green */}
          <div className="relative rounded-2xl overflow-hidden bg-[#133E32] text-white p-8 sm:p-10 flex flex-col justify-between min-h-[300px] shadow-sm">
            <div className="relative z-10 max-w-xs">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold leading-tight mb-2">
                {cms?.splitBanners?.left?.title || 'Make Every Corner Special'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-200 mb-6">
                {cms?.splitBanners?.left?.subtitle || 'Up to 40% Off Home Decor'}
              </p>
              <Link
                to={cms?.splitBanners?.left?.ctaLink || '/products?category=home-decor'}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#133E32] hover:bg-stone-100 transition-colors"
              >
                <span>{cms?.splitBanners?.left?.ctaText || 'Shop Decor'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <img
              src={
                cms?.splitBanners?.left?.imageUrl ||
                'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=700&q=80'
              }
              alt="Home Decor Showcase"
              className="absolute right-0 bottom-0 top-0 w-1/2 object-cover opacity-90 mix-blend-luminosity"
            />
          </div>

          {/* Right Banner: Warm Cream */}
          <div className="relative rounded-2xl overflow-hidden bg-[#EAE5DC] text-stone-900 p-8 sm:p-10 flex flex-col justify-between min-h-[300px] shadow-sm border border-stone-200/60">
            <div className="relative z-10 max-w-xs">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold leading-tight mb-2">
                {cms?.splitBanners?.right?.title || 'Comfort Lives Here'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-6">
                {cms?.splitBanners?.right?.subtitle ||
                  'Premium Bedding Collection Up to 30% Off'}
              </p>
              <Link
                to={cms?.splitBanners?.right?.ctaLink || '/products?category=bedding'}
                className="inline-flex items-center gap-2 rounded-full bg-[#133E32] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0d2e24] transition-colors"
              >
                <span>{cms?.splitBanners?.right?.ctaText || 'Shop Bedding'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <img
              src={
                cms?.splitBanners?.right?.imageUrl ||
                'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80'
              }
              alt="Bedding Collection"
              className="absolute right-0 bottom-0 top-0 w-1/2 object-cover opacity-80"
            />
          </div>
        </div>
      </section>

      {/* 5. Best Sellers & Curated Collections Split Section */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Best Sellers (Takes 2 cols) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                Best Sellers
              </h2>
              <Link
                to="/products?sort=popular"
                className="text-xs font-semibold text-[#133E32] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {bestSellers.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/products/${item.slug}`)}
                  className="group bg-white rounded-xl border border-stone-100 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer p-3"
                >
                  <div className="aspect-square bg-[#F4F1EA] rounded-lg overflow-hidden mb-2.5">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-stone-900 truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-[#133E32]">
                      ৳{(item.salePrice || item.basePrice).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Collections (Takes 1 col) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                Curated Collections
              </h2>
              <Link
                to="/products"
                className="text-xs font-semibold text-[#133E32] hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {[
                { title: 'Modern Minimalist', slug: 'furniture', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80' },
                { title: 'Cozy Living', slug: 'bedding', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' },
                { title: 'Outdoor Retreat', slug: 'outdoor', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80' },
                { title: 'Small Space Solutions', slug: 'storage', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80' },
              ].map((col, idx) => (
                <Link
                  key={idx}
                  to={`/products?category=${col.slug}`}
                  className="group relative rounded-xl overflow-hidden aspect-[4/5] bg-stone-100 shadow-2xs block"
                >
                  <img
                    src={col.image}
                    alt={col.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {col.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. "Just For You" & "Live Sustainably" Split Section */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Just For You (2 cols) */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                Just For You
              </h2>
              <p className="text-xs text-stone-500">
                Because great homes reflect great people. Hand-selected for your comfort.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {justForYou.map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/products/${item.slug}`)}
                  className="group bg-white rounded-xl border border-stone-100 overflow-hidden p-3 shadow-2xs cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-stone-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs font-bold text-[#133E32] mt-1">
                    ৳{(item.salePrice || item.basePrice).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Sustainably (1 col) */}
          <div className="bg-[#133E32] rounded-2xl p-7 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-300">
                Eco Essentials
              </span>
              <h3 className="text-2xl font-serif font-bold mt-1 mb-2">
                Live Sustainably
              </h3>
              <p className="text-xs text-stone-200 leading-relaxed mb-6">
                Eco-friendly home essentials crafted from recycled woods, organic linens, and sustainable clays for a brighter planet.
              </p>
              <Link
                to="/products?category=home-decor"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#133E32] hover:bg-stone-100 transition-colors"
              >
                <span>Shop Sustainable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-6 border-t border-emerald-900/60 mt-6 flex items-center justify-between text-[11px] text-emerald-200 relative z-10">
              <span>Better Homes</span>
              <span>·</span>
              <span>Greener Tomorrow</span>
            </div>

            <img
              src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=400&q=80"
              alt="Plant"
              className="absolute -right-8 -bottom-8 w-44 h-44 object-contain opacity-40 mix-blend-overlay"
            />
          </div>
        </div>
      </section>

      {/* 7. Dedicated Admin-Managed Promotional Ad Placement (Optional in CMS) */}
      {cms?.promotionalAd?.enabled && cms?.promotionalAd?.imageUrl && (
        <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <a
            href={cms.promotionalAd.destinationUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative rounded-2xl overflow-hidden shadow-md border border-stone-200"
          >
            <img
              src={cms.promotionalAd.imageUrl}
              alt={cms.promotionalAd.altText || cms.promotionalAd.title}
              className="w-full h-44 sm:h-56 object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/30 to-transparent flex items-center p-8">
              <div className="max-w-md text-white">
                {cms.promotionalAd.badgeText && (
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500 text-stone-900 px-2 py-0.5 rounded-xs">
                    {cms.promotionalAd.badgeText}
                  </span>
                )}
                <h3 className="text-xl sm:text-2xl font-serif font-bold mt-1">
                  {cms.promotionalAd.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 mt-2 group-hover:underline">
                  Discover Now <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </a>
        </section>
      )}

      {/* 8. "What Our Customers Say" (Authentic Verified Reviews) */}
      <section className="py-14 bg-[#FAF8F5] border-t border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              What Our Customers Say
            </h2>
            <Link
              to="/products"
              className="text-xs font-semibold text-[#133E32] hover:underline"
            >
              View All Reviews →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah M.',
                location: 'Gulshan, Dhaka',
                role: 'Verified Buyer',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                rating: 5,
                comment: 'Amazing quality and beautiful designs! My living room feels completely transformed with the Avela Sofa.',
              },
              {
                name: 'Ali K.',
                location: 'Uttara, Dhaka',
                role: 'Verified Buyer',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                rating: 5,
                comment: 'Fast delivery and excellent customer service. The packaging was immaculate. Highly recommended!',
              },
              {
                name: 'Emma R.',
                location: 'Panchlaish, Chittagong',
                role: 'Verified Buyer',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
                rating: 5,
                comment: 'Stylish and durable solid wood craftsmanship. Exactly what I was looking for in minimalist aesthetics.',
              },
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-2xs space-y-4"
              >
                <div className="flex items-center text-amber-500 gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                  "{rev.comment}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-stone-50">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="w-10 h-10 rounded-full object-cover border border-stone-100"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-stone-900 leading-tight">
                      {rev.name}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ {rev.role} · {rev.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Value Propositions Banner */}
      <section className="py-10 border-t border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Truck className="w-6 h-6 text-[#133E32] mb-2" />
              <h4 className="text-xs font-semibold text-stone-900">Free Shipping</h4>
              <p className="text-[11px] text-stone-500">On orders over ৳5,000</p>
            </div>

            <div className="flex flex-col items-center">
              <ShieldCheck className="w-6 h-6 text-[#133E32] mb-2" />
              <h4 className="text-xs font-semibold text-stone-900">Secure Payments</h4>
              <p className="text-[11px] text-stone-500">100% protected checkout</p>
            </div>

            <div className="flex flex-col items-center">
              <RotateCcw className="w-6 h-6 text-[#133E32] mb-2" />
              <h4 className="text-xs font-semibold text-stone-900">Easy Returns</h4>
              <p className="text-[11px] text-stone-500">Hassle-free 7-day policy</p>
            </div>

            <div className="flex flex-col items-center">
              <Leaf className="w-6 h-6 text-[#133E32] mb-2" />
              <h4 className="text-xs font-semibold text-stone-900">Sustainable Choices</h4>
              <p className="text-[11px] text-stone-500">A greener tomorrow</p>
            </div>

            <div className="flex flex-col items-center col-span-2 md:col-span-1">
              <Smile className="w-6 h-6 text-[#133E32] mb-2" />
              <h4 className="text-xs font-semibold text-stone-900">Happy Customers</h4>
              <p className="text-[11px] text-stone-500">Trusted by 100k+ homes</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. "Join Our Home Circle" Newsletter Box */}
      <section className="py-14 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#EFEAE2] rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Join Our Home Circle
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Get exclusive offers, styling tips, and new arrivals delivered to your inbox.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="mt-6 flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-xs sm:text-sm focus:border-[#133E32] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={newsletterSubmitting}
                  className="rounded-xl bg-[#133E32] px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#0d2e24] transition-colors disabled:opacity-50"
                >
                  {newsletterSubmitting ? 'Joining...' : 'Subscribe'}
                </button>
              </form>
            </div>

            <div className="text-center md:text-right hidden sm:block">
              <span className="font-serif italic text-2xl text-stone-800 block">
                Good Homes
              </span>
              <span className="font-serif italic text-xl text-stone-600">
                Happier People
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
