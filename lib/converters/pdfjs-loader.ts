// Client-side loader for PDF.js

export async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be initialized in the browser.');
  }

  const pdfjs = await import('pdfjs-dist');
  
  // Set worker source to local public worker for offline support, with fallback
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }

  return pdfjs;
}
