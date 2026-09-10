'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  RotateCcw,
  ArrowLeft,
  FileCheck,
  X,
} from 'lucide-react';
import { GeneratedPdfResult, PdfSettingsConfig } from '@/lib/pdf';
import { formatBytes } from '@/lib/utils';

interface ResultCardProps {
  result: GeneratedPdfResult;
  settings: PdfSettingsConfig;
  onDownload: () => void;
  onCreateAnother: () => void;
  onBackToEdit: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  settings,
  onDownload,
  onCreateAnother,
  onBackToEdit,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <div
      className="mx-auto w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60"
      id="result-card-container"
    >
      <div className="flex flex-col items-center text-center">
        {/* Success Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-3 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          PDF Ready
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Your PDF has been created successfully.
        </p>

        {/* PDF Metadata Specs */}
        <div className="mt-6 grid w-full grid-cols-3 gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/60 text-center">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Pages
            </div>
            <div className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {result.pageCount}
            </div>
          </div>
          <div className="border-x border-zinc-200/60 dark:border-zinc-800/60">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              File Size
            </div>
            <div className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {formatBytes(result.size)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Format
            </div>
            <div className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
              {settings.pageSize}
            </div>
          </div>
        </div>

        {/* Filename Chip */}
        <div className="mt-3 flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 max-w-full">
          <FileCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{result.filename}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex w-full flex-col gap-2.5">
          {/* Primary: Download */}
          <button
            type="button"
            onClick={onDownload}
            id="download-pdf-btn"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>

          {/* Secondary Actions row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              id="preview-pdf-btn"
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview PDF</span>
            </button>

            <button
              type="button"
              onClick={onBackToEdit}
              id="edit-settings-btn"
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Modify Settings</span>
            </button>
          </div>

          {/* Reset / Create another */}
          <button
            type="button"
            onClick={onCreateAnother}
            id="create-another-btn"
            className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 py-1 transition-colors"
          >
            Convert more images (Create another)
          </button>
        </div>
      </div>

      {/* PDF Inline Viewer Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {result.filename}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex h-7 items-center gap-1 rounded border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-100 dark:bg-zinc-900">
              <iframe
                src={`${result.url}#toolbar=1`}
                className="h-full w-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
