import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AdjustStockModal from './components/AdjustStockModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Settings from './pages/Settings';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('dashboard'); // FR-6: User lands on dashboard after login
  const [toast, setToast] = useState(null);

  // Modal states for Stock Adjustment and Delete Confirmation
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [refreshCallback, setRefreshCallback] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleOpenAdjustStock = (product, onCompleteRefresh) => {
    setAdjustingProduct(product);
    setRefreshCallback(() => onCompleteRefresh);
  };

  const handleConfirmAdjustStock = async (id, delta, note) => {
    const res = await api.adjustStock(id, delta, note);
    showToast(res.message || 'Stock adjusted successfully.', 'success');
    if (refreshCallback) refreshCallback();
  };

  const handleOpenDeleteConfirm = (product, onCompleteRefresh) => {
    setDeletingProduct(product);
    setRefreshCallback(() => onCompleteRefresh);
  };

  const handleConfirmDelete = async (id) => {
    const res = await api.deleteProduct(id);
    showToast(res.message || 'Product deleted successfully.', 'success');
    if (refreshCallback) refreshCallback();
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigateToProducts={() => setActiveTab('products')}
            onOpenAdjustStock={handleOpenAdjustStock}
          />
        )}

        {activeTab === 'products' && (
          <Products
            onOpenAdjustStock={handleOpenAdjustStock}
            onOpenDeleteConfirm={handleOpenDeleteConfirm}
            toastMessage={showToast}
          />
        )}

        {activeTab === 'settings' && (
          <Settings toastMessage={showToast} />
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
