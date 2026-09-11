import React from 'react';
import { MapPin, Search, Database, RefreshCw } from 'lucide-react';

export default function Header({ totalCount, onRefresh, loading }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-200">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Swarm Check-ins</h1>
            <p className="text-xs text-slate-500 font-medium">Personal Location Archive</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>{totalCount.toLocaleString()} Loaded</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
