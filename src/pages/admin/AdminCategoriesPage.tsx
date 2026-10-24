import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/ui/Modal';
import { Category, Brand } from '../../types';
import { Layers, Plus, Trash2, Edit2, Tag } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxonomy = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setCategories(catRes.categories || []);
      setBrands(brandRes.brands || []);
    } catch (err) {
      console.warn('Failed to load taxonomy', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/categories', {
        name,
        nameBn,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Category Created',
          message: `${name} added to catalog taxonomy.`,
        })
      );

      setCatModalOpen(false);
      fetchTaxonomy();
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Error',
          message: err?.message || 'Failed to save category.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Categories & Retail Brands
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Organize catalog hierarchy, nested subcategories, and proprietary brand labels.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setNameBn('');
            setSlug('');
            setDescription('');
            setCatModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Layers className="w-4 h-4 text-[#133E32]" />
            Active Product Categories ({categories.length})
          </h2>

          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
            {categories.map((c) => (
              <div key={c._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-stone-900">{c.name}</p>
                  {c.nameBn && <p className="text-[11px] text-stone-400">{c.nameBn}</p>}
                </div>
                <span className="font-mono text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                  {c.slug}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Tag className="w-4 h-4 text-[#133E32]" />
            Curated Retail Brands ({brands.length})
          </h2>

          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
            {brands.map((b) => (
              <div key={b._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-stone-900">{b.name}</p>
                  <p className="text-[11px] text-stone-500">{b.description || 'Exclusive Collection'}</p>
                </div>
                <span className="font-mono text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                  {b.slug}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Add Catalog Category"
        description="Create a category with bilingual support for search and filtering."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Category Name (English) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bedding"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Bangla Name (বাংলা)
            </label>
            <input
              type="text"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="বেডিং ও তোশক"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="bedding"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
