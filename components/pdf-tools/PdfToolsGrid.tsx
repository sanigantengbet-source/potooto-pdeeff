'use client';

import React from 'react';
import { PDF_TOOLS_META } from '@/lib/pdf-tools/tools-meta';
import { PdfToolId } from '@/lib/pdf-tools/types';
import { PdfToolIcon } from './PdfToolIcons';

interface PdfToolsGridProps {
  activeToolId?: PdfToolId | null;
  onSelectTool: (toolId: PdfToolId) => void;
}

export const PdfToolsGrid: React.FC<PdfToolsGridProps> = ({
  activeToolId,
  onSelectTool,
}) => {
  return (
    <div className="w-full" id="pdf-tools-selector-container">
      {/* Tools Grid - 2 columns on mobile, 3 on sm, 4 on lg matching ConverterSelector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {PDF_TOOLS_META.map((tool) => {
          const isSelected = activeToolId === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className={`group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-zinc-900 bg-zinc-50 shadow-xs ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800/70 dark:ring-zinc-100'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40'
              }`}
              id={`pdf-tool-card-${tool.id}`}
            >
              {/* Top row: Icon container on left, badge pill on right */}
              <div className="flex w-full items-center justify-between gap-1.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform">
                  <PdfToolIcon toolId={tool.id} size={18} />
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {tool.shortLabel}
                </span>
              </div>

              {/* Tool Name */}
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {tool.name}
              </div>

              {/* Tool Description */}
              <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {tool.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

