'use client';

import React, { useState } from 'react';
import {
  Check,
  Download,
  FileArchive,
  RefreshCw,
  FileText,
  Percent,
  Eye,
  ShieldCheck,
  Copy,
  CheckCheck,
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const isMultiple = result.items.length > 1;
  const primaryItem = result.items[0];

  const handleDownload = (itemUrl: string, itemName: string) => {
    const a = document.createElement('a');
    a.href = itemUrl;
    a.download = itemName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = (itemUrl: string) => {
    window.open(itemUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyName = (name: string, index: number) => {
    navigator.clipboard.writeText(name);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadAllZip = () => {
    if (result.zipUrl) {
      handleDownload(result.zipUrl, `${result.toolId}-hasil.zip`);
    } else {
      // Sequential fallback
      result.items.forEach((item, index) => {
        setTimeout(() => {
          handleDownload(item.url, item.name);
        }, index * 250);
      });
    }
  };

  return (
    <div
      className="w-full max-w-xl mx-auto rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90 transition-all space-y-5"
      id="pdf-tool-result-container"
    >
      {/* Header & Status Section - Pure Monochrome */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Selesai Diproses</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {result.title}
        </h3>

        <p className="max-w-md text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Dokumen Anda telah berhasil diproses secara lokal di peramban dan siap untuk disimpan.
        </p>
      </div>

      {/* Compression / Size Reduction Stats if present - Monochrome */}
      {result.stats && (result.stats.originalSize || result.stats.reductionPercentage !== undefined) && (
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-850/60">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-zinc-200 dark:divide-zinc-750">
            <div>
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ukuran Semula</div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                {formatBytes(result.stats.originalSize || 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ukuran Baru</div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                {formatBytes(result.stats.resultSize || 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1">
                <Percent className="h-3 w-3" />
                <span>Hemat</span>
              </div>
              <div className="mt-1 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {result.stats.reductionPercentage ?? 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Items List - Clean, No Awkward Wrapping */}
      <div className="space-y-2.5">
        {result.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-850/50"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={item.name}>
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyName(item.name, idx)}
                    className="shrink-0 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Salin nama berkas"
                  >
                    {copiedIndex === idx ? (
                      <CheckCheck className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">
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

            {/* If multiple files, provide per-item download button */}
            {isMultiple && (
              <button
                type="button"
                onClick={() => handleDownload(item.url, item.name)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                id={`result-download-btn-${idx}`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons Toolbar - Clean, Non-overlapping, Mobile Optimized */}
      <div className="pt-2 space-y-2.5">
        {isMultiple ? (
          <button
            type="button"
            onClick={handleDownloadAllZip}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all cursor-pointer"
            id="result-download-all-zip-btn"
          >
            <FileArchive className="h-4 w-4" />
            <span>Unduh Semua ({result.items.length} Berkas ZIP)</span>
          </button>
        ) : primaryItem && (
          <button
            type="button"
            onClick={() => handleDownload(primaryItem.url, primaryItem.name)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all cursor-pointer"
            id="result-main-download-btn"
          >
            <Download className="h-4 w-4" />
            <span>Unduh Dokumen PDF</span>
          </button>
        )}

        {/* Secondary Buttons: Equal 2-Column Grid on Mobile for Single File, Full Width for Multiple */}
        {isMultiple ? (
          <button
            type="button"
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            id="result-reset-btn"
          >
            <RefreshCw className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <span>Proses Berkas Lain</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handlePreview(primaryItem.url)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              id="result-preview-btn"
            >
              <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span>Buka Pratinjau</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              id="result-reset-btn"
            >
              <RefreshCw className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span>Proses Berkas Lain</span>
            </button>
          </div>
        )}
      </div>

      {/* Security & Local Guarantee Note - Monochrome */}
      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span>100% Client-Side • Berkas Anda diproses lokal tanpa meninggalkan peramban.</span>
      </div>
    </div>
  );
};
