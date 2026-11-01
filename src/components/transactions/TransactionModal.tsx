/**
 * Bulletproof Transaction Modal
 * Solves white-screen crashes by using robust initial state, strict input validation,
 * category isolation, auto-commission calculations, double-click locks, and confirmation summary.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountType, TransactionType } from '../../types';
import {
  formatCurrency,
  generateRefId,
  getTodayDateString,
  getCurrentTimeString,
  suggestCashAmount,
  calculateCommission,
  sanitizePhoneNumber
} from '../../utils/formatters';
import {
  X,
  Send,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Store,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Hash,
  User,
  Phone,
  FileText,
  Calculator,
  ShieldCheck,
  Building2,
  Banknote,
  Smartphone,
  CreditCard
} from 'lucide-react';

export const TransactionModal: React.FC = () => {
  const {
    transactionModalOpen,
    transactionModalType,
    defaultSelectedAccount,
    closeTransactionModal,
    editingTransaction,
    accounts,
    createTransaction,
    updateTransaction,
    settings,
    language,
    t,
    showToast
  } = useApp();

  // Mode: send_money | withdrawal | money_in | money_out | shop_income | shop_expense
  const [activeType, setActiveType] = useState<TransactionType>('send_money');
  const [selectedAccountId, setSelectedAccountId] = useState<AccountType>('easypaisa');
  const [amountStr, setAmountStr] = useState<string>('');
  const [cashAmountStr, setCashAmountStr] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(getTodayDateString());
  const [txTime, setTxTime] = useState<string>(getCurrentTimeString());

  // UI Flow States
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal opens or editing changes
  useEffect(() => {
    if (!transactionModalOpen) {
      setShowConfirmStep(false);
      setErrorMessage(null);
      return;
    }

    if (editingTransaction) {
      setActiveType(editingTransaction.type);
      setSelectedAccountId(editingTransaction.accountId);
      setAmountStr(String(editingTransaction.amount));
      setCashAmountStr(editingTransaction.cashAmount !== undefined ? String(editingTransaction.cashAmount) : '');
      setCustomerName(editingTransaction.customerName || '');
      setCustomerPhone(editingTransaction.customerPhone || '');
      setReferenceId(editingTransaction.referenceId || '');
      setCategory(editingTransaction.category || '');
      setDescription(editingTransaction.description || '');
      setTxDate(editingTransaction.date || getTodayDateString());
      setTxTime(editingTransaction.time || getCurrentTimeString());
    } else {
      // New Transaction
      const initialType: TransactionType =
        transactionModalType === 'add' || !transactionModalType ? 'send_money' : transactionModalType;
      setActiveType(initialType);

      // Select natural default account
      if (initialType === 'send_money' || initialType === 'withdrawal') {
        setSelectedAccountId(defaultSelectedAccount === 'cash' ? 'easypaisa' : defaultSelectedAccount);
      } else if (initialType === 'shop_income' || initialType === 'shop_expense') {
        setSelectedAccountId(defaultSelectedAccount || 'cash');
      } else {
        setSelectedAccountId(defaultSelectedAccount || 'cash');
      }

      setAmountStr('');
      setCashAmountStr('');
      setCustomerName('');
      setCustomerPhone('');
      setDescription('');
      setTxDate(getTodayDateString());
      setTxTime(getCurrentTimeString());
      setErrorMessage(null);
      setShowConfirmStep(false);

      // Auto generate reference ID
      const prefix = initialType === 'send_money' ? 'SEND' : initialType === 'withdrawal' ? 'WTHD' : 'TRX';
      setReferenceId(generateRefId(prefix));
    }
  }, [transactionModalOpen, transactionModalType, defaultSelectedAccount, editingTransaction]);

  // Selected account object
  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  const cashAccount = useMemo(() => {
    return accounts.find((a) => a.id === 'cash') || accounts[0];
  }, [accounts]);

  // Auto-isolated Category update
  useEffect(() => {
    if (editingTransaction) return;

    if (activeType === 'send_money') {
      if (selectedAccountId === 'easypaisa') setCategory('EasyPaisa Send Money');
      else if (selectedAccountId === 'jazzcash') setCategory('JazzCash Send Money');
      else if (selectedAccountId === 'bank') setCategory('Bank Send Money');
      else setCategory('Send Money');
    } else if (activeType === 'withdrawal') {
      if (selectedAccountId === 'easypaisa') setCategory('EasyPaisa Withdrawal');
      else if (selectedAccountId === 'jazzcash') setCategory('JazzCash Withdrawal');
      else if (selectedAccountId === 'bank') setCategory('Bank Withdrawal');
      else setCategory('Cash Withdrawal');
    } else if (activeType === 'shop_income') {
      if (!category || category.includes('Send') || category.includes('Withdrawal')) {
        setCategory('Print Photocopy');
      }
    } else if (activeType === 'shop_expense') {
      if (!category || category.includes('Send') || category.includes('Withdrawal')) {
        setCategory('Shop Expenses');
      }
    } else if (activeType === 'money_in') {
      setCategory('Cash Deposit');
    } else if (activeType === 'money_out') {
      setCategory('Cash Payout');
    }
  }, [activeType, selectedAccountId, editingTransaction]);

  // Numeric parsing
  const numericAmount = useMemo(() => {
    const val = parseFloat(amountStr);
    return isNaN(val) ? 0 : val;
  }, [amountStr]);

  const numericCashAmount = useMemo(() => {
    const val = parseFloat(cashAmountStr);
    return isNaN(val) ? 0 : val;
  }, [cashAmountStr]);

  // Auto-calculate suggested cash amount when amount changes
  const handleAmountChange = (val: string) => {
    setAmountStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      if (activeType === 'send_money') {
        const suggested = suggestCashAmount('send_money', parsed, settings.defaultSendRatePer1000, settings.defaultWithdrawRatePer1000);
        setCashAmountStr(String(suggested));
      } else if (activeType === 'withdrawal') {
        const suggested = suggestCashAmount('withdrawal', parsed, settings.defaultSendRatePer1000, settings.defaultWithdrawRatePer1000);
        setCashAmountStr(String(suggested));
      }
    } else {
      setCashAmountStr('');
    }
  };

  // Commission calculation
  const calculatedCommission = useMemo(() => {
    if (activeType === 'send_money' || activeType === 'withdrawal') {
      return calculateCommission(activeType, numericAmount, numericCashAmount);
    }
    return 0;
  }, [activeType, numericAmount, numericCashAmount]);

  if (!transactionModalOpen) return null;

  // Validation
  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (numericAmount <= 0) {
      setErrorMessage(t('amountMustBePositive'));
      return false;
    }

    if (activeType === 'send_money') {
      if (numericCashAmount <= 0) {
        setErrorMessage('Please enter the cash received from customer.');
        return false;
      }
      if (numericCashAmount < numericAmount) {
        setErrorMessage('Cash received cannot be less than the amount sent.');
        return false;
      }
      if (!settings.allowOverdraft && currentAccount.balance < numericAmount) {
        setErrorMessage(
          t('insufficientBalance')
            .replace('{account}', language === 'ur' ? currentAccount.nameUrdu : currentAccount.name)
            .replace('{balance}', String(currentAccount.balance))
        );
        return false;
      }
    }

    if (activeType === 'withdrawal') {
      if (numericCashAmount <= 0) {
        setErrorMessage('Please enter the cash paid to customer.');
        return false;
      }
      if (numericAmount < numericCashAmount) {
        setErrorMessage('Amount received in account cannot be less than cash paid.');
        return false;
      }
      if (!settings.allowOverdraft && cashAccount.balance < numericCashAmount) {
        setErrorMessage(
          `Insufficient Cash in Hand. Current cash balance is ${formatCurrency(cashAccount.balance)}, but you need to pay ${formatCurrency(numericCashAmount)}.`
        );
        return false;
      }
    }

    if (activeType === 'money_out' || activeType === 'shop_expense') {
      if (!settings.allowOverdraft && currentAccount.balance < numericAmount) {
        setErrorMessage(
          t('insufficientBalance')
            .replace('{account}', language === 'ur' ? currentAccount.nameUrdu : currentAccount.name)
            .replace('{balance}', String(currentAccount.balance))
        );
        return false;
      }
    }

    return true;
  };

  // Handle Proceed to Confirmation
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmStep(true);
  };

  // Final Save Handler (with double-click protection)
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        type: activeType,
        accountId: selectedAccountId,
        secondaryAccountId: (activeType === 'send_money' || activeType === 'withdrawal') ? ('cash' as AccountType) : undefined,
        amount: numericAmount,
        cashAmount: (activeType === 'send_money' || activeType === 'withdrawal') ? numericCashAmount : undefined,
        commission: calculatedCommission,
        customerName: customerName.trim() || (activeType === 'shop_income' ? 'Shop Customer' : 'Walk-in Customer'),
        customerPhone: sanitizePhoneNumber(customerPhone),
        referenceId: referenceId.trim() || generateRefId('TRX'),
        category: category || activeType,
        description: description.trim(),
        date: txDate || getTodayDateString(),
        time: txTime || getCurrentTimeString(),
        timestamp: Date.now()
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await createTransaction(payload);
      }

      closeTransactionModal();
    } catch (err: any) {
      console.error('Failed to save transaction:', err);
      setErrorMessage(err.message || 'Failed to save transaction to database');
      setShowConfirmStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingTransaction ? t('edit') : t('addTransaction')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'ur' ? settings.shopNameUrdu : settings.shopName}
              </p>
            </div>
          </div>
          <button
            onClick={closeTransactionModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* CONFIRMATION SUMMARY STEP */}
          {showConfirmStep ? (
            <div className="space-y-4 py-1">
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>{t('confirmTransactionTitle')}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {t('confirmTransactionSubtitle')}
                </p>

                {/* Summary Table */}
                <div className="space-y-2 text-xs divide-y divide-slate-800/80 pt-1">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">{t('category')}:</span>
                    <span className="font-semibold text-white">{category}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">{t('selectAccount')}:</span>
                    <span className="font-semibold text-white">
                      {language === 'ur' ? currentAccount.nameUrdu : currentAccount.name}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">{t('amount')}:</span>
                    <span className="font-bold text-base text-emerald-400">
                      {formatCurrency(numericAmount)}
                    </span>
                  </div>

                  {(activeType === 'send_money' || activeType === 'withdrawal') && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">
                          {activeType === 'send_money' ? t('cashReceivedFromCustomer') : t('cashPaidToCustomer')}:
                        </span>
                        <span className="font-bold text-white">
                          {formatCurrency(numericCashAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <span className="text-amber-300 font-medium">{t('calculatedCommission')}:</span>
                        <span className="font-black text-amber-300 text-sm">
                          {formatCurrency(calculatedCommission)}
                        </span>
                      </div>
                    </>
                  )}

                  {customerName && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">{t('customerName')}:</span>
                      <span className="font-medium text-white">{customerName}</span>
                    </div>
                  )}

                  {customerPhone && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">{t('customerPhone')}:</span>
                      <span className="font-mono text-white">{customerPhone}</span>
                    </div>
                  )}

                  {referenceId && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">{t('referenceId')}:</span>
                      <span className="font-mono text-xs text-slate-300">{referenceId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmStep(false)}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t('saving') : t('confirm')}
                </button>
              </div>
            </div>
          ) : (
            /* TRANSACTION INPUT FORM */
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Type Switcher Tabs (Segmented control) */}
              {!editingTransaction && (
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveType('send_money')}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                      activeType === 'send_money'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('sendMoney')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveType('withdrawal')}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                      activeType === 'withdrawal'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('cashWithdrawal')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveType('money_in')}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                      activeType === 'money_in'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>{t('moneyIn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveType('money_out')}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                      activeType === 'money_out'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{t('moneyOut')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveType('shop_income')}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                      activeType === 'shop_income'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{t('shopIncome')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveType('shop_expense')}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                      activeType === 'shop_expense'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{t('shopExpense')}</span>
                  </button>
                </div>
              )}

              {/* Mode Guidance Alert */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {activeType === 'send_money' && t('sendMoney')}
                    {activeType === 'withdrawal' && t('cashWithdrawal')}
                    {activeType === 'money_in' && t('moneyIn')}
                    {activeType === 'money_out' && t('moneyOut')}
                    {activeType === 'shop_income' && t('shopIncome')}
                    {activeType === 'shop_expense' && t('shopExpense')}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {activeType === 'send_money' && t('sendMoneyDesc')}
                    {activeType === 'withdrawal' && t('withdrawalDesc')}
                    {activeType === 'money_in' && 'Direct cash or electronic funds deposited into selected account.'}
                    {activeType === 'money_out' && 'Direct payment or payout disbursed from selected account.'}
                    {activeType === 'shop_income' && 'Income earned from Print Photocopy, Mobile Sales, or Online Services.'}
                    {activeType === 'shop_expense' && 'Expenditure incurred for shop rent, electricity, tea, or supplies.'}
                  </p>
                </div>
              </div>

              {/* Account Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  {activeType === 'send_money' ? t('payingAccount') : activeType === 'withdrawal' ? t('receivingAccount') : t('selectAccount')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {accounts
                    // For send_money and withdrawal, only show digital accounts (EasyPaisa, JazzCash, Bank)
                    .filter((acc) => {
                      if (activeType === 'send_money' || activeType === 'withdrawal') {
                        return acc.id !== 'cash';
                      }
                      return true;
                    })
                    .map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight truncate">
                            {language === 'ur' ? acc.nameUrdu : acc.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 mt-1">
                            {formatCurrency(acc.balance)}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Amount Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Principal Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>
                      {activeType === 'send_money'
                        ? 'Amount Sent to Customer (Rs)'
                        : activeType === 'withdrawal'
                        ? 'Amount Received in Account (Rs)'
                        : t('amount')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formatCurrency(numericAmount)}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={amountStr}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-3.5 text-white font-semibold text-base outline-none transition"
                    />
                  </div>
                </div>

                {/* Cash Input (for Send Money & Withdrawal) */}
                {(activeType === 'send_money' || activeType === 'withdrawal') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>
                        {activeType === 'send_money'
                          ? t('cashReceivedFromCustomer')
                          : t('cashPaidToCustomer')}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {formatCurrency(numericCashAmount)}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        required
                        value={cashAmountStr}
                        onChange={(e) => setCashAmountStr(e.target.value)}
                        placeholder={activeType === 'send_money' ? 'e.g. 1010' : 'e.g. 1000'}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-3.5 text-white font-semibold text-base outline-none transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Commission Display for Send Money / Withdrawal */}
              {(activeType === 'send_money' || activeType === 'withdrawal') && (
                <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-amber-300">
                        {t('calculatedCommission')}:
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {activeType === 'send_money' ? t('sendMoneyFormula') : t('withdrawalFormula')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-amber-300 font-mono">
                      {formatCurrency(calculatedCommission)}
                    </span>
                  </div>
                </div>
              )}

              {/* Isolated Category Selection (Section 7 & 8) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  {t('category')}
                </label>
                {activeType === 'send_money' || activeType === 'withdrawal' ? (
                  // Locked to specific isolated category
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-emerald-300 font-medium">
                    {category}
                  </div>
                ) : activeType === 'shop_income' ? (
                  // Shop Income isolated categories
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Print Photocopy">{t('catPrintPhotocopy')}</option>
                    <option value="Online Services">{t('catOnlineServices')}</option>
                    <option value="Mobile Sales">{t('catMobileSales')}</option>
                    <option value="Mobile Accessories">{t('catMobileAccessories')}</option>
                    <option value="Other Income">{t('catOtherIncome')}</option>
                  </select>
                ) : activeType === 'shop_expense' ? (
                  // Shop Expense isolated categories
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Shop Expenses">{t('catShopExpenses')}</option>
                    <option value="Other Expenses">{t('catOtherExpenses')}</option>
                  </select>
                ) : (
                  // General Money In / Money Out
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500"
                    placeholder="Category"
                  />
                )}
              </div>

              {/* Customer Details: Name, Phone (Preserving Leading Zero), Reference ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('customerName')}</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Saqib Ali"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>

                {/* Customer Phone - Strictly text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('customerPhone')}</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                  />
                </div>

                {/* Reference ID / TRX */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('referenceId')}</span>
                  </label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="TRX-123456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* Description (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('description')}</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional notes (optional)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{t('time')}</label>
                  <input
                    type="time"
                    value={txTime}
                    onChange={(e) => setTxTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeTransactionModal}
                  className="w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('save')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
