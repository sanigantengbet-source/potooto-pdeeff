import { createImageItem, ImageItem, revokeImageItem } from '@/lib/image';
import { generatePdfFromImages, PdfSettingsConfig, DEFAULT_PDF_SETTINGS } from '@/lib/pdf';
import { ConversionOutputResult, ProgressCallback } from './types';

export async function convertImagesToPdf(
  files: File[],
  settings: Partial<PdfSettingsConfig> = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  if (files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  onProgress?.(5, `Reading ${files.length} image${files.length > 1 ? 's' : ''}...`);

  const imageItems: ImageItem[] = [];
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const item = await createImageItem(file);
      imageItems.push(item);
      onProgress?.(5 + Math.round(((i + 1) / files.length) * 15), `Loaded ${file.name}`);
    }

    const mergedSettings: PdfSettingsConfig = {
      ...DEFAULT_PDF_SETTINGS,
      ...settings,
    };

    const pdfResult = await generatePdfFromImages(imageItems, mergedSettings, (pct, stage) => {
      // Scale from 20% to 100%
      const scaled = 20 + Math.round((pct / 100) * 80);
      onProgress?.(scaled, stage);
    });

    return {
      files: [
        {
          name: pdfResult.filename,
          blob: pdfResult.blob,
          url: pdfResult.url,
          size: pdfResult.size,
          type: 'application/pdf',
          pageCount: pdfResult.pageCount,
        },
      ],
      pageCount: pdfResult.pageCount,
      summaryText: `Successfully generated PDF with ${pdfResult.pageCount} page${pdfResult.pageCount > 1 ? 's' : ''}.`,
    };
  } finally {
    // Release transient image item object URLs
    imageItems.forEach(revokeImageItem);
  }
}
