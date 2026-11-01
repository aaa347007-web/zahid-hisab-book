/**
 * Fullscreen Gatekeeper Login & Sign Up Screen for Zahid Hisab Book
 * Mobile Number + Password Firebase Authentication with Realtime Database Cloud Sync.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Cloud, 
  Lock, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Globe, 
  Sun, 
  Moon, 
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    login,
    register,
    language,
    setLanguage,
    theme,
    toggleTheme,
    settings,
    showToast
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = mobileNumber.trim();
    if (!cleanInput) {
      setError(language === 'ur' ? 'برائے مہربانی موبائل نمبر درج کریں' : 'Please enter your mobile number');
      return;
    }

    // Basic mobile validation (at least 10 digits or email format)
    const digitsOnly = cleanInput.replace(/\D/g, '');
    if (!cleanInput.includes('@') && digitsOnly.length < 10) {
      setError(language === 'ur' ? 'موبائل نمبر کم از کم 10 یا 11 ہندسوں کا ہونا چاہیے (مثلاً 03001234567)' : 'Please enter a valid mobile number (e.g. 03001234567)');
      return;
    }

    if (!password) {
      setError(language === 'ur' ? 'برائے مہربانی پاس ورڈ درج کریں' : 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError(language === 'ur' ? 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanInput, password);
        showToast(language === 'ur' ? 'کامیابی سے لاگ ان ہو گیا' : 'Logged in successfully! Loading ledger...', 'success');
      } else {
        await register(cleanInput, password);
        showToast(language === 'ur' ? 'اکاؤنٹ بن گیا اور کلاؤڈ سنک فعال ہو گیا' : 'Account created and online cloud sync activated!', 'success');
      }
    } catch (err: any) {
      console.warn('Authentication error:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = language === 'ur' ? 'موبائل نمبر یا پاس ورڈ غلط ہے' : 'Invalid mobile number or password';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'ur' ? 'یہ موبائل نمبر پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں' : 'This mobile number is already registered. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        msg = language === 'ur' ? 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے' : 'Password should be at least 6 characters';
      } else if (err.code === 'auth/api-key-not-valid') {
        msg = language === 'ur' ? 'Firebase API Key کی تصدیق نہیں ہو سکی' : 'Firebase API key validation error';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-x-hidden">
      {/* Decorative Background Lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language and Theme Controls */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-950/40 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-emerald-400 font-black text-xs">ZH</span>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold text-white leading-none">
              {language === 'ur' ? settings.shopNameUrdu : settings.shopName}
            </h2>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">
              {language === 'ur' ? 'آن لائن فائر بیس ڈیٹا بیس' : 'Google Firebase Cloud'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">{language === 'en' ? 'اردو' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-2">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
          
          {/* Card Header Branding */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-inner">
              <Cloud className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {language === 'ur' ? 'زاہد حساب بک' : 'Zahid Hisab Book'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {language === 'ur'
                ? 'اپنے موبائل نمبر اور پاس ورڈ سے لاگ ان کریں تاکہ تمام حساب کتاب آن لائن کلاؤڈ پر محفوظ رہے۔'
                : 'Log in with your mobile number to access and keep your shop ledger permanently synced.'}
            </p>
          </div>

          {/* Mode Selector Tabs (Login vs Register) */}
          <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{language === 'ur' ? 'لاگ ان (Login)' : 'Log In'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{language === 'ur' ? 'نیا اکاؤنٹ (Sign Up)' : 'Sign Up'}</span>
            </button>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="flex-1 leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input 1: Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {language === 'ur' ? 'موبائل نمبر (Mobile Number)' : 'Mobile Number'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                  <Smartphone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter mobile number"
                  required
                  autoFocus
                  autoComplete="tel"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner font-mono tracking-wide"
                />
              </div>
              <p className="text-[10px] text-slate-500 pl-1">
                {language === 'ur' ? 'مثال: 03001234567 یا 0301-7654321' : 'Example: 03001234567'}
              </p>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {language === 'ur' ? 'پاس ورڈ (Password)' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 pl-1">
                {language === 'ur' ? 'کم از کم 6 ہندسے یا حروف' : 'At least 6 characters'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-950/60 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'ur' ? 'فائر بیس کنیکٹ ہو رہا ہے...' : 'Connecting to Firebase...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? (language === 'ur' ? 'لاگ ان کریں' : 'Log In to Account')
                      : (language === 'ur' ? 'اکاؤنٹ بنائیں اور کلاؤڈ سنک آن کریں' : 'Create Account & Enable Cloud Sync')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Cloud Security Benefits Highlights */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'فائر بیس کلاؤڈ کے فوائد:' : 'Google Firebase Features:'}</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 pl-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  {language === 'ur'
                    ? 'ایپ ان انسٹال یا موبائل تبدیل ہونے پر سارا ڈیٹا واپس مل جائے گا۔'
                    : 'All shop accounts and transactions are preserved if reinstalled or switching phones.'}
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  {language === 'ur'
                    ? 'کسٹمر کھاتہ، کیش، ایزی پیسہ، جاز کیش اور کمیشن خودکار سنک ہوتا ہے۔'
                    : 'Customer khata, cash in hand, digital wallets, and commissions sync in real time.'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center z-10 pt-2 pb-1 text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} Zahid Mobiles & Photo State · Zahid Hisab Book</p>
      </footer>
    </div>
  );
};
