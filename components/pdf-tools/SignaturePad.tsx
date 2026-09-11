'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type, Upload, Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureReady: (dataUrl: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureReady }) => {
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [typedFont, setTypedFont] = useState<'cursive' | 'serif' | 'sans'>('cursive');
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(2.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      onSignatureReady(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleGenerateTypedSignature = () => {
    if (!typedName.trim()) return;
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = strokeColor;

    let fontStyle = 'italic 52px "Brush Script MT", cursive, sans-serif';
    if (typedFont === 'serif') {
      fontStyle = 'italic 48px "Times New Roman", serif';
    } else if (typedFont === 'sans') {
      fontStyle = '600 44px sans-serif';
    }

    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    // subtle underline
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 120, canvas.height / 2 + 35);
    ctx.bezierCurveTo(
      canvas.width / 2 - 40,
      canvas.height / 2 + 45,
      canvas.width / 2 + 60,
      canvas.height / 2 + 25,
      canvas.width / 2 + 130,
      canvas.height / 2 + 35
    );
    ctx.stroke();

    onSignatureReady(canvas.toDataURL('image/png'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSignatureReady(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Tab Selectors */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === 'draw'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span>Gambar Tanda Tangan</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('type')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === 'type'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <Type className="h-3.5 w-3.5" />
          <span>Ketik Teks</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === 'upload'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Unggah Gambar</span>
        </button>
      </div>

      {/* Mode 1: DRAW */}
      {mode === 'draw' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Warna:</span>
              {['#0f172a', '#1e3a8a', '#991b1b'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setStrokeColor(c)}
                  className={`h-5 w-5 rounded-full border border-zinc-300 dark:border-zinc-700 transition-transform ${
                    strokeColor === c ? 'scale-125 ring-2 ring-zinc-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Warna ${c}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>Bersihkan</span>
            </button>
          </div>

          {/* Canvas surface */}
          <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
            <canvas
              ref={canvasRef}
              width={480}
              height={160}
              className="h-40 w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
                Goreskan tanda tangan Anda di sini menggunakan mouse atau sentuhan jari
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: TYPE */}
      {mode === 'type' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Ketik nama lengkap Anda..."
              className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleGenerateTypedSignature}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Buat Tanda Tangan</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>Gaya font:</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="typedFont"
                checked={typedFont === 'cursive'}
                onChange={() => setTypedFont('cursive')}
              />
              <span className="font-serif italic">Kursif Cursive</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="typedFont"
                checked={typedFont === 'serif'}
                onChange={() => setTypedFont('serif')}
              />
              <span className="font-serif">Formal Serif</span>
            </label>
          </div>
        </div>
      )}

      {/* Mode 3: UPLOAD */}
      {mode === 'upload' && (
        <div className="space-y-3 text-center py-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Pilih Berkas Foto Tanda Tangan (PNG / JPG)</span>
          </button>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Disarankan menggunakan gambar latar belakang transparan (PNG).
          </p>
        </div>
      )}
    </div>
  );
};
