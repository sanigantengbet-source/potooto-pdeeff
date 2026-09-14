'use client';

import React from 'react';
import { ShieldCheck, Sparkles, FileText } from 'lucide-react';
import { PdfToolId } from '@/lib/pdf-tools/types';
import { PdfToolIcon } from './PdfToolIcons';

interface PdfProcessingModalProps {
  isOpen: boolean;
  toolName: string;
  toolId: PdfToolId;
  progress: { percent: number; stage: string };
  fileName?: string;
}

export const PdfProcessingModal: React.FC<PdfProcessingModalProps> = ({
  isOpen,
  toolName,
  toolId,
  progress,
  fileName,
}) => {
  if (!isOpen) return null;

  const percent = Math.max(0, Math.min(100, Math.round(progress.percent || 0)));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-md transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-processing-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white/95 p-6 sm:p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur-xl text-center space-y-5"
        id="pdf-processing-dialog-content"
      >
        {/* Modern Orbital Progress Indicator */}
        <div className="relative flex justify-center items-center">
          <div className="relative h-28 w-28 flex items-center justify-center">
            {/* Background decorative soft glow */}
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
                <PdfToolIcon toolId={toolId} size={18} />
              </div>
              <span className="text-xs font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3
            id="pdf-processing-title"
            className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Memproses {toolName}
          </h3>

          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 min-h-[1.25rem] truncate px-2">
            {progress.stage || 'Menyiapkan dokumen dan konfigurasi...'}
          </p>

          {fileName && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 max-w-full truncate">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
        </div>

        {/* Precision Progress Bar */}
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

        {/* Privacy Note */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>100% Client-Side • Berkas Anda tidak diunggah ke server</span>
        </div>
      </div>
    </div>
  );
};
