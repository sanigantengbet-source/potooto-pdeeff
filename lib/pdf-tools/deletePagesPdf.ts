import { PDFDocument } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export function parsePagesToDelete(inputStr: string, totalPages: number): Set<number> {
  const toDelete = new Set<number>();
  const parts = inputStr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, Math.min(totalPages, parseInt(startStr, 10) || 1));
      const end = Math.max(1, Math.min(totalPages, parseInt(endStr, 10) || totalPages));
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let p = min; p <= max; p++) {
        toDelete.add(p);
      }
    } else {
      const single = parseInt(part, 10);
      if (!isNaN(single) && single >= 1 && single <= totalPages) {
        toDelete.add(single);
      }
    }
  }

  return toDelete;
}

export async function deletePagesFromPdf(
  file: File,
  pagesToDelete: number[], // 1-based page numbers
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Membaca dokumen PDF...' });

  const deleteSet = new Set(pagesToDelete);
  const arrayBuffer = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();

  if (deleteSet.size >= totalPages) {
    throw new Error('Tidak dapat menghapus semua halaman. Minimal sisakan 1 halaman.');
  }

  const newDoc = await PDFDocument.create();
  newDoc.setTitle('PDF Document');
  newDoc.setProducer('Planner PDF Engine');

  const retainedIndices: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!deleteSet.has(i + 1)) {
      retainedIndices.push(i);
    }
  }

  onProgress?.({ percent: 45, stage: `Menyalin ${retainedIndices.length} halaman yang dipertahankan...` });

  const copiedPages = await newDoc.copyPages(sourceDoc, retainedIndices);
  copiedPages.forEach((cp) => newDoc.addPage(cp));

  onProgress?.({ percent: 85, stage: 'Menyusun berkas PDF baru...' });
  const resultBytes = await newDoc.save();

  onProgress?.({ percent: 100, stage: 'Halaman berhasil dihapus!' });

  const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-edited.pdf`;

  return {
    toolId: 'delete-pages',
    title: 'Hapus Halaman Berhasil',
    items: [
      {
        name: finalName,
        blob,
        size: blob.size,
        pageCount: retainedIndices.length,
        url,
      },
    ],
    stats: {
      totalPages: retainedIndices.length,
      resultSize: blob.size,
    },
  };
}
