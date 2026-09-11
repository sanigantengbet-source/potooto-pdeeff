import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfToolExecutionResult, PdfToolResultItem, ProgressStatus } from './types';
import { parsePageRanges } from './splitPdf';

export interface ExtractOptions {
  pagesText: string; // e.g., "1-3, 5, 8-10"
  selectedPages?: number[];
  mode: 'single-file' | 'separate-files';
}

export async function extractPagesFromPdf(
  file: File,
  options: ExtractOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Membaca dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();

  let targetPages: number[] = [];

  if (options.selectedPages && options.selectedPages.length > 0) {
    targetPages = [...new Set(options.selectedPages)].sort((a, b) => a - b);
  } else if (options.pagesText) {
    const groups = parsePageRanges(options.pagesText, totalPages);
    const flattened = groups.flat();
    targetPages = [...new Set(flattened)].sort((a, b) => a - b);
  }

  if (targetPages.length === 0) {
    throw new Error('Tentukan minimal satu nomor halaman yang valid untuk diekstrak.');
  }

  const baseName = file.name.replace(/\.pdf$/i, '');
  const resultItems: PdfToolResultItem[] = [];
  const zip = new JSZip();

  if (options.mode === 'single-file') {
    onProgress?.({ percent: 45, stage: `Mengekstrak ${targetPages.length} halaman menjadi satu berkas...` });

    const newDoc = await PDFDocument.create();
    newDoc.setTitle('Extracted Pages PDF');
    newDoc.setProducer('Planner PDF Engine');

    const zeroIndexed = targetPages.map((p) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);
    const copiedPages = await newDoc.copyPages(sourceDoc, zeroIndexed);
    copiedPages.forEach((cp) => newDoc.addPage(cp));

    const finalBytes = await newDoc.save();
    const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const finalName = `${baseName}-extracted.pdf`;

    resultItems.push({
      name: finalName,
      blob,
      size: blob.size,
      pageCount: targetPages.length,
      url,
    });
  } else {
    // Separate files
    for (let i = 0; i < targetPages.length; i++) {
      const pNum = targetPages[i];
      const percent = Math.round(20 + (i / targetPages.length) * 65);
      onProgress?.({
        percent,
        stage: `Mengekstrak halaman ${pNum} (${i + 1}/${targetPages.length})...`,
      });

      const singleDoc = await PDFDocument.create();
      const [cp] = await singleDoc.copyPages(sourceDoc, [pNum - 1]);
      singleDoc.addPage(cp);

      const bytes = await singleDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = `${baseName}-page-${pNum}.pdf`;

      resultItems.push({
        name: fileName,
        blob,
        size: blob.size,
        pageCount: 1,
        url,
      });

      zip.file(fileName, blob);
    }
  }

  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;

  if (options.mode === 'separate-files' && resultItems.length > 1) {
    onProgress?.({ percent: 92, stage: 'Membuat arsip ZIP...' });
    zipBlob = await zip.generateAsync({ type: 'blob' });
    zipUrl = URL.createObjectURL(zipBlob);
  }

  onProgress?.({ percent: 100, stage: 'Ekstraksi halaman selesai!' });

  return {
    toolId: 'extract-pages',
    title: 'Ekstrak Halaman Berhasil',
    items: resultItems,
    zipBlob,
    zipUrl,
    stats: {
      totalPages: targetPages.length,
      resultSize: resultItems.reduce((a, b) => a + b.size, 0),
    },
  };
}
