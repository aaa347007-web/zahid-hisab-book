/**
 * Non-intrusive Toast Notifications
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-medium shadow-2xl backdrop-blur-md transition-all duration-300 max-w-sm border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80 shadow-emerald-950/60'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/60'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-slate-950/60'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
