'use client';

import React from 'react';
import {
  CheckCircle2,
  Download,
  FileArchive,
  RefreshCw,
  FileText,
  Percent,
  ArrowRight,
} from 'lucide-react';
import { PdfToolExecutionResult } from '@/lib/pdf-tools/types';

interface PdfToolResultProps {
  result: PdfToolExecutionResult;
  onReset: () => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const PdfToolResult: React.FC<PdfToolResultProps> = ({ result, onReset }) => {
  const isMultiple = result.items.length > 1;

  const handleDownload = (itemUrl: string, itemName: string) => {
    const a = document.createElement('a');
    a.href = itemUrl;
    a.download = itemName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = () => {
    if (result.zipUrl) {
      handleDownload(result.zipUrl, `${result.toolId}-hasil.zip`);
    } else {
      // Fallback: download all sequentially
      result.items.forEach((item, index) => {
        setTimeout(() => {
          handleDownload(item.url, item.name);
        }, index * 250);
      });
    }
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all"
      id="pdf-tool-result-container"
    >
      {/* Success Badge & Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-2">
          ✓ Berhasil
        </span>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {result.title}
        </h3>

        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Dokumen Anda telah selesai diproses dengan aman di peramban.
        </p>
      </div>

      {/* Stats Banner for Compression / Reduction if available */}
      {result.stats && (result.stats.originalSize || result.stats.reductionPercentage !== undefined) && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/75 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-zinc-200 dark:divide-zinc-700/60">
            <div>
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ukuran Asli</div>
              <div className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {formatBytes(result.stats.originalSize || 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ukuran Hasil</div>
              <div className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {formatBytes(result.stats.resultSize || 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                <Percent className="h-3 w-3" />
                <span>Pengurangan</span>
              </div>
              <div className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {result.stats.reductionPercentage ?? 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Items List */}
      <div className="mt-6 space-y-2.5">
        {result.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatBytes(item.size)}</span>
                  {item.pageCount !== undefined && (
                    <>
                      <span>•</span>
                      <span>{item.pageCount} halaman</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownload(item.url, item.name)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              id={`result-download-btn-${idx}`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh</span>
            </button>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
        {isMultiple && (
          <button
            onClick={handleDownloadAllZip}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all active:scale-[0.98]"
            id="result-download-all-zip-btn"
          >
            <FileArchive className="h-4 w-4" />
            <span>Unduh Semua (ZIP)</span>
          </button>
        )}

        {!isMultiple && (
          <button
            onClick={() => handleDownload(result.items[0].url, result.items[0].name)}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all active:scale-[0.98]"
            id="result-main-download-btn"
          >
            <Download className="h-4 w-4" />
            <span>Unduh PDF</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition-colors"
          id="result-reset-btn"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Proses Berkas Lain</span>
        </button>
      </div>
    </div>
  );
};
