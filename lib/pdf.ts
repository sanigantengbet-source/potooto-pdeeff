import { PDFDocument, rgb } from 'pdf-lib';
import { ImageItem, QualitySetting } from './image';

export type PageSizeOption = 'a4' | 'a5' | 'letter' | 'legal' | 'original';
export type OrientationOption = 'portrait' | 'landscape' | 'auto';
export type MarginOption = 'none' | 'small' | 'medium' | 'large';
export type ImageFitOption = 'contain' | 'cover' | 'fill';

export interface PdfSettingsConfig {
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  margin: MarginOption;
  imageFit: ImageFitOption;
  quality: QualitySetting;
  autoRotate: boolean;
  pageNumbers: boolean;
  pdfTitle: string;
  customFilename: string;
  filename?: string;
}

export const DEFAULT_PDF_SETTINGS: PdfSettingsConfig = {
  pageSize: 'a4',
  orientation: 'auto',
  margin: 'none',
  imageFit: 'contain',
  quality: 'high',
  autoRotate: true,
  pageNumbers: false,
  pdfTitle: '',
  customFilename: '',
  filename: '',
};

export interface GeneratedPdfResult {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  pageCount: number;
  createdAt: string;
}

const PAGE_DIMS_PT: Record<Exclude<PageSizeOption, 'original'>, [number, number]> = {
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
  letter: [612, 792],
  legal: [612, 1008],
};

const MARGIN_PT: Record<MarginOption, number> = {
  none: 0,
  small: 20,
  medium: 36,
  large: 54,
};

export function formatPdfFilename(customName?: string): string {
  if (customName && customName.trim()) {
    let name = customName.trim();
    if (!name.toLowerCase().endsWith('.pdf')) {
      name += '.pdf';
    }
    return name;
  }
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate()
  )}_${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `photo-to-pdf_${timestamp}.pdf`;
}

export async function generatePdfFromImages(
  images: ImageItem[],
  settings: PdfSettingsConfig,
  onProgress?: (percent: number, stage: string) => void
): Promise<GeneratedPdfResult> {
  if (images.length === 0) {
    throw new Error('Tidak ada gambar untuk dikonversi.');
  }

  onProgress?.(10, 'Menginisialisasi dokumen PDF...');
  const pdfDoc = await PDFDocument.create();

  if (settings.pdfTitle) {
    pdfDoc.setTitle(settings.pdfTitle);
  }
  pdfDoc.setProducer('Planner Studio Photo to PDF');
  pdfDoc.setCreator('Planner');

  const total = images.length;

  for (let i = 0; i < total; i++) {
    const item = images[i];
    const pct = Math.round(15 + ((i + 1) / total) * 70);
    onProgress?.(pct, `Memproses gambar ${i + 1} dari ${total}: ${item.name}`);

    // Read image buffer
    const arrayBuffer = await item.file.arrayBuffer();

    let embeddedImage: any;
    const mimeType = (item.file.type || item.type || '').toLowerCase();
    const isPng = mimeType.includes('png') || item.name.toLowerCase().endsWith('.png');

    try {
      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      }
    } catch {
      // Fallback to JPG embedding
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    }

    const naturalWidth = embeddedImage.width;
    const naturalHeight = embeddedImage.height;

    // Determine target page width and height
    let pageWidth: number;
    let pageHeight: number;

    if (settings.pageSize === 'original') {
      pageWidth = naturalWidth;
      pageHeight = naturalHeight;
    } else {
      const [stdW, stdH] = PAGE_DIMS_PT[settings.pageSize] || PAGE_DIMS_PT.a4;
      if (settings.orientation === 'landscape') {
        pageWidth = Math.max(stdW, stdH);
        pageHeight = Math.min(stdW, stdH);
      } else if (settings.orientation === 'portrait') {
        pageWidth = Math.min(stdW, stdH);
        pageHeight = Math.max(stdW, stdH);
      } else {
        // 'auto'
        if (naturalWidth > naturalHeight) {
          pageWidth = Math.max(stdW, stdH);
          pageHeight = Math.min(stdW, stdH);
        } else {
          pageWidth = Math.min(stdW, stdH);
          pageHeight = Math.max(stdW, stdH);
        }
      }
    }

    const margin = MARGIN_PT[settings.margin] ?? 0;
    const printableWidth = Math.max(10, pageWidth - margin * 2);
    const printableHeight = Math.max(10, pageHeight - margin * 2);

    let drawWidth = printableWidth;
    let drawHeight = printableHeight;

    if (settings.imageFit === 'contain' || settings.pageSize === 'original') {
      const scale = Math.min(
        printableWidth / naturalWidth,
        printableHeight / naturalHeight
      );
      drawWidth = naturalWidth * scale;
      drawHeight = naturalHeight * scale;
    } else if (settings.imageFit === 'cover') {
      const scale = Math.max(
        printableWidth / naturalWidth,
        printableHeight / naturalHeight
      );
      drawWidth = naturalWidth * scale;
      drawHeight = naturalHeight * scale;
    }

    const drawX = margin + (printableWidth - drawWidth) / 2;
    const drawY = margin + (printableHeight - drawHeight) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(90, 'Menyusun berkas PDF final...');
  const pdfBytes = await pdfDoc.save();

  onProgress?.(100, 'Dokumen PDF siap!');
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const filename = formatPdfFilename(settings.filename || settings.customFilename);

  return {
    blob,
    url,
    filename,
    size: blob.size,
    pageCount: total,
    createdAt: new Date().toISOString(),
  };
}
