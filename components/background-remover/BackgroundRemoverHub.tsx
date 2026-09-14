'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Cpu,
  Zap,
  ShieldCheck,
  AlertCircle,
  FileImage,
  ArrowRight,
  Settings2,
  Lock,
  Layers,
  HelpCircle,
  ChevronDown,
  Info,
} from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { ProcessingView } from './ProcessingView';
import { CompareSlider } from './CompareSlider';
import {
  backgroundRemover,
} from '@/lib/background-remover/engine';
import {
  detectHardwareCapabilities,
} from '@/lib/background-remover/detector';
import {
  createSolidBackgroundBlob,
  triggerDownload,
  copyImageToClipboard,
} from '@/lib/background-remover/export';
import {
  HardwareSupport,
  ModelProgress,
  ModelVariant,
  ProcessResult,
  RuntimeDevice,
} from '@/lib/background-remover/types';

export const BackgroundRemoverHub: React.FC = () => {
  const router = useRouter();

  // State
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ModelProgress>({
    status: 'idle',
    message: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [modelVariant, setModelVariant] = useState<ModelVariant>('rmbg-1.4');
  const [forceDevice, setForceDevice] = useState<RuntimeDevice | undefined>(undefined);
  const [maxDimension, setMaxDimension] = useState<number>(0); // 0 = original resolution
  const [activeBgColor, setActiveBgColor] = useState<string>('transparent');
  const [hardware, setHardware] = useState<HardwareSupport | null>(null);

  // Copy & Action feedback
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Hardware detection on mount
  useEffect(() => {
    detectHardwareCapabilities().then((hw) => {
      setHardware(hw);
    });
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      if (result?.transparentUrl) URL.revokeObjectURL(result.transparentUrl);
    };
  }, [sourcePreviewUrl, result]);

  // Execute Background Removal
  const executeProcess = async (file: File | Blob, previewUrl: string) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProgress({
      status: 'downloading',
      stage: 'preparing-model',
      message: 'Mempersiapkan model...',
      progress: 0,
    });

    // Yield control so React mounts the ProcessingView and renders spinners smoothly before heavy async work
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const res = await backgroundRemover.removeBackground(
        file,
        {
          modelVariant,
          forceDevice,
          maxDimension,
        },
        (prog) => setProgress(prog)
      );
      setResult(res);
    } catch (err: any) {
      console.error('[BackgroundRemover] Error:', err);
      setErrorMessage(
        err?.message || 'Model gagal dipersiapkan. Silakan coba lagi.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file selection: Lazily start model loading and processing upon selecting an image
  const handleFileSelected = (file: File | Blob, previewUrl: string) => {
    setErrorMessage(null);
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    if (result?.transparentUrl) URL.revokeObjectURL(result.transparentUrl);
    setResult(null);

    setSelectedFile(file);
    setSourcePreviewUrl(previewUrl);

    // Calculate natural image dimensions
    const img = new Image();
    img.onload = () => {
      setFileDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = previewUrl;

    // Automatically trigger lazy model preparation and inference
    executeProcess(file, previewUrl);
  };

  // Retry processing after failure
  const handleRetry = () => {
    if (selectedFile && sourcePreviewUrl) {
      executeProcess(selectedFile, sourcePreviewUrl);
    }
  };

  // Reset / Change Image
  const handleReset = () => {
    backgroundRemover.abort();
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    if (result?.transparentUrl) URL.revokeObjectURL(result.transparentUrl);
    setSelectedFile(null);
    setSourcePreviewUrl(null);
    setResult(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  // Run Background Removal manually (e.g. if settings changed)
  const handleStartProcessing = () => {
    if (selectedFile && sourcePreviewUrl) {
      executeProcess(selectedFile, sourcePreviewUrl);
    }
  };

  // Cancel processing
  const handleCancel = () => {
    backgroundRemover.abort();
    setIsProcessing(false);
    setProgress({ status: 'idle', message: '' });
  };

  // Download Transparent PNG
  const handleDownloadPng = () => {
    if (!result) return;
    const filename = `background-removed-${Date.now()}.png`;
    triggerDownload(result.transparentBlob, filename);
  };

  // Download with solid background (white or custom)
  const handleDownloadSolid = async () => {
    if (!result) return;
    setIsDownloading(true);
    try {
      const color = activeBgColor === 'transparent' ? '#FFFFFF' : activeBgColor;
      const solidBlob = await createSolidBackgroundBlob(
        result.transparentUrl,
        color,
        result.width,
        result.height,
        'image/jpeg',
        0.95
      );
      const filename = `photo-bg-${color.replace('#', '')}-${Date.now()}.jpg`;
      triggerDownload(solidBlob, filename);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    if (!result) return;
    try {
      await copyImageToClipboard(result.transparentBlob);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      setErrorMessage('Browser Anda tidak mengizinkan penulisan gambar ke clipboard.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          <span>BiRefNet / RMBG AI • 100% Client-Side</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Background Remover
        </h1>

        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Hapus background foto secara instan langsung di peramban Anda menggunakan akselerasi WebGPU & WebAssembly. Tanpa server, tanpa kuota, dan privasi foto 100% terlindungi.
        </p>
      </div>

      {/* HARDWARE ACCELERATION STATUS BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 text-xs">
        <div className="flex items-center gap-2">
          {hardware?.webgpu ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-amber-500" />
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Cpu className="h-3.5 w-3.5" />
            </span>
          )}

          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {hardware?.webgpu
                ? `Akselerasi WebGPU Aktif (${hardware.gpuName || 'GPU Hardware'})`
                : 'Akselerasi WASM CPU Aktif (WebAssembly Multi-threading)'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 ml-1.5 hidden sm:inline">
              • Model di-load saat diproses
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Zero Server Upload</span>
        </div>
      </div>

      {/* ERROR ALERT (When no file selected) */}
      {errorMessage && !selectedFile && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:border-rose-900/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Perhatian: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* MAIN WORKFLOW VIEWS */}
      {/* 1. UPLOAD VIEW (No image selected yet) */}
      {!selectedFile && (
        <div className="space-y-8">
          <UploadDropzone onFileSelected={handleFileSelected} />

          {/* Engine Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Privasi Penuh 100%</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Foto Anda tidak pernah dikirim ke cloud atau disimpan di server mana pun. Semua komputasi berjalan di RAM lokal peramban Anda.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Teknologi WebGPU & WASM</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Menggunakan ONNX Runtime Web dengan pipeline BiRefNet / RMBG untuk isolasi subjek, rambut, dan siluet objek berpresisi tinggi.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span>Resolusi Asli PNG</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Hasil ekspor transparan tanpa kompresi buram, siap digunakan untuk pas foto, desain grafis, e-commerce, atau dokumen PDF.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROCESSING VIEW / ERROR VIEW */}
      {(isProcessing || (errorMessage && !result)) && sourcePreviewUrl && (
        <ProcessingView
          progress={progress}
          sourcePreviewUrl={sourcePreviewUrl}
          onCancel={handleReset}
          onRetry={handleRetry}
          isError={Boolean(errorMessage)}
          errorMessage={errorMessage || undefined}
        />
      )}

      {/* 3. READY TO PROCESS VIEW (Image selected, awaiting manual click if user cancelled) */}
      {selectedFile && sourcePreviewUrl && !isProcessing && !result && !errorMessage && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                <img
                  src={sourcePreviewUrl}
                  alt="Selected preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Foto Siap Diproses
                </h3>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                  {fileDimensions && (
                    <span>
                      {fileDimensions.width} × {fileDimensions.height} px
                    </span>
                  )}
                  {selectedFile instanceof File && (
                    <>
                      <span>•</span>
                      <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Ganti Foto
            </button>
          </div>

          {/* Settings & Quality Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model Architecture Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-violet-500" />
                <span>Model AI</span>
              </label>
              <select
                value={modelVariant}
                onChange={(e) => setModelVariant(e.target.value as ModelVariant)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="rmbg-1.4">
                  RMBG-1.4 (Rekomendasi: Cepat & Hemat RAM)
                </option>
                <option value="birefnet">
                  BiRefNet ONNX (Presisi Ultra-Detail)
                </option>
              </select>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                RMBG-1.4 optimal untuk foto portrait, manusia, dan produk dengan waktu proses singkat.
              </p>
            </div>

            {/* Performance Mode / Mobile RAM Safe */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-emerald-500" />
                <span>Resolusi Inferensi</span>
              </label>
              <select
                value={maxDimension}
                onChange={(e) => setMaxDimension(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={0}>Resolusi Penuh (Kualitas Maksimum)</option>
                <option value={1600}>
                  Mode Hemat RAM (Maks 1600px - Stabil untuk Ponsel)
                </option>
              </select>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Hasil akhir tetap mempertahankan ketajaman piksel foto asli Anda.
              </p>
            </div>
          </div>

          {/* Process Trigger Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleStartProcessing}
              className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[240px] px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md transition-all duration-200"
              id="btn-start-bg-remover"
            >
              <Sparkles className="h-4 w-4" />
              <span>Hapus Background Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. RESULT VIEW (Background removed successfully) */}
      {result && (
        <div className="space-y-6">
          {/* Compare Slider Component */}
          <CompareSlider
            originalUrl={result.originalUrl}
            transparentUrl={result.transparentUrl}
            width={result.width}
            height={result.height}
            onColorChange={(color) => setActiveBgColor(color)}
          />

          {/* Action & Download Toolbar */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <span>Diproses dalam </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {(result.processingTimeMs / 1000).toFixed(1)}s
                </span>
                <span> via </span>
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {result.runtimeUsed === 'webgpu' ? 'WebGPU' : 'WASM (CPU)'}
                </span>
                <span> • Dimensi: {result.width} × {result.height} px</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Proses Foto Lain</span>
              </button>
            </div>

            {/* Action Buttons: Download & Utilities */}
            <div className="space-y-2.5">
              {/* Primary Downloads Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Primary: Download Transparent PNG */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 sm:py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150"
                  id="btn-download-png"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download PNG Transparan</span>
                </button>

                {/* 2. Secondary: Download Solid Color JPG */}
                <button
                  type="button"
                  onClick={handleDownloadSolid}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 sm:py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 text-xs sm:text-sm font-semibold transition-all duration-150 disabled:opacity-50"
                  id="btn-download-solid-jpg"
                >
                  <Download className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    Download JPG ({activeBgColor === 'transparent' ? 'Latar Putih' : 'Latar Warna'})
                  </span>
                </button>
              </div>

              {/* Utility Tools Row: Salin & Jadikan PDF */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 3. Salin ke Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs"
                  title="Salin PNG ke Clipboard"
                  id="btn-copy-clipboard"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5] shrink-0" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                        Tersalin!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span className="truncate">Salin Gambar</span>
                    </>
                  )}
                </button>

                {/* 4. Jadikan PDF */}
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs"
                  title="Buka di PDF Workspace"
                  id="btn-convert-to-pdf"
                >
                  <Layers className="h-4 w-4 text-sky-500 shrink-0" />
                  <span className="truncate">Jadikan PDF</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ & GUIDANCE SECTION - Directly readable without clicking */}
      <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <HelpCircle className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Panduan & Pertanyaan Umum AI Background Remover
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {[
            {
              q: 'Bagaimana cara kerja AI Background Remover tanpa mengirim foto ke server?',
              a: 'Aplikasi ini mengeksekusi model neural network (BiRefNet / RMBG-1.4) langsung di peramban web Anda menggunakan teknologi ONNX Runtime Web. Jika perangkat Anda mendukung WebGPU, pemrosesan akan dipercepat oleh kartu grafis lokal. Jika tidak, sistem otomatis beralih ke WebAssembly (WASM) multi-threading.',
            },
            {
              q: 'Apakah foto pengguna disimpan atau dipakai untuk pelatihan AI?',
              a: 'Sama sekali tidak. Foto Anda 100% diproses di memori RAM lokal peramban. Tidak ada piksel foto yang diunggah ke internet, server cloud, atau pihak ketiga. Privasi foto Anda terjamin aman sepenuhnya.',
            },
            {
              q: 'Mengapa pemrosesan pertama membutuhkan waktu beberapa detik?',
              a: 'Pada proses pertama kali, peramban mengunduh bobot model AI terkompresi dan menyimpannya di cache peramban lokal (IndexedDB / Cache API). Setelah tersimpan di cache, proses berikutnya akan berjalan instan bahkan tanpa koneksi internet yang cepat.',
            },
            {
              q: 'Bagaimana cara mendapatkan hasil terbaik untuk subjek foto?',
              a: 'Model BiRefNet & RMBG sangat handal mendeteksi subjek manusia, rambut, pakaian, hewan peliharaan, serta objek produk (sepatu, tas, barang e-commerce). Pastikan pencahayaan cukup dan subjek utama memiliki kontras yang jelas dengan latar belakang.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 space-y-2"
            >
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-start gap-2 leading-snug">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item.q}</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
