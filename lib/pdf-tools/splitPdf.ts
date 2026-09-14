import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfToolExecutionResult, PdfToolResultItem, ProgressStatus } from './types';

export type SplitMode = 'every-page' | 'ranges' | 'selected';

export interface SplitOptions {
  mode: SplitMode;
  rangesText?: string; // e.g., "1-3, 4-6, 7-10"
  selectedPages?: number[]; // 1-based page numbers
}

export function parsePageRanges(rangeStr: string, totalPages: number): number[][] {
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);
  const result: number[][] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, Math.min(totalPages, parseInt(startStr, 10) || 1));
      const end = Math.max(1, Math.min(totalPages, parseInt(endStr, 10) || totalPages));

      const rangePages: number[] = [];
      const step = start <= end ? 1 : -1;
      for (let p = start; step > 0 ? p <= end : p >= end; p += step) {
        rangePages.push(p);
      }
      if (rangePages.length > 0) {
        result.push(rangePages);
      }
    } else {
      const single = parseInt(part, 10);
      if (!isNaN(single) && single >= 1 && single <= totalPages) {
        result.push([single]);
      }
    }
  }

  return result;
}

export async function splitPdfFile(
  file: File,
  options: SplitOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 10, stage: 'Membaca berkas PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('Dokumen PDF kosong.');
  }

  let groups: number[][] = [];

  if (options.mode === 'every-page') {
    for (let i = 1; i <= totalPages; i++) {
      groups.push([i]);
    }
  } else if (options.mode === 'ranges') {
    groups = parsePageRanges(options.rangesText || '1-1', totalPages);
    if (groups.length === 0) {
      throw new Error('Format rentang halaman tidak valid. Contoh format: 1-3, 4-6, 7-10');
    }
  } else {
    // selected
    const selected = options.selectedPages || [];
    if (selected.length === 0) {
      throw new Error('Pilih minimal satu halaman untuk dipisahkan.');
    }
    // create 1 PDF containing the selected pages or separate?
    groups = [selected];
  }

  const baseName = file.name.replace(/\.pdf$/i, '');
  const resultItems: PdfToolResultItem[] = [];
  const zip = new JSZip();

  for (let g = 0; g < groups.length; g++) {
    const pageGroup = groups[g];
    const groupNum = g + 1;
    const progressPercent = Math.round(20 + (g / groups.length) * 65);

    onProgress?.({
      percent: progressPercent,
      stage: `Memproses bagian ${groupNum} dari ${groups.length} (${pageGroup.length} halaman)...`,
    });

    const newDoc = await PDFDocument.create();
    const zeroIndexedPages = pageGroup.map((p) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);
    const copiedPages = await newDoc.copyPages(sourceDoc, zeroIndexedPages);

    copiedPages.forEach((cp) => newDoc.addPage(cp));

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    let partName = '';
    if (options.mode === 'every-page') {
      partName = `${baseName}-halaman-${pageGroup[0]}.pdf`;
    } else if (options.mode === 'ranges') {
      const start = pageGroup[0];
      const end = pageGroup[pageGroup.length - 1];
      partName = start === end ? `${baseName}-halaman-${start}.pdf` : `${baseName}-rentang-${start}-${end}.pdf`;
    } else {
      partName = `${baseName}-terpilih.pdf`;
    }

    resultItems.push({
      name: partName,
      blob,
      size: blob.size,
      pageCount: pageGroup.length,
      url,
    });

    zip.file(partName, blob);
  }

  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;

  if (resultItems.length > 1) {
    onProgress?.({ percent: 90, stage: 'Menyiapkan berkas arsip ZIP...' });
    zipBlob = await zip.generateAsync({ type: 'blob' });
    zipUrl = URL.createObjectURL(zipBlob);
  }

  onProgress?.({ percent: 100, stage: 'Pemisahan PDF selesai!' });

  return {
    toolId: 'split',
    title: 'Pisahkan PDF Berhasil',
    items: resultItems,
    zipBlob,
    zipUrl,
    stats: {
      totalPages,
      resultSize: resultItems.reduce((acc, curr) => acc + curr.size, 0),
    },
  };
}
