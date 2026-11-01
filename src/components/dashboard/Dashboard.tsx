/**
 * Main Shop Dashboard
 * Shows total balance, account cards, today's income/expenses/commission, quick action buttons, and recent transactions.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { AccountCard } from './AccountCard';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Download,
  Plus,
  TrendingUp,
  Percent,
  Clock,
  Sparkles,
  ChevronRight,
  Phone,
  Hash,
  Store,
  DollarSign
} from 'lucide-react';
import { AccountType } from '../../types';

export const Dashboard: React.FC = () => {
  const {
    accounts,
    totalAvailableBalance,
    todayReport,
    transactions,
    setSelectedAccountDetail,
    openTransactionModal,
    openEditTransaction,
    setActiveTab,
    settings,
    language,
    t
  } = useApp();

  const recentTransactions = transactions.slice(0, 7);

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto px-4 pt-3 select-none">
      {/* Total Balance Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            {t('totalBalance')}
          </span>
          {!settings.isSetupComplete && (
            <button
              onClick={() => setActiveTab('settings')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
            >
              {t('editInitialBalance')}
            </button>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {formatCurrency(totalAvailableBalance)}
          </div>
        </div>

        {/* Quick today snapshot mini-row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">{t('todayIncome')}</span>
            <span className="font-bold text-emerald-400 text-xs">
              +{formatCurrency(todayReport.totalMoneyIn)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">{t('todayExpenses')}</span>
            <span className="font-bold text-rose-400 text-xs">
              -{formatCurrency(todayReport.totalMoneyOut)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-amber-300 block">{t('todayCommission')}</span>
            <span className="font-black text-amber-400 text-xs">
              +{formatCurrency(todayReport.totalCommission)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Accounts Grid (Cash in Hand, EasyPaisa, JazzCash, Bank) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
          <span>Accounts & Balances</span>
          <span className="text-[11px] text-slate-500">Tap card for history</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onClick={() => setSelectedAccountDetail(acc.id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <span className="px-1 text-xs text-slate-400 font-medium block">
          {t('quickActions')}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* Send Money */}
          <button
            onClick={() => openTransactionModal('send_money', 'easypaisa')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight text-center">
              {t('sendMoney')}
            </span>
          </button>

          {/* Cash Withdrawal */}
          <button
            onClick={() => openTransactionModal('withdrawal', 'jazzcash')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight text-center">
              {t('cashWithdrawal')}
            </span>
          </button>

          {/* Shop Services Income */}
          <button
            onClick={() => openTransactionModal('shop_income', 'cash')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight text-center">
              {t('shopIncome')}
            </span>
          </button>

          {/* Money In */}
          <button
            onClick={() => openTransactionModal('money_in', 'cash')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight text-center">
              {t('moneyIn')}
            </span>
          </button>

          {/* Money Out */}
          <button
            onClick={() => openTransactionModal('money_out', 'cash')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight text-center">
              {t('moneyOut')}
            </span>
          </button>

          {/* Shop Expenses */}
          <button
            onClick={() => openTransactionModal('shop_expense', 'cash')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight text-center">
              {t('shopExpense')}
            </span>
          </button>
        </div>
      </div>

      {/* Today's Financial Summary */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('todayTransactions')}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {formatDate(todayReport.date)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">{t('todayIncome')}</span>
            <span className="font-bold text-emerald-400 text-sm">
              {formatCurrency(todayReport.totalMoneyIn)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">{t('todayExpenses')}</span>
            <span className="font-bold text-rose-400 text-sm">
              {formatCurrency(todayReport.totalMoneyOut)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-amber-300 block">{t('todayCommission')}</span>
            <span className="font-bold text-amber-400 text-sm">
              {formatCurrency(todayReport.totalCommission)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-emerald-300 block">{t('netProfit')}</span>
            <span className="font-black text-emerald-400 text-sm">
              {formatCurrency(todayReport.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
          <span>{t('recentTransactions')}</span>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-0.5"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500">{t('noTransactionsYet')}</p>
            <button
              onClick={() => openTransactionModal('send_money')}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addTransaction')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const isMoneyIn =
                tx.type === 'money_in' ||
                tx.type === 'shop_income' ||
                tx.type === 'khata_payment' ||
                (tx.type === 'withdrawal' && tx.accountId !== 'cash');

              return (
                <div
                  key={tx.id}
                  onClick={() => openEditTransaction(tx)}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isMoneyIn
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'send_money' ? (
                        <Send className="w-4 h-4" />
                      ) : tx.type === 'withdrawal' ? (
                        <Download className="w-4 h-4" />
                      ) : isMoneyIn ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {tx.customerName || tx.category}
                        </span>
                        {tx.commission > 0 && (
                          <span className="text-[10px] text-amber-300 font-bold">
                            +{formatCurrency(tx.commission)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                        <span>{tx.category}</span>
                        {tx.customerPhone && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-slate-300">{tx.customerPhone}</span>
                          </>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatDate(tx.date)} {formatTime(tx.time)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-bold text-xs ${isMoneyIn ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isMoneyIn ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    {tx.cashAmount !== undefined && (
                      <div className="text-[10px] text-slate-400">
                        Cash: {formatCurrency(tx.cashAmount)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
