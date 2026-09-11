export type ConverterCategory =
  | 'image-to-pdf'
  | 'office-to-pdf'
  | 'pdf-to-image'
  | 'pdf-to-office'
  | 'pdf-to-pdfa';

export type ToolId =
  | 'jpg-to-pdf'
  | 'png-to-pdf'
  | 'webp-to-pdf'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'ppt-to-pdf'
  | 'html-to-pdf'
  | 'pdf-to-jpg'
  | 'pdf-to-png'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-ppt'
  | 'pdf-to-pdfa';

export interface ConverterToolMeta {
  id: ToolId;
  name: string;
  fromFormat: string;
  toFormat: string;
  shortLabel: string;
  description: string;
  category: ConverterCategory;
  accept: string;
  multiple: boolean;
  maxFiles?: number;
  outputExtension: string;
  outputMimeType: string;
}

export type ConversionStatus = 'IDLE' | 'READING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

export interface ConvertedOutputFile {
  name: string;
  blob: Blob;
  url: string;
  size: number;
  type: string;
  previewUrl?: string;
  pageNumber?: number;
  pageCount?: number;
}

export interface ConversionOutputResult {
  files: ConvertedOutputFile[];
  zipBlob?: Blob;
  zipUrl?: string;
  zipFilename?: string;
  summaryText?: string;
  pageCount?: number;
}

export interface ProgressState {
  stage: string;
  percent: number;
}

export type ProgressCallback = (percent: number, stage: string) => void;
