/**
 * Android APK Build & Installation Guide Modal
 * Provides exact step-by-step instructions for compiling the debug APK with Capacitor
 * and installing it on any Android mobile phone.
 */

import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Download,
  X,
  FileCode,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t, settings } = useApp();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Build Web Assets',
      desc: 'Compile the React TypeScript applet into the production /dist bundle.',
      command: 'npm run build'
    },
    {
      title: '2. Add Android Platform (First Time)',
      desc: 'Initialize the native Android Gradle project using Capacitor CLI.',
      command: 'npx cap add android'
    },
    {
      title: '3. Sync Web Assets to Android',
      desc: 'Copy all compiled web assets and configuration into the native Android shell.',
      command: 'npx cap sync android'
    },
    {
      title: '4. Compile Debug APK',
      desc: 'Generate the installable debug APK directly using Gradle wrapper.',
      command: 'cd android && ./gradlew assembleDebug'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-y-auto select-none">
      <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t('apkGuideTitle')}
              </h2>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Capacitor Ready (com.zahidmobiles.hisabbook)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
            <p>
              This project is built with <strong>Capacitor 6</strong> and is fully configured to compile into a native Android APK for <strong>Zahid Mobiles and Photo State</strong>.
            </p>
          </div>

          {/* Compilation Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step APK Build Commands</span>
            </h3>

            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{s.title}</span>
                  <button
                    onClick={() => copyCommand(s.command, idx)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">{s.desc}</p>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  {s.command}
                </div>
              </div>
            ))}
          </div>

          {/* APK File Location & Phone Installation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-emerald-400">
              <Download className="w-4 h-4" />
              <span>Where is the APK file located?</span>
            </h4>
            <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg break-all">
              android/app/build/outputs/apk/debug/app-debug.apk
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1 leading-relaxed">
              <p><strong>To install on your Android Phone:</strong></p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Send <code className="text-white">app-debug.apk</code> to your phone via WhatsApp, USB cable, or Google Drive.</li>
                <li>Tap the file on your Android phone to open it.</li>
                <li>If prompted, enable "Allow installation from unknown sources".</li>
                <li>Tap <strong>Install</strong>. Zahid Hisab Book will install with offline storage and the custom shop icon!</li>
              </ol>
            </div>
          </div>

          {/* Instant PWA Alternative */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1.5">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Instant PWA Installation (Zero Computer Needed)</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open this web app in Google Chrome on your Android phone, tap the three dots in the top right, and tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>. It installs as a full standalone app with offline database caching!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
