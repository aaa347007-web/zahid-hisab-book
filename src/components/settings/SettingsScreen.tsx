/**
 * Shop Settings, Initial Balances, PIN Security, and Data Backup Screen
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountType, AppSettings, BackupData } from '../../types';
import { formatCurrency, downloadFile } from '../../utils/formatters';
import { DiagnosticTestSuite } from '../tests/DiagnosticTestSuite';
import {
  Settings,
  Shield,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  Cpu,
  Trash2,
  Save,
  Building2,
  Banknote,
  CreditCard,
  Sun,
  Moon,
  Palette,
  Cloud,
  CloudOff,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface Props {
  onOpenApkGuide: () => void;
}

export const SettingsScreen: React.FC<Props> = ({ onOpenApkGuide }) => {
  const {
    accounts,
    settings,
    updateInitialBalances,
    updateSettings,
    setPin,
    disablePin,
    exportBackup,
    restoreBackup,
    resetAllData,
    language,
    t,
    showToast,
    theme,
    setTheme,
    currentUser,
    userPhone,
    openAuthModal,
    logout,
    syncWithCloud,
    isSyncing,
    lastSyncedAt
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'balances' | 'security' | 'backup' | 'diagnostics'>('general');

  // Initial balances form state
  const [initCash, setInitCash] = useState<string>(String(accounts.find((a) => a.id === 'cash')?.initialBalance ?? 0));
  const [initEP, setInitEP] = useState<string>(String(accounts.find((a) => a.id === 'easypaisa')?.initialBalance ?? 0));
  const [initJC, setInitJC] = useState<string>(String(accounts.find((a) => a.id === 'jazzcash')?.initialBalance ?? 0));
  const [initBank, setInitBank] = useState<string>(String(accounts.find((a) => a.id === 'bank')?.initialBalance ?? 0));

  // PIN Form State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Commission Rates
  const [sendRate, setSendRate] = useState<string>(String(settings.defaultSendRatePer1000));
  const [withdrawRate, setWithdrawRate] = useState<string>(String(settings.defaultWithdrawRatePer1000));
  const [allowOverdraft, setAllowOverdraft] = useState<boolean>(settings.allowOverdraft);

  // Restore Modal & Warnings
  const [showResetWarning, setShowResetWarning] = useState(false);

  // Save Initial Balances
  const handleSaveInitialBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    const balances: Record<AccountType, number> = {
      cash: parseFloat(initCash) || 0,
      easypaisa: parseFloat(initEP) || 0,
      jazzcash: parseFloat(initJC) || 0,
      bank: parseFloat(initBank) || 0
    };
    await updateInitialBalances(balances);
  };

  // Save Rates & Overdraft
  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      defaultSendRatePer1000: parseFloat(sendRate) || 10,
      defaultWithdrawRatePer1000: parseFloat(withdrawRate) || 20,
      allowOverdraft
    });
  };

  // Save New PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('pinMismatch'));
      return;
    }

    await setPin(newPin);
    setNewPin('');
    setConfirmPin('');
  };

  // Export Backup JSON
  const handleExportBackup = async () => {
    try {
      const backup = await exportBackup();
      const content = JSON.stringify(backup, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(`zahid_hisab_book_backup_${dateStr}.json`, content, 'application/json');
      showToast('Backup file downloaded successfully', 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  // Restore Backup JSON
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupData;
        if (!parsed.accounts || !parsed.transactions) {
          throw new Error('Corrupted or invalid backup file');
        }

        const ok = window.confirm(
          `Restore backup from ${parsed.exportDate || 'file'} containing ${parsed.transactions.length} transactions? This will overwrite the current database.`
        );
        if (ok) {
          await restoreBackup(parsed);
        }
      } catch (err: any) {
        showToast(`Restore error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto px-4 pt-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>{t('securitySettings')}</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            {language === 'ur' ? settings.shopNameUrdu : settings.shopName}
          </p>
        </div>

        {/* APK Guide Button */}
        <button
          onClick={onOpenApkGuide}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Smartphone className="w-4 h-4" />
          <span>APK Guide</span>
        </button>
      </div>

      {/* Firebase Cloud Account & Sync Card */}
      <div className={`p-4 rounded-2xl border transition-all ${
        currentUser
          ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : 'bg-gradient-to-br from-amber-950/20 to-slate-900 border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              currentUser 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {currentUser ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span>{language === 'ur' ? 'گوگل فائر بیس کلاؤڈ سنک' : 'Firebase Realtime Database'}</span>
                {currentUser && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Online Synced
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentUser 
                  ? (userPhone || currentUser.email)
                  : (language === 'ur' ? 'ڈیٹا محفوظ رکھنے کے لیے لاگ ان کریں' : 'Log in to protect data against uninstall')}
              </p>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={async () => {
                await logout();
                showToast(language === 'ur' ? 'کامیابی سے لاگ آؤٹ ہو گیا' : 'Logged out', 'info');
              }}
              className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              title="Logout from Firebase"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'لاگ ان / رجسٹر' : 'Login / Register'}</span>
            </button>
          )}
        </div>

        {currentUser ? (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="truncate font-mono text-[10px] text-slate-500">
              Path: users/{currentUser.uid.slice(0, 8)}.../hisab
            </span>
            <button
              onClick={async () => {
                await syncWithCloud();
                showToast(language === 'ur' ? 'کلاؤڈ سے سنک مکمل ہو گیا' : 'Synced with Firebase', 'success');
              }}
              disabled={isSyncing}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            {language === 'ur'
              ? 'موبائل تبدیل کرنے یا ایپ ڈیلیٹ ہونے پر بھی سارا حساب محفوظ رہے گا۔'
              : 'Save accounts, transactions, and customer khata to users/${uid}/hisab in real time.'}
          </p>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setActiveTab('general')}
          className={`py-2 px-3 rounded-xl font-semibold shrink-0 transition ${
            activeTab === 'general' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          General & Rates
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`py-2 px-3 rounded-xl font-semibold shrink-0 transition ${
            activeTab === 'balances' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('editInitialBalance')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-3 rounded-xl font-semibold shrink-0 transition ${
            activeTab === 'security' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          PIN Security
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`py-2 px-3 rounded-xl font-semibold shrink-0 transition ${
            activeTab === 'backup' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Backup & Safety
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`py-2 px-3 rounded-xl font-semibold shrink-0 transition ${
            activeTab === 'diagnostics' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Diagnostics (A-G)
        </button>
      </div>

      {/* TAB 1: GENERAL & RATES */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          {/* Theme Switch Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>{t('themeSettings')}</span>
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t('themeDesc')}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Dark Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white border-emerald-500 shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/50'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Moon className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>🌙 {t('darkMode')}</span>
              </button>

              {/* Light Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Sun className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>☀️ {t('lightMode')}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveRates} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Default Commission Rates & Overdraft</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  Send Money Default Rate (Rs per 1,000)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={sendRate}
                  onChange={(e) => setSendRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Withdrawal Default Rate (Rs per 1,000)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={withdrawRate}
                  onChange={(e) => setWithdrawRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold outline-none"
                />
              </div>
            </div>

            {/* Overdraft Setting */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-white block">
                  {t('allowOverdraftLabel')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t('allowOverdraftDesc')}
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowOverdraft}
                onChange={(e) => setAllowOverdraft(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              {t('save')}
            </button>
          </form>

          {/* Shop Profile Info */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              Shop Profile
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Shop Name:</span>
                <span className="font-semibold">{settings.shopName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">نام (Urdu):</span>
                <span className="font-semibold">{settings.shopNameUrdu}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold">{settings.ownerName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INITIAL BALANCES */}
      {activeTab === 'balances' && (
        <form onSubmit={handleSaveInitialBalances} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-white">
              {t('editInitialBalance')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Set the exact opening balance you had in each account when you started using the app. No demo balances or fake transactions are inserted into your ledger.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {t('cash')} (Rs)
              </label>
              <input
                type="number"
                step="any"
                value={initCash}
                onChange={(e) => setInitCash(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {t('easypaisa')} (Rs)
              </label>
              <input
                type="number"
                step="any"
                value={initEP}
                onChange={(e) => setInitEP(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {t('jazzcash')} (Rs)
              </label>
              <input
                type="number"
                step="any"
                value={initJC}
                onChange={(e) => setInitJC(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {t('bank')} (Rs)
              </label>
              <input
                type="number"
                step="any"
                value={initBank}
                onChange={(e) => setInitBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition"
          >
            {t('save')}
          </button>
        </form>
      )}

      {/* TAB 3: PIN SECURITY */}
      {activeTab === 'security' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>{t('pinProtection')}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('pinEnabledDesc')}
              </p>
            </div>
            {settings.pinEnabled && (
              <button
                onClick={disablePin}
                className="py-1 px-2.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-[11px] font-semibold"
              >
                Disable PIN
              </button>
            )}
          </div>

          <form onSubmit={handleSavePin} className="space-y-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                {settings.pinEnabled ? 'Enter New 4-Digit PIN' : t('setNewPin')}
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-center text-lg font-mono tracking-widest text-white outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                {t('confirmNewPin')}
              </label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-center text-lg font-mono tracking-widest text-white outline-none"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-medium">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              {settings.pinEnabled ? 'Update PIN' : 'Enable PIN Protection'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            PIN is securely encrypted locally with salted SHA-256 and never stored in plain text.
          </p>
        </div>
      )}

      {/* TAB 4: BACKUP & DATA SAFETY */}
      {activeTab === 'backup' && (
        <div className="space-y-4 text-xs">
          {/* Data Safety Notice */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('dataSafetySection')}</span>
            </h3>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {t('backupNotice')} Every transaction is written to persistent IndexedDB with a redundant encrypted local snapshot.
            </p>
          </div>

          {/* Backup / Restore Controls */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs">
              Manual File Backup & Restore
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportBackup}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                <span>{t('downloadBackup')} (JSON)</span>
              </button>

              <label className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border border-slate-700">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{t('restoreBackup')} (JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Wipe / Reset Data */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/20 space-y-2">
            <h4 className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clear all accounting records, customers, and transactions to start fresh.
            </p>
            <button
              onClick={() => setShowResetWarning(true)}
              className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('resetData')}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: DIAGNOSTICS & VERIFICATION (Section 16) */}
      {activeTab === 'diagnostics' && (
        <DiagnosticTestSuite />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">{t('resetData')}</h3>
              <p className="text-xs text-rose-300 leading-relaxed">
                {t('confirmResetMsg')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetWarning(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={async () => {
                  await resetAllData();
                  setShowResetWarning(false);
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
