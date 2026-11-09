import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, Settings, LogOut, Boxes, Building2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, organization, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900">StockFlow</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full ml-2 border border-indigo-200">
                  MVP
                </span>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User & Organization Context */}
          <div className="flex items-center gap-4">
            {organization && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[140px] truncate" title={organization.name}>
                  {organization.name}
                </span>
              </div>
            )}

            <div className="hidden lg:block text-right">
              <div className="text-xs font-medium text-slate-900">{user?.email}</div>
              <div className="text-[10px] text-slate-500">Tenant Owner</div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden border-t border-slate-100 px-4 py-2 bg-slate-50 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium ${
                isActive ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

