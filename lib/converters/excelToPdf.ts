import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { ConversionOutputResult, ProgressCallback } from './types';
import { PageSizeOption, OrientationOption, MarginOption, formatPdfFilename } from '@/lib/pdf';

export interface ExcelToPdfSettings {
  sheetName?: string; // 'all' or specific sheet
  pageSize?: PageSizeOption;
  orientation?: OrientationOption;
  margin?: MarginOption;
  fitToPage?: boolean;
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

export async function convertExcelToPdf(
  file: File,
  settings: ExcelToPdfSettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  onProgress?.(10, 'Reading Excel workbook...');
  const arrayBuffer = await file.arrayBuffer();

  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  const sheetsToProcess =
    !settings.sheetName || settings.sheetName === 'all'
      ? wb.SheetNames
      : wb.SheetNames.filter((s) => s === settings.sheetName);

  if (sheetsToProcess.length === 0) {
    throw new Error(`Worksheet "${settings.sheetName}" not found in workbook.`);
  }

  // Setup dimension variables: Excel tables typically default to landscape
  const pageSize = settings.pageSize && settings.pageSize !== 'original' ? settings.pageSize : 'a4';
  const orientation = settings.orientation || 'landscape';
  const marginOption = settings.margin || 'small';
  const [stdW, stdH] = PAGE_DIMS_PT[pageSize];
  const pageW = orientation === 'landscape' ? Math.max(stdW, stdH) : Math.min(stdW, stdH);
  const pageH = orientation === 'landscape' ? Math.min(stdW, stdH) : Math.max(stdW, stdH);
  const marginPt = MARGIN_PT[marginOption];

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(file.name.replace(/\.(xlsx|xls)$/i, ''));
  pdfDoc.setProducer('Planner (Client-side Engine)');
  pdfDoc.setCreator('Planner');
  pdfDoc.setCreationDate(new Date());

  const containerPixelWidth = orientation === 'landscape' ? 1120 : 794;
  let totalRenderedPages = 0;

  for (let sIdx = 0; sIdx < sheetsToProcess.length; sIdx++) {
    const sheetName = sheetsToProcess[sIdx];
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    onProgress?.(
      20 + Math.round((sIdx / sheetsToProcess.length) * 50),
      `Processing worksheet: "${sheetName}"...`
    );

    // Convert worksheet to HTML table
    const tableHtml = XLSX.utils.sheet_to_html(ws, { header: '', footer: '' });

    // Render offscreen container
    const container = document.createElement('div');
    container.id = 'excel-render-container';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${containerPixelWidth}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#18181b';
    container.style.fontFamily = 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.fontSize = '12px';
    container.style.padding = '32px 40px';
    container.style.boxSizing = 'border-box';

    container.innerHTML = `
      <style>
        #excel-render-container .sheet-title {
          font-size: 16px;
          font-weight: 700;
          color: #09090b;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #e4e4e7;
        }
        #excel-render-container table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          line-height: 1.4;
        }
        #excel-render-container th, #excel-render-container td {
          border: 1px solid #d4d4d8;
          padding: 6px 8px;
          text-align: left;
          word-break: break-word;
        }
        #excel-render-container tr:first-child td, #excel-render-container th {
          background-color: #f4f4f5;
          font-weight: 600;
          color: #09090b;
        }
        #excel-render-container tr:nth-child(even) td {
          background-color: #fafafa;
        }
      </style>
      <div class="sheet-title">${sheetName}</div>
      <div>${tableHtml}</div>
    `;

    document.body.appendChild(container);

    try {
      const fullCanvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const printableW = pageW - marginPt * 2;
      const printableH = pageH - marginPt * 2;
      const pxPerPt = fullCanvas.width / printableW;
      const sliceHeightPx = printableH * pxPerPt;
      const totalHeightPx = fullCanvas.height;

      let currentY = 0;
      while (currentY < totalHeightPx) {
        totalRenderedPages++;
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
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }

  if (totalRenderedPages === 0) {
    throw new Error('No content could be rendered from the spreadsheet.');
  }

  onProgress?.(90, 'Finalizing PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const defaultName = file.name.replace(/\.(xlsx|xls)$/i, '') + '.pdf';
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
        pageCount: totalRenderedPages,
      },
    ],
    pageCount: totalRenderedPages,
    summaryText: `Converted ${sheetsToProcess.length} sheet${sheetsToProcess.length > 1 ? 's' : ''} into a ${totalRenderedPages}-page PDF document.`,
  };
}
