import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/ui/Modal';
import { Coupon } from '../../types';
import { Tag, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(1000);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons/admin/all');
      setCoupons(res.coupons || []);
    } catch (err) {
      console.warn('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/coupons', {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        validTo: validUntil,
        usageLimit: Number(usageLimit),
        isActive: true,
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Coupon Created',
          message: `Campaign code ${code.toUpperCase()} is now active!`,
        })
      );

      setModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Creation Failed',
          message: err?.message || 'Code already exists or invalid values.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/coupons/${id}`);
      dispatch(
        addToast({
          type: 'info',
          title: 'Coupon Removed',
          message: 'Campaign code deleted.',
        })
      );
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Marketing & Coupon Campaigns
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure promotional percentage vouchers, fixed reductions, minimum basket thresholds.
          </p>
        </div>

        <button
          onClick={() => {
            setCode('');
            setDiscountType('percentage');
            setDiscountValue(10);
            setMinOrderAmount(1000);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-stone-50/70 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Type & Value</th>
                <th className="py-3 px-4">Min Spend</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-sm">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#133E32]">
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `৳${c.discountValue} OFF`}
                  </td>
                  <td className="py-3.5 px-4">
                    ৳{c.minOrderAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    {new Date(c.validTo).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {c.usageCount} / {c.usageLimit || '∞'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1 rounded text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Promotional Coupon"
        description="Define discount code, percentage or fixed discount, and eligibility rules."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. NOVARA10"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs font-mono uppercase focus:border-[#133E32] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (৳)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Value ({discountType === 'percentage' ? '%' : '৳'})
              </label>
              <input
                type="number"
                required
                min="1"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Min Order Spend (৳)
              </label>
              <input
                type="number"
                required
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Activate Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
