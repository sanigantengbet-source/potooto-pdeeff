import { PDFDocument } from 'pdf-lib';
import { getPdfDocument } from './pdf-renderer';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export async function unlockPdfFile(
  file: File,
  password: string,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  if (!password) {
    throw new Error('Masukkan kata sandi PDF.');
  }

  onProgress?.({ percent: 15, stage: 'Memvalidasi kata sandi PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  let pdfjsDoc: any;

  try {
    pdfjsDoc = await getPdfDocument(arrayBuffer, password);
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    const name = err?.name || '';
    if (name === 'PasswordException' || msg.includes('password') || msg.includes('incorrect')) {
      throw new Error('Password PDF salah. Silakan periksa kembali kata sandi Anda.');
    }
    throw new Error(`Gagal membuka PDF terproteksi: ${err?.message || 'Format tidak didukung'}`);
  }

  const totalPages = pdfjsDoc.numPages;
  onProgress?.({ percent: 35, stage: `Kata sandi valid! Mendekripsi ${totalPages} halaman...` });

  // Render decrypted pages to unencrypted new PDF document
  const unlockedDoc = await PDFDocument.create();
  unlockedDoc.setTitle('Unlocked PDF Document');
  unlockedDoc.setProducer('Planner PDF Engine (Unlocked)');

  for (let i = 1; i <= totalPages; i++) {
    const progressPercent = Math.round(35 + (i / totalPages) * 55);
    onProgress?.({
      percent: progressPercent,
      stage: `Menyimpan halaman ${i} dari ${totalPages} tanpa sandi...`,
    });

    const page = await pdfjsDoc.getPage(i);
    const scale = 2.0; // High resolution rendering for crisp text/vector
    const viewport = page.getViewport({ scale });
    const originalViewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Kanvas rendering tidak tersedia.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const base64Data = dataUrl.split(',')[1];
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let k = 0; k < binary.length; k++) {
      bytes[k] = binary.charCodeAt(k);
    }

    const embeddedImage = await unlockedDoc.embedJpg(bytes);
    const newPage = unlockedDoc.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  onProgress?.({ percent: 95, stage: 'Menyelesaikan berkas PDF terbuka...' });
  const unlockedBytes = await unlockedDoc.save({ useObjectStreams: true });

  onProgress?.({ percent: 100, stage: 'PDF berhasil dibuka tanpa sandi!' });

  const blob = new Blob([unlockedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-unlocked.pdf`;

  return {
    toolId: 'unlock',
    title: 'Buka PDF Terkunci Berhasil',
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
