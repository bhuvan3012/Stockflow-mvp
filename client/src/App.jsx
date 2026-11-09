import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AdjustStockModal from './components/AdjustStockModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('products');
  const [toast, setToast] = useState(null);

  // Modal states for Stock Adjustment and Delete Confirmation
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [refreshProductsTrigger, setRefreshProductsTrigger] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleOpenAdjustStock = (product, refreshCallback) => {
    setAdjustingProduct(product);
    setRefreshProductsTrigger(() => refreshCallback);
  };

  const handleConfirmAdjustStock = async (id, delta, note) => {
    const res = await api.adjustStock(id, delta, note);
    showToast(res.message || 'Stock adjusted successfully.', 'success');
    if (refreshProductsTrigger) refreshProductsTrigger();
  };

  const handleOpenDeleteConfirm = (product, refreshCallback) => {
    setDeletingProduct(product);
    setRefreshProductsTrigger(() => refreshCallback);
  };

  const handleConfirmDelete = async (id) => {
    const res = await api.deleteProduct(id);
    showToast(res.message || 'Product deleted successfully.', 'success');
    if (refreshProductsTrigger) refreshProductsTrigger();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Loading StockFlow...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <Products
            onOpenAdjustStock={handleOpenAdjustStock}
            onOpenDeleteConfirm={handleOpenDeleteConfirm}
            toastMessage={showToast}
          />
        )}

        {activeTab !== 'products' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab} View</h2>
            <p className="text-sm text-slate-500 mt-1">
              Active in the upcoming commit. Switch back to Products to test live inventory!
            </p>
          </div>
        )}
      </main>

      {/* Quick Stock Adjustment Modal (FR-5) */}
      <AdjustStockModal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onAdjust={handleConfirmAdjustStock}
        product={adjustingProduct}
      />

      {/* Delete Confirmation Modal (FR-4) */}
      <ConfirmDeleteModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        product={deletingProduct}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
