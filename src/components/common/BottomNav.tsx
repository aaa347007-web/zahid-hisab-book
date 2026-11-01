/**
 * Mobile-First Bottom Navigation Bar
 * Layout:
 * 1. Dashboard (far left)
 * 2. Transaction (second from left)
 * 3. Add (exact center, prominent circular action)
 * 4. Customer (second from right)
 * 5. Reports (far right)
 *
 * Settings is placed in the top-right corner of the app header as a small gear icon.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, ReceiptText, Users, BarChart3, Plus } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openTransactionModal, t } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-xl mx-auto px-1 py-1">
        <div className="grid grid-cols-5 items-center">
          {/* 1. Dashboard — far left */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full py-1 transition cursor-pointer select-none ${
              activeTab === 'dashboard'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t('navDashboard')}
            aria-label={t('navDashboard')}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10.5px] leading-tight text-center truncate max-w-full px-0.5">
              {t('navDashboard')}
            </span>
          </button>

          {/* 2. Transaction — second from left */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center w-full py-1 transition cursor-pointer select-none ${
              activeTab === 'transactions'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t('navTransaction')}
            aria-label={t('navTransaction')}
          >
            <ReceiptText className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10.5px] leading-tight text-center truncate max-w-full px-0.5">
              {t('navTransaction')}
            </span>
          </button>

          {/* 3. Add — exactly in the center, slightly larger and visually highlighted circular button */}
          <div className="flex flex-col items-center justify-center relative -top-3 w-full">
            <button
              onClick={() => openTransactionModal('add')}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-950/70 flex items-center justify-center active:scale-95 transition-transform border-4 border-slate-950 cursor-pointer"
              title="Add New Transaction"
              aria-label="Add Transaction"
            >
              <Plus className="w-7 h-7 stroke-[2.75]" />
            </button>
            <span className="text-[10px] font-semibold text-emerald-400 leading-tight text-center mt-0.5">
              {t('navAdd')}
            </span>
          </div>

          {/* 4. Customer — second from right */}
          <button
            onClick={() => setActiveTab('khata')}
            className={`flex flex-col items-center justify-center w-full py-1 transition cursor-pointer select-none ${
              activeTab === 'khata'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t('navCustomer')}
            aria-label={t('navCustomer')}
          >
            <Users className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10.5px] leading-tight text-center truncate max-w-full px-0.5">
              {t('navCustomer')}
            </span>
          </button>

          {/* 5. Reports — far right */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center w-full py-1 transition cursor-pointer select-none ${
              activeTab === 'reports'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t('navReports')}
            aria-label={t('navReports')}
          >
            <BarChart3 className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10.5px] leading-tight text-center truncate max-w-full px-0.5">
              {t('navReports')}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};
