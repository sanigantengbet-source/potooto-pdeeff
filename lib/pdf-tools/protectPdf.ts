import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export interface ProtectOptions {
  password: string;
  confirmPassword: string;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  algorithm?: 'AES-256' | 'RC4';
}

export async function protectPdfFile(
  file: File,
  options: ProtectOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  if (!options.password) {
    throw new Error('Kata sandi tidak boleh kosong.');
  }

  if (options.password !== options.confirmPassword) {
    throw new Error('Konfirmasi kata sandi tidak cocok.');
  }

  onProgress?.({ percent: 20, stage: 'Membaca dokumen PDF asli...' });

  const arrayBuffer = await file.arrayBuffer();
  // Ensure valid PDF format by loading in pdf-lib first
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const rawBytes = await pdfDoc.save();

  onProgress?.({ percent: 55, stage: 'Menerapkan enkripsi standar AES-256...' });

  const encryptedBytes = await encryptPDF(rawBytes, options.password, {
    algorithm: options.algorithm || 'AES-256',
    ownerPassword: options.password,
    allowPrinting: options.allowPrinting ?? true,
    allowCopying: options.allowCopying ?? false,
    allowModifying: false,
    allowAnnotating: false,
    allowFillingForms: true,
    allowHighQualityPrint: options.allowPrinting ?? true,
  });

  onProgress?.({ percent: 92, stage: 'Menyiapkan berkas terproteksi...' });

  const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-protected.pdf`;

  onProgress?.({ percent: 100, stage: 'Proteksi PDF selesai!' });

  return {
    toolId: 'protect',
    title: 'Proteksi PDF Berhasil',
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
