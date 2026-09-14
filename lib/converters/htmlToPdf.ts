import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { ConversionOutputResult, ProgressCallback } from './types';
import { PageSizeOption, OrientationOption, MarginOption, formatPdfFilename } from '@/lib/pdf';

export interface HtmlToPdfSettings {
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

export async function convertHtmlToPdf(
  input: File | string,
  settings: HtmlToPdfSettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  onProgress?.(10, 'Reading HTML content...');

  let htmlString = '';
  let originalFilename = 'document.html';

  if (typeof input === 'string') {
    htmlString = input;
    originalFilename = 'webpage.html';
  } else {
    originalFilename = input.name;
    htmlString = await input.text();
  }

  if (!htmlString || htmlString.trim() === '') {
    throw new Error('The HTML content is empty.');
  }

  onProgress?.(30, 'Parsing and preparing HTML layout...');

  const pageSize = settings.pageSize && settings.pageSize !== 'original' ? settings.pageSize : 'a4';
  const orientation = settings.orientation || 'portrait';
  const marginOption = settings.margin || 'medium';
  const [stdW, stdH] = PAGE_DIMS_PT[pageSize];
  const pageW = orientation === 'landscape' ? Math.max(stdW, stdH) : Math.min(stdW, stdH);
  const pageH = orientation === 'landscape' ? Math.min(stdW, stdH) : Math.max(stdW, stdH);
  const marginPt = MARGIN_PT[marginOption];

  const containerPixelWidth = orientation === 'landscape' ? 1120 : 794;

  const container = document.createElement('div');
  container.id = 'html-render-sandbox';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${containerPixelWidth}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.padding = '36px';
  container.style.boxSizing = 'border-box';
  container.innerHTML = htmlString;

  document.body.appendChild(container);

  try {
    onProgress?.(50, 'Rendering HTML elements to canvas...');
    const fullCanvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    onProgress?.(75, 'Constructing PDF document...');
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(originalFilename.replace(/\.(html|htm)$/i, ''));
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

      page.drawImage(embedded, {
        x: marginPt,
        y: pageH - marginPt - drawHeight,
        width: printableW,
        height: drawHeight,
      });

      currentY += sliceHeightPx;
    }

    onProgress?.(92, 'Finalizing PDF...');
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const defaultName = originalFilename.replace(/\.(html|htm)$/i, '') + '.pdf';
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
      summaryText: `Successfully converted HTML into a ${pageCount}-page PDF document.`,
    };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
