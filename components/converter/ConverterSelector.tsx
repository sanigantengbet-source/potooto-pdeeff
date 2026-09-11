'use client';

import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Code2,
  FileArchive,
} from 'lucide-react';
import { CONVERTER_TOOLS } from '@/lib/converters/tools-meta';
import { ToolId } from '@/lib/converters/types';

interface ConverterSelectorProps {
  selectedToolId: ToolId;
  onSelectTool: (toolId: ToolId) => void;
}

export const ConverterSelector: React.FC<ConverterSelectorProps> = ({
  selectedToolId,
  onSelectTool,
}) => {
  const getToolIcon = (toolId: ToolId) => {
    if (toolId.includes('jpg') || toolId.includes('png') || toolId.includes('webp')) {
      return <ImageIcon className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
    if (toolId.includes('word')) {
      return <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    }
    if (toolId.includes('excel')) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
    }
    if (toolId.includes('ppt')) {
      return <Presentation className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
    }
    if (toolId.includes('html')) {
      return <Code2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />;
    }
    if (toolId.includes('pdfa')) {
      return <FileArchive className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    }
    return <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />;
  };

  return (
    <div className="w-full" id="converter-selector-container">
      {/* Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {CONVERTER_TOOLS.map((tool) => {
          const isSelected = selectedToolId === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className={`group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-zinc-900 bg-zinc-50 shadow-xs ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800/70 dark:ring-zinc-100'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40'
              }`}
              id={`tool-card-${tool.id}`}
            >
              <div className="flex w-full items-center justify-between gap-1.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform">
                  {getToolIcon(tool.id)}
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

              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {tool.name}
              </div>
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
