/**
 * Full Transaction History & Management Screen
 * Supports searching by phone number (with leading zeros), customer name, reference ID,
 * filtering by account and type, editing, and deleting with balance reversal.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountType, Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import {
  Search,
  Filter,
  Plus,
  Send,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Edit2,
  Phone,
  Hash,
  AlertTriangle,
  X
} from 'lucide-react';

export const TransactionList: React.FC = () => {
  const {
    transactions,
    accounts,
    deleteTransaction,
    openEditTransaction,
    openTransactionModal,
    t,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search matching phone, name, or referenceId
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = tx.customerName.toLowerCase().includes(query);
        const matchPhone = tx.customerPhone.includes(query);
        const matchRef = tx.referenceId.toLowerCase().includes(query);
        const matchDesc = (tx.description || '').toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchRef && !matchDesc) {
          return false;
        }
      }

      // Type filter
      if (selectedTypeFilter !== 'all') {
        if (tx.type !== selectedTypeFilter) return false;
      }

      // Account filter
      if (selectedAccountFilter !== 'all') {
        if (tx.accountId !== selectedAccountFilter && tx.secondaryAccountId !== selectedAccountFilter) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, selectedTypeFilter, selectedAccountFilter]);

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    await deleteTransaction(deletingTx.id);
    setDeletingTx(null);
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto px-4 pt-3 select-none">
      {/* Top Header & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t('navTransactions')} ({transactions.length})
          </h2>
          <button
            onClick={() => openTransactionModal('add')}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addTransaction')}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone (03xx), name, or Ref ID..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none shrink-0"
          >
            <option value="all">All Types</option>
            <option value="send_money">{t('sendMoney')}</option>
            <option value="withdrawal">{t('cashWithdrawal')}</option>
            <option value="money_in">{t('moneyIn')}</option>
            <option value="money_out">{t('moneyOut')}</option>
            <option value="shop_income">{t('shopIncome')}</option>
            <option value="shop_expense">{t('shopExpense')}</option>
            <option value="khata_credit">Customer Udhar Given</option>
            <option value="khata_payment">Customer Udhar Received</option>
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none shrink-0"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {language === 'ur' ? a.nameUrdu : a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500">
            {searchQuery ? 'No transactions match your search' : t('noTransactionsYet')}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-emerald-400 underline font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const isMoneyIn =
              tx.type === 'money_in' ||
              tx.type === 'shop_income' ||
              tx.type === 'khata_payment' ||
              (tx.type === 'withdrawal' && tx.accountId !== 'cash');

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
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
                        <span className="font-bold text-xs text-white truncate">
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
                            <span className="font-mono text-slate-300 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-500" />
                              {tx.customerPhone}
                            </span>
                          </>
                        )}
                        {tx.referenceId && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              {tx.referenceId}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatDate(tx.date)} {formatTime(tx.time)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-black text-sm ${isMoneyIn ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isMoneyIn ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    {tx.cashAmount !== undefined && (
                      <div className="text-[10px] text-slate-400">
                        Cash: {formatCurrency(tx.cashAmount)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                    {tx.description || 'Verified atomic record'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditTransaction(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title={t('edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTx(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">{t('confirmDeleteTitle')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('confirmDeleteMsg')}
              </p>
              <div className="mt-2 p-2 rounded-xl bg-slate-950 text-xs font-mono text-slate-300">
                {deletingTx.category}: {formatCurrency(deletingTx.amount)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingTx(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
