/**
 * Clickable Account Card for Dashboard
 */

import React from 'react';
import { Account, AccountType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Banknote, Smartphone, CreditCard, Building2, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AccountCardProps {
  account: Account;
  onClick: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  const { language, t } = useApp();

  const getAccountStyle = (id: AccountType) => {
    switch (id) {
      case 'cash':
        return {
          icon: <Banknote className="w-5 h-5 text-emerald-400" />,
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          bg: 'bg-emerald-950/20',
          accent: 'text-emerald-400'
        };
      case 'easypaisa':
        return {
          icon: <Smartphone className="w-5 h-5 text-green-400" />,
          border: 'border-green-500/30 hover:border-green-500/60',
          bg: 'bg-green-950/20',
          accent: 'text-green-400'
        };
      case 'jazzcash':
        return {
          icon: <CreditCard className="w-5 h-5 text-rose-400" />,
          border: 'border-rose-500/30 hover:border-rose-500/60',
          bg: 'bg-rose-950/20',
          accent: 'text-rose-400'
        };
      case 'bank':
        return {
          icon: <Building2 className="w-5 h-5 text-blue-400" />,
          border: 'border-blue-500/30 hover:border-blue-500/60',
          bg: 'bg-blue-950/20',
          accent: 'text-blue-400'
        };
    }
  };

  const style = getAccountStyle(account.id);

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl bg-slate-900 border ${style.border} ${style.bg} transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.98] flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
          {style.icon}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </div>

      <div className="mt-3">
        <span className="text-xs font-semibold text-slate-300 block truncate">
          {language === 'ur' ? account.nameUrdu : account.name}
        </span>
        <div className={`text-base font-extrabold mt-0.5 tracking-tight ${style.accent}`}>
          {formatCurrency(account.balance)}
        </div>
      </div>
    </div>
  );
};
