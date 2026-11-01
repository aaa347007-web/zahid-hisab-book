/**
 * Account Detail Screen & Filtered History
 */

import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Download,
  Plus,
  Minus,
  Search,
  Building2,
  Banknote,
  Smartphone,
  CreditCard,
  Phone,
  Hash
} from 'lucide-react';
import { AccountType, Transaction } from '../../types';

export const AccountDetailModal: React.FC = () => {
  const {
    selectedAccountDetail,
    setSelectedAccountDetail,
    accounts,
    transactions,
    language,
    t,
    openTransactionModal,
    openEditTransaction
  } = useApp();

  const currentAccount = useMemo(() => {
    if (!selectedAccountDetail) return null;
    return accounts.find((a) => a.id === selectedAccountDetail) || null;
  }, [accounts, selectedAccountDetail]);

  const accountTransactions = useMemo(() => {
    if (!selectedAccountDetail) return [];
    return transactions.filter(
      (tx) => tx.accountId === selectedAccountDetail || tx.secondaryAccountId === selectedAccountDetail
    );
  }, [transactions, selectedAccountDetail]);

  if (!selectedAccountDetail || !currentAccount) return null;

  const renderIcon = (type: AccountType) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-6 h-6 text-emerald-400" />;
      case 'easypaisa':
        return <Smartphone className="w-6 h-6 text-green-400" />;
      case 'jazzcash':
        return <CreditCard className="w-6 h-6 text-rose-400" />;
      case 'bank':
        return <Building2 className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              {renderIcon(currentAccount.id)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {language === 'ur' ? currentAccount.nameUrdu : currentAccount.name}
              </h2>
              <span className="text-xs text-slate-400">
                {t('currentBalance')}: <span className="font-semibold text-emerald-400">{formatCurrency(currentAccount.balance)}</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedAccountDetail(null)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Buttons for this Account */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              openTransactionModal(
                currentAccount.id === 'cash' ? 'money_in' : 'send_money',
                currentAccount.id
              );
            }}
            className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            {currentAccount.id === 'cash' ? (
              <>
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{t('moneyIn')}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-emerald-400" />
                <span>{t('sendMoney')}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              openTransactionModal(
                currentAccount.id === 'cash' ? 'money_out' : 'withdrawal',
                currentAccount.id
              );
            }}
            className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            {currentAccount.id === 'cash' ? (
              <>
                <Minus className="w-4 h-4 text-rose-400" />
                <span>{t('moneyOut')}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-rose-400" />
                <span>{t('cashWithdrawal')}</span>
              </>
            )}
          </button>
        </div>

        {/* Transaction History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>{t('recentTransactions')} ({accountTransactions.length})</span>
            <span>{t('date')} & {t('amount')}</span>
          </div>

          {accountTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm space-y-2">
              <p>{t('noTransactionsYet')}</p>
              <button
                onClick={() => openTransactionModal('add', currentAccount.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> {t('addTransaction')}
              </button>
            </div>
          ) : (
            accountTransactions.map((tx) => {
              const isMoneyIn =
                tx.type === 'money_in' ||
                tx.type === 'shop_income' ||
                tx.type === 'khata_payment' ||
                (tx.type === 'withdrawal' && tx.accountId === currentAccount.id);

              return (
                <div
                  key={tx.id}
                  onClick={() => openEditTransaction(tx)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isMoneyIn
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isMoneyIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">
                          {tx.customerName || tx.category}
                        </span>
                        {tx.commission > 0 && (
                          <span className="text-[10px] text-amber-300 font-medium">
                            +{formatCurrency(tx.commission)} {t('todayCommission')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span>{tx.category}</span>
                        {tx.customerPhone && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="flex items-center gap-0.5 text-slate-300">
                              <Phone className="w-2.5 h-2.5 text-slate-500" />
                              {tx.customerPhone}
                            </span>
                          </>
                        )}
                        {tx.referenceId && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="flex items-center gap-0.5 text-slate-400 text-[11px]">
                              <Hash className="w-2.5 h-2.5 text-slate-500" />
                              {tx.referenceId}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(tx.date)} {formatTime(tx.time)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${isMoneyIn ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isMoneyIn ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    {tx.cashAmount !== undefined && (
                      <div className="text-[11px] text-slate-400">
                        Cash: {formatCurrency(tx.cashAmount)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
