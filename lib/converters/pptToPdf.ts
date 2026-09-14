import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { ConversionOutputResult, ProgressCallback } from './types';
import { formatPdfFilename } from '@/lib/pdf';

export interface PptToPdfSettings {
  filename?: string;
}

interface SlideItem {
  slideNumber: number;
  xmlPath: string;
  relsPath: string;
}

export async function convertPptToPdf(
  file: File,
  settings: PptToPdfSettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pptx') {
    throw new Error('Please select a valid Microsoft PowerPoint (.pptx) presentation.');
  }

  onProgress?.(10, 'Reading PowerPoint presentation...');
  const arrayBuffer = await file.arrayBuffer();

  const zip = await JSZip.loadAsync(arrayBuffer);

  // Discover all slides in ppt/slides/slide*.xml
  const slideFiles: SlideItem[] = [];
  zip.forEach((path) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      slideFiles.push({
        slideNumber: num,
        xmlPath: path,
        relsPath: `ppt/slides/_rels/slide${num}.xml.rels`,
      });
    }
  });

  if (slideFiles.length === 0) {
    throw new Error('No slides found in the PowerPoint presentation.');
  }

  // Sort slides in natural order
  slideFiles.sort((a, b) => a.slideNumber - b.slideNumber);

  onProgress?.(25, `Found ${slideFiles.length} slide${slideFiles.length > 1 ? 's' : ''}. Rendering slides...`);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(file.name.replace(/\.pptx$/i, ''));
  pdfDoc.setProducer('Planner (Client-side Engine)');
  pdfDoc.setCreator('Planner');
  pdfDoc.setCreationDate(new Date());

  // 16:9 standard PDF slide page in points (e.g. 960 x 540 pt)
  const slideWidthPt = 960;
  const slideHeightPt = 540;
  const canvasW = 1920;
  const canvasH = 1080;

  const parser = new DOMParser();

  for (let i = 0; i < slideFiles.length; i++) {
    const slideItem = slideFiles[i];
    const currentSlideNum = i + 1;
    const progressPercent = 25 + Math.round((i / slideFiles.length) * 65);
    onProgress?.(progressPercent, `Rendering slide ${currentSlideNum} of ${slideFiles.length}...`);

    // 1. Read slide XML
    const slideXmlStr = await zip.file(slideItem.xmlPath)?.async('text');
    if (!slideXmlStr) continue;
    const slideXml = parser.parseFromString(slideXmlStr, 'application/xml');

    // 2. Read relationships to find media images
    const relsXmlStr = await zip.file(slideItem.relsPath)?.async('text');
    const relsMap: Record<string, string> = {};
    if (relsXmlStr) {
      const relsDoc = parser.parseFromString(relsXmlStr, 'application/xml');
      const relElements = relsDoc.getElementsByTagName('Relationship');
      for (let r = 0; r < relElements.length; r++) {
        const id = relElements[r].getAttribute('Id');
        const target = relElements[r].getAttribute('Target');
        if (id && target) {
          // Normalize target path relative to ppt/slides
          let norm = target.replace(/^\.\.\//, 'ppt/');
          if (!norm.startsWith('ppt/')) norm = `ppt/${norm}`;
          relsMap[id] = norm;
        }
      }
    }

    // 3. Extract text paragraphs & titles
    const textParagraphs: string[] = [];
    const pElements = slideXml.getElementsByTagName('a:p');
    for (let p = 0; p < pElements.length; p++) {
      const textRuns: string[] = [];
      const tElements = pElements[p].getElementsByTagName('a:t');
      for (let t = 0; t < tElements.length; t++) {
        const str = tElements[t].textContent;
        if (str) textRuns.push(str);
      }
      const fullP = textRuns.join('').trim();
      if (fullP) {
        textParagraphs.push(fullP);
      }
    }

    // 4. Extract embedded images from slide
    const slideImages: { dataUrl: string; widthRatio?: number; heightRatio?: number }[] = [];
    const blipElements = slideXml.getElementsByTagName('a:blip');
    for (let b = 0; b < blipElements.length; b++) {
      const rId = blipElements[b].getAttribute('r:embed') || blipElements[b].getAttribute('embed');
      if (rId && relsMap[rId]) {
        const mediaFile = zip.file(relsMap[rId]);
        if (mediaFile) {
          const imgBase64 = await mediaFile.async('base64');
          const ext = relsMap[rId].split('.').pop()?.toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          slideImages.push({ dataUrl: `data:${mime};base64,${imgBase64}` });
        }
      }
    }

    // 5. Draw Slide to Canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Slide Background: Modern clean gradient
    const bgGradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle slide border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvasW - 40, canvasH - 40);

    // Slide Header: Title / Slide number indicator
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Slide ${currentSlideNum} of ${slideFiles.length}`, 80, 80);

    let contentStartY = 160;

    // If there is a title (first paragraph)
    if (textParagraphs.length > 0) {
      const title = textParagraphs[0];
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      
      // Wrap title if needed
      const words = title.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > (canvasW - 200)) {
          ctx.fillText(line, 80, contentStartY);
          contentStartY += 68;
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line, 80, contentStartY);
        contentStartY += 80;
      }
    }

    // Draw images if present
    let textAvailableWidth = canvasW - 160;
    if (slideImages.length > 0) {
      try {
        const imgObj = new Image();
        imgObj.src = slideImages[0].dataUrl;
        await new Promise((resolve) => {
          imgObj.onload = resolve;
          imgObj.onerror = resolve;
        });

        if (imgObj.complete && imgObj.naturalWidth > 0) {
          const maxImgW = 600;
          const maxImgH = 500;
          const scale = Math.min(maxImgW / imgObj.naturalWidth, maxImgH / imgObj.naturalHeight, 1);
          const drawW = imgObj.naturalWidth * scale;
          const drawH = imgObj.naturalHeight * scale;
          const imgX = canvasW - drawW - 80;
          const imgY = contentStartY;

          // Shadow and frame for image
          ctx.shadowColor = 'rgba(0,0,0,0.1)';
          ctx.shadowBlur = 16;
          ctx.drawImage(imgObj, imgX, imgY, drawW, drawH);
          ctx.shadowBlur = 0;

          textAvailableWidth = imgX - 120;
        }
      } catch {
        // Image render fallback
      }
    }

    // Draw subsequent body paragraphs / bullet points
    ctx.fillStyle = '#334155';
    ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    for (let pIdx = 1; pIdx < textParagraphs.length; pIdx++) {
      if (contentStartY > canvasH - 120) break;
      const text = textParagraphs[pIdx];

      // Draw bullet mark
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(88, contentStartY - 10, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      // Wrap paragraph words
      const words = text.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > textAvailableWidth) {
          ctx.fillText(line, 112, contentStartY);
          contentStartY += 44;
          line = word;
          if (contentStartY > canvasH - 120) break;
        } else {
          line = testLine;
        }
      }
      if (line && contentStartY <= canvasH - 120) {
        ctx.fillText(line, 112, contentStartY);
        contentStartY += 54;
      }
    }

    // 6. Embed canvas image into PDF page
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const imgBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
    const embedded = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([slideWidthPt, slideHeightPt]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: slideWidthPt,
      height: slideHeightPt,
    });
  }

  onProgress?.(92, 'Finalizing presentation PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const defaultName = file.name.replace(/\.pptx$/i, '') + '.pdf';
  const filename = formatPdfFilename(settings.filename || defaultName);

  onProgress?.(100, 'Done!');

  return {
    files: [
      {
        name: filename,
        blob,
        url,
        size: blob.size,
        type: 'application/pdf',
        pageCount: slideFiles.length,
      },
    ],
    pageCount: slideFiles.length,
    summaryText: `Converted ${slideFiles.length} PowerPoint slide${slideFiles.length > 1 ? 's' : ''} into a presentation PDF.`,
  };
}
