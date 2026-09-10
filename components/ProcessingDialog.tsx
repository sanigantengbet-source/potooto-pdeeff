'use client';

import React from 'react';
import { Loader2, ShieldCheck, FileText } from 'lucide-react';

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        <div className="flex flex-col items-center text-center">
          {/* Animated Spinner Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-800 dark:text-zinc-200" />
          </div>

          <h3
            id="processing-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Creating PDF — {progress}%
          </h3>

          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-[260px] truncate">
            {stage || 'Preparing images...'}
          </p>

          {/* Progress Bar */}
          <div className="mt-5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 h-2">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-200 ease-out"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>

          {/* Local processing confirmation */}
          <div className="mt-5 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Processing directly inside your browser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
