import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'simple' | 'page-n' | 'n-of-total' | 'page-n-of-total';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  fontSize: number;
  margin: number; // points from edge
  skipFirstPage?: boolean; // useful if page 1 is a cover
  target: 'all' | 'custom';
  customPages?: number[];
}

export async function addPageNumbersToPdf(
  file: File,
  options: PageNumberOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Membaca dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSize || 10;
  const margin = options.margin || 25;
  const startNum = options.startNumber || 1;

  const customSet = new Set(options.customPages || []);

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;

    if (options.skipFirstPage && pageNum === 1) {
      continue;
    }

    if (options.target === 'custom' && !customSet.has(pageNum)) {
      continue;
    }

    const currentNumber = startNum + (options.skipFirstPage ? i - 1 : i);
    const totalCountLabel = options.skipFirstPage ? totalPages - 1 : totalPages;

    let text = `${currentNumber}`;
    if (options.format === 'page-n') {
      text = `Halaman ${currentNumber}`;
    } else if (options.format === 'n-of-total') {
      text = `${currentNumber} / ${totalCountLabel}`;
    } else if (options.format === 'page-n-of-total') {
      text = `Halaman ${currentNumber} dari ${totalCountLabel}`;
    }

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = margin;

    if (options.position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - margin;
      y = margin;
    } else if (options.position === 'bottom-center') {
      x = (width - textWidth) / 2;
      y = margin;
    } else if (options.position === 'top-left') {
      x = margin;
      y = height - margin - fontSize;
    } else if (options.position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin - fontSize;
    } else if (options.position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - margin - fontSize;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    const progressPercent = Math.round(20 + (i / totalPages) * 70);
    onProgress?.({
      percent: progressPercent,
      stage: `Menambahkan nomor pada halaman ${pageNum} dari ${totalPages}...`,
    });
  }

  onProgress?.({ percent: 92, stage: 'Menyimpan dokumen berpenomoran...' });
  const finalBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Penomoran halaman selesai!' });

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-numbered.pdf`;

  return {
    toolId: 'page-numbers',
    title: 'Nomor Halaman Berhasil Ditambahkan',
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
