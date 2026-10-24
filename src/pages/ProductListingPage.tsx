import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addToCart } from '../features/cart/cartSlice';
import { animateCartFlight } from '../features/cart/cartFlight';
import { openAuthModal } from '../features/auth/authSlice';
import { toggleWishlist } from '../features/wishlist/wishlistSlice';
import { addToast } from '../features/toast/toastSlice';
import { api } from '../services/api';
import { Product, Category, Brand } from '../types';
import {
  Heart,
  Star,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.wishlist.itemIds);

  const queryQ = searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || '';
  const querySort = searchParams.get('sort') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState(querySort);
  const [page, setPage] = useState(1);

  // Mobile filters drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  useEffect(() => {
    // Load metadata (categories & brands)
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(catRes.categories || []);
        setBrands(brandRes.brands || []);
      } catch (e) {
        console.warn('Failed to load filters metadata', e);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          q: queryQ,
          category: selectedCategory,
          brand: selectedBrand,
          minPrice: priceMin !== '' ? priceMin : undefined,
          maxPrice: priceMax !== '' ? priceMax : undefined,
          inStock: onlyInStock ? true : undefined,
          sort: sortBy,
          page,
          limit: 12,
        };

        const res = await api.get('/products', params);
        setProducts(res.products || []);
        setTotalCount(res.total || 0);
      } catch (err) {
        console.warn('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [queryQ, selectedCategory, selectedBrand, priceMin, priceMax, onlyInStock, sortBy, page]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceMin('');
    setPriceMax('');
    setOnlyInStock(false);
    setSortBy('newest');
    setSearchParams({});
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: product.salePrice || product.basePrice,
      originalPrice: product.basePrice,
      image: product.images[0],
      quantity: 1,
      maxStock: product.stock,
    };

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
        title: 'Added to Cart',
        message: `${product.name} is now in your shopping bag.`,
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
        title: isNowFav ? 'Added to Wishlist' : 'Removed',
        message: isNowFav ? 'Saved to your wishlist' : 'Removed from wishlist',
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Heading */}
        <div className="mb-6">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800">
              {queryQ ? `Search: "${queryQ}"` : selectedCategory ? selectedCategory.toUpperCase() : 'All Collections'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-900">
                {queryQ ? `Results for "${queryQ}"` : 'Browse Catalog'}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Showing {products.length} of {totalCount} curated items
              </p>
            </div>

            {/* Sort & Mobile Filter Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500 hidden sm:inline">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 focus:border-[#133E32] focus:outline-none"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block bg-white rounded-2xl border border-stone-100 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#133E32]" />
                Filters
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2.5">
                Categories
              </h4>
              <div className="space-y-1.5 text-xs text-stone-600 max-h-48 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left py-1 px-2 rounded-md transition-colors ${
                    !selectedCategory ? 'bg-[#133E32] text-white font-medium' : 'hover:bg-stone-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`w-full text-left py-1 px-2 rounded-md transition-colors ${
                      selectedCategory === c.slug
                        ? 'bg-[#133E32] text-white font-medium'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    {c.name} {c.nameBn && `(${c.nameBn})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2.5">
                Price (BDT ৳)
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-md border border-stone-200 px-2 py-1 text-xs"
                />
                <span className="text-stone-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-md border border-stone-200 px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2.5">
                Brand
              </h4>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-xs text-stone-700"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className="pt-4 border-t border-stone-100">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-[#133E32] focus:ring-[#133E32]"
                />
                <span>In Stock items only</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-stone-200/60 rounded-xl h-72" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
                <h3 className="text-base font-serif font-semibold text-stone-800 mb-1">
                  No matching products found
                </h3>
                <p className="text-xs text-stone-500 mb-6">
                  Try adjusting your keywords, price filters, or category selection.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="rounded-lg bg-[#133E32] px-5 py-2 text-xs font-semibold text-white"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {products.map((product) => {
                  const isFav = wishlist.includes(product._id);
                  return (
                    <div
                      key={product._id}
                      data-cart-flight-card
                      onClick={() => navigate(`/products/${product.slug}`)}
                      className="group bg-white rounded-xl border border-stone-100 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-square bg-[#F4F1EA] overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.stock <= 3 && product.stock > 0 && (
                          <span className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                            Only {product.stock} left
                          </span>
                        )}
                        <button
                          onClick={(e) => handleToggleWishlist(product._id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-stone-600 hover:text-rose-600 shadow-xs"
                          aria-label="Wishlist"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-rose-600 text-rose-600' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                            {product.brand}
                          </p>
                          <h3 className="text-xs font-semibold text-stone-900 group-hover:text-[#133E32] transition-colors line-clamp-1 mt-0.5">
                            {product.name}
                          </h3>
                          {product.nameBn && (
                            <p className="text-[10px] text-stone-500 mt-0.5 truncate">
                              {product.nameBn}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-bold text-stone-900">
                              ৳{(product.salePrice || product.basePrice).toLocaleString()}
                            </span>
                            {product.salePrice && product.salePrice < product.basePrice && (
                              <span className="text-xs text-stone-400 line-through">
                                ৳{product.basePrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-50">
                          <div className="flex items-center text-amber-500 text-[10px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="ml-1 text-stone-600 font-medium">
                              {product.rating.toFixed(1)} ({product.numReviews})
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            className="rounded-md bg-[#133E32] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#0d2e24] transition-colors"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
