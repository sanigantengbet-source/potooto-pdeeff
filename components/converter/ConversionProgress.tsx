'use client';

import React from 'react';
import { Loader2, ShieldCheck, Cpu } from 'lucide-react';
import { ConversionStatus } from '@/lib/converters/types';

interface ConversionProgressProps {
  status: ConversionStatus;
  stageText: string;
  percent: number;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  status,
  stageText,
  percent,
}) => {
  if (status !== 'READING' && status !== 'PROCESSING') {
    return null;
  }

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/80 text-center space-y-4"
      id="conversion-progress-modal"
    >
      <div className="flex justify-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      </div>

      <div>
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {status === 'READING' ? 'Reading File...' : 'Converting Document...'}
        </h4>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {stageText || 'Processing data...'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <span>Processing in browser</span>
          <span>{percent > 0 ? `${percent}%` : 'Working...'}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>100% Client-Side Engine • Private & Secure</span>
      </div>
    </div>
  );
};
