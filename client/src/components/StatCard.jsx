import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtext, isAlert = false }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`bg-white rounded-2xl p-6 border shadow-sm transition-all hover:shadow-md ${
        isAlert ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

