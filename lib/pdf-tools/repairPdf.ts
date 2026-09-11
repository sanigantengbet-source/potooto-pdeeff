import { PDFDocument } from 'pdf-lib';
import { getPdfDocument } from './pdf-renderer';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export async function repairPdfFile(
  file: File,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Memeriksa integritas berkas PDF...' });

  const rawBuffer = await file.arrayBuffer();
  if (rawBuffer.byteLength < 32) {
    throw new Error('PDF tidak dapat dipulihkan: Ukuran berkas terlalu kecil atau rusak.');
  }

  // Attempt 1: Direct structural rebuild with pdf-lib lenient parsing
  try {
    onProgress?.({ percent: 35, stage: 'Membangun ulang tabel cross-reference (xref)...' });
    const doc = await PDFDocument.load(rawBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: true,
    });

    const pageCount = doc.getPageCount();
    if (pageCount > 0) {
      onProgress?.({ percent: 75, stage: `Memulihkan struktur ${pageCount} halaman...` });
      const repairedBytes = await doc.save({ useObjectStreams: true });
      const blob = new Blob([repairedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.pdf$/i, '');
      const finalName = `${baseName}-repaired.pdf`;

      onProgress?.({ percent: 100, stage: 'Pemulihan PDF berhasil!' });

      return {
        toolId: 'repair',
        title: 'Perbaiki PDF Berhasil',
        items: [
          {
            name: finalName,
            blob,
            size: blob.size,
            pageCount,
            url,
          },
        ],
        stats: {
          totalPages: pageCount,
          resultSize: blob.size,
        },
      };
    }
  } catch {
    // Continue to advanced stream sanitization
  }

  // Attempt 2: Sanitize leading garbage bytes and missing EOF markers
  onProgress?.({ percent: 50, stage: 'Menganalisis dan memperbaiki byte stream dokumen...' });

  let uint8 = new Uint8Array(rawBuffer);
  // Find '%PDF-'
  let pdfHeaderIndex = -1;
  for (let i = 0; i < Math.min(uint8.length - 5, 2048); i++) {
    if (
      uint8[i] === 0x25 && // %
      uint8[i + 1] === 0x50 && // P
      uint8[i + 2] === 0x44 && // D
      uint8[i + 3] === 0x46 && // F
      uint8[i + 4] === 0x2d // -
    ) {
      pdfHeaderIndex = i;
      break;
    }
  }

  if (pdfHeaderIndex > 0) {
    uint8 = uint8.slice(pdfHeaderIndex);
  }

  // Check EOF
  const textDecoder = new TextDecoder('latin1');
  const tail = textDecoder.decode(uint8.slice(-128));
  if (!tail.includes('%%EOF')) {
    const eofAppend = new TextEncoder().encode('\n%%EOF\n');
    const merged = new Uint8Array(uint8.length + eofAppend.length);
    merged.set(uint8, 0);
    merged.set(eofAppend, uint8.length);
    uint8 = merged;
  }

  // Attempt 3: Robust PDF.js page object recovery
  try {
    onProgress?.({ percent: 65, stage: 'Memulihkan objek visual dan halaman menggunakan parser resilient...' });
    const pdfjsDoc = await getPdfDocument(uint8.buffer);
    const totalPages = pdfjsDoc.numPages;

    if (totalPages === 0) {
      throw new Error('PDF tidak dapat dipulihkan.');
    }

    const reconstructedDoc = await PDFDocument.create();
    reconstructedDoc.setTitle('Repaired PDF Document');
    reconstructedDoc.setProducer('Planner Resilient PDF Recovery');

    for (let p = 1; p <= totalPages; p++) {
      onProgress?.({
        percent: Math.round(65 + (p / totalPages) * 25),
        stage: `Merekonstruksi halaman ${p} dari ${totalPages}...`,
      });

      const page = await pdfjsDoc.getPage(p);
      const viewport = page.getViewport({ scale: 1.8 });
      const origViewport = page.getViewport({ scale: 1.0 });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64Data = dataUrl.split(',')[1];
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let k = 0; k < binary.length; k++) {
        bytes[k] = binary.charCodeAt(k);
      }

      const img = await reconstructedDoc.embedJpg(bytes);
      const newPage = reconstructedDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(img, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });
    }

    const finalBytes = await reconstructedDoc.save({ useObjectStreams: true });
    const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const baseName = file.name.replace(/\.pdf$/i, '');
    const finalName = `${baseName}-repaired.pdf`;

    onProgress?.({ percent: 100, stage: 'PDF berhasil dipulihkan!' });

    return {
      toolId: 'repair',
      title: 'Perbaiki PDF Berhasil',
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
  } catch {
    throw new Error('PDF tidak dapat dipulihkan. Struktur dokumen mengalami kerusakan biner kritis.');
  }
}
