import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Building2, Sliders, Save, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function Settings({ toastMessage }) {
  const { organization, updateOrg } = useAuth();
  const [defaultThreshold, setDefaultThreshold] = useState(5);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setDefaultThreshold(data.defaultLowStockThreshold ?? 5);
        setOrganizationName(data.organizationName || organization?.name || '');
      } catch (err) {
        toastMessage('Failed to load settings.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const parsed = parseInt(defaultThreshold, 10);
    if (isNaN(parsed) || parsed < 0) {
      toastMessage('Default threshold must be a non-negative number.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateSettings({
        defaultLowStockThreshold: parsed,
        organizationName: organizationName.trim(),
      });

      updateOrg({
        name: res.organizationName,
        defaultLowStockThreshold: res.defaultLowStockThreshold,
      });

      toastMessage('Organization settings updated successfully.', 'success');
    } catch (err) {
      toastMessage(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default inventory alert rules and tenant preferences
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Organization Store Name
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Apex Retail Store"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900"
            />
          </div>

          {/* Default Low Stock Threshold (FR-7) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Default Low Stock Threshold (Units) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={defaultThreshold}
                onChange={(e) => setDefaultThreshold(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900"
              />
            </div>
            
            <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>PRD Rule (FR-7):</strong> If any product in your inventory does not have a custom low-stock threshold defined, this default value (e.g., <strong>{defaultThreshold} units</strong>) will automatically be used to trigger low-stock alerts on the dashboard and catalog table.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-70 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

