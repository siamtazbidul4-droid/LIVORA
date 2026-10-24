import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Review } from '../../types';
import { Star, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/admin/all');
      setReviews(res.reviews || []);
    } catch (err) {
      console.warn('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/reviews/admin/${reviewId}`, { status });
      dispatch(
        addToast({
          type: 'success',
          title: 'Review Moderated',
          message: `Review marked as ${status.toUpperCase()}.`,
        })
      );
      fetchReviews();
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Moderation Error',
          message: err?.message || 'Failed to update review status.',
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">
          Customer Review Moderation
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Verify authentic purchaser badges, inspect submissions, and approve honest customer feedback.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-stone-50/70 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <th className="py-3 px-4">Customer & Product</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Feedback Comment</th>
                <th className="py-3 px-4">Verified Purchase</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {reviews.map((rev) => (
                <tr key={rev._id} className="hover:bg-stone-50/50">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-stone-900">{rev.userName}</p>
                    <p className="text-[10px] text-stone-400">{rev.productName || 'Catalog Product'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-xs text-stone-700 italic line-clamp-2">"{rev.comment}"</p>
                  </td>
                  <td className="py-3 px-4">
                    {rev.verifiedPurchase ? (
                      <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-sm">
                        ✓ Verified Order
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[10px]">Unverified</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        rev.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800'
                          : rev.status === 'rejected'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {rev.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleModerate(rev._id, 'approved')}
                        className="p-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        title="Approve"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleModerate(rev._id, 'rejected')}
                        className="p-1 rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200"
                        title="Reject"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
