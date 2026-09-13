'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Columns,
  SplitSquareVertical,
  Eye,
  Check,
} from 'lucide-react';

interface CompareSliderProps {
  originalUrl: string;
  transparentUrl: string;
  width: number;
  height: number;
  onColorChange?: (color: string) => void;
}

type ViewMode = 'slider' | 'side-by-side' | 'toggle';
type BgType = 'checkerboard' | 'white' | 'black' | 'custom';

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalUrl,
  transparentUrl,
  width,
  height,
  onColorChange,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [toggleState, setToggleState] = useState<'after' | 'before'>('after');
  const [bgType, setBgType] = useState<BgType>('checkerboard');
  const [customColor, setCustomColor] = useState('#2563EB');
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode !== 'slider') return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSliderPosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || viewMode !== 'slider') return;
    updateSliderPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleBgChange = (type: BgType, color?: string) => {
    setBgType(type);
    if (color) {
      setCustomColor(color);
      onColorChange?.(color);
    } else if (type === 'white') {
      onColorChange?.('#FFFFFF');
    } else if (type === 'black') {
      onColorChange?.('#000000');
    } else {
      onColorChange?.('transparent');
    }
  };

  const getActiveBgStyle = () => {
    if (bgType === 'white') return { backgroundColor: '#ffffff' };
    if (bgType === 'black') return { backgroundColor: '#000000' };
    if (bgType === 'custom') return { backgroundColor: customColor };
    return {};
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      {/* Top Toolbar: Mode Switcher, Background Presets, Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xs">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'slider'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
            title="Split Slider"
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
            title="Side by Side"
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Berdampingan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('toggle')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'toggle'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
            title="Toggle View"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Toggle</span>
          </button>
        </div>

        {/* Center: Background Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mr-1 hidden sm:inline">
            Latar:
          </span>
          {/* Transparent / Checkerboard */}
          <button
            type="button"
            onClick={() => handleBgChange('checkerboard')}
            className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
              bgType === 'checkerboard'
                ? 'border-violet-600 ring-2 ring-violet-500/20'
                : 'border-zinc-300 dark:border-zinc-700'
            } bg-checkerboard`}
            title="Transparan (Checkerboard)"
          >
            {bgType === 'checkerboard' && (
              <Check className="h-3.5 w-3.5 text-zinc-900 stroke-[3]" />
            )}
          </button>

          {/* White */}
          <button
            type="button"
            onClick={() => handleBgChange('white')}
            className={`h-7 w-7 rounded-lg border bg-white flex items-center justify-center transition-all ${
              bgType === 'white'
                ? 'border-violet-600 ring-2 ring-violet-500/20'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
            title="Latar Putih"
          >
            {bgType === 'white' && (
              <Check className="h-3.5 w-3.5 text-zinc-900 stroke-[3]" />
            )}
          </button>

          {/* Black */}
          <button
            type="button"
            onClick={() => handleBgChange('black')}
            className={`h-7 w-7 rounded-lg border bg-zinc-950 flex items-center justify-center transition-all ${
              bgType === 'black'
                ? 'border-violet-500 ring-2 ring-violet-500/20'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
            title="Latar Hitam"
          >
            {bgType === 'black' && (
              <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
            )}
          </button>

          {/* Custom Color */}
          <label
            className={`relative h-7 w-7 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
              bgType === 'custom'
                ? 'border-violet-600 ring-2 ring-violet-500/20'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
            style={{ backgroundColor: customColor }}
            title="Pilih Warna Custom"
          >
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleBgChange('custom', e.target.value)}
              className="sr-only"
            />
            {bgType === 'custom' && (
              <Check className="h-3.5 w-3.5 text-white drop-shadow stroke-[3]" />
            )}
          </label>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            title="Perkecil (Zoom Out)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
            disabled={zoom >= 3}
            className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            title="Perbesar (Zoom In)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={zoom === 1}
            className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            title="Reset Ukuran (100%)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-900/5 dark:bg-zinc-950/40 min-h-[380px] sm:min-h-[500px] flex items-center justify-center p-3 sm:p-6">
        {/* VIEW MODE 1: INTERACTIVE SPLIT SLIDER */}
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`relative max-w-full overflow-hidden rounded-xl select-none cursor-ew-resize shadow-md touch-none ${
              bgType === 'checkerboard' ? 'bg-checkerboard' : ''
            }`}
            style={{
              ...getActiveBgStyle(),
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease',
            }}
          >
            {/* Background Layer: Transparent Image (Processed Result) */}
            <img
              src={transparentUrl}
              alt="Hasil Background Removed"
              className="block max-h-[70vh] w-auto max-w-full object-contain pointer-events-none"
              draggable={false}
            />

            {/* Foreground Layer: Original Image (Clipped by slider position) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            >
              <img
                src={originalUrl}
                alt="Foto Asli"
                className="block max-h-[70vh] w-auto max-w-full object-contain pointer-events-none bg-white dark:bg-zinc-900"
                draggable={false}
              />
            </div>

            {/* Vertical Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] pointer-events-none z-10"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Circular Slider Handle */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-zinc-300 flex items-center justify-center text-zinc-700">
                <div className="flex items-center gap-0.5">
                  <div className="w-0.5 h-3 bg-zinc-400 rounded-full" />
                  <div className="w-0.5 h-3 bg-zinc-400 rounded-full" />
                </div>
              </div>
            </div>

            {/* Floating Labels */}
            <div className="absolute bottom-3 left-3 pointer-events-none z-10">
              <span className="px-2 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-md bg-black/60 text-white backdrop-blur-md shadow-xs">
                Sebelum
              </span>
            </div>
            <div className="absolute bottom-3 right-3 pointer-events-none z-10">
              <span className="px-2 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-md bg-violet-600/80 text-white backdrop-blur-md shadow-xs">
                Sesudah (AI)
              </span>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SIDE BY SIDE */}
        {viewMode === 'side-by-side' && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
            }}
          >
            {/* Original Card */}
            <div className="flex flex-col items-center rounded-xl border border-zinc-200/90 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
              <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Foto Asli</span>
                <span className="text-[10px] text-zinc-400">
                  {width} × {height} px
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-center w-full max-h-[55vh] overflow-hidden rounded-lg bg-zinc-50 dark:bg-zinc-950 p-1">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-[50vh] w-auto object-contain rounded"
                />
              </div>
            </div>

            {/* Result Card */}
            <div className="flex flex-col items-center rounded-xl border border-zinc-200/90 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
              <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-violet-700 dark:text-violet-400">
                <span>Background Terhapus</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                  Transparan PNG
                </span>
              </div>
              <div
                className={`mt-2.5 flex items-center justify-center w-full max-h-[55vh] overflow-hidden rounded-lg p-1 ${
                  bgType === 'checkerboard' ? 'bg-checkerboard' : ''
                }`}
                style={getActiveBgStyle()}
              >
                <img
                  src={transparentUrl}
                  alt="Background Removed"
                  className="max-h-[50vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: SINGLE TOGGLE */}
        {viewMode === 'toggle' && (
          <div
            className="flex flex-col items-center space-y-3"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              className={`relative max-w-full overflow-hidden rounded-xl shadow-md p-1 ${
                toggleState === 'after' && bgType === 'checkerboard'
                  ? 'bg-checkerboard'
                  : ''
              }`}
              style={toggleState === 'after' ? getActiveBgStyle() : {}}
            >
              <img
                src={toggleState === 'after' ? transparentUrl : originalUrl}
                alt={toggleState === 'after' ? 'Hasil' : 'Asli'}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded"
              />
            </div>

            {/* Toggle Buttons */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setToggleState('before')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  toggleState === 'before'
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                Lihat Foto Asli
              </button>
              <button
                type="button"
                onClick={() => setToggleState('after')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  toggleState === 'after'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                Lihat Hasil (AI)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
