import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/ui/Modal';
import { Order, OrderStatus } from '../../types';
import {
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Update Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin/all', {
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setOrders(res.orders || []);
    } catch (err) {
      console.warn('Failed to load admin orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const res = await api.put(`/orders/admin/${selectedOrder._id}/status`, {
        status: newStatus,
        note: statusNote || `Status updated to ${newStatus}`,
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Order Status Updated',
          message: `Order #${selectedOrder.orderNumber} transitioned to ${newStatus.toUpperCase()}`,
        })
      );

      setStatusModalOpen(false);
      setSelectedOrder(res.order);
      setOrders(orders.map((o) => (o._id === res.order._id ? res.order : o)));
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Transition Failed',
          message: err?.message || 'Unauthorized status transition.',
        })
      );
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Orders & Nationwide Fulfillment
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track order status timelines, manage courier transitions, print shipping labels and invoices.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, recipient or phone..."
            className="w-full rounded-xl border border-stone-200 pl-9 pr-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:border-[#133E32] focus:outline-none capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="return_requested">Return Requested</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-stone-50/70 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer & Location</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((order) => (
                <tr key={order._id} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                    #{order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-stone-900">{order.shippingAddress.recipientName}</p>
                      <p className="text-[10px] text-stone-400">
                        {order.shippingAddress.upazila}, {order.shippingAddress.district}
                      </p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="uppercase font-semibold text-[11px] text-stone-700">
                      {order.paymentMethod}
                    </span>
                    <span className="block text-[10px] text-stone-400 capitalize">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    ৳{order.total.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 capitalize">
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenStatusModal(order)}
                      className="px-3 py-1 rounded-lg bg-[#133E32] text-white text-[11px] font-semibold hover:bg-[#0d2e24]"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay for Status Transition */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Update Order: #${selectedOrder?.orderNumber}`}
        description="Transition order along authorized fulfillment lifecycle and log internal audit notes."
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="bg-[#FAF8F5] p-3 rounded-xl text-xs space-y-1">
              <p>Customer: <strong>{selectedOrder.shippingAddress.recipientName}</strong> ({selectedOrder.shippingAddress.phone})</p>
              <p>Address: {selectedOrder.shippingAddress.streetAddress}, {selectedOrder.shippingAddress.district}</p>
              <p>Total: <strong>৳{selectedOrder.total.toLocaleString()}</strong> ({selectedOrder.paymentMethod.toUpperCase()})</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Next Fulfillment Lifecycle State *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none capitalize"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="packed">Packed & Dispatched</option>
                <option value="shipped">Shipped (In Courier Transit)</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Staff Audit Note
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Dispatched via Paperfly courier tracking #10928..."
                className="w-full rounded-lg border border-stone-200 p-2.5 text-xs focus:border-[#133E32] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
              >
                {updating ? 'Recording...' : 'Save Lifecycle Transition'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
