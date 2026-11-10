import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Loader2,
  Building2,
  Sparkles,
  DollarSign,
} from 'lucide-react';

export default function Dashboard({ onNavigateToProducts, onOpenAdjustStock }) {
  const { organization } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading organization dashboard...</span>
      </div>
    );
  }

  const stats = data?.stats || { totalProducts: 0, totalQuantity: 0, lowStockCount: 0 };
  const lowStockItems = data?.lowStockItems || [];
  const defaultThreshold = data?.organization?.defaultLowStockThreshold ?? 5;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4" />
            <span>{organization?.name || 'Organization Workspace'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inventory Overview
          </h1>
          <p className="text-sm text-indigo-100 mt-1 max-w-lg">
            Real-time stock monitoring, tenant metrics, and instant threshold alerts for your store.
          </p>
        </div>

        <button
          onClick={onNavigateToProducts}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Manage Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Executive Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="indigo"
          subtext="Catalog items registered"
        />

        <StatCard
          title="Units on Hand"
          value={stats.totalQuantity.toLocaleString()}
          icon={Layers}
          color="indigo"
          subtext="Total units in inventory"
        />

        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? 'rose' : 'emerald'}
          isAlert={stats.lowStockCount > 0}
          subtext={
            stats.lowStockCount > 0
              ? 'Units at or below threshold'
              : 'All inventory levels healthy'
          }
        />

        <StatCard
          title="Inventory Valuation"
          value={`$${(stats.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="emerald"
          subtext={stats.totalCost ? `Total Cost: $${stats.totalCost.toLocaleString()}` : 'Retail inventory value'}
        />
      </div>

      {/* Low Stock Items Section (FR-6) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Low Stock Alert Feed</h2>
              {lowStockItems.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {lowStockItems.length} Needs Attention
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Items currently at or below their low-stock threshold (Org default: ≤{defaultThreshold})
            </p>
          </div>

          <button
            onClick={onNavigateToProducts}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">All Stock Levels Healthy! 🎉</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              None of your products are at or below their low-stock threshold right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Product Name</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Quantity on Hand</th>
                  <th className="py-3.5 px-4">Threshold</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-6 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {lowStockItems.map((item) => {
                  const isZero = item.quantityOnHand === 0;

                  return (
                    <tr key={item._id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {item.name}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {item.sku}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-rose-600 flex items-center gap-2">
                        <span>{item.quantityOnHand} units</span>
                        {isZero && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs font-medium text-slate-600">
                        ≤ {item.lowStockThreshold} units
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700">
                        {item.sellingPrice !== null && item.sellingPrice !== undefined
                          ? `$${item.sellingPrice.toFixed(2)}`
                          : '—'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onOpenAdjustStock(item, fetchDashboard)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

