import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addToCart } from '../features/cart/cartSlice';
import { animateCartFlight } from '../features/cart/cartFlight';
import { toggleWishlist } from '../features/wishlist/wishlistSlice';
import { openAuthModal } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import { api } from '../services/api';
import { Product, Review } from '../types';
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Share2,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.wishlist.itemIds);

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant & Quantity
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // Tab State
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'policy' | 'reviews'>('desc');

  // Review Form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchProductData = async () => {
      setLoading(true);
      setRelatedLoading(true);
      setProduct(null);
      setRelatedProducts([]);
      try {
        const res = await api.get(`/products/${slug}`);
        if (!active) return;
        setProduct(res.product);
        setReviews(res.reviews || []);
        setLoading(false);

        setSelectedOptions(res.product?.variants?.[0]?.options || {});
        setQuantity(1);

        // Track detail_view for personalization algorithm (Phase 7.1)
        if (res.product) {
          api.post('/recommendations/track', {
            productId: res.product._id,
            productName: res.product.name,
            category: res.product.category,
            brand: res.product.brand,
            eventType: 'detail_view',
            sessionId: localStorage.getItem('novara_session_id') || 'anon_session',
          }).catch(() => {});
        }

        try {
          const relatedRes = await api.get<{ products: Product[] }>(
            `/products/${slug}/related`
          );
          if (active) {
            setRelatedProducts(Array.isArray(relatedRes.products) ? relatedRes.products : []);
          }
        } catch (error) {
          console.warn('Failed to load related products', error);
        } finally {
          if (active) setRelatedLoading(false);
        }
      } catch (err) {
        if (active) console.warn('Failed to load product detail', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProductData();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#133E32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] py-20 text-center">
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Product Not Found</h2>
        <p className="text-xs text-stone-500 mb-4">The item you are searching for is unavailable or archived.</p>
        <Link to="/products" className="rounded-lg bg-[#133E32] px-5 py-2 text-xs font-semibold text-white">
          Browse Collections
        </Link>
      </div>
    );
  }

  const isFav = wishlist.includes(product._id);
  const currentPrice = product.salePrice || product.basePrice;
  const visibleRelatedProducts = relatedProducts.filter(
    (related, index, products) =>
      related._id !== product._id &&
      products.findIndex((candidate) => candidate._id === related._id) === index
  );

  // Selected Variant Price / Stock
  const matchedVariant = product.variants?.find((v) =>
    Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val)
  );

  const finalPrice = matchedVariant?.price || currentPrice;
  const availableStock = matchedVariant?.stock ?? product.stock;

  const handleAddToCart = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const itemToAdd = {
      productId: product._id,
      variantSku: matchedVariant?.sku,
      name: product.name,
      price: finalPrice,
      originalPrice: product.basePrice,
      image: product.images[activeImageIndex] || product.images[0],
      quantity,
      selectedOptions,
      maxStock: availableStock,
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

    animateCartFlight(event?.currentTarget ?? null);
    dispatch(addToCart(itemToAdd));

    // Track add_to_cart for personalization engine
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
        message: `${quantity}x ${product.name} added to your shopping bag.`,
      })
    );
  };

  const handleBuyNow = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAuthenticated) {
      const itemToAdd = {
        productId: product._id,
        variantSku: matchedVariant?.sku,
        name: product.name,
        price: finalPrice,
        originalPrice: product.basePrice,
        image: product.images[activeImageIndex] || product.images[0],
        quantity,
        selectedOptions,
        maxStock: availableStock,
      };
      dispatch(openAuthModal({ view: 'login', redirect: '/checkout', pendingCartItem: itemToAdd }));
    } else {
      handleAddToCart(event);
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(openAuthModal({ view: 'login' }));
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await api.post(`/reviews/${product._id}`, {
        rating: newRating,
        comment: newComment.trim(),
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Review Submitted',
          message: 'Thank you! Your feedback has been published.',
        })
      );
      setReviews([res.review, ...reviews]);
      setNewComment('');
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Submission Note',
          message: err?.message || 'Only verified buyers can review this item.',
        })
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${product.category}`} className="hover:underline capitalize">
            {product.category.replace('-', ' ')}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-stone-800 truncate">{product.name}</span>
        </nav>

        {/* Product Hero Layout */}
        <div data-cart-flight-card className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 bg-white rounded-3xl border border-stone-100 p-6 sm:p-10 shadow-2xs">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden bg-[#F4F1EA] border border-stone-100 relative shadow-inner">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <button
                onClick={() => dispatch(toggleWishlist(product._id))}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-stone-600 hover:text-rose-600 shadow-md transition-colors"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-[#133E32] scale-102' : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Purchase Panel */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest font-semibold text-stone-500">
                  {product.brand} · SKU: {matchedVariant?.sku || product.sku}
                </span>
                <span className="text-xs text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-sm">
                  {availableStock > 0 ? 'In Stock' : 'Pre-Order / Out of Stock'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-1.5">
                {product.name}
              </h1>

              {product.nameBn && (
                <p className="text-sm text-stone-500 font-sans mt-0.5">{product.nameBn}</p>
              )}

              {/* Ratings */}
              <div className="flex items-center gap-2 mt-3 text-amber-500 text-xs">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-stone-700">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-stone-400">·</span>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-stone-500 hover:text-[#133E32] underline"
                >
                  {reviews.length} authentic {reviews.length === 1 ? 'review' : 'reviews'}
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-stone-100">
                <span className="text-3xl font-bold text-stone-900">
                  ৳{finalPrice.toLocaleString()}
                </span>
                {product.salePrice && product.salePrice < product.basePrice && (
                  <span className="text-base text-stone-400 line-through">
                    ৳{product.basePrice.toLocaleString()}
                  </span>
                )}
                {product.salePrice && (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">
                    Save ৳{(product.basePrice - product.salePrice).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-5 space-y-3 pt-4 border-t border-stone-100">
                  <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                    Select Variant / Finish
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = matchedVariant?.sku === v.sku;
                      const label = Object.values(v.options).join(' / ');
                      return (
                        <button
                          key={v.sku}
                          onClick={() => setSelectedOptions(v.options)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'border-[#133E32] bg-[#133E32] text-white shadow-xs'
                              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          {label} (৳{v.price.toLocaleString()})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Controls & CTA */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center justify-between border border-stone-200 rounded-xl px-3 py-2 bg-stone-50/50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 hover:text-[#133E32]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold text-stone-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="p-1 hover:text-[#133E32] disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={availableStock <= 0}
                  className="flex-1 rounded-xl bg-[#133E32] py-3.5 px-6 text-sm font-semibold text-white hover:bg-[#0d2e24] shadow-md transition-all disabled:opacity-50"
                >
                  Add to Shopping Bag
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={availableStock <= 0}
                  className="rounded-xl border-2 border-[#133E32] bg-white py-3.5 px-6 text-sm font-semibold text-[#133E32] hover:bg-stone-50 transition-all disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>

              {/* Delivery Assurance */}
              <div className="mt-6 bg-[#FAF8F5] rounded-2xl p-4 border border-stone-100 space-y-2.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#133E32]" />
                  <span>
                    <strong>Dhaka:</strong> 24–48 Hours (৳80) · <strong>Outside Dhaka:</strong> 3–5 Days (৳150)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#133E32]" />
                  <span>Cash on Delivery available nationwide · 100% genuine guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#133E32]" />
                  <span>Hassle-free 7-day replacement and inspection warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Tabs: Description, Specs, Policy, Reviews */}
        <div className="mt-12 bg-white rounded-3xl border border-stone-100 p-6 sm:p-10 shadow-2xs">
          <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'desc'
                  ? 'border-[#133E32] text-[#133E32]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Description & Features
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'specs'
                  ? 'border-[#133E32] text-[#133E32]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'policy'
                  ? 'border-[#133E32] text-[#133E32]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Warranty & Delivery Info
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'border-[#133E32] text-[#133E32]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>Customer Reviews</span>
              <span className="bg-stone-100 text-stone-700 text-xs px-2 py-0.5 rounded-full">
                {reviews.length}
              </span>
            </button>
          </div>

          <div className="py-6">
            {activeTab === 'desc' && (
              <div className="space-y-4 max-w-3xl text-sm text-stone-700 leading-relaxed">
                <p>{product.description}</p>
                {product.features && product.features.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-stone-900 mb-2">Key Highlights:</h4>
                    <ul className="space-y-1.5 list-disc pl-5 text-stone-600">
                      {product.features.map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-xl">
                <table className="w-full text-xs text-left text-stone-700 divide-y divide-stone-100">
                  <tbody>
                    <tr className="py-2.5 flex justify-between">
                      <td className="font-semibold text-stone-500">Brand</td>
                      <td className="text-stone-900 font-medium">{product.brand}</td>
                    </tr>
                    <tr className="py-2.5 flex justify-between">
                      <td className="font-semibold text-stone-500">SKU</td>
                      <td className="text-stone-900 font-medium">{product.sku}</td>
                    </tr>
                    <tr className="py-2.5 flex justify-between">
                      <td className="font-semibold text-stone-500">Category</td>
                      <td className="text-stone-900 font-medium capitalize">{product.category}</td>
                    </tr>
                    {product.categoryAttributes &&
                      Object.entries(product.categoryAttributes).map(([k, v]) => (
                        <tr key={k} className="py-2.5 flex justify-between">
                          <td className="font-semibold text-stone-500">{k}</td>
                          <td className="text-stone-900 font-medium">{String(v)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="space-y-4 max-w-2xl text-xs sm:text-sm text-stone-700 leading-relaxed">
                <p>
                  <strong>Warranty:</strong> {product.warranty || '1 Year Official Structural Warranty against manufacturing defects.'}
                </p>
                <p>
                  <strong>Delivery Coverage:</strong> Shipped via specialized courier partners across all 64 districts in Bangladesh with real-time SMS tracking.
                </p>
                <p>
                  <strong>Returns:</strong> If the product arrives damaged or incorrect, initiate a return within 7 days via your order dashboard for replacement or full refund.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Review submission box */}
                <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-stone-100">
                  <h4 className="text-sm font-semibold text-stone-900 mb-2">
                    Write a Customer Review
                  </h4>
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-stone-600 block mb-1">Your Rating</label>
                      <div className="flex gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= newRating ? 'fill-amber-400' : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <textarea
                        required
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your experience with the craftsmanship, delivery, and aesthetics..."
                        className="w-full rounded-xl border border-stone-200 bg-white p-3 text-xs focus:border-[#133E32] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-lg bg-[#133E32] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="divide-y divide-stone-100">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">
                      No reviews yet for this product. Be the first to review!
                    </p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev._id} className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-900">
                              {rev.userName}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-sm font-medium">
                                ✓ Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>

                        <p className="text-xs text-stone-700 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-12" aria-labelledby="related-products-heading">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold">
                Curated for your home
              </p>
              <h2
                id="related-products-heading"
                className="mt-1 text-2xl font-serif font-bold text-stone-900"
              >
                Related Products
              </h2>
            </div>
          </div>

          {relatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse" aria-busy="true">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-64 rounded-xl bg-stone-200/60" />
              ))}
            </div>
          ) : visibleRelatedProducts.length === 0 ? (
            <p className="rounded-xl border border-stone-100 bg-white p-6 text-center text-sm text-stone-500">
              No related products are available right now.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {visibleRelatedProducts.map((related) => (
                <Link
                  key={related._id}
                  to={`/products/${related.slug}`}
                  className="group overflow-hidden rounded-xl border border-stone-100 bg-white shadow-2xs transition-all hover:shadow-md"
                >
                  <div className="aspect-square overflow-hidden bg-[#F4F1EA]">
                    {related.images[0] && (
                      <img
                        src={related.images[0]}
                        alt={related.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                      {related.brand}
                    </p>
                    <h3 className="mt-0.5 line-clamp-2 min-h-8 text-xs font-semibold text-stone-900 group-hover:text-[#133E32]">
                      {related.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-bold text-stone-900">
                        ৳{(related.salePrice || related.basePrice).toLocaleString()}
                      </span>
                      {related.salePrice && related.salePrice < related.basePrice && (
                        <span className="text-xs text-stone-400 line-through">
                          ৳{related.basePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
