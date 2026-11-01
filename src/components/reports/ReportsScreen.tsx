/**
 * Accounting & Daily Closing Reports Screen
 * Reconciles opening balances, inflows, outflows, closing balances,
 * commission breakdown, shop income/expense, and net profit with Print and CSV export.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountType, DailyAccountReconciliation, DailyReportData } from '../../types';
import { formatCurrency, formatDate, getTodayDateString, downloadFile } from '../../utils/formatters';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  TrendingUp,
  Percent,
  CheckCircle2,
  Building2,
  Banknote,
  Smartphone,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { accounts, transactions, language, t, settings } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());

  // Determine target dates
  const selectedDates = useMemo<string[]>(() => {
    const today = new Date();
    const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (dateFilter === 'today') {
      return [toYMD(today)];
    }
    if (dateFilter === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return [toYMD(yest)];
    }
    if (dateFilter === '7days') {
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(toYMD(d));
      }
      return dates;
    }
    if (dateFilter === 'month') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const firstDay = new Date(currentYear, currentMonth, 1);
      const dates: string[] = [];
      const cur = new Date(firstDay);
      while (cur <= today) {
        dates.push(toYMD(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }
    if (dateFilter === 'custom') {
      return [customDate];
    }
    return [toYMD(today)];
  }, [dateFilter, customDate]);

  // Aggregate Report for selected dates
  const reportData = useMemo(() => {
    const filteredTxs = transactions.filter((t) => selectedDates.includes(t.date));

    const accSummary: Record<AccountType, DailyAccountReconciliation> = {
      cash: { openingBalance: 0, moneyIn: 0, moneyOut: 0, closingBalance: 0, netChange: 0 },
      easypaisa: { openingBalance: 0, moneyIn: 0, moneyOut: 0, closingBalance: 0, netChange: 0 },
      jazzcash: { openingBalance: 0, moneyIn: 0, moneyOut: 0, closingBalance: 0, netChange: 0 },
      bank: { openingBalance: 0, moneyIn: 0, moneyOut: 0, closingBalance: 0, netChange: 0 }
    };

    let sendMoneyTotal = 0;
    let sendMoneyCommission = 0;
    let sendMoneyCount = 0;
    let withdrawalTotal = 0;
    let withdrawalCommission = 0;
    let withdrawalCount = 0;
    let shopIncomeTotal = 0;
    let shopExpenseTotal = 0;
    let totalInflow = 0;
    let totalOutflow = 0;

    filteredTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const cashAmt = Number(tx.cashAmount) || 0;
      const comm = Number(tx.commission) || 0;

      switch (tx.type) {
        case 'money_in':
        case 'khata_payment':
          accSummary[tx.accountId].moneyIn += amt;
          totalInflow += amt;
          break;

        case 'money_out':
        case 'khata_credit':
          accSummary[tx.accountId].moneyOut += amt;
          totalOutflow += amt;
          break;

        case 'shop_income':
          accSummary[tx.accountId].moneyIn += amt;
          shopIncomeTotal += amt;
          totalInflow += amt;
          break;

        case 'shop_expense':
          accSummary[tx.accountId].moneyOut += amt;
          shopExpenseTotal += amt;
          totalOutflow += amt;
          break;

        case 'send_money':
          // Sent from digital account
          accSummary[tx.accountId].moneyOut += amt;
          // Cash in Hand receives cash from customer
          accSummary['cash'].moneyIn += cashAmt;
          sendMoneyTotal += amt;
          sendMoneyCount += 1;
          sendMoneyCommission += comm;
          totalInflow += cashAmt;
          totalOutflow += amt;
          break;

        case 'withdrawal':
          // Digital account receives money
          accSummary[tx.accountId].moneyIn += amt;
          // Cash paid out to customer
          accSummary['cash'].moneyOut += cashAmt;
          withdrawalTotal += amt;
          withdrawalCount += 1;
          withdrawalCommission += comm;
          totalInflow += amt;
          totalOutflow += cashAmt;
          break;
      }
    });

    accounts.forEach((acc) => {
      const rec = accSummary[acc.id];
      rec.closingBalance = acc.balance;
      rec.netChange = rec.moneyIn - rec.moneyOut;
      rec.openingBalance = rec.closingBalance - rec.netChange;
    });

    const totalCommission = sendMoneyCommission + withdrawalCommission;
    const netProfit = totalCommission + shopIncomeTotal - shopExpenseTotal;

    return {
      filteredTxs,
      accSummary,
      sendMoneyTotal,
      sendMoneyCommission,
      sendMoneyCount,
      withdrawalTotal,
      withdrawalCommission,
      withdrawalCount,
      totalCommission,
      shopIncomeTotal,
      shopExpenseTotal,
      netProfit,
      totalInflow,
      totalOutflow
    };
  }, [accounts, transactions, selectedDates]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Date', 'Time', 'Type', 'Account', 'Amount', 'Cash', 'Commission', 'Customer', 'Phone', 'Ref ID', 'Category'];
    const rows = reportData.filteredTxs.map((t) => [
      t.date,
      t.time,
      t.type,
      t.accountId,
      t.amount,
      t.cashAmount || '',
      t.commission,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `"${t.customerPhone}"`,
      t.referenceId,
      `"${t.category}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(`zahid_hisab_report_${dateFilter}.csv`, csvContent, 'text/csv');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto px-4 pt-3 select-none">
      {/* Top Header & Export Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>{t('dailyReport')}</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            {language === 'ur' ? settings.shopNameUrdu : settings.shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Print Report"
          >
            <Printer className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setDateFilter('today')}
          className={`py-1.5 px-3 rounded-xl font-semibold shrink-0 transition ${
            dateFilter === 'today' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('today')}
        </button>
        <button
          onClick={() => setDateFilter('yesterday')}
          className={`py-1.5 px-3 rounded-xl font-semibold shrink-0 transition ${
            dateFilter === 'yesterday' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('yesterday')}
        </button>
        <button
          onClick={() => setDateFilter('7days')}
          className={`py-1.5 px-3 rounded-xl font-semibold shrink-0 transition ${
            dateFilter === '7days' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('last7Days')}
        </button>
        <button
          onClick={() => setDateFilter('month')}
          className={`py-1.5 px-3 rounded-xl font-semibold shrink-0 transition ${
            dateFilter === 'month' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('thisMonth')}
        </button>
        <button
          onClick={() => setDateFilter('custom')}
          className={`py-1.5 px-3 rounded-xl font-semibold shrink-0 transition ${
            dateFilter === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Custom
        </button>
      </div>

      {dateFilter === 'custom' && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-400">Select Date:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white outline-none"
          />
        </div>
      )}

      {/* Net Profit & Gross Revenue Hero Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            {t('netProfit')}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {reportData.filteredTxs.length} Transactions
          </span>
        </div>

        <div className="text-3xl font-black text-white tracking-tight">
          {formatCurrency(reportData.netProfit)}
        </div>

        <p className="text-[11px] text-slate-400">
          Net Profit = Commission Profit ({formatCurrency(reportData.totalCommission)}) + Shop Services Income ({formatCurrency(reportData.shopIncomeTotal)}) − Shop Expenses ({formatCurrency(reportData.shopExpenseTotal)}).
        </p>

        {/* Commission Breakdown */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">{t('sendMoney')} Commission</span>
            <span className="font-bold text-amber-400">
              {formatCurrency(reportData.sendMoneyCommission)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Vol: {formatCurrency(reportData.sendMoneyTotal)} ({reportData.sendMoneyCount})
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">{t('cashWithdrawal')} Commission</span>
            <span className="font-bold text-amber-400">
              {formatCurrency(reportData.withdrawalCommission)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Vol: {formatCurrency(reportData.withdrawalTotal)} ({reportData.withdrawalCount})
            </span>
          </div>
        </div>
      </div>

      {/* Account Daily Closing Reconciliation Table */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {t('accountReport')} (Opening → Closing)
          </h3>
          <span className="text-[10px] text-emerald-400 font-medium">Reconciled</span>
        </div>

        <div className="space-y-2">
          {accounts.map((acc) => {
            const rec = reportData.accSummary[acc.id];
            return (
              <div
                key={acc.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">
                    {language === 'ur' ? acc.nameUrdu : acc.name}
                  </span>
                  <span className="font-black text-xs text-emerald-400">
                    Closing: {formatCurrency(rec.closingBalance)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 border-t border-slate-800/60 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{t('openingBalance')}</span>
                    <span className="font-mono text-slate-300">
                      {formatCurrency(rec.openingBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block">+ Inflows</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      +{formatCurrency(rec.moneyIn)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block">- Outflows</span>
                    <span className="font-mono text-rose-400 font-semibold">
                      -{formatCurrency(rec.moneyOut)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shop Expenses & Other Income Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <h3 className="font-bold text-white uppercase tracking-wider text-xs">
          Shop Services Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">{t('shopIncome')}</span>
            <span className="font-bold text-emerald-400 text-sm">
              +{formatCurrency(reportData.shopIncomeTotal)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">{t('shopExpense')}</span>
            <span className="font-bold text-rose-400 text-sm">
              -{formatCurrency(reportData.shopExpenseTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
