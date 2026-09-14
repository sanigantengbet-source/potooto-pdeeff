import { getPdfDocument, renderPageToCanvas, computeCanvasDifference } from './pdf-renderer';
import { ProgressStatus } from './types';

export interface PageCompareResult {
  pageNumber: number;
  canvasA: HTMLCanvasElement;
  canvasB: HTMLCanvasElement;
  diffCanvas: HTMLCanvasElement;
  diffPercentage: number;
  hasDifference: boolean;
}

export interface DocumentCompareSummary {
  pagesA: number;
  pagesB: number;
  maxPages: number;
  identicalPages: number;
  changedPages: number;
  averageDiffPercentage: number;
}

export async function comparePdfDocuments(
  fileA: File,
  fileB: File,
  onProgress?: (status: ProgressStatus) => void
): Promise<{
  docA: any;
  docB: any;
  summary: DocumentCompareSummary;
  firstPageResult: PageCompareResult;
}> {
  onProgress?.({ percent: 15, stage: 'Membaca kedua dokumen PDF...' });

  const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
  const [docA, docB] = await Promise.all([getPdfDocument(bufA), getPdfDocument(bufB)]);

  const pagesA = docA.numPages;
  const pagesB = docB.numPages;
  const maxPages = Math.max(pagesA, pagesB);

  onProgress?.({ percent: 40, stage: 'Menganalisis perbedaan visual halaman...' });

  let identicalCount = 0;
  let changedCount = 0;
  let totalDiffPct = 0;

  // Compare first page for immediate interactive display
  const firstCanvasA = await renderPageToCanvas(docA, 1, 1.4);
  const firstCanvasB = pagesB >= 1 ? await renderPageToCanvas(docB, 1, 1.4) : document.createElement('canvas');
  const firstDiff = computeCanvasDifference(firstCanvasA, firstCanvasB);

  const firstPageResult: PageCompareResult = {
    pageNumber: 1,
    canvasA: firstCanvasA,
    canvasB: firstCanvasB,
    diffCanvas: firstDiff.diffCanvas,
    diffPercentage: firstDiff.diffPercentage,
    hasDifference: firstDiff.diffPercentage > 0.05,
  };

  if (firstPageResult.hasDifference) {
    changedCount++;
  } else {
    identicalCount++;
  }
  totalDiffPct += firstDiff.diffPercentage;

  // Sample or complete check for remaining pages
  const checkPages = Math.min(maxPages, 10);
  for (let p = 2; p <= checkPages; p++) {
    onProgress?.({
      percent: Math.round(40 + (p / checkPages) * 50),
      stage: `Membandingkan halaman ${p} dari ${checkPages}...`,
    });

    if (p <= pagesA && p <= pagesB) {
      const cA = await renderPageToCanvas(docA, p, 1.0);
      const cB = await renderPageToCanvas(docB, p, 1.0);
      const d = computeCanvasDifference(cA, cB);
      if (d.diffPercentage > 0.05) {
        changedCount++;
      } else {
        identicalCount++;
      }
      totalDiffPct += d.diffPercentage;
    } else {
      changedCount++;
      totalDiffPct += 100;
    }
  }

  // If there are more pages beyond 10, calculate weighted stats
  if (maxPages > checkPages) {
    const extraPages = maxPages - checkPages;
    if (pagesA !== pagesB) {
      changedCount += extraPages;
    } else {
      identicalCount += extraPages;
    }
  }

  const averageDiffPercentage = parseFloat((totalDiffPct / checkPages).toFixed(2));

  onProgress?.({ percent: 100, stage: 'Perbandingan selesai!' });

  return {
    docA,
    docB,
    summary: {
      pagesA,
      pagesB,
      maxPages,
      identicalPages: identicalCount,
      changedPages: changedCount,
      averageDiffPercentage,
    },
    firstPageResult,
  };
}

export async function compareSinglePage(
  docA: any,
  docB: any,
  pageNum: number,
  scale = 1.4
): Promise<PageCompareResult> {
  const pagesA = docA.numPages;
  const pagesB = docB.numPages;

  let canvasA: HTMLCanvasElement;
  let canvasB: HTMLCanvasElement;

  if (pageNum <= pagesA) {
    canvasA = await renderPageToCanvas(docA, pageNum, scale);
  } else {
    canvasA = document.createElement('canvas');
    canvasA.width = 400;
    canvasA.height = 560;
    const ctx = canvasA.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 560);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('(Halaman tidak ada di Dokumen 1)', 70, 280);
    }
  }

  if (pageNum <= pagesB) {
    canvasB = await renderPageToCanvas(docB, pageNum, scale);
  } else {
    canvasB = document.createElement('canvas');
    canvasB.width = 400;
    canvasB.height = 560;
    const ctx = canvasB.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 560);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('(Halaman tidak ada di Dokumen 2)', 70, 280);
    }
  }

  const diffResult = computeCanvasDifference(canvasA, canvasB);

  return {
    pageNumber: pageNum,
    canvasA,
    canvasB,
    diffCanvas: diffResult.diffCanvas,
    diffPercentage: diffResult.diffPercentage,
    hasDifference: diffResult.diffPercentage > 0.05,
  };
}
