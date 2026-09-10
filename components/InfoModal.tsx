'use client';

import React from 'react';
import { X, ShieldCheck, Cpu, Zap, FileCheck, Layers } from 'lucide-react';

interface InfoModalProps {
  type: 'how-it-works' | 'privacy' | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {type === 'privacy' ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Zap className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
            )}
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {type === 'privacy' ? 'Privacy & Security Guarantee' : 'How Photo to PDF Works'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                <p className="font-medium">
                  Zero Server Uploads: Your photos never leave your device.
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  Every image conversion and PDF assembly is executed locally in your browser memory using WebAssembly, HTML5 Canvas, and modern Web APIs.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    1. No Cloud Storage or Database
                  </h4>
                  <p className="mt-0.5">
                    We do not maintain any cloud databases, external object storage buckets, or temporary staging disks. Once you close or reload the browser tab, all loaded images and generated PDFs are automatically purged from memory.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    2. No User Tracking or Analytics
                  </h4>
                  <p className="mt-0.5">
                    There are no third-party ad trackers, invasive analytics scripts, or cookies embedded into this utility.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    3. Safe for Confidential Documents
                  </h4>
                  <p className="mt-0.5">
                    Whether converting government IDs, passport photos, medical receipts, or confidential business receipts, your data remains strictly private on your personal device.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    <Layers className="h-4 w-4 text-zinc-500" />
                    <span>1. Select & Reorder</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Drag and drop or select multiple JPG, PNG, or WEBP photos. Drag cards or tap arrows to arrange page sequences.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    <Cpu className="h-4 w-4 text-zinc-500" />
                    <span>2. Customize Layout</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Choose standard page formats (A4, A5, Letter, Legal) or original image dimensions, adjust margins, and select image fit.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    <Zap className="h-4 w-4 text-zinc-500" />
                    <span>3. Client Generation</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Our high-performance engine encodes and combines pages in real-time right inside your browser without freezing the UI.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    <FileCheck className="h-4 w-4 text-zinc-500" />
                    <span>4. Instant Download</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Preview your generated PDF directly in your browser or download it with one click.
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                Tip: If photos were taken in landscape mode or upside down, use the rotation buttons on each photo card before generating your PDF.
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
