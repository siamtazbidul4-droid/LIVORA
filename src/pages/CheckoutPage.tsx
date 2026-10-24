import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useBangladeshLocations } from '../app/useBangladeshLocations';
import {
  clearCart,
  selectCartSubtotal,
  selectCartDiscount,
  selectShippingFee,
  selectCartGrandTotal,
} from '../features/cart/cartSlice';
import { openAuthModal } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import { api, ApiError } from '../services/api';
import {
  getDivisions,
  getBangladeshLocationSelection,
  resolveBangladeshLocation,
} from '../lib/bangladeshLocations';
import type { BangladeshLocationSelection } from '../lib/bangladeshLocations';
import { BangladeshAddressFields } from '../components/ui/BangladeshAddressFields';
import { Address, PaymentMethod } from '../types';
import type { PaymentStatus } from '../types';
import {
  ShieldCheck,
  Banknote,
  CheckCircle2,
  Lock,
  ArrowRight,
  MapPin,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { isLoading: locationsLoading, error: locationsError } = useBangladeshLocations();
  const checkoutRequestId = useRef<string | null>(null);

  const paymentIdParam = searchParams.get('paymentId');

  const { isAuthenticated, isLoading: authLoading, user } = useAppSelector((state) => state.auth);
  const items = useAppSelector((state) => state.cart.items);
  const appliedCoupon = useAppSelector((state) => state.cart.appliedCoupon);

  const subtotal = useAppSelector(selectCartSubtotal);
  const discount = useAppSelector(selectCartDiscount);
  const shipping = useAppSelector(selectShippingFee);
  const grandTotal = useAppSelector(selectCartGrandTotal);

  // Address fields
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [locationSelection, setLocationSelection] = useState<BangladeshLocationSelection>({
    divisionId: null,
    districtId: null,
    upazilaId: null,
    unionId: null,
  });
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentMethods, setPaymentMethods] = useState({ cod: true, bkash: false });
  const [paymentMethodsLoadFailed, setPaymentMethodsLoadFailed] = useState(false);
  const [callbackPaymentStatus, setCallbackPaymentStatus] = useState<
    PaymentStatus | 'unknown' | null
  >(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved addresses
  const savedAddresses = user?.addresses || [];
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);

  // Auth Protection: Guests cannot checkout
  useEffect(() => {
    if (authLoading) return;
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
          title: 'Account Required',
          message: 'Please sign in or register to complete your order checkout.',
        })
      );
    }
  }, [authLoading, isAuthenticated, dispatch]);

  // Set user profile info when user changes
  useEffect(() => {
    if (user) {
      if (!recipientName) setRecipientName(user.name);
      if (!phone && user.phone) setPhone(user.phone);
      if (user.addresses && user.addresses.length > 0) {
        const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        setRecipientName(def.recipientName);
        setPhone(def.phone);
        setLocationSelection(getBangladeshLocationSelection(def));
        setStreetAddress(def.streetAddress);
        setLandmark(def.landmark || '');
        setSelectedSavedAddressId(def._id || null);
      }
    }
  }, [user, locationsLoading]);

  useEffect(() => {
    let active = true;
    api
      .get('/payments/methods')
      .then((response) => {
        if (!active) return;
        setPaymentMethods({
          cod: response.methods?.cod === true,
          bkash: response.methods?.bkash === true,
        });
      })
      .catch((error) => {
        console.error('Payment method availability could not be loaded:', error);
        if (active) setPaymentMethodsLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!paymentIdParam) {
      setCallbackPaymentStatus(null);
      return;
    }

    let active = true;
    setCallbackPaymentStatus('pending');
    api
      .get(`/payments/${encodeURIComponent(paymentIdParam)}/status`)
      .then((response) => {
        if (active) setCallbackPaymentStatus(response.payment?.status || 'unknown');
      })
      .catch((error) => {
        console.error('Payment return status could not be verified:', error);
        if (active) setCallbackPaymentStatus('unknown');
      });
    return () => {
      active = false;
    };
  }, [paymentIdParam]);

  const handleSelectSavedAddress = (addr: Address) => {
    if (locationsLoading || locationsError) return;
    setSelectedSavedAddressId(addr._id || null);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setLocationSelection(getBangladeshLocationSelection(addr));
    setStreetAddress(addr.streetAddress);
    setLandmark(addr.landmark || '');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-sm text-stone-600" role="status">
          Checking your sign-in session...
        </div>
      );
    }

    if (!isAuthenticated) {
      dispatch(openAuthModal({ view: 'login' }));
      return;
    }

    if (items.length === 0) {
      dispatch(
        addToast({
          type: 'warning',
          title: 'Empty Cart',
          message: 'Your cart has no items to order.',
        })
      );
      navigate('/products');
      return;
    }

    if (!streetAddress.trim() || !phone.trim() || !recipientName.trim()) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Missing Address',
          message: 'Please complete recipient name, phone, and delivery address details.',
        })
      );
      return;
    }

    const normalizedLocation = resolveBangladeshLocation(
      locationSelection,
      true
    );
    if (!normalizedLocation) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Incomplete Delivery Location',
          message: 'Select a valid Division, District, Upazila, and an available Union.',
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (!checkoutRequestId.current) checkoutRequestId.current = crypto.randomUUID();
      const orderPayload = {
        checkoutRequestId: checkoutRequestId.current,
        items: items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        })),
        shippingAddress: {
          recipientName,
          phone,
          ...normalizedLocation,
          streetAddress,
          landmark,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code,
        notes: orderNotes,
        saveAddress: saveAddressToProfile,
      };

      const res = await api.post('/orders', orderPayload);
      checkoutRequestId.current = null;

      if (paymentMethod === 'cod') {
        items.forEach((item) => {
          api
            .post('/recommendations/track', {
              productId: item.productId,
              productName: item.name,
              category: 'general',
              eventType: 'purchase',
              sessionId: localStorage.getItem('novara_session_id') || 'anon_session',
            })
            .catch((error) => console.error('Could not record COD order activity:', error));
        });
      }

      if (paymentMethod === 'bkash') {
        try {
          const bkashRes = await api.post('/payments/bkash/initiate', {
            orderId: res.order._id,
            orderNumber: res.order.orderNumber,
          });
          if (!bkashRes.redirectUrl) {
            throw new Error('The provider did not return a checkout URL.');
          }
          dispatch(clearCart());
          dispatch(
            addToast({
              type: 'info',
              title: 'Redirecting to bKash',
              message: 'Connecting to authorized bKash merchant gateway...',
            })
          );
          window.location.href = bkashRes.redirectUrl;
          return;
        } catch (error) {
          console.error('The order was created but bKash initiation did not complete:', error);
          dispatch(clearCart());
          dispatch(
            addToast({
              type: 'warning',
              title: 'Order Awaiting Payment',
              message: `Order #${res.order.orderNumber} was created, but payment is not confirmed. Review its status before taking further action.`,
            })
          );
          navigate(`/account/orders/${res.order._id}`);
          return;
        }
      }

      dispatch(clearCart());
      dispatch(
        addToast({
          type: 'success',
          title: 'Order Placed Successfully',
          message: `Your order #${res.order.orderNumber} has been recorded!`,
        })
      );

      navigate(`/account/orders/${res.order._id}`);
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Order Failed',
          message: err instanceof ApiError ? err.message : 'Unable to confirm order. Please try again.',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
          <Lock className="w-10 h-10 text-[#133E32] mx-auto mb-3" />
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-xs text-stone-600 mb-6">
            In accordance with NOVARA Commerce policies, please sign in or register your account before checking out.
          </p>
          <button
            onClick={() => dispatch(openAuthModal({ view: 'login', redirect: '/checkout' }))}
            className="w-full rounded-xl bg-[#133E32] py-3 text-xs font-semibold text-white hover:bg-[#0d2e24]"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="cursor-pointer hover:underline" onClick={() => navigate('/products')}>Cart</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800">Checkout</span>
          </nav>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            Secure Checkout
          </h1>

          {callbackPaymentStatus === 'paid' && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Payment Verified:</strong> Your merchant transaction has been successfully confirmed.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/account/orders')}
                className="font-semibold underline ml-2"
              >
                View Orders &rarr;
              </button>
            </div>
          )}

          {callbackPaymentStatus &&
            ['failed', 'cancelled', 'expired'].includes(callbackPaymentStatus) && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Payment not completed:</strong> The provider did not confirm this transaction. You may choose an available method below.
              </span>
            </div>
          )}
          {callbackPaymentStatus &&
            ['pending', 'initiated', 'awaiting_verification', 'unknown'].includes(
              callbackPaymentStatus
            ) && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Payment status is not confirmed yet.</strong> Do not retry until the payment status is resolved. Check your order history or contact support.
                </span>
              </div>
            )}
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address & Payment (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Saved Addresses (if available) */}
            {savedAddresses.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-2xs">
                <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#133E32]" />
                  Choose Saved Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      aria-disabled={locationsLoading || Boolean(locationsError)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedSavedAddressId === addr._id
                          ? 'border-[#133E32] bg-[#FAF8F5] ring-1 ring-[#133E32]'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <p className="font-semibold text-stone-900">{addr.recipientName}</p>
                      <p className="text-stone-500 mt-0.5">{addr.phone}</p>
                      <p className="text-stone-600 mt-1">
                        {addr.streetAddress}, {addr.upazila}, {addr.district}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Delivery Address Form */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-semibold text-stone-900">
                Delivery Details (Bangladesh Address)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                  />
                </div>
              </div>

              <BangladeshAddressFields
                value={locationSelection}
                onChange={setLocationSelection}
                isLoading={locationsLoading}
                error={locationsError}
              />

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  House, Road & Area Details *
                </label>
                <textarea
                  required
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House 12, Road 4, Sector 7, etc."
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nearest Landmark / Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near North South University, opposite mosque..."
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-semibold text-stone-900">
                Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#133E32] bg-[#FAF8F5] ring-1 ring-[#133E32]'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#133E32] focus:ring-[#133E32]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#133E32]" />
                      <span className="text-xs font-semibold text-stone-900">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Pay with cash upon physical arrival and inspection of your package.
                    </p>
                  </div>
                </label>

                {paymentMethods.bkash && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'bkash'
                        ? 'border-[#D12053] bg-pink-50/50 ring-1 ring-[#D12053]'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="mt-1 text-[#D12053] focus:ring-[#D12053]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#D12053]">bKash</span>
                        <span className="text-[10px] font-semibold bg-[#D12053] text-white px-1.5 py-0.5 rounded">
                          Merchant PG
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Secure payment through the bKash-hosted checkout.
                      </p>
                    </div>
                  </label>
                )}
              </div>
              {paymentMethodsLoadFailed && (
                <p role="status" className="text-[11px] text-amber-700">
                  Online payment availability could not be confirmed. Only Cash on Delivery is available for this checkout.
                </p>
              )}
            </div>
          </div>

          {/* Right: Order Summary (1 col) */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-2xs space-y-6 h-fit sticky top-24">
            <h3 className="text-sm font-semibold text-stone-900 border-b border-stone-100 pb-3">
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h3>

            {/* Items summary */}
            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-stone-50">
              {items.map((item) => (
                <div key={`${item.productId}_${item.variantSku}`} className="pt-2 flex gap-3 text-xs">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-stone-400">Qty: {item.quantity}</p>
                    <p className="font-semibold text-stone-800">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>
                  Shipping (
                  {getDivisions()
                    .find((option) => option.id === locationSelection.divisionId)
                    ?.name.toLowerCase() === 'dhaka'
                    ? 'Inside Dhaka'
                    : 'Outside Dhaka'}
                  )
                </span>
                <span>{shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `৳${shipping}`}</span>
              </div>
              <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-bold text-stone-900">
                <span>Total Payable</span>
                <span className="text-[#133E32]">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#133E32] py-4 text-sm font-semibold text-white hover:bg-[#0d2e24] shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Validating & Processing...</span>
              ) : (
                <>
                  <span>Confirm Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>TLS 256-Bit Encrypted Secure Checkout</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
