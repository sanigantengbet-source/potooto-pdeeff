import JSZip from 'jszip';
import { getPdfJs } from './pdfjs-loader';
import { ConversionOutputResult, ConvertedOutputFile, ProgressCallback } from './types';

export interface PdfToImageSettings {
  format: 'jpg' | 'png';
  scale?: number; // 1, 1.5, 2, 3
  quality?: number; // 0.7 - 1.0 (for jpg)
  pageRange?: string; // 'all' or '1-5'
}

export async function convertPdfToImages(
  file: File,
  settings: PdfToImageSettings,
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
    throw new Error('The uploaded PDF contains no pages.');
  }

  // Parse page range if specified
  const pagesToRender: number[] = [];
  if (!settings.pageRange || settings.pageRange.trim().toLowerCase() === 'all') {
    for (let p = 1; p <= numPages; p++) pagesToRender.push(p);
  } else {
    // Parse range e.g. "1-3, 5"
    const parts = settings.pageRange.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let p = Math.max(1, s); p <= Math.min(numPages, e); p++) {
            if (!pagesToRender.includes(p)) pagesToRender.push(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= numPages && !pagesToRender.includes(p)) {
          pagesToRender.push(p);
        }
      }
    }
  }

  if (pagesToRender.length === 0) {
    for (let p = 1; p <= numPages; p++) pagesToRender.push(p);
  }

  const baseName = file.name.replace(/\.pdf$/i, '');
  const format = settings.format || 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const scale = settings.scale || 2.0; // 2x for crisp DPI
  const quality = settings.quality || 0.92;

  const outputFiles: ConvertedOutputFile[] = [];
  const zip = new JSZip();

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageNum = pagesToRender[i];
    const progressPercent = 20 + Math.round((i / pagesToRender.length) * 70);
    onProgress?.(
      progressPercent,
      `Rendering page ${pageNum} of ${numPages} to ${format.toUpperCase()}...`
    );

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    // Fill white background for transparent PDF layers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to encode page ${pageNum} to ${format.toUpperCase()}`));
        },
        mimeType,
        quality
      );
    });

    const filename = `${baseName}-page-${pageNum}.${ext}`;
    const url = URL.createObjectURL(blob);

    outputFiles.push({
      name: filename,
      blob,
      url,
      size: blob.size,
      type: mimeType,
      previewUrl: url,
      pageNumber: pageNum,
    });

    zip.file(filename, blob);
  }

  onProgress?.(95, 'Preparing download packages...');

  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;
  let zipFilename: string | undefined;

  if (outputFiles.length > 1) {
    zipBlob = await zip.generateAsync({ type: 'blob' });
    zipUrl = URL.createObjectURL(zipBlob);
    zipFilename = `${baseName}-${format.toUpperCase()}-images.zip`;
  }

  onProgress?.(100, 'Done!');

  return {
    files: outputFiles,
    zipBlob,
    zipUrl,
    zipFilename,
    pageCount: outputFiles.length,
    summaryText: `Rendered ${outputFiles.length} page${outputFiles.length > 1 ? 's' : ''} to ${format.toUpperCase()} images.`,
  };
}
