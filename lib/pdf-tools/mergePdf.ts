import { PDFDocument } from 'pdf-lib';
import { PdfToolExecutionResult, ProgressStatus } from './types';

export interface MergeFileInput {
  file: File;
  name: string;
}

export async function mergePdfFiles(
  files: MergeFileInput[],
  customFilename: string = 'merged-document.pdf',
  onProgress?: (status: ProgressStatus) => void
): Promise<PdfToolExecutionResult> {
  if (files.length < 2) {
    throw new Error('Pilih minimal 2 file PDF untuk digabungkan.');
  }

  onProgress?.({ percent: 10, stage: 'Memulai penggabungan PDF...' });

  const mergedDoc = await PDFDocument.create();
  mergedDoc.setTitle('Merged PDF Document');
  mergedDoc.setProducer('Planner PDF Tools (Client-Side)');
  mergedDoc.setCreator('Planner');

  let totalPagesCount = 0;
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const item = files[i];
    const fileNum = i + 1;
    const progressPercent = Math.round(15 + (i / totalFiles) * 70);

    onProgress?.({
      percent: progressPercent,
      stage: `Menggabungkan berkas ${fileNum} dari ${totalFiles}: ${item.name}`,
    });

    const arrayBuffer = await item.file.arrayBuffer();
    const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageIndices = sourceDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);

    copiedPages.forEach((page) => {
      mergedDoc.addPage(page);
    });

    totalPagesCount += copiedPages.length;
  }

  onProgress?.({ percent: 90, stage: 'Menyusun berkas PDF akhir...' });
  const mergedBytes = await mergedDoc.save();

  onProgress?.({ percent: 100, stage: 'Selesai!' });

  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  let finalName = customFilename.trim();
  if (!finalName.toLowerCase().endsWith('.pdf')) {
    finalName = `${finalName || 'gabungan'}.pdf`;
  }

  return {
    toolId: 'merge',
    title: 'Gabungkan PDF Berhasil',
    items: [
      {
        name: finalName,
        blob,
        size: blob.size,
        pageCount: totalPagesCount,
        url,
      },
    ],
    stats: {
      totalPages: totalPagesCount,
      resultSize: blob.size,
    },
  };
}
