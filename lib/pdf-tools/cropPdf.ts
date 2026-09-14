import { PDFDocument } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export interface CropBoxRect {
  x: number; // in PDF points
  y: number; // in PDF points (from bottom)
  width: number;
  height: number;
}

export interface CropOptions {
  cropBox: CropBoxRect;
  target: 'all' | 'current' | 'selected';
  currentPageIndex?: number; // 0-based
  selectedPages?: number[]; // 1-based
}

export async function cropPdfFile(
  file: File,
  options: CropOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Membaca dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const selectedSet = new Set(options.selectedPages || []);
  const { x, y, width, height } = options.cropBox;

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    let shouldCrop = false;

    if (options.target === 'all') {
      shouldCrop = true;
    } else if (options.target === 'current' && i === (options.currentPageIndex ?? 0)) {
      shouldCrop = true;
    } else if (options.target === 'selected' && selectedSet.has(pageNum)) {
      shouldCrop = true;
    }

    if (shouldCrop) {
      const page = pdfDoc.getPage(i);
      const originalSize = page.getSize();

      // Ensure crop dimensions are within bounds
      const safeX = Math.max(0, Math.min(x, originalSize.width - 10));
      const safeY = Math.max(0, Math.min(y, originalSize.height - 10));
      const safeW = Math.max(10, Math.min(width, originalSize.width - safeX));
      const safeH = Math.max(10, Math.min(height, originalSize.height - safeY));

      page.setCropBox(safeX, safeY, safeW, safeH);
      page.setMediaBox(safeX, safeY, safeW, safeH);
    }

    const progressPercent = Math.round(20 + (i / totalPages) * 70);
    onProgress?.({
      percent: progressPercent,
      stage: `Memotong halaman ${pageNum} dari ${totalPages}...`,
    });
  }

  onProgress?.({ percent: 92, stage: 'Menyimpan dokumen hasil pemotongan...' });
  const croppedBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Crop PDF selesai!' });

  const blob = new Blob([croppedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-cropped.pdf`;

  return {
    toolId: 'crop',
    title: 'Crop PDF Berhasil',
    items: [
      {
        name: finalName,
        blob,
        size: blob.size,
        pageCount: totalPages,
        url,
      },
    ],
    stats: {
      totalPages,
      resultSize: blob.size,
    },
  };
}
