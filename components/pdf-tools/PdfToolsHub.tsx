'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import {
  FileText,
  UploadCloud,
  Layers,
  ArrowUpDown,
  RotateCw,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  Shield,
  Lock,
  Unlock,
  Wrench,
  Hash,
  Crop,
  GitCompare,
  Sliders,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileArchive,
  Download,
  Files,
  RefreshCw,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ConverterHub } from '@/components/converter/ConverterHub';
import { isValidToolId } from '@/lib/converters/tools-meta';
import { PDF_TOOLS_META, getPdfToolMeta } from '@/lib/pdf-tools/tools-meta';
import {
  PdfToolId,
  PdfToolExecutionResult,
  ProgressStatus,
  PageThumbnailItem,
} from '@/lib/pdf-tools/types';
import { PdfToolIcon } from './PdfToolIcons';
import { PdfToolsGrid } from './PdfToolsGrid';
import { PdfToolResult } from './PdfToolResult';
import { PdfProcessingModal } from './PdfProcessingModal';
import { SignaturePad } from './SignaturePad';
import { renderAllThumbnails, getPdfDocument } from '@/lib/pdf-tools/pdf-renderer';

// Import core processing functions
import { mergePdfFiles } from '@/lib/pdf-tools/mergePdf';
import { splitPdfFile, SplitMode } from '@/lib/pdf-tools/splitPdf';
import { compressPdfFile, CompressionLevel } from '@/lib/pdf-tools/compressPdf';
import { exportOrganizedPdf, OrganizePageSpec } from '@/lib/pdf-tools/organizePdf';
import { rotatePdfFile, RotationAngle, RotationTarget } from '@/lib/pdf-tools/rotatePdf';
import { deletePagesFromPdf } from '@/lib/pdf-tools/deletePagesPdf';
import { extractPagesFromPdf } from '@/lib/pdf-tools/extractPagesPdf';
import { applyEditsToPdf, EditItem } from '@/lib/pdf-tools/editPdf';
import { applyWatermarkToPdf, WatermarkPosition } from '@/lib/pdf-tools/watermarkPdf';
import { applySignatureToPdf, SignaturePlacement } from '@/lib/pdf-tools/signPdf';
import { protectPdfFile } from '@/lib/pdf-tools/protectPdf';
import { unlockPdfFile } from '@/lib/pdf-tools/unlockPdf';
import { repairPdfFile } from '@/lib/pdf-tools/repairPdf';
import { addPageNumbersToPdf, PageNumberPosition, PageNumberFormat } from '@/lib/pdf-tools/pageNumberPdf';
import { cropPdfFile } from '@/lib/pdf-tools/cropPdf';
import { comparePdfDocuments, compareSinglePage, DocumentCompareSummary } from '@/lib/pdf-tools/comparePdf';

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const PdfToolsHub: React.FC = () => {
  const searchParams = useSearchParams();
  const suiteParam = searchParams.get('suite');
  const toolParam = searchParams.get('tool');

  const [activeSuite, setActiveSuite] = useState<'pdf-tools' | 'converters'>(() => {
    if (suiteParam === 'converters' || (toolParam && isValidToolId(toolParam))) {
      return 'converters';
    }
    return 'pdf-tools';
  });

  const [activeToolId, setActiveToolId] = useState<PdfToolId>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [compareFileB, setCompareFileB] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressStatus>({ percent: 0, stage: '' });
  const [result, setResult] = useState<PdfToolExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loaded thumbnails for single document tools
  const [thumbnails, setThumbnails] = useState<PageThumbnailItem[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreFileInputRef = useRef<HTMLInputElement>(null);
  const compareFileBInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Tool Specific States
  // 1. Merge
  const [mergeFilename, setMergeFilename] = useState('dokumen-gabungan.pdf');

  // 2. Split
  const [splitMode, setSplitMode] = useState<SplitMode>('every-page');
  const [splitRangesText, setSplitRangesText] = useState('1-2, 3-4');
  const [selectedSplitPages, setSelectedSplitPages] = useState<number[]>([]);

  // 3. Compress
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');

  // 4. Organize
  const [organizedPages, setOrganizedPages] = useState<
    (OrganizePageSpec & { dataUrl?: string; originalNum: number })[]
  >([]);

  // 5. Rotate
  const [rotateAngle, setRotateAngle] = useState<RotationAngle>(90);
  const [rotateTarget, setRotateTarget] = useState<RotationTarget>('all');
  const [selectedRotatePages, setSelectedRotatePages] = useState<number[]>([]);

  // 6. Delete Pages
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]);
  const [deleteRangesInput, setDeleteRangesInput] = useState('');

  // 7. Extract Pages
  const [extractMode, setExtractMode] = useState<'single-file' | 'separate-files'>('single-file');
  const [extractRangesText, setExtractRangesText] = useState('1');
  const [selectedExtractPages, setSelectedExtractPages] = useState<number[]>([]);

  // 8. Edit PDF
  const [activeEditPage, setActiveEditPage] = useState(0);
  const [editText, setEditText] = useState('Catatan Baru');
  const [editFontSize, setEditFontSize] = useState(16);
  const [editColor, setEditColor] = useState('#ef4444');
  const [editItems, setEditItems] = useState<EditItem[]>([]);

  // 9. Watermark
  const [wmType, setWmType] = useState<'text' | 'image'>('text');
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFontSize, setWmFontSize] = useState(48);
  const [wmColor, setWmColor] = useState('#64748b');
  const [wmOpacity, setWmOpacity] = useState(0.35);
  const [wmRotation, setWmRotation] = useState(-45);
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>('center');
  const [wmImageFile, setWmImageFile] = useState<File | null>(null);

  // 10. Sign PDF
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signDate, setSignDate] = useState(new Date().toLocaleDateString('id-ID'));
  const [signPageNum, setSignPageNum] = useState(1);
  const [signX, setSignX] = useState(150);
  const [signY, setSignY] = useState(150);
  const [signScale, setSignScale] = useState(1);

  // 11. Protect PDF
  const [protectPassword, setProtectPassword] = useState('');
  const [protectConfirmPassword, setProtectConfirmPassword] = useState('');
  const [protectAllowPrint, setProtectAllowPrint] = useState(true);
  const [protectAllowCopy, setProtectAllowCopy] = useState(false);

  // 12. Unlock PDF
  const [unlockPassword, setUnlockPassword] = useState('');

  // 14. Page Numbers
  const [pnPosition, setPnPosition] = useState<PageNumberPosition>('bottom-center');
  const [pnFormat, setPnFormat] = useState<PageNumberFormat>('page-n-of-total');
  const [pnStartNumber, setPnStartNumber] = useState(1);
  const [pnSkipCover, setPnSkipCover] = useState(false);

  // 15. Crop PDF
  const [cropMarginTop, setCropMarginTop] = useState(30);
  const [cropMarginBottom, setCropMarginBottom] = useState(30);
  const [cropMarginLeft, setCropMarginLeft] = useState(30);
  const [cropMarginRight, setCropMarginRight] = useState(30);
  const [cropTarget, setCropTarget] = useState<'all' | 'current'>('all');

  // 16. Compare PDF
  const [compareDocA, setCompareDocA] = useState<any>(null);
  const [compareDocB, setCompareDocB] = useState<any>(null);
  const [compareSummary, setCompareSummary] = useState<DocumentCompareSummary | null>(null);
  const [compareCurrentPage, setCompareCurrentPage] = useState(1);
  const [compareCanvasA, setCompareCanvasA] = useState<string | null>(null);
  const [compareCanvasB, setCompareCanvasB] = useState<string | null>(null);
  const [compareCanvasDiff, setCompareCanvasDiff] = useState<string | null>(null);
  const [compareShowDiff, setCompareShowDiff] = useState(true);
  const [compareDiffPct, setCompareDiffPct] = useState(0);

  // Complete file reset function to delete/clear active files and reset state
  const handleClearFiles = () => {
    setFiles([]);
    setCompareFileB(null);
    setThumbnails([]);
    setOrganizedPages([]);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreFileInputRef.current) addMoreFileInputRef.current.value = '';
    if (compareFileBInputRef.current) compareFileBInputRef.current.value = '';
  };

  // Select tool and reset files so user is asked to upload fresh file for the new tool
  const handleSelectTool = (id: PdfToolId) => {
    if (id !== activeToolId) {
      setActiveToolId(id);
      setResult(null);
      setErrorMessage(null);
      // Reset files so new tool asks user to upload file again
      setFiles([]);
      setCompareFileB(null);
      setThumbnails([]);
      setOrganizedPages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (addMoreFileInputRef.current) addMoreFileInputRef.current.value = '';
      if (compareFileBInputRef.current) compareFileBInputRef.current.value = '';
    }
    setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Load thumbnails whenever the primary file changes and tool requires visual pages
  useEffect(() => {
    const currentMeta = getPdfToolMeta(activeToolId);
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    if (files.length > 0 && !currentMeta.multipleFiles && activeToolId !== 'repair') {
      timer = setTimeout(() => {
        if (isMounted) setIsLoadingThumbnails(true);
      }, 0);

      (async () => {
        try {
          const buf = await files[0].arrayBuffer();
          const thumbs = await renderAllThumbnails(buf, undefined, 40);
          if (isMounted) {
            setThumbnails(thumbs);
            // Initialize organize pages
            setOrganizedPages(
              thumbs.map((t, idx) => ({
                id: `p-${idx}-${Date.now()}`,
                sourceDocIndex: 0,
                sourcePageIndex: t.originalIndex,
                rotation: 0,
                dataUrl: t.dataUrl,
                originalNum: t.pageNumber,
              }))
            );
          }
        } catch {
          // Password protected or corrupt
        } finally {
          if (isMounted) setIsLoadingThumbnails(false);
        }
      })();

      return () => {
        isMounted = false;
        if (timer) clearTimeout(timer);
      };
    } else {
      timer = setTimeout(() => {
        if (isMounted) {
          setThumbnails([]);
          setOrganizedPages([]);
        }
      }, 0);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [files, activeToolId]);

  // File Upload Handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter((f) => f.type.includes('pdf') || f.name.endsWith('.pdf'));
      if (selected.length === 0) {
        setErrorMessage('Silakan pilih berkas PDF yang valid.');
        return;
      }
      setErrorMessage(null);
      setResult(null);

      const meta = getPdfToolMeta(activeToolId);
      if (meta.multipleFiles) {
        setFiles((prev) => [...prev, ...selected]);
      } else {
        setFiles([selected[0]]);
      }
    }
    // reset input value so re-selecting the same file triggers change
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.includes('pdf') || f.name.endsWith('.pdf'));
      if (dropped.length === 0) {
        setErrorMessage('Hanya berkas PDF yang didukung.');
        return;
      }
      setErrorMessage(null);
      setResult(null);

      const meta = getPdfToolMeta(activeToolId);
      if (meta.multipleFiles) {
        setFiles((prev) => [...prev, ...dropped]);
      } else {
        setFiles([dropped[0]]);
      }
    }
  };

  // Reorder files in Merge
  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Execute processing based on activeToolId
  const handleExecuteTool = async () => {
    if (files.length === 0) {
      setErrorMessage('Silakan pilih berkas PDF terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgress({ percent: 5, stage: 'Memulai proses...' });

    try {
      let res: PdfToolExecutionResult;

      switch (activeToolId) {
        case 'merge': {
          const mergeInputs = files.map((f) => ({ file: f, name: f.name }));
          res = await mergePdfFiles(mergeInputs, mergeFilename, (p) => setProgress(p));
          break;
        }

        case 'split': {
          res = await splitPdfFile(
            files[0],
            {
              mode: splitMode,
              rangesText: splitRangesText,
              selectedPages: selectedSplitPages,
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'compress': {
          res = await compressPdfFile(
            files[0],
            { level: compressionLevel },
            (p) => setProgress(p)
          );
          break;
        }

        case 'organize': {
          res = await exportOrganizedPdf(
            files,
            organizedPages.map((p) => ({
              id: p.id,
              sourceDocIndex: p.sourceDocIndex,
              sourcePageIndex: p.sourcePageIndex,
              rotation: p.rotation,
            })),
            'dokumen-diatur.pdf',
            (p) => setProgress(p)
          );
          break;
        }

        case 'rotate': {
          res = await rotatePdfFile(
            files[0],
            {
              angle: rotateAngle,
              target: rotateTarget,
              selectedPages: selectedRotatePages,
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'delete-pages': {
          res = await deletePagesFromPdf(
            files[0],
            pagesToDelete,
            (p) => setProgress(p)
          );
          break;
        }

        case 'extract-pages': {
          res = await extractPagesFromPdf(
            files[0],
            {
              mode: extractMode,
              pagesText: extractRangesText,
              selectedPages: selectedExtractPages,
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'edit': {
          res = await applyEditsToPdf(files[0], editItems, (p) => setProgress(p));
          break;
        }

        case 'watermark': {
          res = await applyWatermarkToPdf(
            files[0],
            {
              type: wmType,
              text: wmText,
              fontSize: wmFontSize,
              color: wmColor,
              opacity: wmOpacity,
              rotation: wmRotation,
              position: wmPosition,
              imageFile: wmImageFile || undefined,
              target: 'all',
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'sign': {
          if (!signatureDataUrl) {
            throw new Error('Silakan buat atau unggah tanda tangan terlebih dahulu.');
          }
          const placement: SignaturePlacement = {
            pageIndex: Math.max(0, signPageNum - 1),
            x: signX,
            y: signY,
            width: 140 * signScale,
            height: 60 * signScale,
            signatureDataUrl,
            signerName: signerName || undefined,
            dateText: signDate || undefined,
          };
          res = await applySignatureToPdf(files[0], [placement], (p) => setProgress(p));
          break;
        }

        case 'protect': {
          res = await protectPdfFile(
            files[0],
            {
              password: protectPassword,
              confirmPassword: protectConfirmPassword,
              allowPrinting: protectAllowPrint,
              allowCopying: protectAllowCopy,
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'unlock': {
          res = await unlockPdfFile(files[0], unlockPassword, (p) => setProgress(p));
          break;
        }

        case 'repair': {
          res = await repairPdfFile(files[0], (p) => setProgress(p));
          break;
        }

        case 'page-numbers': {
          res = await addPageNumbersToPdf(
            files[0],
            {
              position: pnPosition,
              format: pnFormat,
              startNumber: pnStartNumber,
              fontSize: 10,
              margin: 24,
              skipFirstPage: pnSkipCover,
              target: 'all',
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'crop': {
          // Cropbox dimensions calculation
          const firstThumb = thumbnails[0] || { width: 595, height: 842 };
          const cropW = Math.max(50, firstThumb.width - cropMarginLeft - cropMarginRight);
          const cropH = Math.max(50, firstThumb.height - cropMarginTop - cropMarginBottom);

          res = await cropPdfFile(
            files[0],
            {
              cropBox: {
                x: cropMarginLeft,
                y: cropMarginBottom,
                width: cropW,
                height: cropH,
              },
              target: cropTarget,
            },
            (p) => setProgress(p)
          );
          break;
        }

        case 'compare': {
          if (!compareFileB) {
            throw new Error('Pilih dokumen PDF kedua untuk dibandingkan.');
          }
          const cmp = await comparePdfDocuments(files[0], compareFileB, (p) => setProgress(p));
          setCompareDocA(cmp.docA);
          setCompareDocB(cmp.docB);
          setCompareSummary(cmp.summary);
          setCompareCanvasA(cmp.firstPageResult.canvasA.toDataURL());
          setCompareCanvasB(cmp.firstPageResult.canvasB.toDataURL());
          setCompareCanvasDiff(cmp.firstPageResult.diffCanvas.toDataURL());
          setCompareDiffPct(cmp.firstPageResult.diffPercentage);

          res = {
            toolId: 'compare',
            title: 'Perbandingan PDF Selesai',
            items: [
              {
                name: `${files[0].name} vs ${compareFileB.name}`,
                blob: new Blob([]),
                size: files[0].size + compareFileB.size,
                url: '#',
              },
            ],
            stats: {
              differencePercentage: cmp.summary.averageDiffPercentage,
              totalPages: cmp.summary.maxPages,
            },
          };
          break;
        }

        default:
          throw new Error('Alat belum terkonfigurasi.');
      }

      setResult(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kendala saat memproses berkas PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch page in Compare mode
  const handleComparePageChange = async (newPage: number) => {
    if (!compareDocA || !compareDocB) return;
    setCompareCurrentPage(newPage);
    try {
      const res = await compareSinglePage(compareDocA, compareDocB, newPage, 1.4);
      setCompareCanvasA(res.canvasA.toDataURL());
      setCompareCanvasB(res.canvasB.toDataURL());
      setCompareCanvasDiff(res.diffCanvas.toDataURL());
      setCompareDiffPct(res.diffPercentage);
    } catch {
      // ignore
    }
  };

  const currentToolMeta = getPdfToolMeta(activeToolId);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 space-y-8" id="pdf-tools-hub">
      {/* Header section */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          <Lock className="h-3.5 w-3.5 text-emerald-500" />
          <span>100% Client-Side • Private & Fast</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Planner All-in-One PDF & Document Tools
        </h1>
        <p className="max-w-xl text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          29 peralatan lengkap: manipulasi dokumen PDF (16 fitur) dan konversi format dokumen (13 fitur) 100% diproses lokal di peramban Anda.
        </p>

        {/* Suite Category Navigation Switcher */}
        <div className="pt-2 flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveSuite('pdf-tools');
                const url = new URL(window.location.href);
                url.searchParams.set('suite', 'pdf-tools');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSuite === 'pdf-tools'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              id="suite-tab-pdf-tools"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>PDF Tools (16)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSuite('converters');
                const url = new URL(window.location.href);
                url.searchParams.set('suite', 'converters');
                url.searchParams.delete('tool');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSuite === 'converters'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              id="suite-tab-converters"
            >
              <Files className="h-3.5 w-3.5" />
              <span>Format Converter (13)</span>
            </button>
          </div>
        </div>
      </div>

      {activeSuite === 'converters' ? (
        <ConverterHub hideHeader={true} />
      ) : (
        <>
          {/* Tool Selector Section - matches screenshot layout exactly */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 sm:p-6 backdrop-blur-xs dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Select PDF Tool
                </h2>
              </div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Active: <strong className="text-zinc-900 dark:text-zinc-100">{currentToolMeta.name}</strong>
              </span>
            </div>

            <PdfToolsGrid
              activeToolId={activeToolId}
              onSelectTool={handleSelectTool}
            />
          </div>

          {/* 2. ACTIVE TOOL WORKSPACE SECTION */}
          <section
            ref={workspaceRef}
            className="scroll-mt-20 pt-2"
            id="pdf-tool-workspace"
          >
        {/* Workspace Card Container */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 sm:p-7 backdrop-blur-xs dark:border-zinc-800/80 dark:bg-zinc-900/40 shadow-xs transition-all space-y-6">
          {/* Active Tool Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white shadow-2xs text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-100 mt-0.5">
                <PdfToolIcon toolId={activeToolId} size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {currentToolMeta.name}
                  </h3>
                  <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {currentToolMeta.shortLabel}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    100% Client-Side
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {currentToolMeta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs self-start sm:self-auto shrink-0">
              {files.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Ganti dengan berkas baru"
                  >
                    <RefreshCw className="h-3 w-3 text-zinc-500" />
                    <span>Ganti Berkas</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                    title="Hapus berkas dan reset pilihan"
                  >
                    <Trash2 className="h-3 w-3 text-rose-500" />
                    <span>Hapus Berkas</span>
                  </button>
                </>
              )}
              <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                {currentToolMeta.multipleFiles ? 'Multi-dokumen' : 'Dokumen tunggal'}
              </span>
            </div>
          </div>

          {/* Error Alert if any */}
          {errorMessage && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* VIEW A: Result Screen */}
          {result ? (
            <div className="mt-6">
              <PdfToolResult
                result={result}
                onReset={() => {
                  setResult(null);
                  setFiles([]);
                  setCompareFileB(null);
                }}
              />
            </div>
          ) : files.length === 0 ? (
            /* VIEW B: Upload Zone */
            <div className="mt-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex min-h-[220px] sm:min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-6 sm:p-8 text-center transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/20 dark:hover:border-zinc-600"
                id="pdf-tool-upload-dropzone"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="application/pdf"
                  multiple={currentToolMeta.multipleFiles}
                  className="hidden"
                  id="pdf-tool-hidden-file-input"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-2xs group-hover:scale-105 transition-transform dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3">
                  <UploadCloud className="h-6 w-6" />
                </div>

                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentToolMeta.multipleFiles
                    ? 'Pilih atau Tarik Beberapa Berkas PDF ke Sini'
                    : 'Pilih atau Tarik Berkas PDF ke Sini'}
                </div>

                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  {currentToolMeta.multipleFiles
                    ? 'Anda dapat mengunggah beberapa dokumen sekaligus untuk digabungkan secara instan.'
                    : 'Berkas diproses sepenuhnya di peramban Anda tanpa pernah diunggah ke server eksternal.'}
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs group-hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-white transition-colors">
                  <span>Pilih Dokumen PDF</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          ) : (
            /* VIEW C: Interactive Tool Workspace */
            <div className="mt-6 space-y-6">
              {/* Active Files Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30" id="active-files-summary-bar">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200/80 bg-red-50/80 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={files.length === 1 ? files[0].name : `${files.length} berkas PDF terpilih`}>
                      {files.length === 1 ? files[0].name : `${files.length} berkas PDF terpilih`}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Total {formatBytes(files.reduce((a, b) => a + b.size, 0))}
                      {thumbnails.length > 0 && ` • ${thumbnails.length} Halaman`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {currentToolMeta.multipleFiles ? (
                    <>
                      <input
                        type="file"
                        ref={addMoreFileInputRef}
                        onChange={handleFileInputChange}
                        accept="application/pdf"
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => addMoreFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah File</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFiles}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                        title="Hapus semua berkas yang dipilih"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Hapus Semua</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        title="Ganti dengan berkas lain"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Ganti Berkas</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFiles}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors shadow-2xs cursor-pointer"
                        id="summary-bar-delete-file-btn"
                        title="Hapus berkas ini dan pilih berkas baru"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Hapus Berkas</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* TOOL-SPECIFIC WORKSPACE CONTROLS */}
              {/* ---------------------------------------------------- */}

              {/* 1. GABUNGKAN PDF WORKSPACE */}
              {activeToolId === 'merge' && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Urutan Berkas (Gunakan panah untuk mengubah urutan penggabungan):
                  </div>

                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-850"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {idx + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 shrink-0">
                            ({formatBytes(file.size)})
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveFile(idx, 'up')}
                            disabled={idx === 0}
                            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800"
                            title="Pindah ke atas"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFile(idx, 'down')}
                            disabled={idx === files.length - 1}
                            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800"
                            title="Pindah ke bawah"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="rounded-md p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                            title="Hapus berkas"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Nama Berkas Hasil:
                    </label>
                    <input
                      type="text"
                      value={mergeFilename}
                      onChange={(e) => setMergeFilename(e.target.value)}
                      className="w-full sm:w-80 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      placeholder="dokumen-gabungan.pdf"
                    />
                  </div>
                </div>
              )}

              {/* 2. PISAHKAN PDF WORKSPACE */}
              {activeToolId === 'split' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'every-page', label: 'Setiap Halaman', desc: '1 PDF per halaman' },
                      { id: 'ranges', label: 'Rentang Halaman', desc: 'Contoh: 1-3, 4-6' },
                      { id: 'selected', label: 'Halaman Pilihan', desc: 'Pilih halaman tertentu' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSplitMode(m.id as SplitMode)}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          splitMode === m.id
                            ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{m.label}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>

                  {splitMode === 'ranges' && (
                    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 space-y-2">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Ketik rentang pemisahan (pisahkan dengan koma):
                      </label>
                      <input
                        type="text"
                        value={splitRangesText}
                        onChange={(e) => setSplitRangesText(e.target.value)}
                        placeholder="1-2, 3-4, 5-10"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 font-mono"
                      />
                      <p className="text-[11px] text-zinc-500">
                        Format &quot;1-3, 4-6&quot; akan memisahkan PDF menjadi document-1 (halaman 1-3) dan document-2 (halaman 4-6).
                      </p>
                    </div>
                  )}

                  {/* Thumbnail Selection Grid */}
                  {thumbnails.length > 0 && splitMode === 'selected' && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Pilih halaman yang ingin dipisahkan:
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto p-2 border border-zinc-200 rounded-xl dark:border-zinc-800">
                        {thumbnails.map((t) => {
                          const isPicked = selectedSplitPages.includes(t.pageNumber);
                          return (
                            <button
                              key={t.pageNumber}
                              type="button"
                              onClick={() => {
                                setSelectedSplitPages((prev) =>
                                  prev.includes(t.pageNumber)
                                    ? prev.filter((p) => p !== t.pageNumber)
                                    : [...prev, t.pageNumber]
                                );
                              }}
                              className={`relative rounded-lg border p-1 transition-all ${
                                isPicked
                                  ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                                  : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                              }`}
                            >
                              <img src={t.dataUrl} alt={`Halaman ${t.pageNumber}`} className="w-full h-auto rounded-sm object-contain" />
                              <span className="block text-center text-[10px] font-semibold mt-1 text-zinc-700 dark:text-zinc-300">
                                Hal {t.pageNumber}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. KOMPRES PDF WORKSPACE */}
              {activeToolId === 'compress' && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Pilih Tingkat Kompresi:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        level: 'recommended',
                        title: 'Recommended',
                        subtitle: 'Keseimbangan Kualitas & Ukuran',
                        badge: 'Direkomendasikan',
                      },
                      {
                        level: 'extreme',
                        title: 'Extreme',
                        subtitle: 'Kompresi Tinggi (Ukuran terkecil)',
                        badge: 'Paling Kecil',
                      },
                      {
                        level: 'low',
                        title: 'Low Compression',
                        subtitle: 'Kualitas Gambar Tertinggi',
                        badge: 'Resolusi Tajam',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.level}
                        type="button"
                        onClick={() => setCompressionLevel(opt.level as CompressionLevel)}
                        className={`p-4 text-left rounded-xl border transition-all ${
                          compressionLevel === opt.level
                            ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800 shadow-2xs ring-1 ring-zinc-900/10 dark:ring-zinc-100/10'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                      >
                        <span className="inline-block rounded bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          {opt.badge}
                        </span>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{opt.title}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{opt.subtitle}</div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/75 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">Ukuran dokumen asli:</span>{' '}
                    {formatBytes(files[0].size)} • Hasil kompresi dihitung dari berkas riil.
                  </div>
                </div>
              )}

              {/* 4. ATUR PDF WORKSPACE */}
              {activeToolId === 'organize' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Atur urutan, putar, duplikat, atau hapus halaman:</span>
                    <span>{organizedPages.length} Halaman Aktif</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-3 border border-zinc-200 rounded-xl dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                    {organizedPages.map((page, idx) => (
                      <div
                        key={page.id}
                        className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800 shadow-2xs"
                      >
                        {/* Thumbnail image with rotation */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                          {page.dataUrl ? (
                            <img
                              src={page.dataUrl}
                              alt={`Halaman ${page.originalNum}`}
                              className="h-full w-full object-contain transition-transform"
                              style={{ transform: `rotate(${page.rotation}deg)` }}
                            />
                          ) : (
                            <FileText className="h-8 w-8 text-zinc-400" />
                          )}

                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Controls Toolbar */}
                        <div className="mt-2 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                          {/* Move left */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              setOrganizedPages((prev) => {
                                const copy = [...prev];
                                const temp = copy[idx];
                                copy[idx] = copy[idx - 1];
                                copy[idx - 1] = temp;
                                return copy;
                              });
                            }}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-20"
                            title="Geser ke kiri"
                          >
                            ◀
                          </button>

                          {/* Rotate 90 deg */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrganizedPages((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
                              );
                            }}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sky-600 dark:text-sky-400"
                            title="Putar 90°"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrganizedPages((prev) => {
                                const copy = [...prev];
                                copy.splice(idx + 1, 0, {
                                  ...page,
                                  id: `p-${Date.now()}-${Math.random()}`,
                                });
                                return copy;
                              });
                            }}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-purple-600 dark:text-purple-400"
                            title="Duplikat halaman"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Move right */}
                          <button
                            type="button"
                            disabled={idx === organizedPages.length - 1}
                            onClick={() => {
                              setOrganizedPages((prev) => {
                                const copy = [...prev];
                                const temp = copy[idx];
                                copy[idx] = copy[idx + 1];
                                copy[idx + 1] = temp;
                                return copy;
                              });
                            }}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-20"
                            title="Geser ke kanan"
                          >
                            ▶
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={organizedPages.length <= 1}
                            onClick={() => {
                              setOrganizedPages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 disabled:opacity-20"
                            title="Hapus halaman"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. PUTAR PDF WORKSPACE */}
              {activeToolId === 'rotate' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Pilih Sudut Putar:
                    </label>
                    <div className="flex items-center gap-2">
                      {[90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setRotateAngle(deg as RotationAngle)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            rotateAngle === deg
                              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                              : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Terapkan Ke:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'all', label: 'Semua Halaman' },
                        { id: 'odd', label: 'Halaman Ganjil' },
                        { id: 'even', label: 'Halaman Genap' },
                        { id: 'selected', label: 'Pilih Halaman' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setRotateTarget(t.id as RotationTarget)}
                          className={`py-2 px-3 rounded-lg border text-xs transition-all ${
                            rotateTarget === t.id
                              ? 'border-zinc-900 bg-zinc-100 font-semibold text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100'
                              : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-400'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Preview */}
                  {thumbnails.length > 0 && (
                    <div className="p-4 border border-zinc-200 rounded-xl dark:border-zinc-800 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-[11px] text-zinc-400 mb-2">Pratinjau Halaman 1</div>
                        <img
                          src={thumbnails[0].dataUrl}
                          alt="Pratinjau Rotasi"
                          className="h-44 w-auto rounded border border-zinc-300 dark:border-zinc-700 object-contain transition-transform duration-300"
                          style={{ transform: `rotate(${rotateAngle}deg)` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. HAPUS HALAMAN WORKSPACE */}
              {activeToolId === 'delete-pages' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Ketik nomor halaman yang ingin dihapus (contoh: 2, 5, 8) atau klik thumbnail di bawah:
                    </label>
                    <input
                      type="text"
                      value={deleteRangesInput}
                      onChange={(e) => {
                        setDeleteRangesInput(e.target.value);
                        const nums = e.target.value
                          .split(',')
                          .map((s) => parseInt(s.trim(), 10))
                          .filter((n) => !isNaN(n));
                        setPagesToDelete(nums);
                      }}
                      placeholder="Contoh: 2, 5, 8"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  {thumbnails.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-2 border border-zinc-200 rounded-xl dark:border-zinc-800">
                      {thumbnails.map((t) => {
                        const isMarked = pagesToDelete.includes(t.pageNumber);
                        return (
                          <button
                            key={t.pageNumber}
                            type="button"
                            onClick={() => {
                              setPagesToDelete((prev) =>
                                prev.includes(t.pageNumber)
                                  ? prev.filter((p) => p !== t.pageNumber)
                                  : [...prev, t.pageNumber]
                              );
                              setDeleteRangesInput((prev) => {
                                const current = prev.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);
                                const updated = current.includes(t.pageNumber)
                                  ? current.filter((p) => p !== t.pageNumber)
                                  : [...current, t.pageNumber];
                                return updated.join(', ');
                              });
                            }}
                            className={`relative rounded-lg border p-1 transition-all ${
                              isMarked
                                ? 'border-rose-500 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40 ring-2 ring-rose-500/20 opacity-75'
                                : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                            }`}
                          >
                            <img src={t.dataUrl} alt={`Halaman ${t.pageNumber}`} className="w-full h-auto rounded-sm object-contain" />
                            {isMarked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-rose-600/30 rounded-lg">
                                <Trash2 className="h-6 w-6 text-white drop-shadow" />
                              </div>
                            )}
                            <span className="block text-center text-[10px] font-semibold mt-1 text-zinc-700 dark:text-zinc-300">
                              Hal {t.pageNumber}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 7. EKSTRAK HALAMAN WORKSPACE */}
              {activeToolId === 'extract-pages' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={extractMode === 'single-file'}
                        onChange={() => setExtractMode('single-file')}
                      />
                      <span>Gabung jadi 1 Berkas PDF</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={extractMode === 'separate-files'}
                        onChange={() => setExtractMode('separate-files')}
                      />
                      <span>Pisah per Halaman (ZIP)</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Rentang halaman yang diekstrak (contoh: 1-3, 5, 8-10):
                    </label>
                    <input
                      type="text"
                      value={extractRangesText}
                      onChange={(e) => setExtractRangesText(e.target.value)}
                      placeholder="1-3, 5, 8-10"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

              {/* 8. EDIT PDF WORKSPACE */}
              {activeToolId === 'edit' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 space-y-3">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Tambah Elemen Teks ke Halaman:
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Ketik teks anotasi..."
                        className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-8 w-12 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!editText.trim()) return;
                          setEditItems((prev) => [
                            ...prev,
                            {
                              type: 'text',
                              id: `txt-${Date.now()}`,
                              pageIndex: activeEditPage,
                              x: 72,
                              y: 700 - prev.length * 30,
                              text: editText,
                              fontSize: editFontSize,
                              color: editColor,
                              opacity: 1,
                            },
                          ]);
                          setEditText('');
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tempelkan Teks</span>
                      </button>
                    </div>

                    {editItems.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-[11px] font-semibold text-zinc-500">
                          Daftar Anotasi ({editItems.length}):
                        </div>
                        {editItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs bg-white dark:bg-zinc-800 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700"
                          >
                            <span>
                              {item.type === 'text' ? `Teks: "${item.text}"` : item.type} (Hal {item.pageIndex + 1})
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditItems((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 9. TANDA AIR WORKSPACE */}
              {activeToolId === 'watermark' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWmType('text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        wmType === 'text'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Watermark Teks
                    </button>
                    <button
                      type="button"
                      onClick={() => setWmType('image')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        wmType === 'image'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Watermark Gambar
                    </button>
                  </div>

                  {wmType === 'text' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Teks Watermark:
                        </label>
                        <input
                          type="text"
                          value={wmText}
                          onChange={(e) => setWmText(e.target.value)}
                          placeholder="CONFIDENTIAL / DRAFT"
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Posisi Watermark:
                        </label>
                        <select
                          value={wmPosition}
                          onChange={(e) => setWmPosition(e.target.value as WatermarkPosition)}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <option value="center">Tengah Halaman (Center)</option>
                          <option value="diagonal">Diagonal Miring (-45°)</option>
                          <option value="top">Bagian Atas (Header)</option>
                          <option value="bottom">Bagian Bawah (Footer)</option>
                          <option value="tiled">Pola Berulang (Tiled Pattern)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Transparansi (Opacity): {Math.round(wmOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={wmOpacity}
                          onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Ukuran Huruf (Font Size): {wmFontSize} pt
                        </label>
                        <input
                          type="range"
                          min="24"
                          max="96"
                          step="4"
                          value={wmFontSize}
                          onChange={(e) => setWmFontSize(parseInt(e.target.value, 10))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setWmImageFile(e.target.files[0]);
                        }}
                        className="text-xs text-zinc-600 dark:text-zinc-400"
                      />
                      {wmImageFile && (
                        <div className="text-xs text-emerald-600 font-medium">
                          ✓ Berkas gambar terpilih: {wmImageFile.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 10. TANDA TANGANI PDF WORKSPACE */}
              {activeToolId === 'sign' && (
                <div className="space-y-4">
                  <SignaturePad
                    onSignatureReady={(url) => setSignatureDataUrl(url)}
                  />

                  {signatureDataUrl && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-850/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Pengaturan Posisi Tanda Tangan:
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Tanda tangan siap dibubuhkan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Halaman Target:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={thumbnails.length || 50}
                            value={signPageNum}
                            onChange={(e) => setSignPageNum(parseInt(e.target.value, 10) || 1)}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Nama Penanda Tangan (Opsional):
                          </label>
                          <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Tanggal Cap:
                          </label>
                          <input
                            type="text"
                            value={signDate}
                            onChange={(e) => setSignDate(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 11. PROTEKSI PDF WORKSPACE */}
              {activeToolId === 'protect' && (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Kata Sandi PDF:
                    </label>
                    <input
                      type="password"
                      value={protectPassword}
                      onChange={(e) => setProtectPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Konfirmasi Kata Sandi:
                    </label>
                    <input
                      type="password"
                      value={protectConfirmPassword}
                      onChange={(e) => setProtectConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi..."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Hak Akses Dokumen (Permissions):
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={protectAllowPrint}
                        onChange={(e) => setProtectAllowPrint(e.target.checked)}
                      />
                      <span>Izinkan pencetakan (Printing)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={protectAllowCopy}
                        onChange={(e) => setProtectAllowCopy(e.target.checked)}
                      />
                      <span>Izinkan penyalinan teks (Copying text)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 12. BUKA PDF TERKUNCI WORKSPACE */}
              {activeToolId === 'unlock' && (
                <div className="space-y-3 max-w-md">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Masukkan Kata Sandi Dokumen PDF:
                  </div>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Kata sandi PDF..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Sistem akan memvalidasi sandi dan menghapus enkripsi sehingga dokumen dapat dibuka secara bebas.
                  </p>
                </div>
              )}

              {/* 13. PERBAIKI PDF WORKSPACE */}
              {activeToolId === 'repair' && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-850/50 space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-yellow-600" />
                    <span>Pemulihan Struktur Dokumen</span>
                  </div>
                  <p>
                    Engine akan menganalisis berkas, merekonstruksi tabel cross-reference (xref), memperbaiki trailer yang hilang, dan menyelamatkan halaman yang rusak menggunakan parser resilient.
                  </p>
                </div>
              )}

              {/* 14. NOMOR HALAMAN WORKSPACE */}
              {activeToolId === 'page-numbers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Format Penomoran:
                      </label>
                      <select
                        value={pnFormat}
                        onChange={(e) => setPnFormat(e.target.value as PageNumberFormat)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <option value="simple">1, 2, 3...</option>
                        <option value="page-n">Halaman 1, Halaman 2...</option>
                        <option value="n-of-total">1 / 10, 2 / 10...</option>
                        <option value="page-n-of-total">Halaman 1 dari 10...</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Posisi Nomor:
                      </label>
                      <select
                        value={pnPosition}
                        onChange={(e) => setPnPosition(e.target.value as PageNumberPosition)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <option value="bottom-center">Bawah Tengah (Bottom Center)</option>
                        <option value="bottom-right">Bawah Kanan (Bottom Right)</option>
                        <option value="bottom-left">Bawah Kiri (Bottom Left)</option>
                        <option value="top-center">Atas Tengah (Top Center)</option>
                        <option value="top-right">Atas Kanan (Top Right)</option>
                        <option value="top-left">Atas Kiri (Top Left)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pnSkipCover}
                        onChange={(e) => setPnSkipCover(e.target.checked)}
                      />
                      <span>Lewati halaman pertama (Cover / Sampul)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 15. CROP PDF WORKSPACE */}
              {activeToolId === 'crop' && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Sesuaikan Batas Pemotongan (Margin Crop dalam points):
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Atas (Top):</label>
                      <input
                        type="number"
                        value={cropMarginTop}
                        onChange={(e) => setCropMarginTop(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Bawah (Bottom):</label>
                      <input
                        type="number"
                        value={cropMarginBottom}
                        onChange={(e) => setCropMarginBottom(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Kiri (Left):</label>
                      <input
                        type="number"
                        value={cropMarginLeft}
                        onChange={(e) => setCropMarginLeft(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Kanan (Right):</label>
                      <input
                        type="number"
                        value={cropMarginRight}
                        onChange={(e) => setCropMarginRight(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 16. COMPARE PDF WORKSPACE */}
              {activeToolId === 'compare' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Doc A */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-850">
                      <div className="text-xs font-semibold text-zinc-500 mb-1">Dokumen 1 (Asli)</div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {files[0].name}
                      </div>
                      <div className="text-[11px] text-zinc-400">{formatBytes(files[0].size)}</div>
                    </div>

                    {/* Doc B */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-850">
                      <div className="text-xs font-semibold text-zinc-500 mb-1">Dokumen 2 (Revisi / Bandingan)</div>
                      {compareFileB ? (
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {compareFileB.name}
                          </div>
                          <div className="text-[11px] text-zinc-400">{formatBytes(compareFileB.size)}</div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            ref={compareFileBInputRef}
                            accept="application/pdf"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setCompareFileB(e.target.files[0]);
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => compareFileBInputRef.current?.click()}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Pilih Dokumen PDF Kedua</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Side by side preview if comparison generated */}
                  {compareCanvasA && compareCanvasB && (
                    <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Halaman {compareCurrentPage} dari {compareSummary?.maxPages || 1}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              compareDiffPct > 0.05
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            Perbedaan: {compareDiffPct}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={compareCurrentPage <= 1}
                            onClick={() => handleComparePageChange(compareCurrentPage - 1)}
                            className="rounded p-1 text-xs border border-zinc-300 dark:border-zinc-700 disabled:opacity-30"
                          >
                            ◀ Prev
                          </button>
                          <button
                            type="button"
                            disabled={compareCurrentPage >= (compareSummary?.maxPages || 1)}
                            onClick={() => handleComparePageChange(compareCurrentPage + 1)}
                            className="rounded p-1 text-xs border border-zinc-300 dark:border-zinc-700 disabled:opacity-30"
                          >
                            Next ▶
                          </button>
                        </div>
                      </div>

                      {/* Side-by-side images */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-[11px] font-medium text-zinc-500 mb-1">Dokumen 1</div>
                          <img src={compareCanvasA} alt="Doc A" className="w-full rounded border border-zinc-300 dark:border-zinc-700 shadow-2xs" />
                        </div>
                        <div className="text-center">
                          <div className="text-[11px] font-medium text-zinc-500 mb-1">Dokumen 2 (Sorotan Perbedaan Merah)</div>
                          <div className="relative">
                            <img src={compareCanvasB} alt="Doc B" className="w-full rounded border border-zinc-300 dark:border-zinc-700 shadow-2xs" />
                            {compareCanvasDiff && (
                              <img src={compareCanvasDiff} alt="Diff overlay" className="absolute inset-0 w-full h-full pointer-events-none" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* EXECUTE ACTION BUTTON & SPINNER */}
              {/* ---------------------------------------------------- */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Semua berkas diproses secara instan di peramban tanpa antrean server.
                </div>

                <button
                  type="button"
                  onClick={handleExecuteTool}
                  disabled={isProcessing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all"
                  id="pdf-tool-execute-btn"
                >
                  <PdfToolIcon toolId={activeToolId} size={18} />
                  <span>Jalankan {currentToolMeta.name}</span>
                </button>
              </div>

              {/* Modern Processing Modal */}
              <PdfProcessingModal
                isOpen={isProcessing}
                toolName={currentToolMeta.name}
                toolId={activeToolId}
                progress={progress}
                fileName={files[0]?.name}
              />
            </div>
          )}
        </div>
      </section>
    </>
  )}
</div>
  );
};
