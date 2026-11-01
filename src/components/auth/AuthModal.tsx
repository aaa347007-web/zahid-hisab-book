/**
 * Firebase Authentication Modal (Email/Password Login, Register, Sync Status, and Logout)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Cloud, 
  Lock, 
  Mail, 
  Smartphone,
  CheckCircle2, 
  AlertCircle, 
  X, 
  LogOut, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  KeyRound,
  ExternalLink,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig,
  isFirebaseApiKeyValid,
  resetAndReinitFirebase
} from '../../db/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userPhone,
    login,
    register,
    logout,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
    language,
    showToast
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced Config state (allows updating API key if user has full key)
  const [customApiKey, setCustomApiKey] = useState(() => getStoredFirebaseConfig().apiKey);
  const [showConfigEditor, setShowConfigEditor] = useState(() => !isFirebaseApiKeyValid(getStoredFirebaseConfig().apiKey));
  const [configSaved, setConfigSaved] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isKeyValid = isFirebaseApiKeyValid(customApiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If key is truncated or invalid, guide user immediately
    if (!isKeyValid) {
      setError(
        language === 'ur'
          ? 'Firebase API Key ادھوری ہے۔ براہ کرم اوپر دیئے گئے خانے میں اپنی مکمل 39 ہندسوں کی Web API Key درج کریں، یا نیچے سے آف لائن موڈ استعمال کریں۔'
          : 'Firebase API Key is incomplete ("AIzaSyBwbZnvso..."). Please enter your complete 39-character Web API Key above, or continue with Offline Mode.'
      );
      setShowConfigEditor(true);
      return;
    }

    if (!mobileNumber.trim() || !password) {
      setError(language === 'ur' ? 'برائے مہربانی موبائل نمبر اور پاس ورڈ درج کریں' : 'Please enter mobile number and password');
      return;
    }

    if (password.length < 6) {
      setError(language === 'ur' ? 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(mobileNumber.trim(), password);
        showToast(language === 'ur' ? 'کامیابی سے لاگ ان ہو گیا' : 'Logged in successfully', 'success');
      } else {
        await register(mobileNumber.trim(), password);
        showToast(language === 'ur' ? 'نیا اکاؤنٹ بن گیا اور کلاؤڈ سنک فعال ہو گیا' : 'Account created & cloud sync active', 'success');
      }
      onClose();
    } catch (err: any) {
      console.warn('Firebase Auth Handler:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = language === 'ur' ? 'غلط ای میل یا پاس ورڈ' : 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'ur' ? 'یہ ای میل پہلے سے رجسٹرڈ ہے، براہ کرم لاگ ان کریں' : 'Email already in use, please login';
      } else if (err.code === 'auth/invalid-email') {
        msg = language === 'ur' ? 'درست ای میل درج کریں' : 'Invalid email address format';
      } else if (err.code === 'auth/api-key-not-valid' || msg.includes('API key') || msg.includes('api-key-not-valid')) {
        msg = language === 'ur' 
          ? 'Firebase API Key ادھوری یا غلط ہے۔ براہ کرم فائر بیس کنسول سے 39 ہندسوں کی مکمل کی درج کریں۔' 
          : 'Firebase Web API Key is invalid or truncated. Please paste your complete 39-character key from Firebase Console.';
        setShowConfigEditor(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    setApiKeyError(null);
    const trimmed = customApiKey.trim();
    if (!trimmed) {
      setApiKeyError(language === 'ur' ? 'براہ کرم API Key درج کریں' : 'Please enter an API Key');
      return;
    }
    if (trimmed.includes('...') || trimmed.endsWith('.')) {
      setApiKeyError(language === 'ur' ? 'یہ کی ادھوری ہے (... کو ہٹا کر مکمل کی درج کریں)' : 'Key is truncated. Please remove "..." and paste complete key.');
      return;
    }
    if (!trimmed.startsWith('AIzaSy')) {
      setApiKeyError(language === 'ur' ? 'فائر بیس کی "AIzaSy" سے شروع ہونی چاہیے' : 'Firebase Web API Key must start with "AIzaSy"');
      return;
    }
    if (trimmed.length < 35 || trimmed.length > 45) {
      setApiKeyError(language === 'ur' ? `کی میں 39 ہندسے ہونے چاہئیں (ابھی ${trimmed.length} ہیں)` : `Key should be ~39 characters (currently ${trimmed.length})`);
      return;
    }

    try {
      await resetAndReinitFirebase(trimmed);
      saveStoredFirebaseConfig({ apiKey: trimmed });
      setConfigSaved(true);
      setError(null);
      showToast(language === 'ur' ? 'Firebase API Key کامیابی سے محفوظ ہو گئی' : 'Firebase API Key saved & reinitialized successfully', 'success');
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (e: any) {
      setApiKeyError(e.message || 'Error saving API key');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {language === 'ur' ? 'گوگل فائر بیس کلاؤڈ سنک' : 'Firebase Cloud Sync & Auth'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ur' ? 'ایپ ڈیلیٹ ہونے پر بھی ڈیٹا محفوظ رہے گا' : 'Safe cloud persistence across devices'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'ur' ? 'آن لائن سنک فعال ہے' : 'Cloud Sync Active'}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium font-mono break-all">{userPhone || currentUser.email}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">UID: {currentUser.uid}</p>
                <p className="text-[11px] text-emerald-300 mt-2">
                  {language === 'ur' 
                    ? 'تمام حساب کتاب خودکار طور پر فائر بیس ڈیٹا بیس میں محفوظ ہو رہا ہے' 
                    : 'All accounts, transactions, and customer khata are synced to Firebase Realtime Database'}
                </p>
                {lastSyncedAt && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ur' ? 'آخری سنک:' : 'Last Synced:'} {new Date(lastSyncedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await syncWithCloud();
                    showToast(language === 'ur' ? 'کلاؤڈ سے تازہ ڈیٹا سنک ہو گیا' : 'Cloud sync completed successfully', 'success');
                  }}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSyncing ? (language === 'ur' ? 'سنک ہو رہا ہے...' : 'Syncing...') : (language === 'ur' ? 'ابھی سنک کریں' : 'Sync Now')}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    showToast(language === 'ur' ? 'لاگ آؤٹ ہو گیا' : 'Logged out', 'info');
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login / Register Form */
            <div>
              {/* API Key Status / Truncation Warning */}
              {!isKeyValid ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-300">
                        {language === 'ur' ? '⚠️ فائر بیس API Key نامکمل ہے (39 ہندسے درکار ہیں)' : '⚠️ Firebase Web API Key Incomplete (Action Required)'}
                      </p>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        {language === 'ur' 
                          ? 'آپ کی فراہم کردہ کی "AIzaSyBwbZnvso..." میں صرف 17 ہندسے ہیں (... کے ساتھ ادھوری ہے)۔ اصل گوگل فائر بیس کی 39 ہندسوں کی ہوتی ہے۔'
                          : 'The provided API key ("AIzaSyBwbZnvso...") is truncated (17 characters with "..."). A full Google Web API Key has 39 characters.'}
                      </p>
                    </div>
                  </div>

                  {/* Direct API Key Input Field */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-semibold text-amber-300">
                      {language === 'ur' ? 'مکمل Web API Key یہاں پیسٹ کریں:' : 'Paste Complete Web API Key Here:'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={customApiKey}
                        onChange={(e) => {
                          setCustomApiKey(e.target.value);
                          setApiKeyError(null);
                        }}
                        placeholder="AIzaSy... (39 characters from Firebase Console)"
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-amber-500/40 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    {apiKeyError && (
                      <p className="text-[11px] text-rose-400 font-medium">{apiKeyError}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'ur' ? 'API Key محفوظ کریں' : 'Save & Connect'}</span>
                      </button>

                      <a
                        href="https://console.firebase.google.com/project/pubg-tournmenrnt/settings/general"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-amber-300 hover:text-amber-200 underline flex items-center gap-1 shrink-0"
                      >
                        <span>{language === 'ur' ? 'فائر بیس کنسول کھولیں' : 'Firebase Console'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {configSaved && (
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        {language === 'ur' ? '✓ کی کامیابی سے محفوظ ہو گئی!' : '✓ Valid Key Saved! Ready to login.'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-[11px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? 'فائر بیس API Key کنفیگر ہے' : 'Firebase Web API Key Configured'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfigEditor(!showConfigEditor)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      {showConfigEditor ? 'Hide' : 'Change Key'}
                    </button>
                  </div>

                  {showConfigEditor && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800">
                      <input
                        type="text"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleSaveApiKey}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] rounded font-medium cursor-pointer"
                        >
                          Update Key
                        </button>
                        {configSaved && <span className="text-[10px] text-emerald-400">Saved!</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    mode === 'login' 
                      ? 'bg-emerald-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'لاگ ان (Login)' : 'Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    mode === 'register' 
                      ? 'bg-emerald-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'نیا اکاؤنٹ (Register)' : 'Sign Up'}
                </button>
              </div>

              {error && (
                <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'ur' ? 'موبائل نمبر (Mobile Number)' : 'Mobile Number'}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      autoComplete="tel"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'ur' ? 'پاس ورڈ (کم از کم 6 ہندسے)' : 'Password (min. 6 characters)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>
                    {loading
                      ? (language === 'ur' ? 'جاری ہے...' : 'Please wait...')
                      : mode === 'login'
                      ? (language === 'ur' ? 'لاگ ان کریں' : 'Log In to Account')
                      : (language === 'ur' ? 'اکاؤنٹ بنائیں اور سنک کریں' : 'Create Account & Enable Cloud Sync')}
                  </span>
                </button>
              </form>

              {/* Informative Note */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'مستقل آن لائن ریکارڈ' : 'Permanent Online Record'}</span>
                </div>
                <p>
                  {language === 'ur'
                    ? 'آپ کا تمام ڈیٹا فائر بیس پر path users/{uid}/hisab پر خودکار محفوظ ہو گا۔ موبائل تبدیل کرنے یا ایپ ان انسٹال ہونے پر لاگ ان کریں اور ڈیٹا واپس مل جائے گا۔'
                    : 'Data is securely saved to Firebase Realtime Database at users/{uid}/hisab. Reinstalling or switching phones will restore everything instantly upon login.'}
                </p>
              </div>

              {/* Continue in Offline Mode button */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast(
                      language === 'ur' 
                        ? 'آف لائن موڈ فعال ہے: تمام حساب کتاب اس ڈیوائس پر محفوظ ہو رہا ہے' 
                        : 'Offline mode active: All shop ledger data is stored securely on this device',
                      'info'
                    );
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {language === 'ur' 
                      ? 'آف لائن موڈ جاری رکھیں (لوکل محفوظ)' 
                      : 'Continue in Offline Mode (Device Local)'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
