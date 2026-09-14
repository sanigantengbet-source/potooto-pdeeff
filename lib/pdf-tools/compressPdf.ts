import { PDFDocument } from 'pdf-lib';
import { getPdfDocument } from './pdf-renderer';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export type CompressionLevel = 'extreme' | 'recommended' | 'low';

export interface CompressOptions {
  level: CompressionLevel;
}

export async function compressPdfFile(
  file: File,
  options: CompressOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  const originalSize = file.size;
  onProgress?.({ percent: 10, stage: 'Menganalisis konten dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfjsDoc = await getPdfDocument(arrayBuffer);
  const totalPages = pdfjsDoc.numPages;

  let scale = 1.4;
  let jpegQuality = 0.72;

  if (options.level === 'extreme') {
    scale = 1.1;
    jpegQuality = 0.55;
  } else if (options.level === 'low') {
    scale = 1.8;
    jpegQuality = 0.88;
  }

  const newDoc = await PDFDocument.create();
  newDoc.setTitle('Compressed PDF Document');
  newDoc.setProducer('Planner PDF Engine (Compressed)');

  for (let i = 1; i <= totalPages; i++) {
    const progressPercent = Math.round(15 + (i / totalPages) * 70);
    onProgress?.({
      percent: progressPercent,
      stage: `Mengompresi halaman ${i} dari ${totalPages}...`,
    });

    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const originalViewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Gagal menyiapkan kanvas kompresi');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // Convert to compressed JPEG data URL / blob
    const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const base64Data = dataUrl.split(',')[1];
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let k = 0; k < binary.length; k++) {
      bytes[k] = binary.charCodeAt(k);
    }

    const embeddedImage = await newDoc.embedJpg(bytes);

    // Maintain original PDF page dimensions in points
    const newPage = newDoc.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  onProgress?.({ percent: 90, stage: 'Menyusun berkas PDF hasil kompresi...' });
  const compressedBytes = await newDoc.save({ useObjectStreams: true });

  let resultBlob: Blob;
  let resultSize: number;

  // Real size check: If re-rasterized is somehow larger than original (e.g. text-only PDF),
  // optimize the original PDF structure via pdf-lib stream packaging so we don't inflate
  if (compressedBytes.byteLength > originalSize && originalSize > 0) {
    try {
      const origDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const optBytes = await origDoc.save({ useObjectStreams: true });
      if (optBytes.byteLength < originalSize) {
        resultBlob = new Blob([optBytes as unknown as BlobPart], { type: 'application/pdf' });
      } else {
        resultBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      }
    } catch {
      resultBlob = new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
    }
  } else {
    resultBlob = new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
  }

  resultSize = resultBlob.size;
  const reductionPercentage =
    originalSize > resultSize
      ? parseFloat((((originalSize - resultSize) / originalSize) * 100).toFixed(1))
      : 0;

  onProgress?.({ percent: 100, stage: 'Kompresi selesai!' });

  const url = URL.createObjectURL(resultBlob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-compressed.pdf`;

  return {
    toolId: 'compress',
    title: 'Kompres PDF Berhasil',
    items: [
      {
        name: finalName,
        blob: resultBlob,
        size: resultSize,
        pageCount: totalPages,
        url,
      },
    ],
    stats: {
      originalSize,
      resultSize,
      reductionPercentage,
      totalPages,
    },
  };
}
