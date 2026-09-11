import pptxgen from 'pptxgenjs';
import { getPdfJs } from './pdfjs-loader';
import { ConversionOutputResult, ProgressCallback } from './types';

export interface PdfToPptSettings {
  filename?: string;
}

export async function convertPdfToPpt(
  file: File,
  settings: PdfToPptSettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  onProgress?.(5, 'Initializing PDF and PowerPoint engines...');
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(15, 'Loading PDF document...');
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = file.name.replace(/\.pdf$/i, '');
  pptx.author = 'Planner';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const progressPercent = 20 + Math.round((pageNum / numPages) * 70);
    onProgress?.(
      progressPercent,
      `Converting page ${pageNum} of ${numPages} to PowerPoint slide...`
    );

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    // Render page to canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
    }

    const pageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Extract text for slide notes
    let notesText = '';
    try {
      const textContent = await page.getTextContent();
      notesText = textContent.items
        .map((it) => ('str' in it ? it.str : ''))
        .filter(Boolean)
        .join(' ');
    } catch {
      // Notes extraction fallback
    }

    // Add slide
    const slide = pptx.addSlide();

    // Fill slide with page graphic (100% width and height)
    slide.addImage({
      data: pageDataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    // Add searchable speaker notes if text was present
    if (notesText) {
      slide.addNotes(notesText);
    }
  }

  onProgress?.(92, 'Generating PowerPoint presentation (.pptx)...');
  const pptxBlob = (await pptx.write({ outputType: 'blob' })) as Blob;
  const url = URL.createObjectURL(pptxBlob);

  const defaultName = file.name.replace(/\.pdf$/i, '') + '.pptx';
  const filename = settings.filename
    ? (settings.filename.endsWith('.pptx') ? settings.filename : `${settings.filename}.pptx`)
    : defaultName;

  onProgress?.(100, 'Done!');

  return {
    files: [
      {
        name: filename,
        blob: pptxBlob,
        url,
        size: pptxBlob.size,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        pageCount: numPages,
      },
    ],
    pageCount: numPages,
    summaryText: `Successfully converted ${numPages} PDF page${numPages > 1 ? 's' : ''} into PowerPoint slides.`,
  };
}
