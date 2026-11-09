import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdjustStockModal({ isOpen, onClose, onAdjust, product }) {
  if (!isOpen || !product) return null;

  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDelta('');
    setNote('');
    setError('');
  }, [isOpen, product]);

  const parsedDelta = parseInt(delta, 10);
  const isValidNumber = !isNaN(parsedDelta) && parsedDelta !== 0;
  const currentQty = product.quantityOnHand || 0;
  const projectedQty = isValidNumber ? currentQty + parsedDelta : currentQty;

  const handlePreset = (val) => {
    setDelta(String(val));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidNumber) {
      setError('Please enter a non-zero adjustment (e.g. +5 or -2).');
      return;
    }

    if (projectedQty < 0) {
      setError(`Cannot adjust stock below 0. Current stock is ${currentQty}.`);
      return;
    }

    try {
      setLoading(true);
      await onAdjust(product._id, parsedDelta, note);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Adjust Stock Level</h2>
              <p className="text-xs text-slate-500">{product.name} ({product.sku})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Real-time Stock Visualizer */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-around text-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current</span>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{currentQty}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Change</span>
              <p className={`text-2xl font-bold mt-0.5 ${isValidNumber ? (parsedDelta > 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'}`}>
                {isValidNumber ? (parsedDelta > 0 ? `+${parsedDelta}` : parsedDelta) : '0'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Projected</span>
              <p className={`text-2xl font-bold mt-0.5 ${projectedQty < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                {projectedQty}
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Quick Delta Presets
            </label>
            <div className="grid grid-cols-6 gap-1.5 text-xs font-semibold">
              {[-10, -5, -1, 1, 5, 10].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handlePreset(val)}
                  className={`py-1.5 rounded-lg border transition-all cursor-pointer ${
                    parsedDelta === val
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : val > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Adjustment Units (+/- N)
            </label>
            <input
              type="number"
              step="1"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. +15 or -3"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900"
            />
          </div>

          {/* Reason Note (FR-5) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Audit Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Shipment delivered, warehouse damage"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValidNumber || projectedQty < 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Adjusting...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

