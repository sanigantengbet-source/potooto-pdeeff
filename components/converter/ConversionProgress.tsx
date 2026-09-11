'use client';

import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
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

  const cleanPercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercent / 100) * circumference;

  return (
    <div
      className="rounded-2xl border border-zinc-200/90 bg-white/95 p-6 sm:p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur-xl text-center space-y-4"
      id="conversion-progress-modal"
    >
      <div className="relative flex justify-center items-center">
        <div className="relative h-24 w-24 flex items-center justify-center">
          <div className="absolute inset-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 -z-10" />
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-zinc-200/70 dark:stroke-zinc-800"
              strokeWidth="4.5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-zinc-900 dark:stroke-zinc-100 transition-all duration-300 ease-out"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Cpu className="h-4 w-4 text-zinc-600 dark:text-zinc-300 mb-0.5" />
            <span className="text-[11px] font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {cleanPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {status === 'READING' ? 'Membaca Berkas...' : 'Mengonversi Dokumen...'}
        </h4>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 min-h-[1.25rem] truncate px-2">
          {stageText || 'Memproses berkas...'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-1.5 pt-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.max(4, cleanPercent)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-zinc-400">
          <span>Proses di Peramban</span>
          <span className="font-mono">{cleanPercent}%</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>100% Client-Side Engine • Berkas Aman & Privat</span>
      </div>
    </div>
  );
};
