'use client';

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, Shield } from 'lucide-react';
import { validateImageFile, createImageItem, ImageItem, MAX_IMAGES_COUNT } from '@/lib/image';

interface UploadZoneProps {
  onImagesAdded: (items: ImageItem[]) => void;
  currentCount: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImagesAdded,
  currentCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    if (currentCount + fileArray.length > MAX_IMAGES_COUNT) {
      setErrorMessage(
        `Maximum limit reached: You can upload up to ${MAX_IMAGES_COUNT} images in one batch.`
      );
      return;
    }

    setIsLoading(true);

    const validItems: ImageItem[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        errors.push(validation.error || `Invalid file: ${file.name}`);
        continue;
      }

      try {
        const item = await createImageItem(file);
        validItems.push(item);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Failed to load ${file.name}`);
      }
    }

    setIsLoading(false);

    if (errors.length > 0) {
      setErrorMessage(errors.slice(0, 3).join(' • ') + (errors.length > 3 ? ` (+${errors.length - 3} more errors)` : ''));
    }

    if (validItems.length > 0) {
      onImagesAdded(validItems);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image files"
        id="file-upload-input"
      />

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBoxClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBoxClick();
          }
        }}
        id="upload-dropzone"
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
          isDragging
            ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-300 dark:bg-zinc-900/50 scale-[1.005]'
            : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/30'
        }`}
      >
        <div className="flex flex-col items-center space-y-3">
          {/* Icon Badge */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
              isDragging
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-700'
            }`}
          >
            {isDragging ? (
              <UploadCloud className="h-6 w-6 animate-bounce" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
          </div>

          {/* Heading and Action */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              {isDragging ? 'Drop your images here' : 'Drop your images here or browse'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              JPG, PNG, WEBP • Multiple images supported
            </p>
          </div>

          {/* Clean Action Button */}
          <div className="pt-2">
            <span className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors">
              {isLoading ? 'Processing files...' : 'Choose images'}
            </span>
          </div>

          {/* Micro Privacy Assurance */}
          <div className="flex items-center gap-1.5 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Files are processed locally on your device</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 dark:border-red-950/60 dark:bg-red-950/30 dark:text-red-400"
          role="alert"
          id="upload-error-alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
