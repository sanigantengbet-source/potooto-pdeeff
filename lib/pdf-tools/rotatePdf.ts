import { PDFDocument, degrees } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export type RotationAngle = 90 | 180 | 270;
export type RotationTarget = 'all' | 'odd' | 'even' | 'selected';

export interface RotateOptions {
  angle: RotationAngle;
  target: RotationTarget;
  selectedPages?: number[]; // 1-based page numbers
}

export async function rotatePdfFile(
  file: File,
  options: RotateOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Membaca berkas PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('Dokumen PDF kosong.');
  }

  const selectedSet = new Set(options.selectedPages || []);

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    let shouldRotate = false;

    if (options.target === 'all') {
      shouldRotate = true;
    } else if (options.target === 'odd' && pageNum % 2 === 1) {
      shouldRotate = true;
    } else if (options.target === 'even' && pageNum % 2 === 0) {
      shouldRotate = true;
    } else if (options.target === 'selected' && selectedSet.has(pageNum)) {
      shouldRotate = true;
    }

    if (shouldRotate) {
      const page = pdfDoc.getPage(i);
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + options.angle) % 360));
    }

    const progressPercent = Math.round(20 + (i / totalPages) * 65);
    onProgress?.({
      percent: progressPercent,
      stage: `Memutar halaman ${pageNum} dari ${totalPages}...`,
    });
  }

  onProgress?.({ percent: 90, stage: 'Menyimpan dokumen terputar...' });
  const rotatedBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Rotasi PDF selesai!' });

  const blob = new Blob([rotatedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-rotated.pdf`;

  return {
    toolId: 'rotate',
    title: 'Putar PDF Berhasil',
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
