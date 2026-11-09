import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Loader2,
  Tag,
} from 'lucide-react';

export default function Products({ onOpenAdjustStock, onOpenDeleteConfirm, toastMessage }) {
  const { organization } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(search);
      setProducts(data.products || []);
    } catch (err) {
      toastMessage('Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSaveProduct = async (formData) => {
    if (editingProduct) {
      await api.updateProduct(editingProduct._id, formData);
      toastMessage(`Product "${formData.name}" updated successfully.`, 'success');
    } else {
      await api.createProduct(formData);
      toastMessage(`Product "${formData.name}" created successfully.`, 'success');
    }
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your inventory items, pricing, and stock status
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          {products.length} {products.length === 1 ? 'product' : 'products'} found
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            <span className="text-sm">Loading catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? `No products matched "${search}". Try searching with a different SKU or name.`
                : 'Your catalog is empty. Click "Add Product" to create your first inventory item.'}
            </p>
            {!search && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Product & Description</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => {
                  const isOutOfStock = p.quantityOnHand === 0;
                  const isLow = p.isLowStock;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Description */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          {p.sku}
                        </span>
                      </td>

                      {/* Quantity on Hand */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {p.quantityOnHand} units
                      </td>

                      {/* Status Indicator */}
                      <td className="py-4 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock (≤{p.effectiveThreshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Healthy
                          </span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {p.sellingPrice !== null && p.sellingPrice !== undefined
                          ? `$${p.sellingPrice.toFixed(2)}`
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Adjust Stock Button (FR-5) */}
                          <button
                            onClick={() => onOpenAdjustStock(p, fetchProducts)}
                            title="Quick Stock Adjustment (+/-)"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => onOpenDeleteConfirm(p, fetchProducts)}
                            title="Delete Product"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveProduct}
        product={editingProduct}
        defaultThreshold={organization?.defaultLowStockThreshold ?? 5}
      />
    </div>
  );
}

