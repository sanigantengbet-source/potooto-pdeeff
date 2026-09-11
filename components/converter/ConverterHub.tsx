'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
  FileUp,
} from 'lucide-react';
import { ConverterSelector } from './ConverterSelector';
import { FileUploader } from './FileUploader';
import { ConversionSettings } from './ConversionSettings';
import { ConversionProgress } from './ConversionProgress';
import { ConversionResult } from './ConversionResult';
import { CONVERTER_TOOLS, getToolById, isValidToolId } from '@/lib/converters/tools-meta';
import { ToolId, ConversionStatus, ConversionOutputResult } from '@/lib/converters/types';
import { processConversion } from '@/lib/converters';

interface ConverterHubProps {
  hideHeader?: boolean;
}

export const ConverterHub: React.FC<ConverterHubProps> = ({ hideHeader = false }) => {
  const searchParams = useSearchParams();
  const initialToolParam = searchParams.get('tool');

  const [selectedToolId, setSelectedToolId] = useState<ToolId>(() => {
    if (initialToolParam && isValidToolId(initialToolParam)) {
      return initialToolParam as ToolId;
    }
    return 'jpg-to-pdf';
  });

  const [files, setFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<ConversionStatus>('IDLE');
  const [stageText, setStageText] = useState<string>('');
  const [percent, setPercent] = useState<number>(0);
  const [result, setResult] = useState<ConversionOutputResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showToolSelector, setShowToolSelector] = useState<boolean>(true);

  const currentTool = getToolById(selectedToolId);

  // Sync tool selection with URL query param without full page reload & auto-scroll to workspace
  const handleSelectTool = (toolId: ToolId) => {
    setSelectedToolId(toolId);
    setFiles([]);
    setSettings({});
    setStatus('IDLE');
    setResult(null);
    setErrorMessage(null);

    const url = new URL(window.location.href);
    url.searchParams.set('tool', toolId);
    window.history.replaceState({}, '', url.toString());

    // Instantly scroll smoothly to the drag & drop area
    setTimeout(() => {
      const workspaceElement = document.getElementById('conversion-workspace');
      if (workspaceElement) {
        workspaceElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleStartConversion = async () => {
    if (files.length === 0) {
      setErrorMessage('Please select at least one file to convert.');
      return;
    }

    setErrorMessage(null);
    setStatus('READING');
    setStageText('Reading files...');
    setPercent(10);

    try {
      const output = await processConversion(
        selectedToolId,
        files,
        settings,
        (p, stage) => {
          setStatus(p >= 20 ? 'PROCESSING' : 'READING');
          setPercent(p);
          setStageText(stage);
        }
      );

      setResult(output);
      setStatus('COMPLETED');
      setPercent(100);
      setStageText('Conversion completed');
    } catch (err: any) {
      console.error('Conversion failed:', err);
      setStatus('ERROR');
      setErrorMessage(
        err?.message || 'An unexpected error occurred during document conversion.'
      );
    }
  };

  const handleResetForAnother = () => {
    setFiles([]);
    setStatus('IDLE');
    setResult(null);
    setErrorMessage(null);
    setStageText('');
    setPercent(0);
  };

  return (
    <div className={hideHeader ? "w-full space-y-6" : "mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 space-y-8"} id="converter-hub">
      {/* Header section */}
      {!hideHeader && (
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>100% Client-Side • Private & Fast</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            PDF Converter Suite
          </h1>
          <p className="max-w-xl text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            High-performance in-browser conversion between PDF, images, Microsoft Office documents, HTML, and archival standards.
          </p>
        </div>
      )}

      {/* Tool Selector Section */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 sm:p-6 backdrop-blur-xs dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Select Converter Tool
            </h2>
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Active: <strong className="text-zinc-900 dark:text-zinc-100">{currentTool.name}</strong>
          </span>
        </div>

        <ConverterSelector
          selectedToolId={selectedToolId}
          onSelectTool={handleSelectTool}
        />
      </div>

      {/* Main Conversion Workspace */}
      {status === 'COMPLETED' && result ? (
        <ConversionResult
          result={result}
          onConvertAnother={handleResetForAnother}
        />
      ) : (
        <div className="space-y-6 pt-2" id="conversion-workspace">
          {/* Active Tool Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white shadow-2xs text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-100 mt-0.5">
                <FileUp className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {currentTool.name}
                  </h3>
                  <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {currentTool.shortLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {currentTool.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs self-start sm:self-auto shrink-0">
              <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                {currentTool.multiple ? 'Batch conversion (up to 60)' : 'Single document'}
              </span>
              <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                Max 50 MB
              </span>
            </div>
          </div>

          {/* Progress Overlay / Panel */}
          {(status === 'READING' || status === 'PROCESSING') && (
            <ConversionProgress
              status={status}
              stageText={stageText}
              percent={percent}
            />
          )}

          {/* Error Banner */}
          {status === 'ERROR' && errorMessage && (
            <div
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
              id="converter-error-banner"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-semibold">Conversion Error</div>
                <div>{errorMessage}</div>
              </div>
              <button
                type="button"
                onClick={() => setStatus('IDLE')}
                className="text-xs font-semibold underline hover:text-red-700 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload Zone */}
          <FileUploader
            tool={currentTool}
            files={files}
            onFilesChange={setFiles}
            disabled={status === 'READING' || status === 'PROCESSING'}
          />

          {/* Settings Section */}
          {files.length > 0 && (
            <ConversionSettings
              toolId={selectedToolId}
              settings={settings}
              onSettingsChange={setSettings}
              disabled={status === 'READING' || status === 'PROCESSING'}
            />
          )}

          {/* Action Button */}
          {files.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleStartConversion}
                disabled={status === 'READING' || status === 'PROCESSING'}
                className="flex h-12 w-full sm:w-auto min-w-[220px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
                id="btn-convert-action"
              >
                <span>Convert to {currentTool.toFormat}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
