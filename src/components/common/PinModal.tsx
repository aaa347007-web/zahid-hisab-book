/**
 * Security PIN Keypad & Unlock Screen
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Delete, ShieldCheck, AlertCircle } from 'lucide-react';

export const PinModal: React.FC = () => {
  const { isLocked, unlockApp, t, settings, language } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isLocked) return null;

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      const ok = await unlockApp(nextPin);
      if (!ok) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          setIsVerifying(false);
        }, 600);
      } else {
        setIsVerifying(false);
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    if (isVerifying) return;
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6">
        {/* Lock Icon */}
        <div className={`w-18 h-18 rounded-2xl flex items-center justify-center transition-all ${
          error ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-shake' : 'bg-slate-900 border border-slate-800 text-emerald-400 shadow-xl'
        }`}>
          {error ? <AlertCircle className="w-9 h-9" /> : <Lock className="w-9 h-9" />}
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {language === 'ur' ? settings.shopNameUrdu : settings.shopName}
          </h2>
          <p className="text-xs text-slate-400">
            {t('enterCurrentPin')}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-900/50'
                    : isFilled
                    ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-900/50'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium">
            {t('incorrectPin')}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              disabled={isVerifying}
              className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-2xl flex items-center justify-center transition active:scale-95 active:bg-emerald-950"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={isVerifying}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 text-xs font-semibold flex items-center justify-center transition active:scale-95"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-2xl flex items-center justify-center transition active:scale-95 active:bg-emerald-950"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isVerifying}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 flex items-center justify-center transition active:scale-95"
            aria-label="Backspace"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Safe storage guarantee */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local Encrypted Security</span>
        </div>
      </div>
    </div>
  );
};
