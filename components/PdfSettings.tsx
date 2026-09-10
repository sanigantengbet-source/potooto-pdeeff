'use client';

import React from 'react';
import {
  FileText,
  Sliders,
  Sparkles,
  ShieldCheck,
  Maximize,
  Compass,
  Square,
  Check,
} from 'lucide-react';
import {
  PageSizeOption,
  OrientationOption,
  MarginOption,
  ImageFitOption,
  PdfSettingsConfig,
} from '@/lib/pdf';
import { QualitySetting } from '@/lib/image';

interface PdfSettingsProps {
  settings: PdfSettingsConfig;
  onChange: (settings: PdfSettingsConfig) => void;
  onCreatePdf: () => void;
  disabled?: boolean;
  imageCount: number;
}

export const PdfSettings: React.FC<PdfSettingsProps> = ({
  settings,
  onChange,
  onCreatePdf,
  disabled = false,
  imageCount,
}) => {
  const update = <K extends keyof PdfSettingsConfig>(
    key: K,
    value: PdfSettingsConfig[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div
      className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40"
      id="pdf-settings-panel"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            PDF Settings
          </h3>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {imageCount} {imageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>

      <div className="mt-4 space-y-4 text-xs">
        {/* Page Size */}
        <div className="space-y-1.5">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">
            Page Size
          </label>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {(
              [
                { id: 'a4', label: 'A4' },
                { id: 'a5', label: 'A5' },
                { id: 'letter', label: 'Letter' },
                { id: 'legal', label: 'Legal' },
                { id: 'original', label: 'Original' },
              ] as { id: PageSizeOption; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update('pageSize', opt.id)}
                className={`flex h-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                  settings.pageSize === opt.id
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              Orientation
            </label>
            {settings.pageSize === 'original' && (
              <span className="text-[11px] text-zinc-400">Fixed to image</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'auto', label: 'Auto' },
                { id: 'portrait', label: 'Portrait' },
                { id: 'landscape', label: 'Landscape' },
              ] as { id: OrientationOption; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={settings.pageSize === 'original'}
                onClick={() => update('orientation', opt.id)}
                className={`flex h-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                  settings.orientation === opt.id
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div className="space-y-1.5">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">
            Page Margins
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'none', label: 'None' },
                { id: 'small', label: 'Small' },
                { id: 'medium', label: 'Medium' },
                { id: 'large', label: 'Large' },
              ] as { id: MarginOption; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update('margin', opt.id)}
                className={`flex h-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                  settings.margin === opt.id
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image Fit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              Image Fit
            </label>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {settings.imageFit === 'contain'
                ? 'Maintains ratio, fits inside'
                : settings.imageFit === 'cover'
                ? 'Fills page edge-to-edge'
                : 'Stretches to fill dimensions'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'contain', label: 'Contain' },
                { id: 'cover', label: 'Cover' },
                { id: 'stretch', label: 'Stretch' },
              ] as { id: ImageFitOption; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update('imageFit', opt.id)}
                className={`flex h-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                  settings.imageFit === opt.id
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality / Compression */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              Quality & Compression
            </label>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {settings.quality === 'standard'
                ? 'Smaller file size'
                : settings.quality === 'high'
                ? 'Crisp balance (recommended)'
                : 'Lossless resolution'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'standard', label: 'Standard' },
                { id: 'high', label: 'High' },
                { id: 'maximum', label: 'Maximum' },
              ] as { id: QualitySetting; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update('quality', opt.id)}
                className={`flex h-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                  settings.quality === opt.id
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* File name */}
        <div className="space-y-1.5">
          <label
            htmlFor="pdf-filename-input"
            className="font-medium text-zinc-700 dark:text-zinc-300"
          >
            File name
          </label>
          <input
            id="pdf-filename-input"
            type="text"
            value={settings.filename ?? ''}
            onChange={(e) => update('filename', e.target.value)}
            placeholder="photos-to-pdf"
            className="flex h-8 w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 transition-colors"
          />
        </div>
      </div>

      {/* Action Button: Create PDF */}
      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          disabled={disabled || imageCount === 0}
          onClick={onCreatePdf}
          id="create-pdf-submit-btn"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <span>Create PDF ({imageCount})</span>
        </button>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Your images stay on your device</span>
        </div>
      </div>
    </div>
  );
};
