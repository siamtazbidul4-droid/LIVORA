import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  removeFromCart,
  updateQuantity,
  toggleCartDrawer,
  applyCoupon,
  removeCoupon,
  selectCartSubtotal,
  selectShippingFee,
  selectCartDiscount,
  selectCartGrandTotal,
} from './cartSlice';
import { openAuthModal } from '../auth/authSlice';
import { addToast } from '../toast/toastSlice';
import { api, ApiError } from '../../services/api';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, isDrawerOpen, appliedCoupon } = useAppSelector(
    (state) => state.cart
  );
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const subtotal = useAppSelector(selectCartSubtotal);
  const shipping = useAppSelector(selectShippingFee);
  const discount = useAppSelector(selectCartDiscount);
  const total = useAppSelector(selectCartGrandTotal);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput.trim(),
        subtotal,
      });

      dispatch(
        applyCoupon({
          code: res.code,
          discountType: res.discountType,
          discountValue: res.discountValue,
          discountAmount: res.discountAmount,
        })
      );
      dispatch(
        addToast({
          type: 'success',
          title: 'Coupon Applied',
          message: `Saved ৳${res.discountAmount.toLocaleString()} with code ${res.code}`,
        })
      );
      setCouponInput('');
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Invalid Coupon',
          message: err instanceof ApiError ? err.message : 'Coupon code is invalid or expired',
        })
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    dispatch(toggleCartDrawer(false));
    if (!isAuthenticated) {
      dispatch(
        openAuthModal({
          view: 'login',
          redirect: '/checkout',
        })
      );
      dispatch(
        addToast({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in or register to securely place your order.',
        })
      );
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(toggleCartDrawer(false))}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#133E32]" />
              <h2 className="text-base font-serif font-semibold text-stone-900">
                Your Shopping Bag ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h2>
            </div>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-serif font-semibold text-stone-800 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Explore our handcrafted furniture, soothing lighting, and timeless decor to fill your home.
                </p>
                <button
                  onClick={() => dispatch(toggleCartDrawer(false))}
                  className="rounded-lg bg-[#133E32] px-5 py-2 text-xs font-medium text-white hover:bg-[#0d2e24]"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}_${item.variantSku || 'base'}`}
                  className="py-4 flex gap-4 items-start"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover bg-stone-100 border border-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-900 truncate">
                      {item.name}
                    </h4>
                    {item.selectedOptions && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {Object.entries(item.selectedOptions)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-stone-900">
                        ৳{item.price.toLocaleString()}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[11px] text-stone-400 line-through">
                          ৳{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-stone-200 rounded-md overflow-hidden">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                variantSku: item.variantSku,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="p-1 hover:bg-stone-100 text-stone-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-medium text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                variantSku: item.variantSku,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          disabled={item.quantity >= (item.maxStock || 99)}
                          className="p-1 hover:bg-stone-100 text-stone-600 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              productId: item.productId,
                              variantSku: item.variantSku,
                            })
                          )
                        }
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Totals */}
          {items.length > 0 && (
            <div className="border-t border-stone-100 bg-[#FAF8F5] p-6 space-y-4">
              {/* Coupon Form */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-৳{discount.toLocaleString()})</span>
                  </div>
                  <button
                    onClick={() => dispatch(removeCoupon())}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code (e.g. NOVARA10)"
                    className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs uppercase focus:border-[#133E32] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-900 disabled:opacity-40"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {/* Order Calculations */}
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-700 font-medium">Free (Over ৳5k)</span>
                    ) : (
                      `৳${shipping}`
                    )}
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-semibold text-stone-900">
                  <span>Total</span>
                  <span className="text-base text-[#133E32]">
                    ৳{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#133E32] py-3 text-sm font-medium text-white hover:bg-[#0d2e24] shadow-md transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isAuthenticated && (
                <p className="text-[11px] text-center text-stone-500">
                  * Account sign-in required before completing order.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
