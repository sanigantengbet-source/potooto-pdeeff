import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export type EditItem =
  | {
      type: 'text';
      id: string;
      pageIndex: number; // 0-based
      x: number; // PDF points from left
      y: number; // PDF points from bottom
      text: string;
      fontSize: number;
      color: string; // #RRGGBB
      opacity: number;
    }
  | {
      type: 'image';
      id: string;
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      imageBytes: Uint8Array;
      imageFormat: 'png' | 'jpg';
      opacity: number;
    }
  | {
      type: 'drawing';
      id: string;
      pageIndex: number;
      points: { x: number; y: number }[];
      color: string;
      strokeWidth: number;
      opacity: number;
    }
  | {
      type: 'shape';
      id: string;
      pageIndex: number;
      shapeType: 'rectangle' | 'circle' | 'line';
      x: number;
      y: number;
      width: number;
      height: number;
      strokeColor: string;
      fillColor?: string;
      strokeWidth: number;
      opacity: number;
    }
  | {
      type: 'highlight';
      id: string;
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      opacity: number;
    };

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

export async function applyEditsToPdf(
  file: File,
  edits: EditItem[],
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Mempersiapkan dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Group edits by page index
  const editsByPage = new Map<number, EditItem[]>();
  for (const edit of edits) {
    if (!editsByPage.has(edit.pageIndex)) {
      editsByPage.set(edit.pageIndex, []);
    }
    editsByPage.get(edit.pageIndex)!.push(edit);
  }

  const pagesWithEdits = Array.from(editsByPage.keys());

  for (let p = 0; p < pagesWithEdits.length; p++) {
    const pageIndex = pagesWithEdits[p];
    if (pageIndex < 0 || pageIndex >= totalPages) continue;

    const page = pdfDoc.getPage(pageIndex);
    const items = editsByPage.get(pageIndex) || [];

    for (const item of items) {
      if (item.type === 'text') {
        if (!item.text.trim()) continue;
        page.drawText(item.text, {
          x: item.x,
          y: item.y,
          size: item.fontSize,
          font,
          color: hexToRgb(item.color),
          opacity: item.opacity ?? 1,
        });
      } else if (item.type === 'image') {
        const embeddedImg =
          item.imageFormat === 'png'
            ? await pdfDoc.embedPng(item.imageBytes)
            : await pdfDoc.embedJpg(item.imageBytes);

        page.drawImage(embeddedImg, {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          opacity: item.opacity ?? 1,
        });
      } else if (item.type === 'drawing') {
        if (item.points.length < 2) continue;
        const color = hexToRgb(item.color);
        for (let pt = 0; pt < item.points.length - 1; pt++) {
          const start = item.points[pt];
          const end = item.points[pt + 1];
          page.drawLine({
            start: { x: start.x, y: start.y },
            end: { x: end.x, y: end.y },
            thickness: item.strokeWidth,
            color,
            opacity: item.opacity ?? 1,
          });
        }
      } else if (item.type === 'shape') {
        const stroke = hexToRgb(item.strokeColor);
        const fill = item.fillColor ? hexToRgb(item.fillColor) : undefined;

        if (item.shapeType === 'rectangle') {
          page.drawRectangle({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            borderWidth: item.strokeWidth,
            borderColor: stroke,
            color: fill,
            opacity: item.opacity ?? 1,
          });
        } else if (item.shapeType === 'circle') {
          page.drawEllipse({
            x: item.x + item.width / 2,
            y: item.y + item.height / 2,
            xScale: item.width / 2,
            yScale: item.height / 2,
            borderWidth: item.strokeWidth,
            borderColor: stroke,
            color: fill,
            opacity: item.opacity ?? 1,
          });
        } else if (item.shapeType === 'line') {
          page.drawLine({
            start: { x: item.x, y: item.y },
            end: { x: item.x + item.width, y: item.y + item.height },
            thickness: item.strokeWidth,
            color: stroke,
            opacity: item.opacity ?? 1,
          });
        }
      } else if (item.type === 'highlight') {
        page.drawRectangle({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          color: hexToRgb(item.color || '#ffeb3b'),
          opacity: item.opacity || 0.35,
        });
      }
    }
  }

  onProgress?.({ percent: 90, stage: 'Menyimpan dokumen teredit...' });
  const finalBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Edit dokumen selesai!' });

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-edited.pdf`;

  return {
    toolId: 'edit',
    title: 'Edit PDF Berhasil',
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
