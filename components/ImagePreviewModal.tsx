/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageItem } from '@/lib/image';
import { formatBytes } from '@/lib/utils';

interface ImagePreviewModalProps {
  item: ImageItem | null;
  items: ImageItem[];
  onClose: () => void;
  onSelectNext?: (nextItem: ImageItem) => void;
  onSelectPrev?: (prevItem: ImageItem) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  item,
  items,
  onClose,
  onSelectNext,
  onSelectPrev,
}) => {
  const [zoom, setZoom] = useState(1);
  const [prevItemId, setPrevItemId] = useState(item?.id);

  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    setZoom(1);
  }


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!item) return;

      const currentIndex = items.findIndex((i) => i.id === item.id);
      if (e.key === 'ArrowRight' && currentIndex < items.length - 1 && onSelectNext) {
        onSelectNext(items[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0 && onSelectPrev) {
        onSelectPrev(items[currentIndex - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, items, onClose, onSelectNext, onSelectPrev]);

  if (!item) return null;

  const currentIndex = items.findIndex((i) => i.id === item.id);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 truncate pr-4">
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              #{currentIndex + 1} of {items.length}
            </span>
            <h3 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100" title={item.name}>
              {item.name}
            </h3>
            <span className="text-xs text-zinc-400">
              ({formatBytes(item.size)} • {item.width}×{item.height}px)
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 h-7 text-xs font-mono rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Canvas Stage */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto p-4 min-h-[350px] max-h-[70vh] bg-zinc-50 dark:bg-zinc-900/40">
          <div
            className="transition-transform duration-150 flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={item.previewUrl}
              alt={item.name}
              className="max-h-[60vh] max-w-full rounded shadow-md object-contain transition-transform duration-200"
              style={{
                transform: `rotate(${item.rotation}deg)`,
              }}
            />
          </div>

          {/* Navigation Prev/Next Arrows */}
          {currentIndex > 0 && onSelectPrev && (
            <button
              type="button"
              onClick={() => onSelectPrev(items[currentIndex - 1])}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-md hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800 backdrop-blur-xs transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {currentIndex < items.length - 1 && onSelectNext && (
            <button
              type="button"
              onClick={() => onSelectNext(items[currentIndex + 1])}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-md hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800 backdrop-blur-xs transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span>Rotation: {item.rotation}°</span>
            <span>Type: {item.type}</span>
          </div>
          <span className="hidden sm:inline">Use Arrow keys ← → to browse</span>
        </div>
      </div>
    </div>
  );
};
