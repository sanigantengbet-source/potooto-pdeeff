import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { ConversionOutputResult, ProgressCallback } from './types';
import { PageSizeOption, OrientationOption, MarginOption, formatPdfFilename } from '@/lib/pdf';

export interface WordToPdfSettings {
  pageSize?: PageSizeOption;
  orientation?: OrientationOption;
  margin?: MarginOption;
  filename?: string;
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

export async function convertWordToPdf(
  file: File,
  settings: WordToPdfSettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'doc') {
    throw new Error(
      'Legacy .doc format is not supported for client-side conversion. Please save or convert your document to .docx for private in-browser conversion.'
    );
  }

  if (ext !== 'docx') {
    throw new Error('Please select a valid Microsoft Word (.docx) document.');
  }

  onProgress?.(10, 'Reading Word document...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(30, 'Extracting text, formatting, and tables...');
  const conversionResult = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = conversionResult.value;

  if (!htmlContent || htmlContent.trim() === '') {
    throw new Error('The Word document does not contain any readable text or content.');
  }

  onProgress?.(50, 'Rendering document layout...');

  // Setup dimension variables
  const pageSize = settings.pageSize && settings.pageSize !== 'original' ? settings.pageSize : 'a4';
  const orientation = settings.orientation || 'portrait';
  const marginOption = settings.margin || 'medium';
  const [stdW, stdH] = PAGE_DIMS_PT[pageSize];
  const pageW = orientation === 'landscape' ? Math.max(stdW, stdH) : Math.min(stdW, stdH);
  const pageH = orientation === 'landscape' ? Math.min(stdW, stdH) : Math.max(stdW, stdH);
  const marginPt = MARGIN_PT[marginOption];

  // Container width in screen pixels (A4 portrait ~ 794px at 96 DPI)
  const containerPixelWidth = 794;

  // Render HTML inside isolated off-screen element
  const container = document.createElement('div');
  container.id = 'word-render-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${containerPixelWidth}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.6';
  container.style.padding = '40px 48px';
  container.style.boxSizing = 'border-box';

  // Inject styles for Word typography, tables, and images
  container.innerHTML = `
    <style>
      #word-render-container h1 { font-size: 24px; font-weight: 700; margin: 18px 0 10px; color: #09090b; }
      #word-render-container h2 { font-size: 20px; font-weight: 600; margin: 16px 0 8px; color: #18181b; }
      #word-render-container h3 { font-size: 16px; font-weight: 600; margin: 14px 0 6px; color: #27272a; }
      #word-render-container p { margin: 0 0 12px; }
      #word-render-container table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
      #word-render-container th, #word-render-container td { border: 1px solid #d4d4d8; padding: 8px 10px; text-align: left; }
      #word-render-container th { background-color: #f4f4f5; font-weight: 600; }
      #word-render-container ul, #word-render-container ol { margin: 0 0 12px 24px; padding: 0; }
      #word-render-container li { margin-bottom: 4px; }
      #word-render-container img { max-width: 100%; height: auto; margin: 12px 0; }
      #word-render-container blockquote { border-left: 3px solid #d4d4d8; padding-left: 14px; margin: 12px 0; color: #52525b; }
    </style>
    <div>${htmlContent}</div>
  `;

  document.body.appendChild(container);

  try {
    onProgress?.(65, 'Capturing pages...');
    const fullCanvas = await html2canvas(container, {
      scale: 2, // 2x high resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    onProgress?.(80, 'Creating PDF document...');
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(file.name.replace(/\.docx$/i, ''));
    pdfDoc.setProducer('Planner (Client-side Engine)');
    pdfDoc.setCreator('Planner');
    pdfDoc.setCreationDate(new Date());

    const printableW = pageW - marginPt * 2;
    const printableH = pageH - marginPt * 2;
    const pxPerPt = fullCanvas.width / printableW;
    const sliceHeightPx = printableH * pxPerPt;

    const totalHeightPx = fullCanvas.height;
    let currentY = 0;
    let pageCount = 0;

    while (currentY < totalHeightPx) {
      pageCount++;
      const currentSliceHeight = Math.min(sliceHeightPx, totalHeightPx - currentY);

      // Create a canvas for this page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = currentSliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          fullCanvas,
          0,
          currentY,
          fullCanvas.width,
          currentSliceHeight,
          0,
          0,
          pageCanvas.width,
          currentSliceHeight
        );
      }

      const imgDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
      const imgBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
      const embedded = await pdfDoc.embedJpg(imgBytes);

      const page = pdfDoc.addPage([pageW, pageH]);
      const drawHeight = currentSliceHeight / pxPerPt;

      // Draw top-aligned on printable area
      page.drawImage(embedded, {
        x: marginPt,
        y: pageH - marginPt - drawHeight,
        width: printableW,
        height: drawHeight,
      });

      currentY += sliceHeightPx;
    }

    onProgress?.(95, 'Finalizing PDF...');
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const defaultName = file.name.replace(/\.docx$/i, '') + '.pdf';
    const filename = formatPdfFilename(settings.filename || defaultName);

    onProgress?.(100, 'Done!');

    return {
      files: [
        {
          name: filename,
          blob,
          url,
          size: blob.size,
          type: 'application/pdf',
          pageCount,
        },
      ],
      pageCount,
      summaryText: `Successfully converted Word document into a ${pageCount}-page PDF.`,
    };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
