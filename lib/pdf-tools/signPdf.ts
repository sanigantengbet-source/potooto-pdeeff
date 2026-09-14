import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export interface SignaturePlacement {
  pageIndex: number; // 0-based
  x: number; // PDF points
  y: number; // PDF points
  width: number;
  height: number;
  rotation?: number;
  signatureDataUrl: string; // transparent PNG base64
  signerName?: string;
  dateText?: string;
}

export async function applySignatureToPdf(
  file: File,
  placements: SignaturePlacement[],
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  if (placements.length === 0) {
    throw new Error('Tentukan letak tanda tangan pada dokumen terlebih dahulu.');
  }

  onProgress?.({ percent: 15, stage: 'Membaca dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let idx = 0; idx < placements.length; idx++) {
    const item = placements[idx];
    const progressPercent = Math.round(25 + (idx / placements.length) * 60);

    onProgress?.({
      percent: progressPercent,
      stage: `Menanamkan tanda tangan ke halaman ${item.pageIndex + 1}...`,
    });

    if (item.pageIndex < 0 || item.pageIndex >= totalPages) continue;

    const page = pdfDoc.getPage(item.pageIndex);

    // Convert dataUrl to Uint8Array
    const base64 = item.signatureDataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let k = 0; k < binary.length; k++) {
      bytes[k] = binary.charCodeAt(k);
    }

    const embeddedPng = await pdfDoc.embedPng(bytes);

    page.drawImage(embeddedPng, {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      rotate: degrees(item.rotation || 0),
    });

    // Optional metadata label (e.g., Signed by: John Doe, 11/09/2026)
    if (item.signerName || item.dateText) {
      let subText = item.signerName ? `Ttd: ${item.signerName}` : '';
      if (item.dateText) {
        subText += subText ? ` • ${item.dateText}` : item.dateText;
      }
      page.drawText(subText, {
        x: item.x,
        y: Math.max(10, item.y - 12),
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  onProgress?.({ percent: 90, stage: 'Menyusun dokumen bertanda tangan...' });
  const finalBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Tanda tangan berhasil tertanam!' });

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-signed.pdf`;

  return {
    toolId: 'sign',
    title: 'Tanda Tangani PDF Berhasil',
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
