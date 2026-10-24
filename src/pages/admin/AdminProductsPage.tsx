import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { api } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { AdminImageUploader } from '../../components/ui/AdminImageUploader';
import { Product, Category, Brand } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Download,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('Livora Artisan');
  const [category, setCategory] = useState('furniture');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(10);
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Bulk CSV import state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/products', { limit: 100 }),
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      setBrands(brandRes.brands || []);
    } catch (err) {
      console.warn('Failed to fetch catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setNameBn('');
    setSlug('');
    setSku('');
    setBrand(brands[0]?.name || 'Livora Artisan');
    setCategory(categories[0]?.slug || 'furniture');
    setDescription('');
    setBasePrice(1000);
    setSalePrice(undefined);
    setStock(10);
    setStatus('active');
    setImages(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80']);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setNameBn(prod.nameBn || '');
    setSlug(prod.slug);
    setSku(prod.sku);
    setBrand(prod.brand);
    setCategory(prod.category);
    setDescription(prod.description);
    setBasePrice(prod.basePrice);
    setSalePrice(prod.salePrice);
    setStock(prod.stock);
    setStatus(prod.status);
    setImages(prod.images || []);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name,
        nameBn,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku,
        brand,
        category,
        description,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        stock: Number(stock),
        status,
        images: images.filter(Boolean),
        features: ['Handcrafted solid build', 'Sustainably sourced', '1 Year Structural Warranty'],
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Product Updated',
            message: `${name} has been updated in catalog.`,
          })
        );
      } else {
        await api.post('/products', payload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Product Created',
            message: `${name} added to catalog.`,
          })
        );
      }

      setIsModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Operation Failed',
          message: err?.message || 'SKU must be unique. Error saving product.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveProduct = async () => {
    if (!productToArchive) return;
    setArchiving(true);
    try {
      await api.delete(`/products/${productToArchive._id}`);
      dispatch(
        addToast({
          type: 'info',
          title: 'Product Archived',
          message: 'Product removed from active catalog.',
        })
      );
      setProductToArchive(null);
      await fetchCatalog();
    } catch (error: unknown) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Archive Failed',
          message: error instanceof Error ? error.message : 'Unable to archive this product.',
        })
      );
    } finally {
      setArchiving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Brand', 'Category', 'BasePrice', 'SalePrice', 'Stock', 'Status'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku,
      `"${p.brand}"`,
      p.category,
      p.basePrice,
      p.salePrice || '',
      p.stock,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `novara_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameBn && p.nameBn.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Catalog Products & SKUs
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage single-vendor SKUs, prices, variants, stock, and Cloudinary image assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, product title, or Bangla term..."
            className="w-full rounded-xl border border-stone-200 pl-9 pr-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <span className="text-xs text-stone-500">
          Total SKUs: <strong>{products.length}</strong>
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-stone-50/70 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((prod) => (
                <tr key={prod._id} className="hover:bg-stone-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-stone-900 leading-tight">
                          {prod.name}
                        </p>
                        {prod.nameBn && (
                          <p className="text-[10px] text-stone-400">{prod.nameBn}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-stone-600">
                    {prod.sku}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {prod.category}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-stone-900">
                      ৳{(prod.salePrice || prod.basePrice).toLocaleString()}
                    </p>
                    {prod.salePrice && (
                      <span className="text-[10px] text-stone-400 line-through">
                        ৳{prod.basePrice.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        prod.stock <= 3 ? 'text-amber-600' : 'text-stone-800'
                      }`}
                    >
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        prod.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {prod.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#133E32] hover:bg-stone-100"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setProductToArchive(prod)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100"
                        title="Archive product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Custom Modal Overlay for Create / Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Catalog SKU'}
        description="Configure product metadata, pricing, inventory stock, and Cloudinary media."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Product Name (English) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Avela 3-Seater Sofa"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs focus:border-[#133E32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Bangla Name (বাংলা) *
              </label>
              <input
                type="text"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="আভেলা ৩-সিটার সোফা"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs focus:border-[#133E32] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Unique SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="LIV-SOFA-001"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-mono uppercase focus:border-[#133E32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:border-[#133E32] focus:outline-none capitalize"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Brand *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:border-[#133E32] focus:outline-none"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Base Price (BDT ৳) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Sale Price (Optional ৳)
              </label>
              <input
                type="number"
                min="0"
                value={salePrice || ''}
                onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Discounted price"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Stock On Hand *
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handcrafted details, fabric texture, and dimensions..."
              className="w-full rounded-lg border border-stone-200 p-2.5 text-xs"
            />
          </div>

          <div className="space-y-3">
            {images.map((image, index) => (
              <AdminImageUploader
                key={index}
                label={`Product image ${index + 1}`}
                value={image}
                onChange={(url) =>
                  setImages((current) => current.map((item, itemIndex) => itemIndex === index ? url : item))
                }
                onRemove={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
            <button
              type="button"
              onClick={() => setImages((current) => [...current, ''])}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Add another product image
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(productToArchive)}
        onClose={() => {
          if (!archiving) setProductToArchive(null);
        }}
        title="Archive product?"
        description="Archived products are removed from the active catalog but remain in order history."
        maxWidth="sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setProductToArchive(null)}
            disabled={archiving}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleArchiveProduct()}
            disabled={archiving}
            className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
          >
            {archiving ? 'Archiving…' : 'Archive product'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
