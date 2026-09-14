'use client';

import React from 'react';
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  Check,
  Download,
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
  const percent = Math.min(100, Math.max(0, Math.round(progress.progress ?? 0)));

  // 1. ERROR STATE - Bersih, Tenang, dan Jelas
  if (isError || progress.status === 'error') {
    return (
      <div
        className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-center space-y-5"
        id="bg-remover-error-view"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Gagal Memproses Gambar
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Terjadi kendala saat memuat model AI atau memproses file.
          </p>
          {errorMessage && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200/70 dark:border-rose-900/40 font-mono text-left break-all">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] rounded-lg transition-colors"
              id="btn-retry-model"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Coba Lagi</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            id="btn-cancel-error"
          >
            <span>Pilih Foto Lain</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. FIRST-TIME MODEL INITIALIZATION - Bersih, Minimalis & Profesional
  if (isFirstTimeLoading) {
    return (
      <div
        className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-center space-y-5"
        id="bg-remover-first-time-loading"
      >
        {/* Minimal Icon */}
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
          <Download className="h-5 w-5" />
        </div>

        {/* Headline & Description */}
        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Menyiapkan Model AI
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Mengunduh model segmentasi (~30 MB) ke memori browser. Hanya perlu dilakukan sekali.
          </p>
        </div>

        {/* Clean Progress Bar */}
        <div className="w-full max-w-xs mx-auto space-y-2">
          <div className="flex justify-between items-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span>Mengunduh komponen...</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">{percent}%</span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-600 dark:bg-violet-500 transition-all duration-200 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          {progress.detail && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate">
              {progress.detail}
            </p>
          )}
        </div>

        {/* Cancel Action */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            id="btn-cancel-model-prep"
          >
            Batalkan Proses
          </button>
        </div>
      </div>
    );
  }

  // 3. ACTIVE PROCESSING STATE - Bersih, Tenang & Elegan
  const currentStage = progress.stage ?? 'preparing-image';

  return (
    <div
      className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-center space-y-5"
      id="bg-remover-processing-view"
    >
      {/* Clean Image Thumbnail */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-2xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourcePreviewUrl}
          alt="Foto yang sedang diproses"
          className="h-full w-full object-cover select-none"
        />

        {/* Minimal Subtle Spinner Badge */}
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-white/90 dark:bg-zinc-900/90 shadow-xs flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
          </div>
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {currentStage === 'using-cached-model'
            ? 'Memuat model dari cache...'
            : currentStage === 'preparing-image'
            ? 'Menyiapkan gambar...'
            : currentStage === 'removing-bg'
            ? 'Menghapus latar belakang...'
            : currentStage === 'finalizing'
            ? 'Menyusun transparansi piksel...'
            : currentStage === 'done'
            ? 'Selesai!'
            : progress.message || 'Memproses gambar...'}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {currentStage === 'removing-bg'
            ? 'AI sedang memetakan subjek dan objek foto secara presisi.'
            : currentStage === 'finalizing'
            ? 'Menyempurnakan tepi dan resolusi transparan.'
            : 'Diproses langsung di perangkat Anda tanpa upload ke server.'}
        </p>
      </div>

      {/* Clean Minimal Indeterminate Progress Bar */}
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
          <div className="h-full w-2/5 rounded-full bg-violet-600 dark:bg-violet-500 animate-indeterminate" />
        </div>
      </div>

      {/* Clean Subtle Step Indicator */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
        {/* Step 1 */}
        <span
          className={`flex items-center gap-1 transition-colors ${
            currentStage === 'preparing-image'
              ? 'text-violet-600 dark:text-violet-400 font-semibold'
              : currentStage === 'removing-bg' ||
                currentStage === 'finalizing' ||
                currentStage === 'done'
              ? 'text-zinc-700 dark:text-zinc-300 font-medium'
              : ''
          }`}
        >
          {currentStage === 'removing-bg' ||
          currentStage === 'finalizing' ||
          currentStage === 'done' ? (
            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
          <span>1. Persiapan</span>
        </span>

        <span className="text-zinc-300 dark:text-zinc-700">•</span>

        {/* Step 2 */}
        <span
          className={`flex items-center gap-1 transition-colors ${
            currentStage === 'removing-bg'
              ? 'text-violet-600 dark:text-violet-400 font-semibold'
              : currentStage === 'finalizing' || currentStage === 'done'
              ? 'text-zinc-700 dark:text-zinc-300 font-medium'
              : ''
          }`}
        >
          {currentStage === 'finalizing' || currentStage === 'done' ? (
            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
          <span>2. Segmentasi AI</span>
        </span>

        <span className="text-zinc-300 dark:text-zinc-700">•</span>

        {/* Step 3 */}
        <span
          className={`flex items-center gap-1 transition-colors ${
            currentStage === 'finalizing'
              ? 'text-violet-600 dark:text-violet-400 font-semibold'
              : currentStage === 'done'
              ? 'text-zinc-700 dark:text-zinc-300 font-medium'
              : ''
          }`}
        >
          {currentStage === 'done' ? (
            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
          <span>3. Transparansi</span>
        </span>
      </div>

      {/* Cancel Button */}
      {currentStage !== 'done' && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            id="btn-cancel-processing"
          >
            Batalkan Proses
          </button>
        </div>
      )}
    </div>
  );
};
