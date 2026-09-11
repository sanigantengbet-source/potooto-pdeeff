'use client';

import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';

interface ProcessingDialogProps {
  isOpen: boolean;
  progress: number;
  stage: string;
}

export const ProcessingDialog: React.FC<ProcessingDialogProps> = ({
  isOpen,
  progress,
  stage,
}) => {
  if (!isOpen) return null;

  const percent = Math.max(0, Math.min(100, Math.round(progress || 0)));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-md transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white/95 p-6 sm:p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur-xl transition-all text-center space-y-5">
        {/* Modern Orbital Progress Indicator */}
        <div className="relative flex justify-center items-center">
          <div className="relative h-28 w-28 flex items-center justify-center">
            {/* Background decorative soft container */}
            <div className="absolute inset-2 rounded-full bg-zinc-100 dark:bg-zinc-800/80 -z-10" />

            {/* SVG Circular Ring */}
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 96 96">
              {/* Track */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-zinc-200/70 dark:stroke-zinc-800"
                strokeWidth="5"
                fill="transparent"
              />
              {/* Animated Progress Bar */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-zinc-900 dark:stroke-zinc-100 transition-all duration-300 ease-out"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
              />
            </svg>

            {/* Center Icon & Percentage Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 shadow-2xs text-zinc-900 dark:text-zinc-100 mb-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
                {percent}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <h3
            id="processing-title"
            className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Membuat Dokumen PDF
          </h3>

          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 min-h-[1.25rem] truncate px-2">
            {stage || 'Menyiapkan gambar dan lembar dokumen...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-1.5 pt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-200 ease-out rounded-full"
              style={{ width: `${Math.max(4, percent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400">
            <span>Operasi Lokal</span>
            <span className="font-mono">{percent} / 100%</span>
          </div>
        </div>

        {/* Local processing confirmation */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Diproses 100% langsung di peramban Anda</span>
        </div>
      </div>
    </div>
  );
};
