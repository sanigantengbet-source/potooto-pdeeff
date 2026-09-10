/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  GripVertical,
} from 'lucide-react';
import { ImageItem } from '@/lib/image';
import { formatBytes } from '@/lib/utils';

interface ImageCardProps {
  item: ImageItem;
  index: number;
  total: number;
  onRotateLeft: (id: string) => void;
  onRotateRight: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onPreview: (item: ImageItem) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  index,
  total,
  onRotateLeft,
  onRotateRight,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onPreview,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging = false,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      id={`image-card-${item.id}`}
      className={`group relative flex flex-col rounded-lg border border-zinc-200 bg-white p-2.5 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900/60 ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-zinc-400'
          : 'hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
      }`}
    >
      {/* Top Header: Badge, Drag Handle & Remove */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 items-center justify-center rounded bg-zinc-100 px-1.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            #{index + 1}
          </span>
          <div
            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
            title="Drag to reorder"
            aria-label="Drag handle"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
          title="Remove image"
          aria-label={`Remove image ${index + 1}`}
          id={`remove-image-${item.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thumbnail Container */}
      <div
        onClick={() => onPreview(item)}
        className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-950 group/thumb"
        title="Click to preview"
      >
        <img
          src={item.previewUrl}
          alt={item.name}
          className="h-full w-full object-contain transition-transform duration-200"
          style={{
            transform: `rotate(${item.rotation}deg)`,
          }}
          loading="lazy"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/30">
          <span className="rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100 backdrop-blur-xs">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Rotation indicator badge if rotated */}
        {item.rotation > 0 && (
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-xs">
            {item.rotation}°
          </span>
        )}
      </div>

      {/* File Info */}
      <div className="mt-2 space-y-0.5 px-0.5">
        <p
          className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200"
          title={item.name}
        >
          {item.name}
        </p>
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>{formatBytes(item.size)}</span>
          <span>
            {item.width}×{item.height}
          </span>
        </div>
      </div>

      {/* Action Bar (Rotate + Mobile Move) */}
      <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
        {/* Reorder Buttons (Left / Right) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveLeft(index)}
            className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            title="Move left"
            aria-label={`Move image ${index + 1} backward`}
            id={`move-left-${item.id}`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMoveRight(index)}
            className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            title="Move right"
            aria-label={`Move image ${index + 1} forward`}
            id={`move-right-${item.id}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Rotate Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRotateLeft(item.id)}
            className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            title="Rotate left 90°"
            aria-label={`Rotate image ${index + 1} counter-clockwise`}
            id={`rotate-left-${item.id}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRotateRight(item.id)}
            className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            title="Rotate right 90°"
            aria-label={`Rotate image ${index + 1} clockwise`}
            id={`rotate-right-${item.id}`}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
