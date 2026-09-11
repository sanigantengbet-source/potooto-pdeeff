export type PdfToolId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'organize'
  | 'rotate'
  | 'delete-pages'
  | 'extract-pages'
  | 'edit'
  | 'watermark'
  | 'sign'
  | 'protect'
  | 'unlock'
  | 'repair'
  | 'page-numbers'
  | 'crop'
  | 'compare';

export interface PdfToolMeta {
  id: PdfToolId;
  name: string;
  description: string;
  shortLabel: string;
  multipleFiles?: boolean;
  requiresSecondFile?: boolean;
  badge?: string;
}

export interface ProgressStatus {
  percent: number;
  stage: string;
}

export interface PdfToolResultItem {
  name: string;
  blob: Blob;
  size: number;
  pageCount?: number;
  url: string;
}

export interface PdfToolExecutionResult {
  toolId: PdfToolId;
  title: string;
  items: PdfToolResultItem[];
  zipBlob?: Blob;
  zipUrl?: string;
  stats?: {
    originalSize?: number;
    resultSize?: number;
    reductionPercentage?: number;
    totalPages?: number;
    differencePercentage?: number;
  };
}

export interface PageThumbnailItem {
  pageNumber: number;
  originalIndex: number;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
}
