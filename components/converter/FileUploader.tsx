'use client';

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  FileCheck,
  X,
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { ConverterToolMeta } from '@/lib/converters/types';
import { formatBytes } from '@/lib/utils';

interface FileUploaderProps {
  tool: ConverterToolMeta;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

const MAX_SINGLE_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_MULTI_FILE_COUNT = 60;

export const FileUploader: React.FC<FileUploaderProps> = ({
  tool,
  files,
  onFilesChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (incoming: FileList | File[]) => {
    setErrorMessage(null);
    const arr = Array.from(incoming);
    if (arr.length === 0) return;

    if (!tool.multiple && arr.length > 1) {
      setErrorMessage(`"${tool.name}" processes one document at a time. Using the first file.`);
    }

    const targetFiles = tool.multiple ? arr : [arr[0]];
    const valid: File[] = [];
    const errors: string[] = [];

    // Parse accepted extensions from tool.accept
    const acceptedExtensions = tool.accept
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.startsWith('.'))
      .map((s) => s.replace('.', ''));

    for (const file of targetFiles) {
      if (file.size > MAX_SINGLE_FILE_BYTES) {
        errors.push(`${file.name} exceeds the 50 MB limit.`);
        continue;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

      // Special helpful check for legacy .doc
      if (tool.id === 'word-to-pdf' && fileExt === 'doc') {
        errors.push(
          `"${file.name}" is in legacy .doc format. Please re-save as .docx for client-side processing.`
        );
        continue;
      }

      if (acceptedExtensions.length > 0 && !acceptedExtensions.includes(fileExt)) {
        errors.push(
          `"${file.name}" has an unsupported format (.${fileExt}). Expected: ${tool.accept}`
        );
        continue;
      }

      valid.push(file);
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(' • '));
    }

    if (valid.length > 0) {
      if (tool.multiple) {
        const combined = [...files, ...valid];
        if (combined.length > MAX_MULTI_FILE_COUNT) {
          setErrorMessage(`Limit of ${MAX_MULTI_FILE_COUNT} files reached. Retaining first ${MAX_MULTI_FILE_COUNT}.`);
          onFilesChange(combined.slice(0, MAX_MULTI_FILE_COUNT));
        } else {
          onFilesChange(combined);
        }
      } else {
        onFilesChange(valid);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const clearAll = () => {
    onFilesChange([]);
    setErrorMessage(null);
  };

  // Helper to extract clean uppercase extension tags for display
  const displayExtensions = React.useMemo(() => {
    const parts = tool.accept.split(',').map((s) => s.trim().toLowerCase());
    const exts = parts
      .filter((s) => s.startsWith('.'))
      .map((s) => s.toUpperCase());

    if (exts.length > 0) {
      return Array.from(new Set(exts)).slice(0, 4);
    }

    if (tool.accept.includes('jpeg') || tool.accept.includes('jpg')) return ['.JPG', '.JPEG'];
    if (tool.accept.includes('png')) return ['.PNG'];
    if (tool.accept.includes('webp')) return ['.WEBP'];
    if (tool.accept.includes('pdf')) return ['.PDF'];
    return [];
  }, [tool.accept]);

  return (
    <div className="w-full space-y-3" id="file-uploader-component">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={tool.multiple}
        accept={tool.accept}
        onChange={handleFileInputChange}
        className="hidden"
        id="converter-file-input"
        disabled={disabled}
      />

      {/* Drop Zone Box - Professional Double Layered Architecture */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border transition-all duration-200 overflow-hidden ${
          isDragging
            ? 'border-zinc-900 bg-zinc-100/90 ring-4 ring-zinc-900/10 dark:border-zinc-100 dark:bg-zinc-800/90 dark:ring-zinc-100/10 scale-[0.995]'
            : 'border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 shadow-xs'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        id="converter-dropzone"
      >
        <div className="m-2 w-[calc(100%-16px)] flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-9 text-center transition-colors group-hover:border-zinc-300/90 dark:border-zinc-800 dark:bg-zinc-950/30 dark:group-hover:border-zinc-700/90">
          {/* Elevated Icon Badge */}
          <div className="relative mb-3.5 flex h-13 w-13 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-700/80 dark:bg-zinc-800 transition-transform duration-200 group-hover:scale-105">
            <UploadCloud className="h-6 w-6 text-zinc-800 dark:text-zinc-200" />
            <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs">
              <Plus className="h-2.5 w-2.5" />
            </span>
          </div>

          <div className="space-y-1 max-w-sm">
            <div className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Choose <span className="font-bold">{tool.fromFormat}</span> {tool.multiple ? 'files' : 'file'} or drag & drop here
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {tool.multiple
                ? `Supports up to ${MAX_MULTI_FILE_COUNT} files simultaneously • Max 50 MB per file`
                : `Select a single document to process • Max 50 MB`}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all group-hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-white">
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Browse from Device</span>
            </span>
          </div>

          {/* Technical Metadata & Privacy Tagline */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 w-full max-w-md">
            <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200/70 shadow-2xs dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>100% Local • Zero Server Upload</span>
            </div>
            {displayExtensions.map((ext) => (
              <span
                key={ext}
                className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-500 border border-zinc-200/70 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
          id="uploader-error-alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File List / Queue */}
      {files.length > 0 && (
        <div className="space-y-2" id="uploaded-files-list">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Selected File{files.length > 1 ? 's' : ''} ({files.length})
            </span>
            <div className="flex items-center gap-2">
              {tool.multiple && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  id="btn-add-more-files"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add More</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                id="btn-clear-files"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60"
                id={`file-row-${idx}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
