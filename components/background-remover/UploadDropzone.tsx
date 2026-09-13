'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileImage,
  Layers,
} from 'lucide-react';

interface UploadDropzoneProps {
  onFileSelected: (file: File | Blob, previewUrl: string) => void;
  disabled?: boolean;
}

const SAMPLE_IMAGES = [
  {
    id: 'portrait',
    title: 'Potret',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    desc: 'Wajah & Rambut Detail',
  },
  {
    id: 'product',
    title: 'Produk',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    desc: 'Sepatu / Objek Tajam',
  },
  {
    id: 'car',
    title: 'Kendaraan',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    desc: 'Mobil / Refleksi',
  },
];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);

    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage(
        'Format berkas tidak didukung. Mohon gunakan format JPG, PNG, atau WEBP.'
      );
      return;
    }

    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      setErrorMessage(
        'Ukuran berkas terlalu besar (maksimum 25MB).'
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onFileSelected(file, previewUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const loadSample = async (sample: (typeof SAMPLE_IMAGES)[0]) => {
    if (disabled) return;
    setLoadingSample(sample.id);
    setErrorMessage(null);
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}-sample.jpg`, {
        type: 'image/jpeg',
      });
      const previewUrl = URL.createObjectURL(blob);
      onFileSelected(file, previewUrl);
    } catch (err) {
      setErrorMessage('Gagal memuat contoh gambar. Silakan coba unggah foto dari perangkat Anda.');
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
            : isDragOver
            ? 'border-violet-500 bg-violet-50/70 dark:border-violet-500 dark:bg-violet-950/20 shadow-lg scale-[1.005]'
            : 'border-zinc-300 hover:border-violet-400 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 shadow-xs hover:shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 mb-4 transition-transform group-hover:scale-105">
          <UploadCloud className="h-8 w-8 stroke-[1.75]" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Tarik & Lepaskan Foto ke Sini
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
          atau klik untuk memilih foto dari galeri/folder komputer Anda
        </p>

        <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors">
          <ImageIcon className="h-4 w-4" />
          <span>Pilih Foto</span>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>Format: JPG, PNG, WEBP</span>
          <span>•</span>
          <span>Maks 25MB</span>
          <span>•</span>
          <span>100% di Browser</span>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/90 dark:border-rose-900/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Sample Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span>Atau coba dengan foto contoh:</span>
          </span>
          <span className="text-[11px] text-zinc-400">1-Klik Langsung Test</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={disabled || loadingSample !== null}
              onClick={() => loadSample(sample)}
              className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200/80 bg-white hover:border-violet-300 hover:bg-violet-50/40 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60 text-left transition-all group disabled:opacity-50"
            >
              <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {sample.title}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {sample.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
