'use client';

import React from 'react';
import {
  CheckCircle2,
  Download,
  FileCheck,
  RotateCcw,
  Archive,
  ExternalLink,
  Eye,
  FileText,
} from 'lucide-react';
import { ConversionOutputResult, ConvertedOutputFile } from '@/lib/converters/types';
import { formatBytes } from '@/lib/utils';

interface ConversionResultProps {
  result: ConversionOutputResult;
  onConvertAnother: () => void;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({
  result,
  onConvertAnother,
}) => {
  const downloadSingleFile = (file: ConvertedOutputFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllSequential = () => {
    result.files.forEach((file, index) => {
      setTimeout(() => {
        downloadSingleFile(file);
      }, index * 200);
    });
  };

  const downloadZip = () => {
    if (!result.zipUrl || !result.zipFilename) return;
    const a = document.createElement('a');
    a.href = result.zipUrl;
    a.download = result.zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isMultiFile = result.files.length > 1;
  const primaryFile = result.files[0];

  return (
    <div
      className="mx-auto w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70 text-center space-y-6"
      id="conversion-result-screen"
    >
      {/* Success Badge */}
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-3 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Conversion Completed
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {result.summaryText || 'Your file has been converted successfully.'}
        </p>
      </div>

      {/* Single File Info Box */}
      {!isMultiFile && primaryFile && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/60 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
              <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {primaryFile.name}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span>{formatBytes(primaryFile.size)}</span>
                {result.pageCount && result.pageCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{result.pageCount} page{result.pageCount > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Files Thumbnails / Grid (e.g. PDF to JPG/PNG) */}
      {isMultiFile && (
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span>Generated Files ({result.files.length})</span>
            <span>Total: {formatBytes(result.files.reduce((acc, f) => acc + f.size, 0))}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {result.files.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="group relative rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                {f.previewUrl ? (
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 mb-1.5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.previewUrl}
                      alt={f.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-3/4 w-full rounded bg-zinc-100 dark:bg-zinc-800 mb-1.5 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-zinc-400" />
                  </div>
                )}

                <div className="min-w-0 mb-2">
                  <div className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {f.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {formatBytes(f.size)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadSingleFile(f)}
                  className="flex items-center justify-center gap-1 w-full rounded py-1 text-[10px] font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="flex flex-col gap-2.5 pt-2">
        {/* Single Download button */}
        {!isMultiFile && primaryFile && (
          <button
            type="button"
            onClick={() => downloadSingleFile(primaryFile)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
            id="btn-download-result-single"
          >
            <Download className="h-4 w-4" />
            <span>Download {primaryFile.name.split('.').pop()?.toUpperCase()}</span>
          </button>
        )}

        {/* Multi-file ZIP download */}
        {isMultiFile && result.zipUrl && (
          <button
            type="button"
            onClick={downloadZip}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
            id="btn-download-zip"
          >
            <Archive className="h-4 w-4" />
            <span>Download All as ZIP</span>
          </button>
        )}

        {/* Secondary download all as individual files */}
        {isMultiFile && (
          <button
            type="button"
            onClick={downloadAllSequential}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            id="btn-download-all-individual"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download All ({result.files.length} files)</span>
          </button>
        )}

        {/* Convert Another File Button */}
        <button
          type="button"
          onClick={onConvertAnother}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          id="btn-convert-another"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Convert Another File</span>
        </button>
      </div>
    </div>
  );
};
