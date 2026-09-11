import { ToolId, ConversionOutputResult, ProgressCallback } from './types';
import { convertImagesToPdf } from './imageToPdf';
import { convertWordToPdf } from './wordToPdf';
import { convertExcelToPdf } from './excelToPdf';
import { convertPptToPdf } from './pptToPdf';
import { convertHtmlToPdf } from './htmlToPdf';
import { convertPdfToImages } from './pdfToImage';
import { convertPdfToWord } from './pdfToWord';
import { convertPdfToExcel } from './pdfToExcel';
import { convertPdfToPpt } from './pdfToPpt';
import { convertPdfToPdfA } from './pdfToPdfA';

export * from './types';
export * from './tools-meta';

export async function processConversion(
  toolId: ToolId,
  files: File[],
  settings: Record<string, any> = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one file to convert.');
  }

  switch (toolId) {
    case 'jpg-to-pdf':
    case 'png-to-pdf':
    case 'webp-to-pdf':
      return convertImagesToPdf(files, settings, onProgress);

    case 'word-to-pdf':
      return convertWordToPdf(files[0], settings, onProgress);

    case 'excel-to-pdf':
      return convertExcelToPdf(files[0], settings, onProgress);

    case 'ppt-to-pdf':
      return convertPptToPdf(files[0], settings, onProgress);

    case 'html-to-pdf':
      return convertHtmlToPdf(files[0], settings, onProgress);

    case 'pdf-to-jpg':
      return convertPdfToImages(files[0], { format: 'jpg', ...settings }, onProgress);

    case 'pdf-to-png':
      return convertPdfToImages(files[0], { format: 'png', ...settings }, onProgress);

    case 'pdf-to-word':
      return convertPdfToWord(files[0], settings, onProgress);

    case 'pdf-to-excel':
      return convertPdfToExcel(files[0], settings, onProgress);

    case 'pdf-to-ppt':
      return convertPdfToPpt(files[0], settings, onProgress);

    case 'pdf-to-pdfa':
      return convertPdfToPdfA(files[0], settings, onProgress);

    default:
      throw new Error(`Unsupported tool: ${toolId}`);
  }
}
