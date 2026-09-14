'use client';

import React from 'react';
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Cpu,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { ModelProgress } from '@/lib/background-remover/types';

interface ProcessingViewProps {
  progress: ModelProgress;
  sourcePreviewUrl: string;
  onCancel: () => void;
  onRetry: () => void;
  isError: boolean;
  errorMessage?: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  progress,
  sourcePreviewUrl,
  onCancel,
  onRetry,
  isError,
  errorMessage,
}) => {
  const percent = Math.max(0, Math.min(100, Math.round(progress.progress ?? 0)));

  return (
    <div
      className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-xs space-y-6"
      id="bg-remover-processing-view"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
            <img
              src={sourcePreviewUrl}
              alt="Source preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isError ? 'Gagal Memproses Gambar' : 'Menghapus Latar Belakang AI'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isError
                ? 'Terjadi kendala saat memproses gambar di peramban.'
                : progress.message || 'Mempersiapkan model AI...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {progress.runtime && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {progress.runtime === 'webgpu' ? (
                <>
                  <Zap className="h-3 w-3 text-amber-500" />
                  WebGPU Akselerasi
                </>
              ) : (
                <>
                  <Cpu className="h-3 w-3 text-blue-500" />
                  WASM CPU Engine
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {isError ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-900 dark:text-red-200">
                Terjadi Kesalahan
              </p>
              <p className="leading-relaxed">
                {errorMessage ||
                  progress.detail ||
                  'Model tidak dapat menyelesaikan inferensi. Silakan coba lagi.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors"
              id="bg-remover-cancel-btn"
            >
              <X className="h-3.5 w-3.5" />
              Batal / Pilih Foto Lain
            </button>
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors shadow-xs"
              id="bg-remover-retry-btn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Coba Lagi
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-100" />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                <Sparkles className="h-3 w-3" />
              </div>
            </div>

            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {progress.message || 'Memproses isolasi latar belakang...'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {progress.detail ||
                  'Jaringan saraf tiruan sedang menganalisis subjek dan memisahkan latar belakang.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span>Status Pengerjaan</span>
              <span>{percent > 0 ? `${percent}%` : 'Menganalisis...'}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(6, percent)}%` }}
              />
            </div>
          </div>

          {progress.isFirstTime && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="leading-relaxed">
                Pengunduhan pertama kali bobot model (~40MB). Setelah tersimpan di cache lokal peramban, proses berikutnya berjalan instan.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Privasi 100% aman: Diproses langsung di RAM peramban Anda</span>
            </div>

            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              id="bg-remover-cancel-processing-btn"
            >
              <X className="h-3.5 w-3.5" />
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
