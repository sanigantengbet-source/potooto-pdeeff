'use client';

import React, { useState } from 'react';
import { Plus, RotateCw, Trash2, Layers } from 'lucide-react';
import { ImageItem } from '@/lib/image';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
  items: ImageItem[];
  onRotateLeft: (id: string) => void;
  onRotateRight: (id: string) => void;
  onRotateAllCW: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onAddMoreClick: () => void;
  onPreview: (item: ImageItem) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  items,
  onRotateLeft,
  onRotateRight,
  onRotateAllCW,
  onRemove,
  onClearAll,
  onReorder,
  onAddMoreClick,
  onPreview,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent image or drag data
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    onReorder(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMoveLeft = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveRight = (index: number) => {
    if (index < items.length - 1) {
      onReorder(index, index + 1);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Workspace Header & Batch Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Layers className="h-4 w-4 text-zinc-500" />
            <span>
              {items.length} {items.length === 1 ? 'image' : 'images'}
            </span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
            • Drag cards or use arrows to reorder
          </span>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRotateAllCW}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            title="Rotate all images 90° clockwise"
            id="rotate-all-btn"
          >
            <RotateCw className="h-3 w-3" />
            <span className="hidden sm:inline">Rotate all</span>
          </button>

          <button
            type="button"
            onClick={onAddMoreClick}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            id="add-more-images-btn"
          >
            <Plus className="h-3 w-3" />
            <span>Add images</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-950/70 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
            title="Remove all images"
            id="clear-all-images-btn"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Grid container: 2 columns on mobile, 3 columns on sm/md, 3-4 on lg */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            onDrop={(e) => handleDrop(e, idx)}
            className="transition-transform"
          >
            <ImageCard
              item={item}
              index={idx}
              total={items.length}
              onRotateLeft={onRotateLeft}
              onRotateRight={onRotateRight}
              onRemove={onRemove}
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onPreview={onPreview}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === idx}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
