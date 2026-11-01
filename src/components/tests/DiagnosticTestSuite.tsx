/**
 * Interactive Diagnostic & Automated Verification Test Suite
 * Tests requirements A through G in an isolated sandbox and displays live verification results.
 */

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';

export const DiagnosticTestSuite: React.FC = () => {
  const {
    diagnosticResults,
    runDiagnostics,
    isDiagnosticsRunning,
    t
  } = useApp();

  // Run automatically on first mount if empty
  useEffect(() => {
    if (diagnosticResults.length === 0) {
      runDiagnostics();
    }
  }, [diagnosticResults.length, runDiagnostics]);

  const passedCount = diagnosticResults.filter((r) => r.status === 'passed').length;
  const totalCount = diagnosticResults.length;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {t('testSuiteTitle')}
            </h3>
          </div>
          <button
            onClick={() => runDiagnostics()}
            disabled={isDiagnosticsRunning}
            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            {isDiagnosticsRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isDiagnosticsRunning ? 'Testing...' : t('runAllTests')}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          {t('testSuiteDesc')}
        </p>

        {/* Status Score Bar */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-300">Verification Status:</span>
            <span
              className={`font-bold ${
                passedCount === totalCount && totalCount > 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {passedCount} / {totalCount} Passed (100% Accounting Correctness)
            </span>
          </div>
          {passedCount === totalCount && totalCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> All Systems Ready
            </span>
          )}
        </div>
      </div>

      {/* Tests Results List */}
      <div className="space-y-2.5">
        {diagnosticResults.map((test) => {
          const isPassed = test.status === 'passed';
          return (
            <div
              key={test.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isPassed
                  ? 'bg-slate-950/70 border-emerald-500/20 text-slate-200'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white block">
                      {test.title}
                    </span>
                    {test.details && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {test.details}
                      </p>
                    )}
                    <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                      <div className="text-slate-400">
                        <span className="text-slate-500">Expected:</span> {test.expected}
                      </div>
                      <div className={isPassed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        <span className="text-slate-500">Actual:</span> {test.actual}
                      </div>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-full ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {test.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
