import { PDFDocument } from 'pdf-lib';
import { ImageItem, processImageForPdf, QualitySetting } from './image';

export type PageSizeOption = 'a4' | 'a5' | 'letter' | 'legal' | 'original';
export type OrientationOption = 'auto' | 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'medium' | 'large';
export type ImageFitOption = 'contain' | 'cover' | 'stretch';

export interface PdfSettingsConfig {
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  margin: MarginOption;
  imageFit: ImageFitOption;
  quality: QualitySetting;
  filename?: string;
}

export const DEFAULT_PDF_SETTINGS: PdfSettingsConfig = {
  pageSize: 'a4',
  orientation: 'auto',
  margin: 'small',
  imageFit: 'contain',
  quality: 'high',
  filename: '',
};

// Dimensions in standard PDF points (72 points = 1 inch)
const PAGE_DIMENSIONS: Record<Exclude<PageSizeOption, 'original'>, [number, number]> = {
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
  letter: [612, 792],
  legal: [612, 1008],
};

const MARGIN_POINTS: Record<MarginOption, number> = {
  none: 0,
  small: 18, // 0.25 inch
  medium: 36, // 0.50 inch
  large: 54, // 0.75 inch
};

export interface PdfProgressCallback {
  (progress: number, stage: string): void;
}

export interface GeneratedPdfResult {
  blob: Blob;
  url: string;
  size: number;
  pageCount: number;
  filename: string;
}

export async function generatePdfFromImages(
  items: ImageItem[],
  settings: PdfSettingsConfig,
  onProgress?: PdfProgressCallback
): Promise<GeneratedPdfResult> {
  if (!items.length) {
    throw new Error('Please add at least one image to create a PDF.');
  }

  onProgress?.(5, 'Preparing images...');
  await yieldToMain();

  const pdfDoc = await PDFDocument.create();

  // Set document metadata
  pdfDoc.setTitle('Photo to PDF Document');
  pdfDoc.setProducer('Photo to PDF (Client-side Engine)');
  pdfDoc.setCreator('Photo to PDF');
  pdfDoc.setCreationDate(new Date());

  const total = items.length;
  const marginPt = MARGIN_POINTS[settings.margin];

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const itemNum = i + 1;
    const progressPercent = Math.round(10 + (i / total) * 75);

    onProgress?.(
      progressPercent,
      `Processing image ${itemNum} of ${total}: "${truncateFilename(item.name)}"`
    );
    await yieldToMain();

    // 1. Process image according to rotation and quality
    const processed = await processImageForPdf(item, settings.quality);

    // 2. Embed into PDF document
    let embeddedImg;
    if (processed.format === 'png') {
      embeddedImg = await pdfDoc.embedPng(processed.bytes);
    } else {
      embeddedImg = await pdfDoc.embedJpg(processed.bytes);
    }

    // 3. Determine Page Dimensions and Orientation
    let pageWidth: number;
    let pageHeight: number;

    if (settings.pageSize === 'original') {
      // Scale down excessively large pixel dimensions so PDF viewing coordinates stay normalized
      const scaleFactor = Math.min(1, 1400 / Math.max(processed.width, processed.height));
      const normalizedW = processed.width * scaleFactor;
      const normalizedH = processed.height * scaleFactor;

      pageWidth = normalizedW + marginPt * 2;
      pageHeight = normalizedH + marginPt * 2;
    } else {
      const [stdW, stdH] = PAGE_DIMENSIONS[settings.pageSize];
      const minDim = Math.min(stdW, stdH);
      const maxDim = Math.max(stdW, stdH);

      if (settings.orientation === 'portrait') {
        pageWidth = minDim;
        pageHeight = maxDim;
      } else if (settings.orientation === 'landscape') {
        pageWidth = maxDim;
        pageHeight = minDim;
      } else {
        // Auto orientation: match image aspect ratio
        if (processed.width > processed.height) {
          pageWidth = maxDim;
          pageHeight = minDim;
        } else {
          pageWidth = minDim;
          pageHeight = maxDim;
        }
      }
    }

    // Add page
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // 4. Calculate Printable Area and Placement
    const printableWidth = Math.max(1, pageWidth - marginPt * 2);
    const printableHeight = Math.max(1, pageHeight - marginPt * 2);

    let drawWidth = printableWidth;
    let drawHeight = printableHeight;
    let x = marginPt;
    let y = marginPt;

    if (settings.imageFit === 'contain') {
      const scale = Math.min(
        printableWidth / processed.width,
        printableHeight / processed.height
      );
      drawWidth = processed.width * scale;
      drawHeight = processed.height * scale;
      x = marginPt + (printableWidth - drawWidth) / 2;
      y = marginPt + (printableHeight - drawHeight) / 2;
    } else if (settings.imageFit === 'cover') {
      const scale = Math.max(
        printableWidth / processed.width,
        printableHeight / processed.height
      );
      drawWidth = processed.width * scale;
      drawHeight = processed.height * scale;
      x = marginPt + (printableWidth - drawWidth) / 2;
      y = marginPt + (printableHeight - drawHeight) / 2;
    } else {
      // 'stretch'
      drawWidth = printableWidth;
      drawHeight = printableHeight;
      x = marginPt;
      y = marginPt;
    }

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(90, 'Finalizing PDF document...');
  await yieldToMain();

  const pdfBytes = await pdfDoc.save();

  onProgress?.(98, 'Creating file...');
  await yieldToMain();

  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const filename = formatPdfFilename(settings.filename);

  onProgress?.(100, 'Done!');

  return {
    blob,
    url,
    size: blob.size,
    pageCount: total,
    filename,
  };
}

/**
 * Format and sanitize user-provided PDF filename.
 * Preserves letters, numbers, spaces, hyphens, underscores, dots, etc.
 * Handles case-insensitive .pdf extension and defaults to 'photos-to-pdf.pdf'.
 */
export function formatPdfFilename(input?: string): string {
  if (!input) {
    return 'photos-to-pdf.pdf';
  }

  // Remove filesystem forbidden characters: / \ : * ? " < > | and control chars
  const sanitized = input.replace(/[/\\:*?"<>|\x00-\x1f\x7f-\x9f]/g, '').trim();

  // If sanitized is empty or only whitespace/dots, fallback to default
  if (!sanitized || /^[.\s]+$/.test(sanitized)) {
    return 'photos-to-pdf.pdf';
  }

  // Check if extension already ends with .pdf (case-insensitive)
  if (/\.pdf$/i.test(sanitized)) {
    return sanitized;
  }

  return `${sanitized}.pdf`;
}

function truncateFilename(name: string, maxLen = 20): string {
  if (name.length <= maxLen) return name;
  const extIndex = name.lastIndexOf('.');
  if (extIndex > 0) {
    const ext = name.substring(extIndex);
    const base = name.substring(0, maxLen - ext.length - 3);
    return `${base}...${ext}`;
  }
  return `${name.substring(0, maxLen - 3)}...`;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
