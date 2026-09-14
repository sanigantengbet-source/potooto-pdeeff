import * as XLSX from 'xlsx';
import { getPdfJs } from './pdfjs-loader';
import { ConversionOutputResult, ProgressCallback } from './types';

export interface PdfToExcelSettings {
  filename?: string;
  perPageSheets?: boolean;
}

interface TextCoordinateItem {
  str: string;
  x: number;
  y: number;
}

export async function convertPdfToExcel(
  file: File,
  settings: PdfToExcelSettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  onProgress?.(5, 'Initializing PDF engine...');
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(15, 'Loading PDF document...');
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const wb = XLSX.utils.book_new();
  let totalRowsExtracted = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const progressPercent = 20 + Math.round((pageNum / numPages) * 65);
    onProgress?.(progressPercent, `Parsing tables and data from page ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items: TextCoordinateItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const x = Math.round(item.transform[4]);
        const y = Math.round(item.transform[5]);
        items.push({ str: item.str, x, y });
      }
    }

    // Sort items top-to-bottom (Y descending), then left-to-right (X ascending)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) {
        return b.y - a.y;
      }
      return a.x - b.x;
    });

    // Cluster items by Y coordinate into rows
    const rowClusters: TextCoordinateItem[][] = [];
    for (const it of items) {
      const matchRow = rowClusters.find(
        (r) => r.length > 0 && Math.abs(r[0].y - it.y) <= 5
      );
      if (matchRow) {
        matchRow.push(it);
      } else {
        rowClusters.push([it]);
      }
    }

    // Sort each row's items by X
    for (const r of rowClusters) {
      r.sort((a, b) => a.x - b.x);
    }

    // Determine distinct column buckets across the page
    const allX = items.map((it) => it.x).sort((a, b) => a - b);
    const colBuckets: number[] = [];
    for (const x of allX) {
      const existing = colBuckets.find((b) => Math.abs(b - x) <= 24);
      if (existing === undefined) {
        colBuckets.push(x);
      }
    }
    colBuckets.sort((a, b) => a - b);

    // Convert row clusters into 2D array of cells
    const sheetAOA: string[][] = [];

    for (const row of rowClusters) {
      const rowCells: string[] = [];

      if (colBuckets.length <= 1) {
        // Single column line
        rowCells.push(row.map((it) => it.str).join(' '));
      } else {
        // Multi-column mapping
        for (let c = 0; c < colBuckets.length; c++) {
          const bucketX = colBuckets[c];
          const cellItems = row.filter((it) => Math.abs(it.x - bucketX) <= 24);
          rowCells.push(cellItems.map((it) => it.str).join(' '));
        }
      }

      // Filter out entirely empty row cells if trailing
      while (rowCells.length > 0 && rowCells[rowCells.length - 1] === '') {
        rowCells.pop();
      }

      if (rowCells.length > 0) {
        sheetAOA.push(rowCells);
        totalRowsExtracted++;
      }
    }

    if (sheetAOA.length === 0) {
      sheetAOA.push([`[Page ${pageNum}: No tabular or text content found]`]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetAOA);

    // Estimate column widths
    const colWidths = colBuckets.map((_, colIndex) => {
      let maxLen = 10;
      for (const row of sheetAOA) {
        if (row[colIndex]) {
          maxLen = Math.max(maxLen, row[colIndex].length);
        }
      }
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, `Page ${pageNum}`);
  }

  onProgress?.(90, 'Generating Excel workbook (.xlsx)...');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const xlsxBlob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(xlsxBlob);

  const defaultName = file.name.replace(/\.pdf$/i, '') + '.xlsx';
  const filename = settings.filename
    ? (settings.filename.endsWith('.xlsx') ? settings.filename : `${settings.filename}.xlsx`)
    : defaultName;

  onProgress?.(100, 'Done!');

  return {
    files: [
      {
        name: filename,
        blob: xlsxBlob,
        url,
        size: xlsxBlob.size,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pageCount: numPages,
      },
    ],
    pageCount: numPages,
    summaryText: `Extracted ${totalRowsExtracted} data rows across ${numPages} sheet${numPages > 1 ? 's' : ''} into Microsoft Excel format.`,
  };
}
