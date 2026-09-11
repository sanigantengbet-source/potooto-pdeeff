import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 'center' | 'top' | 'bottom' | 'diagonal' | 'tiled';

export interface WatermarkOptions {
  type: WatermarkType;
  // Text watermark options
  text?: string;
  fontSize?: number;
  color?: string; // hex #RRGGBB
  rotation?: number; // degrees e.g. -45, 0, 45
  opacity?: number; // 0.1 to 1.0
  position?: WatermarkPosition;

  // Image watermark options
  imageFile?: File;
  imageBytes?: Uint8Array;
  imageFormat?: 'png' | 'jpg';
  imageScale?: number; // 0.1 to 2.0

  // Page targeting
  target: 'all' | 'odd' | 'even' | 'custom';
  customPages?: number[];
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

export async function applyWatermarkToPdf(
  file: File,
  options: WatermarkOptions,
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  onProgress?.({ percent: 15, stage: 'Membaca dokumen PDF...' });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const opacity = options.opacity ?? 0.35;
  const rotationDeg = options.rotation ?? (options.position === 'diagonal' ? -45 : 0);

  let embeddedImage: any = null;
  if (options.type === 'image' && options.imageFile) {
    const imgBuf = await options.imageFile.arrayBuffer();
    const bytes = new Uint8Array(imgBuf);
    const isPng = options.imageFile.type.includes('png') || options.imageFile.name.toLowerCase().endsWith('.png');
    embeddedImage = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  }

  const customSet = new Set(options.customPages || []);

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    let apply = false;

    if (options.target === 'all') apply = true;
    else if (options.target === 'odd' && pageNum % 2 === 1) apply = true;
    else if (options.target === 'even' && pageNum % 2 === 0) apply = true;
    else if (options.target === 'custom' && customSet.has(pageNum)) apply = true;

    if (!apply) continue;

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    if (options.type === 'text') {
      const text = options.text || 'CONFIDENTIAL';
      const size = options.fontSize || 48;
      const textWidth = font.widthOfTextAtSize(text, size);
      const textHeight = font.heightAtSize(size);
      const textColor = hexToRgb(options.color || '#94a3b8');

      if (options.position === 'tiled') {
        const stepX = textWidth + 80;
        const stepY = textHeight + 90;
        for (let x = 30; x < width; x += stepX) {
          for (let y = 30; y < height; y += stepY) {
            page.drawText(text, {
              x,
              y,
              size,
              font,
              color: textColor,
              opacity,
              rotate: degrees(rotationDeg),
            });
          }
        }
      } else {
        // Calculate center or positioning
        let x = (width - textWidth) / 2;
        let y = (height - textHeight) / 2;

        if (options.position === 'top') {
          y = height - textHeight - 50;
        } else if (options.position === 'bottom') {
          y = 50;
        }

        page.drawText(text, {
          x,
          y,
          size,
          font,
          color: textColor,
          opacity,
          rotate: degrees(rotationDeg),
        });
      }
    } else if (options.type === 'image' && embeddedImage) {
      const scale = options.imageScale || 0.4;
      const imgWidth = embeddedImage.width * scale;
      const imgHeight = embeddedImage.height * scale;

      let x = (width - imgWidth) / 2;
      let y = (height - imgHeight) / 2;

      if (options.position === 'top') {
        y = height - imgHeight - 40;
      } else if (options.position === 'bottom') {
        y = 40;
      }

      page.drawImage(embeddedImage, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: degrees(rotationDeg),
      });
    }

    const progressPercent = Math.round(20 + (i / totalPages) * 70);
    onProgress?.({
      percent: progressPercent,
      stage: `Menambahkan tanda air ke halaman ${pageNum} dari ${totalPages}...`,
    });
  }

  onProgress?.({ percent: 92, stage: 'Menyimpan berkas PDF...' });
  const finalBytes = await pdfDoc.save();

  onProgress?.({ percent: 100, stage: 'Tanda air berhasil diterapkan!' });

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalName = `${baseName}-watermarked.pdf`;

  return {
    toolId: 'watermark',
    title: 'Tanda Air Berhasil Ditambahkan',
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
