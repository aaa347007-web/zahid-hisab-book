/**
 * Customer Khata / Udhar Ledger Screen
 * Manages customer credit given, payments received, remaining balances, and total receivables.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, KhataEntry, AccountType } from '../../types';
import { formatCurrency, formatDate, formatTime, sanitizePhoneNumber } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  MapPin,
  ChevronRight,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const KhataScreen: React.FC = () => {
  const {
    customers,
    khataEntries,
    accounts,
    totalAvailableBalance,
    addCustomer,
    addKhataCredit,
    addKhataPayment,
    deleteKhataEntry,
    t,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Add Credit / Payment Modal
  const [entryMode, setEntryMode] = useState<'credit' | 'payment' | null>(null);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryAccount, setEntryAccount] = useState<AccountType>('cash');
  const [entryNote, setEntryNote] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total Receivables
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address || '').toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  // Selected customer entries
  const customerEntries = useMemo(() => {
    if (!selectedCustomer) return [];
    return khataEntries.filter((e) => e.customerId === selectedCustomer.id);
  }, [khataEntries, selectedCustomer]);

  // Handle Add Customer
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = await addCustomer({
      name: newName,
      phone: newPhone,
      address: newAddress,
      notes: newNotes
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewNotes('');
    setShowAddCustomer(false);
    setSelectedCustomer(created);
  };

  // Handle Save Entry (Credit or Payment)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setEntryError(null);

    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0) {
      setEntryError(t('amountMustBePositive'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (entryMode === 'credit') {
        await addKhataCredit(selectedCustomer.id, amt, entryAccount, entryNote);
      } else if (entryMode === 'payment') {
        await addKhataPayment(selectedCustomer.id, amt, entryAccount, entryNote);
      }

      // Update selected customer local reference
      const updated = customers.find((c) => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);

      setEntryMode(null);
      setEntryAmount('');
      setEntryNote('');
    } catch (err: any) {
      setEntryError(err.message || 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto px-4 pt-3 select-none">
      {/* Top Banner: Total Receivables */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            {t('totalReceivables')}
          </span>
          <span className="font-mono text-slate-400">{customers.length} {t('customers')}</span>
        </div>
        <div className="text-3xl font-black text-amber-300 tracking-tight">
          {formatCurrency(totalReceivables)}
        </div>
        <p className="text-[11px] text-slate-400">
          Total outstanding money owed to Zahid Mobiles and Photo State.
        </p>
      </div>

      {/* Customer Search & Add Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchCustomer')}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition active:scale-95 shadow-md shadow-emerald-950/50"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Customer List */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500">{t('noCustomersFound')}</p>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" /> {t('addCustomer')}
            </button>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const owes = cust.currentBalance > 0;
            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-emerald-400 shrink-0">
                    {cust.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white block truncate">
                      {cust.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      {cust.phone && (
                        <span className="font-mono flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-500" />
                          {cust.phone}
                        </span>
                      )}
                      {cust.address && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="truncate max-w-[120px]">{cust.address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span
                      className={`font-black text-sm block ${
                        owes ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(cust.currentBalance)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {owes ? t('owesShop') : t('allClear')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{t('addCustomer')}</span>
              </h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t('customerName')} *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Muhammad Asif"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t('customerPhone')}</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t('address')}</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Main Bazar, Shop #4"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional notes"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Customer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-emerald-400">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {selectedCustomer.phone && (
                      <span className="font-mono">{selectedCustomer.phone}</span>
                    )}
                    {selectedCustomer.address && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span>{selectedCustomer.address}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance Overview Card */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t('udharGiven')}</span>
                <span className="font-bold text-rose-400 text-xs">
                  {formatCurrency(selectedCustomer.totalUdhar)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t('paymentReceived')}</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {formatCurrency(selectedCustomer.totalPaid)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-300 block">{t('customerBalance')}</span>
                <span className="font-black text-amber-400 text-xs">
                  {formatCurrency(selectedCustomer.currentBalance)}
                </span>
              </div>
            </div>

            {/* Quick Actions for this customer: Give Udhar vs Receive Payment */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setEntryMode('credit');
                  setEntryAmount('');
                  setEntryNote('');
                  setEntryError(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4 text-rose-400" />
                <span>{t('giveCredit')}</span>
              </button>

              <button
                onClick={() => {
                  setEntryMode('payment');
                  setEntryAmount('');
                  setEntryNote('');
                  setEntryError(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>{t('receivePayment')}</span>
              </button>
            </div>

            {/* Entries History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="text-xs text-slate-400 font-medium px-1">
                Transaction History ({customerEntries.length})
              </div>

              {customerEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No credit or payment history for this customer yet.
                </div>
              ) : (
                customerEntries.map((entry) => {
                  const isCredit = entry.type === 'credit_given';
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isCredit
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block">
                            {isCredit ? t('udharGiven') : t('paymentReceived')}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {entry.note || (isCredit ? 'Credit goods/service' : 'Payment received')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatDate(entry.date)} {formatTime(entry.time)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className={`font-black text-sm ${isCredit ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(entry.amount)}
                        </span>
                        <button
                          onClick={() => deleteKhataEntry(entry.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Khata Entry Modal (Credit or Payment) */}
      {entryMode && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {entryMode === 'credit' ? (
                  <>
                    <Plus className="w-4 h-4 text-rose-400" />
                    <span>{t('giveCredit')} — {selectedCustomer.name}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    <span>{t('receivePayment')} — {selectedCustomer.name}</span>
                  </>
                )}
              </h3>
              <button onClick={() => setEntryMode(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t('amount')} (Rs) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-sm font-semibold text-white outline-none"
                />
              </div>

              {/* Account selector for both giving udhar and receiving repayment */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  {entryMode === 'credit'
                    ? (language === 'ur' ? 'کس اکاؤنٹ سے رقم ادا کی گئی؟' : 'Deduct Udhar From Account')
                    : (language === 'ur' ? 'رقم کس اکاؤنٹ میں جمع ہوئی؟' : 'Deposit Repayment Into Account')}
                </label>
                <select
                  value={entryAccount}
                  onChange={(e) => setEntryAccount(e.target.value as AccountType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {language === 'ur' ? a.nameUrdu : a.name} (Bal: {formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Balance Impact Preview */}
              {parseFloat(entryAmount) > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-300 text-xs border-b border-slate-800/80 pb-1 flex justify-between">
                    <span>Balance Adjustment Preview</span>
                    <span className={entryMode === 'credit' ? 'text-rose-400' : 'text-emerald-400'}>
                      {entryMode === 'credit' ? '- Cash Deducted' : '+ Cash Added'}
                    </span>
                  </div>
                  {(() => {
                    const amt = parseFloat(entryAmount) || 0;
                    const selectedAcc = accounts.find((a) => a.id === entryAccount) || accounts[0];
                    const nextAccBal = entryMode === 'credit' ? selectedAcc.balance - amt : selectedAcc.balance + amt;
                    const nextTotal = entryMode === 'credit' ? totalAvailableBalance - amt : totalAvailableBalance + amt;
                    const nextCustomerUdhar = entryMode === 'credit' ? selectedCustomer.currentBalance + amt : Math.max(0, selectedCustomer.currentBalance - amt);
                    return (
                      <>
                        <div className="flex justify-between text-slate-400">
                          <span>{selectedAcc.name}:</span>
                          <span className="font-mono text-white">
                            {formatCurrency(selectedAcc.balance)} → <span className={entryMode === 'credit' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{formatCurrency(nextAccBal)}</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Total Available Funds:</span>
                          <span className="font-mono text-white">
                            {formatCurrency(totalAvailableBalance)} → <span className={entryMode === 'credit' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{formatCurrency(nextTotal)}</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Customer Outstanding Udhar:</span>
                          <span className="font-mono text-white">
                            {formatCurrency(selectedCustomer.currentBalance)} → <span className="text-amber-400 font-bold">{formatCurrency(nextCustomerUdhar)}</span>
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  placeholder={entryMode === 'credit' ? 'e.g. 1 Mobile charger + Print' : 'e.g. Cash settlement'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              {entryError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {entryError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEntryMode(null)}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-2.5 px-3 rounded-xl text-white text-xs font-bold ${
                    entryMode === 'credit'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isSubmitting ? t('saving') : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
