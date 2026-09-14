import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  fontSize?: number;
  color?: string; // hex
  opacity?: number; // 0..1
  rotation?: number; // degrees
  position?: WatermarkPosition;
  imageFile?: File;
  target?: 'all' | 'custom';
}

function hexToRgbColor(hex: string) {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0.5, 0.5, 0.5);
}

export async function applyWatermarkToPdf(
  file: File,
  options: WatermarkOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 10, stage: 'Memuat berkas PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('Dokumen PDF tidak memiliki halaman.');
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const opacity = options.opacity ?? 0.3;
  const rotationDeg = options.rotation ?? 45;
  const fontSize = options.fontSize ?? 48;
  const textColor = hexToRgbColor(options.color || '#888888');

  let embeddedImage: any = null;
  if (options.type === 'image' && options.imageFile) {
    onProgress?.({ percent: 25, stage: 'Memuat gambar watermark...' });
    const imgBuffer = await options.imageFile.arrayBuffer();
    const isPng =
      options.imageFile.type.includes('png') ||
      options.imageFile.name.toLowerCase().endsWith('.png');
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(imgBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imgBuffer);
    }
  }

  for (let i = 0; i < totalPages; i++) {
    const progress = Math.round(30 + ((i + 1) / totalPages) * 55);
    onProgress?.({
      percent: progress,
      stage: `Menerapkan watermark pada halaman ${i + 1} dari ${totalPages}...`,
    });

    const page = pages[i];
    const { width, height } = page.getSize();

    if (options.type === 'text' && options.text) {
      const text = options.text;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (options.position === 'top-left') {
        x = 50;
        y = height - 50 - textHeight;
      } else if (options.position === 'top-right') {
        x = width - textWidth - 50;
        y = height - 50 - textHeight;
      } else if (options.position === 'bottom-left') {
        x = 50;
        y = 50;
      } else if (options.position === 'bottom-right') {
        x = width - textWidth - 50;
        y = 50;
      }

      page.drawText(text, {
        x: Math.max(10, x),
        y: Math.max(10, y),
        size: fontSize,
        font,
        color: textColor,
        opacity,
        rotate: degrees(rotationDeg),
      });
    } else if (embeddedImage) {
      const imgDims = embeddedImage.scale(0.5);
      let imgW = imgDims.width;
      let imgH = imgDims.height;

      // Scale to fit within page bounds if oversized
      const maxW = width * 0.6;
      const maxH = height * 0.6;
      if (imgW > maxW || imgH > maxH) {
        const scale = Math.min(maxW / imgW, maxH / imgH);
        imgW *= scale;
        imgH *= scale;
      }

      let x = (width - imgW) / 2;
      let y = (height - imgH) / 2;

      if (options.position === 'top-left') {
        x = 40;
        y = height - imgH - 40;
      } else if (options.position === 'top-right') {
        x = width - imgW - 40;
        y = height - imgH - 40;
      } else if (options.position === 'bottom-left') {
        x = 40;
        y = 40;
      } else if (options.position === 'bottom-right') {
        x = width - imgW - 40;
        y = 40;
      }

      page.drawImage(embeddedImage, {
        x,
        y,
        width: imgW,
        height: imgH,
        opacity,
        rotate: degrees(rotationDeg),
      });
    }
  }

  onProgress?.({ percent: 90, stage: 'Menyimpan dokumen PDF...' });
  const pdfBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Watermark berhasil diterapkan!' });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const finalName = `${baseName}_watermark.pdf`;

  return {
    toolId: 'watermark',
    title: 'Watermark Berhasil Diterapkan',
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
