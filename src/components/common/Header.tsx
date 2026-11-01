/**
 * Application Top Header with Shop Branding, Language Toggle, Theme Toggle, and Settings
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Globe, CheckCircle2, Sun, Moon, Settings as SettingsIcon, Cloud, CloudOff, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenApkGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    settings,
    setLanguage,
    language,
    t,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    currentUser,
    userPhone,
    logout,
    openAuthModal,
    isSyncing
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 select-none">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2.5">
        {/* Brand & Shop Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-emerald-400 font-black text-xs sm:text-sm tracking-tighter">ZH</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight tracking-tight truncate">
              {language === 'ur' ? settings.shopNameUrdu : settings.shopName}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 mt-0.5">
              <span className="truncate">{t('appName')}</span>
              {currentUser && (
                <>
                  <span className="text-slate-600">·</span>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={openAuthModal}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      title={`Synced: ${userPhone || currentUser.email}`}
                    >
                      <Cloud className={`w-3 h-3 ${isSyncing ? 'animate-pulse' : ''}`} />
                      <span className="font-mono">{userPhone || 'Synced'}</span>
                    </button>
                    <button
                      onClick={logout}
                      className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-1 py-0.5 rounded transition cursor-pointer"
                      title={language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}
                    >
                      <LogOut className="w-2.5 h-2.5" />
                      <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls: Exactly 3 buttons (Language, Theme, Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Language Toggle (Urdu / English) */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition active:scale-95 cursor-pointer"
            title={language === 'en' ? 'Switch to Urdu (اردو)' : 'Switch to English (EN)'}
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] sm:text-xs font-medium">{language === 'en' ? 'اردو' : 'EN'}</span>
          </button>

          {/* 2. Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition active:scale-95 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode (☀️)' : 'Switch to Dark Mode (🌙)'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] sm:text-xs font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-[11px] sm:text-xs font-medium">Dark</span>
              </>
            )}
          </button>

          {/* 3. Settings in top-right corner as small gear icon */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 sm:p-2 rounded-lg transition active:scale-95 cursor-pointer border ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
            }`}
            title={t('navSettings')}
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
