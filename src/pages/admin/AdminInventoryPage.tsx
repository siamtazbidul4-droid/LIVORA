import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/ui/Modal';
import { Product } from '../../types';
import { Boxes, AlertTriangle, ArrowUpDown, History, Plus } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('Restock shipment received');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { limit: 100 });
      setProducts(res.products || []);
    } catch (err) {
      console.warn('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustQty(5);
    setAdjustType('add');
    setReason('Restock shipment received');
    setModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const delta = adjustType === 'add' ? adjustQty : -adjustQty;
      const newStock = Math.max(0, selectedProduct.stock + delta);

      await api.put(`/products/${selectedProduct._id}`, {
        stock: newStock,
        inventoryAdjustmentReason: reason,
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Stock Adjusted',
          message: `${selectedProduct.name} stock updated to ${newStock} units.`,
        })
      );

      setModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Adjustment Failed',
          message: err?.message || 'Failed to adjust stock level.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Inventory & Stock Integrity
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time stock on hand, reservations, safe stock thresholds, and adjustment audit trails.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-stone-50/70 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Reserved Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {products.map((item) => (
                <tr key={item._id} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    <p className="text-[10px] font-mono text-stone-400">{item.sku}</p>
                  </td>
                  <td className="py-3.5 px-4 capitalize">{item.category}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-sm font-bold ${
                        item.stock <= 3 ? 'text-amber-600' : 'text-stone-900'
                      }`}
                    >
                      {item.stock}
                    </span>
                    {item.stock <= 3 && (
                      <span className="block text-[10px] text-amber-700 font-semibold">
                        Low Stock Alert
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    {item.reservedStock || 0} in active checkout
                  </td>
                  <td className="py-3.5 px-4">
                    {item.stock > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                        IN STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800">
                        OUT OF STOCK
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openAdjustModal(item)}
                      className="px-3 py-1 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Modal for Inventory Adjustment */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Adjust Inventory: ${selectedProduct?.name}`}
        description="Record physical stock reconciliation with documented actor and operational reason."
        maxWidth="md"
      >
        {selectedProduct && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div className="bg-[#FAF8F5] p-3 rounded-xl text-xs space-y-1">
              <p>SKU: <strong className="font-mono">{selectedProduct.sku}</strong></p>
              <p>Current Stock on Hand: <strong>{selectedProduct.stock} units</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Action</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as 'add' | 'subtract')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                >
                  <option value="add">Add (+ Stock)</option>
                  <option value="subtract">Deduct (- Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Reason for Adjustment *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
              >
                <option value="Restock shipment received">Restock shipment received</option>
                <option value="Physical count inventory reconciliation">Physical count inventory reconciliation</option>
                <option value="Warehouse damaged goods write-off">Warehouse damaged goods write-off</option>
                <option value="Customer return restocked">Customer return restocked</option>
              </select>
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
                {submitting ? 'Updating...' : 'Commit Adjustment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
