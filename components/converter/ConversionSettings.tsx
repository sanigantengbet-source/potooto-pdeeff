'use client';

import React from 'react';
import { Settings2, Sliders, FileType } from 'lucide-react';
import { ToolId } from '@/lib/converters/types';

interface ConversionSettingsProps {
  toolId: ToolId;
  settings: Record<string, any>;
  onSettingsChange: (newSettings: Record<string, any>) => void;
  disabled?: boolean;
}

export const ConversionSettings: React.FC<ConversionSettingsProps> = ({
  toolId,
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const isImageToPdf =
    toolId === 'jpg-to-pdf' || toolId === 'png-to-pdf' || toolId === 'webp-to-pdf';
  const isDocumentToPdf =
    toolId === 'word-to-pdf' ||
    toolId === 'excel-to-pdf' ||
    toolId === 'ppt-to-pdf' ||
    toolId === 'html-to-pdf';
  const isPdfToImage = toolId === 'pdf-to-jpg' || toolId === 'pdf-to-png';

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4"
      id="conversion-settings-panel"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Conversion Settings
          </h3>
        </div>
        <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
          Options
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Page Size (for all PDF outputs) */}
        {(isImageToPdf || isDocumentToPdf) && toolId !== 'ppt-to-pdf' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Page Size
            </label>
            <select
              value={settings.pageSize || 'a4'}
              onChange={(e) => updateSetting('pageSize', e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-page-size"
            >
              <option value="a4">A4 (Standard 210 × 297 mm)</option>
              <option value="letter">Letter (8.5 × 11 in)</option>
              <option value="a5">A5 (148 × 210 mm)</option>
              <option value="legal">Legal (8.5 × 14 in)</option>
              {isImageToPdf && <option value="original">Original Image Aspect</option>}
            </select>
          </div>
        )}

        {/* Orientation */}
        {(isImageToPdf || isDocumentToPdf) && toolId !== 'ppt-to-pdf' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Orientation
            </label>
            <select
              value={
                settings.orientation ||
                (toolId === 'excel-to-pdf' ? 'landscape' : isImageToPdf ? 'auto' : 'portrait')
              }
              onChange={(e) => updateSetting('orientation', e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-orientation"
            >
              {isImageToPdf && <option value="auto">Auto (Match Image Ratio)</option>}
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        )}

        {/* Margins */}
        {(isImageToPdf || isDocumentToPdf) && toolId !== 'ppt-to-pdf' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Margins
            </label>
            <select
              value={settings.margin || 'small'}
              onChange={(e) => updateSetting('margin', e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-margin"
            >
              <option value="none">No Margin (Border to border)</option>
              <option value="small">Small Margin (0.25 inch)</option>
              <option value="medium">Medium Margin (0.50 inch)</option>
              <option value="large">Large Margin (0.75 inch)</option>
            </select>
          </div>
        )}

        {/* Image Fit (for Image to PDF) */}
        {isImageToPdf && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Image Placement
            </label>
            <select
              value={settings.imageFit || 'contain'}
              onChange={(e) => updateSetting('imageFit', e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-image-fit"
            >
              <option value="contain">Fit Page (Preserve Full Aspect)</option>
              <option value="cover">Fill Page (Crop Edges)</option>
              <option value="stretch">Stretch to Fill</option>
            </select>
          </div>
        )}

        {/* Image Quality (for Image to PDF) */}
        {isImageToPdf && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Output Quality
            </label>
            <select
              value={settings.quality || 'high'}
              onChange={(e) => updateSetting('quality', e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-image-quality"
            >
              <option value="standard">Standard (Compact file size)</option>
              <option value="high">High Quality (Recommended)</option>
              <option value="max">Maximum (Lossless fidelity)</option>
            </select>
          </div>
        )}

        {/* Resolution / DPI Scale (for PDF to Image) */}
        {isPdfToImage && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Rendering Resolution
            </label>
            <select
              value={settings.scale || 2.0}
              onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-scale"
            >
              <option value="1.0">Standard 72 DPI (Fastest, Web)</option>
              <option value="1.5">Medium 108 DPI (Balanced)</option>
              <option value="2.0">High 144 DPI (Sharp Text)</option>
              <option value="3.0">Ultra 216 DPI (Print Quality)</option>
            </select>
          </div>
        )}

        {/* JPG Quality (for PDF to JPG) */}
        {toolId === 'pdf-to-jpg' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              JPEG Quality
            </label>
            <select
              value={settings.quality || 0.92}
              onChange={(e) => updateSetting('quality', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-jpg-quality"
            >
              <option value="0.80">Medium (80% quality)</option>
              <option value="0.92">High (92% quality)</option>
              <option value="1.0">Maximum (100% quality)</option>
            </select>
          </div>
        )}

        {/* Page Range (for PDF to Image) */}
        {isPdfToImage && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Page Selection
            </label>
            <input
              type="text"
              placeholder="e.g. all or 1-5, 8"
              value={settings.pageRange || 'all'}
              onChange={(e) => updateSetting('pageRange', e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
              id="settings-page-range"
            />
          </div>
        )}

        {/* Custom Filename */}
        <div className={isPdfToImage ? 'sm:col-span-2' : ''}>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Custom Output Filename (Optional)
          </label>
          <input
            type="text"
            placeholder="Leave empty for auto-generated name"
            value={settings.filename || ''}
            onChange={(e) => updateSetting('filename', e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
            id="settings-custom-filename"
          />
        </div>
      </div>
    </div>
  );
};
