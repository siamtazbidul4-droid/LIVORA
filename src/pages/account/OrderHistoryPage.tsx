import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Printer,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const dispatch = useAppDispatch();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState(false);

  // Return request modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.orders || []);
        if (orderId) {
          const match = (res.orders || []).find((o: Order) => o._id === orderId || o.orderNumber === orderId);
          if (match) setSelectedOrder(match);
        } else if (res.orders && res.orders.length > 0) {
          setSelectedOrder(res.orders[0]);
        }
      } catch (err) {
        console.warn('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [orderId]);

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !returnReason.trim()) return;

    setSubmittingReturn(true);
    try {
      const res = await api.post(`/orders/${selectedOrder._id}/return`, {
        reason: returnReason.trim(),
      });
      setSelectedOrder(res.order);
      setOrders(orders.map((o) => (o._id === res.order._id ? res.order : o)));
      dispatch(
        addToast({
          type: 'success',
          title: 'Return Request Logged',
          message: 'Our support team will inspect and coordinate replacement within 24 hours.',
        })
      );
      setReturnModalOpen(false);
      setReturnReason('');
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Return Error',
          message: err?.message || 'Unable to request return at this stage.',
        })
      );
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!selectedOrder) return;
    setRetryingPayment(true);
    try {
      const response = await api.post('/payments/bkash/initiate', {
        orderId: selectedOrder._id,
        orderNumber: selectedOrder.orderNumber,
      });
      if (!response.redirectUrl) {
        throw new Error('The provider did not return a checkout URL.');
      }
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Payment Not Started',
          message: error?.message || 'The payment status could not be confirmed. Contact support before retrying.',
        })
      );
    } finally {
      setRetryingPayment(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { text: string; bg: string; color: string }> = {
      pending: { text: 'Pending Confirmation', bg: 'bg-amber-50', color: 'text-amber-800' },
      confirmed: { text: 'Order Confirmed', bg: 'bg-sky-50', color: 'text-sky-800' },
      processing: { text: 'Processing', bg: 'bg-indigo-50', color: 'text-indigo-800' },
      packed: { text: 'Packed & Dispatched', bg: 'bg-blue-50', color: 'text-blue-800' },
      shipped: { text: 'In Transit / Shipped', bg: 'bg-purple-50', color: 'text-purple-800' },
      delivered: { text: 'Delivered', bg: 'bg-emerald-50', color: 'text-emerald-800' },
      cancelled: { text: 'Cancelled', bg: 'bg-rose-50', color: 'text-rose-800' },
      return_requested: { text: 'Return Requested', bg: 'bg-orange-50', color: 'text-orange-800' },
      returned: { text: 'Returned', bg: 'bg-stone-100', color: 'text-stone-800' },
      refunded: { text: 'Refund Completed', bg: 'bg-teal-50', color: 'text-teal-800' },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.color}`}>
        {s.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            Order History & Tracking
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Review your past purchases, delivery timelines, and download invoices.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500">
            Loading your order records...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-100 shadow-2xs max-w-md mx-auto">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-serif font-semibold text-stone-800">
              No orders placed yet
            </h3>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              When you order furniture or decor items, their live status will be tracked here.
            </p>
            <Link
              to="/products"
              className="rounded-xl bg-[#133E32] px-6 py-2.5 text-xs font-semibold text-white"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Orders List Sidebar (1 col) */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                All Orders ({orders.length})
              </h3>
              {orders.map((o) => (
                <div
                  key={o._id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    selectedOrder?._id === o._id
                      ? 'border-[#133E32] shadow-sm ring-1 ring-[#133E32]'
                      : 'border-stone-100 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-stone-900">
                      #{o.orderNumber}
                    </span>
                    {getStatusBadge(o.orderStatus)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-stone-900">
                      ৳{o.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Order Details (2 cols) */}
            {selectedOrder && (
              <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-2xs space-y-6">
                {/* Header details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-100 gap-4">
                  <div>
                    <span className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
                      Order Details
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-stone-900 mt-0.5">
                      #{selectedOrder.orderNumber}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleString()} · {selectedOrder.items.length} items
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrder.paymentMethod === 'bkash' &&
                      selectedOrder.orderStatus !== 'cancelled' &&
                      ['pending', 'initiated', 'failed', 'cancelled', 'expired'].includes(
                        selectedOrder.paymentStatus
                      ) && (
                        <button
                          type="button"
                          onClick={handleRetryPayment}
                          disabled={retryingPayment}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D12053] text-xs font-semibold text-white hover:bg-[#ad1843] disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {retryingPayment
                            ? 'Connecting...'
                            : selectedOrder.paymentStatus === 'initiated'
                              ? 'Continue Payment'
                              : 'Retry bKash'}
                        </button>
                      )}
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Invoice
                    </button>
                    {['delivered', 'shipped'].includes(selectedOrder.orderStatus) && (
                      <button
                        onClick={() => setReturnModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Return Item
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#133E32]" />
                    Fulfillment Timeline
                  </h4>
                  <div className="relative pl-6 border-l-2 border-stone-200 space-y-4">
                    {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                      selectedOrder.statusHistory.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#133E32] border-2 border-white ring-2 ring-emerald-200" />
                          <p className="text-xs font-semibold text-stone-900 capitalize">
                            {step.status.replace('_', ' ')}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {new Date(step.timestamp).toLocaleString()} {step.note ? `· ${step.note}` : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#133E32]" />
                        <p className="text-xs font-semibold text-stone-900">
                          {selectedOrder.orderStatus.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t border-stone-100 pt-6">
                  <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-3">
                    Purchased Items
                  </h4>
                  <div className="divide-y divide-stone-100">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-12 h-12 rounded object-cover bg-stone-100"
                          />
                          <div>
                            <p className="font-semibold text-stone-900">{item.productName}</p>
                            {item.variantSku && (
                              <p className="text-[11px] text-stone-500">SKU: {item.variantSku}</p>
                            )}
                            <p className="text-[11px] text-stone-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-stone-900">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Payment summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100 pt-6 text-xs text-stone-600">
                  <div className="bg-[#FAF8F5] p-4 rounded-xl">
                    <p className="font-semibold text-stone-900 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#133E32]" />
                      Delivery Destination
                    </p>
                    <p className="font-medium text-stone-800">{selectedOrder.shippingAddress.recipientName}</p>
                    <p>{selectedOrder.shippingAddress.phone}</p>
                    <p className="mt-1">
                      {selectedOrder.shippingAddress.streetAddress},{' '}
                      {selectedOrder.shippingAddress.upazila},{' '}
                      {selectedOrder.shippingAddress.district},{' '}
                      {selectedOrder.shippingAddress.division}
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-xl">
                    <p className="font-semibold text-stone-900 flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-[#133E32]" />
                      Payment & Billing
                    </p>
                    <p>Method: <strong className="uppercase">{selectedOrder.paymentMethod}</strong></p>
                    <p>Status: <strong className="capitalize">{selectedOrder.paymentStatus}</strong></p>
                    <div className="mt-2 pt-2 border-t border-stone-200/60 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>৳{selectedOrder.subtotal.toLocaleString()}</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount:</span>
                          <span>-৳{selectedOrder.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>৳{selectedOrder.shippingFee}</span>
                      </div>
                      <div className="flex justify-between font-bold text-stone-900 text-sm pt-1">
                        <span>Grand Total:</span>
                        <span className="text-[#133E32]">৳{selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Return Modal Overlay */}
        {returnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-100">
              <h3 className="text-base font-serif font-bold text-stone-900 mb-1">
                Initiate Return / Replacement
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Please explain the issue (e.g. damaged transit, manufacturing defect, or wrong variant received).
              </p>
              <form onSubmit={handleRequestReturn} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Detail the reason for return..."
                  className="w-full rounded-xl border border-stone-200 p-3 text-xs focus:border-[#133E32] focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReturn}
                    className="px-4 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
                  >
                    {submittingReturn ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
