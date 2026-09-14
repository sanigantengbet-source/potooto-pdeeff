import { PDFDocument } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export async function unlockPdfFile(
  file: File,
  password?: string,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 20, stage: 'Membaca dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ percent: 50, stage: 'Membuka dan mendekripsi proteksi dokumen...' });

  let pdfDoc: PDFDocument;
  try {
    // Try loading with ignoreEncryption and password if provided
    pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });
  } catch (err: any) {
    throw new Error(
      err?.message ||
        'Gagal membuka file PDF. Pastikan kata sandi yang dimasukkan sudah sesuai.'
    );
  }

  const totalPages = pdfDoc.getPageCount();
  onProgress?.({ percent: 80, stage: 'Menyusun berkas PDF tanpa enkripsi...' });

  // Re-save without any encryption/password restrictions
  const unlockedBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'PDF berhasil dibuka!' });

  const blob = new Blob([unlockedBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const finalName = `${baseName}_unlocked.pdf`;

  return {
    toolId: 'unlock',
    title: 'PDF Berhasil Dibuka',
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
      originalSize: file.size,
      resultSize: blob.size,
    },
  };
}
