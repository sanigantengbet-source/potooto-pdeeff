'use client';

import React from 'react';
import {
  Cpu,
  Zap,
  Loader2,
  ShieldCheck,
  XCircle,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  HardDriveDownload,
} from 'lucide-react';
import { ModelProgress } from '@/lib/background-remover/types';

interface ProcessingViewProps {
  progress: ModelProgress;
  sourcePreviewUrl: string;
  onCancel: () => void;
  onRetry?: () => void;
  isError?: boolean;
  errorMessage?: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  progress,
  sourcePreviewUrl,
  onCancel,
  onRetry,
  isError = false,
  errorMessage,
}) => {
  const isFirstTimeLoading =
    progress.isFirstTime && progress.stage === 'preparing-model';
  const isCachedLoading = progress.stage === 'using-cached-model';
  const percent = Math.min(100, Math.max(0, progress.progress ?? 0));

  // 1. ERROR STATE
  if (isError || progress.status === 'error') {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 sm:p-10 w-full max-w-lg mx-auto text-center space-y-6 rounded-2xl border border-rose-200/90 bg-white dark:border-rose-900/60 dark:bg-zinc-900/95 shadow-sm"
        id="bg-remover-error-view"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Model gagal dipersiapkan.
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Silakan coba lagi.
          </p>
          {errorMessage && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] rounded-xl shadow-xs transition-colors"
              id="btn-retry-model"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            id="btn-cancel-error"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Pilih Foto Lain</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. FIRST-TIME MODEL LOADING STATE
  if (isFirstTimeLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 sm:p-10 w-full max-w-lg mx-auto text-center space-y-6 rounded-2xl border border-violet-200/90 bg-white dark:border-violet-900/50 dark:bg-zinc-900/95 shadow-sm"
        id="bg-remover-first-time-loading"
      >
        {/* Animated Model Prep Graphic */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          <HardDriveDownload className="h-7 w-7 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-violet-600" />
          </span>
        </div>

        {/* Title & Explanatory Quote */}
        <div className="space-y-2.5 max-w-md">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Preparing Background Remover
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic bg-violet-50/60 dark:bg-violet-950/30 p-3 rounded-xl border border-violet-100 dark:border-violet-900/40">
            «Model AI sedang dipersiapkan untuk pertama kali. Setelah tersimpan di cache browser, penggunaan berikutnya akan lebih cepat.»
          </p>
        </div>

        {/* Real Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600 dark:text-violet-400" />
              <span>Preparing model...</span>
            </span>
            <span className="font-mono font-bold text-violet-700 dark:text-violet-400">
              {percent}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-200 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>

          {progress.detail && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-sm mx-auto">
              {progress.detail}
            </p>
          )}
        </div>

        {/* Runtime Detection Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {progress.webgpuAvailable && !progress.fallbackTriggered ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>WebGPU acceleration detected</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
              <Cpu className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>WebGPU unavailable • Using WASM fallback</span>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          id="btn-cancel-model-prep"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Batalkan Proses</span>
        </button>
      </div>
    );
  }

  // 3. CACHED MODEL LOADING / PROCESSING STATE
  const currentStage = progress.stage ?? 'preparing-image';

  return (
    <div
      className="flex flex-col items-center justify-center p-6 sm:p-10 w-full max-w-lg mx-auto text-center space-y-6 rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/95 shadow-sm"
      id="bg-remover-processing-view"
    >
      {/* Thumbnail with subtle scan effect */}
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
        <img
          src={sourcePreviewUrl}
          alt="Foto yang sedang diproses"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent animate-pulse" />
      </div>

      {/* Main Status */}
      <div className="space-y-2 w-full">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
          {currentStage === 'done' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          <span>
            {currentStage === 'using-cached-model'
              ? 'Using cached model'
              : currentStage === 'preparing-image'
              ? 'Preparing image...'
              : currentStage === 'removing-bg'
              ? 'Removing background...'
              : currentStage === 'finalizing'
              ? 'Finalizing...'
              : currentStage === 'done'
              ? '✓ Background removed'
              : progress.message || 'Memproses gambar...'}
          </span>
        </div>

        {/* Sequential Step Badges */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
          <div
            className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
              currentStage === 'preparing-image'
                ? 'border-violet-300 bg-violet-50 text-violet-800 font-semibold dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
                : currentStage === 'removing-bg' ||
                  currentStage === 'finalizing' ||
                  currentStage === 'done'
                ? 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400'
                : 'border-zinc-100 bg-zinc-50/50 text-zinc-400 dark:border-zinc-800/40 dark:bg-zinc-900/40'
            }`}
          >
            1. Prep Image
          </div>

          <div
            className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
              currentStage === 'removing-bg'
                ? 'border-violet-300 bg-violet-50 text-violet-800 font-semibold dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
                : currentStage === 'finalizing' || currentStage === 'done'
                ? 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400'
                : 'border-zinc-100 bg-zinc-50/50 text-zinc-400 dark:border-zinc-800/40 dark:bg-zinc-900/40'
            }`}
          >
            2. Remove BG
          </div>

          <div
            className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
              currentStage === 'finalizing'
                ? 'border-violet-300 bg-violet-50 text-violet-800 font-semibold dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
                : currentStage === 'done'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-zinc-100 bg-zinc-50/50 text-zinc-400 dark:border-zinc-800/40 dark:bg-zinc-900/40'
            }`}
          >
            3. Finalizing
          </div>
        </div>
      </div>

      {/* Hardware & Cache Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
        {progress.webgpuAvailable && !progress.fallbackTriggered ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
            <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>WebGPU acceleration detected</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            <Cpu className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
            <span>WebGPU unavailable • Using WASM fallback</span>
          </div>
        )}

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
          <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Local Memory</span>
        </div>
      </div>

      {/* Cancel Button */}
      {currentStage !== 'done' && (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          id="btn-cancel-processing"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Batalkan Proses</span>
        </button>
      )}
    </div>
  );
};
