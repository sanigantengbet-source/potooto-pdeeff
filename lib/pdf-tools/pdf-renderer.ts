'use client';

import { getPdfJs } from '@/lib/converters/pdfjs-loader';
import { PageThumbnailItem } from './types';

export async function getPdfDocument(data: ArrayBuffer | Uint8Array, password?: string) {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data,
    password: password || undefined,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });
  return loadingTask.promise;
}

export async function getPdfPageCount(buffer: ArrayBuffer, password?: string): Promise<number> {
  const pdf = await getPdfDocument(buffer, password);
  return pdf.numPages;
}

export async function renderPageThumbnail(
  pdfDoc: any,
  pageNum: number,
  maxWidth = 260
): Promise<PageThumbnailItem> {
  const page = await pdfDoc.getPage(pageNum);
  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  // White background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  return {
    pageNumber: pageNum,
    originalIndex: pageNum - 1,
    dataUrl,
    width: unscaledViewport.width,
    height: unscaledViewport.height,
    rotation: unscaledViewport.rotation || 0,
  };
}

export async function renderAllThumbnails(
  buffer: ArrayBuffer,
  onProgress?: (progress: number, page: number, total: number) => void,
  maxPages = 80
): Promise<PageThumbnailItem[]> {
  const pdf = await getPdfDocument(buffer);
  const total = Math.min(pdf.numPages, maxPages);
  const items: PageThumbnailItem[] = [];

  for (let i = 1; i <= total; i++) {
    const thumb = await renderPageThumbnail(pdf, i, 220);
    items.push(thumb);
    if (onProgress) {
      onProgress(Math.round((i / total) * 100), i, total);
    }
  }

  return items;
}

export async function renderPageToCanvas(
  pdfDoc: any,
  pageNum: number,
  scale = 1.5,
  rotation = 0
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas;
}

export function computeCanvasDifference(
  canvasA: HTMLCanvasElement,
  canvasB: HTMLCanvasElement
): { diffCanvas: HTMLCanvasElement; diffPercentage: number; totalDiffPixels: number } {
  const width = Math.max(canvasA.width, canvasB.width);
  const height = Math.max(canvasA.height, canvasB.height);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d');
  if (!diffCtx) throw new Error('Cannot get canvas diff context');

  // Fill transparent
  diffCtx.clearRect(0, 0, width, height);

  const ctxA = canvasA.getContext('2d');
  const ctxB = canvasB.getContext('2d');
  if (!ctxA || !ctxB) throw new Error('Cannot get source canvas context');

  const imgDataA = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
  const imgDataB = ctxB.getImageData(0, 0, canvasB.width, canvasB.height);

  const diffImageData = diffCtx.createImageData(width, height);
  const dataA = imgDataA.data;
  const dataB = imgDataB.data;
  const out = diffImageData.data;

  let diffPixels = 0;
  const totalPixels = width * height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const outIdx = (y * width + x) * 4;

      const inA = x < canvasA.width && y < canvasA.height;
      const inB = x < canvasB.width && y < canvasB.height;

      const idxA = inA ? (y * canvasA.width + x) * 4 : -1;
      const idxB = inB ? (y * canvasB.width + x) * 4 : -1;

      const rA = inA ? dataA[idxA] : 255;
      const gA = inA ? dataA[idxA + 1] : 255;
      const bA = inA ? dataA[idxA + 2] : 255;

      const rB = inB ? dataB[idxB] : 255;
      const gB = inB ? dataB[idxB + 1] : 255;
      const bB = inB ? dataB[idxB + 2] : 255;

      const delta = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB);

      if (delta > 28) {
        diffPixels++;
        // Highlight differences in vivid magenta/crimson
        out[outIdx] = 239; // R
        out[outIdx + 1] = 68; // G
        out[outIdx + 2] = 68; // B
        out[outIdx + 3] = 230; // A
      } else {
        // Subtle background tint of unchanged content
        out[outIdx] = Math.round((rA + rB) / 2);
        out[outIdx + 1] = Math.round((gA + gB) / 2);
        out[outIdx + 2] = Math.round((bA + bB) / 2);
        out[outIdx + 3] = 70; // Low opacity background
      }
    }
  }

  diffCtx.putImageData(diffImageData, 0, 0);

  const diffPercentage = parseFloat(((diffPixels / totalPixels) * 100).toFixed(2));

  return {
    diffCanvas,
    diffPercentage,
    totalDiffPixels: diffPixels,
  };
}
