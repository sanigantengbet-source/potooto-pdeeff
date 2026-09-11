import { Document, Paragraph, TextRun, HeadingLevel, PageBreak, Packer } from 'docx';
import { getPdfJs } from './pdfjs-loader';
import { ConversionOutputResult, ProgressCallback } from './types';

export interface PdfToWordSettings {
  filename?: string;
}

interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  height: number;
}

export async function convertPdfToWord(
  file: File,
  settings: PdfToWordSettings = {},
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
    throw new Error('The PDF document contains no pages.');
  }

  const documentChildren: Paragraph[] = [];
  let totalExtractedCharacters = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const progressPercent = 20 + Math.round((pageNum / numPages) * 60);
    onProgress?.(progressPercent, `Extracting text from page ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items: ExtractedTextItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const x = item.transform[4];
        const y = item.transform[5];
        const height = Math.abs(item.transform[0] || item.height || 12);
        items.push({ str: item.str, x, y, height });
        totalExtractedCharacters += item.str.length;
      }
    }

    // Sort items top-to-bottom (Y descending in PDF coordinates), then left-to-right (X ascending)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) {
        return b.y - a.y; // top to bottom
      }
      return a.x - b.x; // left to right
    });

    // Group items into lines
    const lines: { text: string; height: number; y: number }[] = [];
    let currentLineItems: ExtractedTextItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (currentLineItems.length === 0) {
        currentLineItems.push(item);
      } else {
        const prev = currentLineItems[currentLineItems.length - 1];
        if (Math.abs(item.y - prev.y) <= 4) {
          currentLineItems.push(item);
        } else {
          // Commit current line
          lines.push({
            text: currentLineItems.map((it) => it.str).join(' '),
            height: Math.max(...currentLineItems.map((it) => it.height)),
            y: currentLineItems[0].y,
          });
          currentLineItems = [item];
        }
      }
    }
    if (currentLineItems.length > 0) {
      lines.push({
        text: currentLineItems.map((it) => it.str).join(' '),
        height: Math.max(...currentLineItems.map((it) => it.height)),
        y: currentLineItems[0].y,
      });
    }

    if (lines.length === 0) {
      documentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${pageNum}: Scanned image or graphic content without embedded text layer]`,
              italics: true,
              color: '888888',
            }),
          ],
        })
      );
    } else {
      // Find median font height to differentiate headings
      const heights = lines.map((l) => l.height).sort((a, b) => a - b);
      const medianHeight = heights[Math.floor(heights.length / 2)] || 12;

      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        const line = lines[lIdx];
        const trimmed = line.text.trim();
        if (!trimmed) continue;

        // Differentiate heading vs body text
        if (line.height >= medianHeight * 1.5 && trimmed.length < 100) {
          documentChildren.push(
            new Paragraph({
              text: trimmed,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            })
          );
        } else if (line.height >= medianHeight * 1.25 && trimmed.length < 120) {
          documentChildren.push(
            new Paragraph({
              text: trimmed,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 180, after: 80 },
            })
          );
        } else {
          documentChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed,
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
      }
    }

    // Add page break between pages (except last)
    if (pageNum < numPages) {
      documentChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  onProgress?.(85, 'Assembling Word document (.docx)...');

  const doc = new Document({
    title: file.name.replace(/\.pdf$/i, ''),
    description: 'Converted from PDF with Planner',
    sections: [
      {
        properties: {},
        children: documentChildren,
      },
    ],
  });

  const docxBlob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(docxBlob);

  const defaultName = file.name.replace(/\.pdf$/i, '') + '.docx';
  const filename = settings.filename
    ? (settings.filename.endsWith('.docx') ? settings.filename : `${settings.filename}.docx`)
    : defaultName;

  onProgress?.(100, 'Done!');

  let summary = `Extracted ${totalExtractedCharacters} characters across ${numPages} page${numPages > 1 ? 's' : ''} into Microsoft Word format.`;
  if (totalExtractedCharacters === 0) {
    summary += ' (Note: The PDF seems to contain scanned images without an embedded text layer).';
  }

  return {
    files: [
      {
        name: filename,
        blob: docxBlob,
        url,
        size: docxBlob.size,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        pageCount: numPages,
      },
    ],
    pageCount: numPages,
    summaryText: summary,
  };
}
