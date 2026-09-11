import { PDFDocument, degrees } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export interface OrganizePageSpec {
  id: string;
  sourceDocIndex: number; // 0 for initial PDF, >0 for added PDFs
  sourcePageIndex: number; // 0-based page index in that document
  rotation: number; // 0, 90, 180, 270
}

export async function exportOrganizedPdf(
  sourceFiles: File[],
  orderedPages: OrganizePageSpec[],
  outputFilename: string = 'organized-document.pdf',
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  if (orderedPages.length === 0) {
    throw new Error('Minimal harus ada 1 halaman pada dokumen hasil.');
  }

  onProgress?.({ percent: 15, stage: 'Membaca dokumen sumber...' });

  // Load all source PDF documents
  const loadedDocs: PDFDocument[] = [];
  for (let i = 0; i < sourceFiles.length; i++) {
    const buf = await sourceFiles[i].arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    loadedDocs.push(doc);
  }

  const newDoc = await PDFDocument.create();
  newDoc.setTitle('Organized PDF Document');
  newDoc.setProducer('Planner PDF Organizer');

  const total = orderedPages.length;

  for (let i = 0; i < total; i++) {
    const spec = orderedPages[i];
    const progressPercent = Math.round(25 + (i / total) * 60);

    onProgress?.({
      percent: progressPercent,
      stage: `Menata halaman ${i + 1} dari ${total}...`,
    });

    const srcDoc = loadedDocs[spec.sourceDocIndex];
    if (!srcDoc) continue;

    const [copiedPage] = await newDoc.copyPages(srcDoc, [spec.sourcePageIndex]);

    if (spec.rotation !== 0) {
      const currentRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRot + spec.rotation) % 360));
    }

    newDoc.addPage(copiedPage);
  }

  onProgress?.({ percent: 92, stage: 'Menyusun berkas PDF akhir...' });
  const finalBytes = await newDoc.save();

  onProgress?.({ percent: 100, stage: 'Dokumen berhasil diatur!' });

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  let finalName = outputFilename.trim();
  if (!finalName.toLowerCase().endsWith('.pdf')) {
    finalName = `${finalName || 'atur-halaman'}.pdf`;
  }

  return {
    toolId: 'organize',
    title: 'Atur PDF Berhasil',
    items: [
      {
        name: finalName,
        blob,
        size: blob.size,
        pageCount: total,
        url,
      },
    ],
    stats: {
      totalPages: total,
      resultSize: blob.size,
    },
  };
}
