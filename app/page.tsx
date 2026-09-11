'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
  Files,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { UploadZone } from '@/components/UploadZone';
import { ImageGrid } from '@/components/ImageGrid';
import { PdfSettings } from '@/components/PdfSettings';
import { ProcessingDialog } from '@/components/ProcessingDialog';
import { ResultCard } from '@/components/ResultCard';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { Footer } from '@/components/Footer';
import { InfoModal } from '@/components/InfoModal';
import {
  ImageItem,
  revokeImageItem,
  createImageItem,
  MAX_IMAGES_COUNT,
} from '@/lib/image';
import {
  PdfSettingsConfig,
  DEFAULT_PDF_SETTINGS,
  GeneratedPdfResult,
  generatePdfFromImages,
} from '@/lib/pdf';

export default function PhotoToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pdfSettings, setPdfSettings] = useState<PdfSettingsConfig>(
    DEFAULT_PDF_SETTINGS
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [result, setResult] = useState<GeneratedPdfResult | null>(null);
  const [previewItem, setPreviewItem] = useState<ImageItem | null>(null);
  const [infoModalType, setInfoModalType] = useState<
    'how-it-works' | 'privacy' | null
  >(null);
  const [appError, setAppError] = useState<string | null>(null);

  const fileInputHiddenRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(revokeImageItem);
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [images, result]);

  // Handle adding new images
  const handleImagesAdded = (newItems: ImageItem[]) => {
    setAppError(null);
    setImages((prev) => {
      const combined = [...prev, ...newItems];
      if (combined.length > MAX_IMAGES_COUNT) {
        setAppError(
          `Only the first ${MAX_IMAGES_COUNT} images are retained.`
        );
        return combined.slice(0, MAX_IMAGES_COUNT);
      }
      return combined;
    });
  };

  // Add more trigger
  const handleAddMoreClick = () => {
    fileInputHiddenRef.current?.click();
  };

  const handleHiddenFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems: ImageItem[] = [];
      for (const file of files) {
        try {
          const item = await createImageItem(file);
          newItems.push(item);
        } catch {
          // ignore corrupted single files
        }
      }
      if (newItems.length > 0) {
        handleImagesAdded(newItems);
      }
      e.target.value = '';
    }
  };

  // Rotate single image 90 deg CCW
  const handleRotateLeft = (id: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === id) {
          const newRot = ((img.rotation - 90 + 360) % 360) as
            | 0
            | 90
            | 180
            | 270;
          return { ...img, rotation: newRot };
        }
        return img;
      })
    );
  };

  // Rotate single image 90 deg CW
  const handleRotateRight = (id: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === id) {
          const newRot = ((img.rotation + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...img, rotation: newRot };
        }
        return img;
      })
    );
  };

  // Rotate all images 90 deg CW
  const handleRotateAllCW = () => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        rotation: ((img.rotation + 90) % 360) as 0 | 90 | 180 | 270,
      }))
    );
  };

  // Remove single image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) revokeImageItem(target);
      return prev.filter((img) => img.id !== id);
    });
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach(revokeImageItem);
    setImages([]);
    setResult(null);
    setAppError(null);
  };

  // Reorder images
  const handleReorder = (startIndex: number, endIndex: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(startIndex, 1);
      copy.splice(endIndex, 0, removed);
      return copy;
    });
  };

  // Create PDF
  const handleCreatePdf = async () => {
    if (images.length === 0) {
      setAppError('Please add at least one image to create a PDF.');
      return;
    }

    setAppError(null);
    setIsProcessing(true);
    setProgress(5);
    setProgressStage('Initializing PDF engine...');

    try {
      // Clean up previous result URL if any
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      const generated = await generatePdfFromImages(
        images,
        pdfSettings,
        (pct, stageText) => {
          setProgress(pct);
          setProgressStage(stageText);
        }
      );

      setResult(generated);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to create the PDF. Please try fewer or smaller images.';
      setAppError(msg);
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Back to edit
  const handleBackToEdit = () => {
    setResult(null);
  };

  // Create another (reset)
  const handleCreateAnother = () => {
    handleClearAll();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 transition-colors">
      {/* Hidden input for adding more files */}
      <input
        ref={fileInputHiddenRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleHiddenFileInputChange}
        aria-label="Add more image files"
        id="hidden-add-more-input"
      />

      {/* Navigation Bar */}
      <Navbar
        onOpenHowItWorks={() => setInfoModalType('how-it-works')}
        onOpenPrivacy={() => setInfoModalType('privacy')}
      />

      {/* Main Container */}
      <main className="flex-1 w-full" id="convert">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Error Banner if any */}
          {appError && (
            <div
              className="mb-6 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
              id="global-error-banner"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{appError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppError(null)}
                className="text-red-500 hover:text-red-800 dark:hover:text-red-200 ml-4 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* VIEW 1: Result Screen */}
          {result ? (
            <div className="py-4">
              <ResultCard
                result={result}
                settings={pdfSettings}
                onDownload={handleDownloadPdf}
                onCreateAnother={handleCreateAnother}
                onBackToEdit={handleBackToEdit}
              />
            </div>
          ) : images.length > 0 ? (
            /* VIEW 2: Active Workspace with Images and Settings */
            <div className="space-y-6">
              {/* Workspace Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    PDF Workspace
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Reorder, rotate, adjust layout, and generate your PDF.
                  </p>
                </div>
              </div>

              {/* Two-column layout on Desktop, Single-column on Mobile */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Area: Images Grid (8 of 12 cols on desktop) */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  <ImageGrid
                    items={images}
                    onRotateLeft={handleRotateLeft}
                    onRotateRight={handleRotateRight}
                    onRotateAllCW={handleRotateAllCW}
                    onRemove={handleRemoveImage}
                    onClearAll={handleClearAll}
                    onReorder={handleReorder}
                    onAddMoreClick={handleAddMoreClick}
                    onPreview={(item) => setPreviewItem(item)}
                  />
                </div>

                {/* Right Area: PDF Settings (5 of 12 cols on desktop) */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <div className="lg:sticky lg:top-20 space-y-4">
                    <PdfSettings
                      settings={pdfSettings}
                      onChange={setPdfSettings}
                      onCreatePdf={handleCreatePdf}
                      disabled={isProcessing}
                      imageCount={images.length}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur-md dark:border-zinc-800 dark:bg-[#09090b]/95 lg:hidden">
                <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {images.length}
                    </span>{' '}
                    {images.length === 1 ? 'image' : 'images'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreatePdf}
                    disabled={isProcessing}
                    id="mobile-sticky-create-pdf-btn"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Create PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 3: Clean Landing & Upload Interface */
            <div className="flex flex-col items-center justify-center py-6 sm:py-12">
              {/* Minimal Hero Section */}
              <div className="mx-auto max-w-2xl text-center space-y-3 mb-8 sm:mb-10">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>100% Client-Side • Private by Design</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Photo to PDF
                </h1>

                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  Convert your images into a PDF quickly, privately, and securely. Your photos never leave your device.
                </p>
              </div>

              {/* Upload Card */}
              <div className="w-full max-w-2xl">
                <UploadZone
                  onImagesAdded={handleImagesAdded}
                  currentCount={images.length}
                />
              </div>

              {/* PDF Converter Suite Quick Banner - Positioned Above Zero Server Storage */}
              <div className="mt-6 w-full max-w-2xl">
                <Link
                  href="/convert"
                  className="group relative block overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
                  id="home-banner-converter-suite"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-100 mt-0.5">
                        <Files className="h-4.5 w-4.5 text-zinc-700 dark:text-zinc-300" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Looking for more formats?
                          </h3>
                          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            13 Tools
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Convert Word, Excel, PowerPoint, HTML, PDF to Images, and PDF/A standards.
                        </p>

                        {/* Format tags */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {['DOCX', 'XLSX', 'PPTX', 'HTML', 'PDF to Image', 'PDF/A'].map((fmt) => (
                            <span
                              key={fmt}
                              className="rounded border border-zinc-200/70 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                            >
                              {fmt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1 sm:pt-0 shrink-0">
                      <span className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all group-hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-white">
                        <span>Open PDF Converter</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Developer-Tool Minimal Specs & Trust Grid */}
              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                    <ShieldCheck className="h-4 w-4 text-zinc-500" />
                    <span>Zero Server Storage</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Everything runs in browser memory. No backend uploads or data collection.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                    <Zap className="h-4 w-4 text-zinc-500" />
                    <span>High Performance</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Instant rendering with canvas compression and lossless embedding via pdf-lib.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                    <Layers className="h-4 w-4 text-zinc-500" />
                    <span>Layout Control</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    A4, A5, Letter, Legal, rotation, custom margins, and aspect ratio fitting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Processing Dialog */}
      <ProcessingDialog
        isOpen={isProcessing}
        progress={progress}
        stage={progressStage}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        item={previewItem}
        items={images}
        onClose={() => setPreviewItem(null)}
        onSelectNext={(next) => setPreviewItem(next)}
        onSelectPrev={(prev) => setPreviewItem(prev)}
      />

      {/* Info & Privacy Dialogs */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      {/* Footer */}
      <Footer
        onOpenHowItWorks={() => setInfoModalType('how-it-works')}
        onOpenPrivacy={() => setInfoModalType('privacy')}
      />
    </div>
  );
}
