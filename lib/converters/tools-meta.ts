import { ConverterToolMeta, ToolId } from './types';

export const CONVERTER_TOOLS: ConverterToolMeta[] = [
  // IMAGE -> PDF
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    fromFormat: 'JPG',
    toFormat: 'PDF',
    shortLabel: 'JPG → PDF',
    description: 'Convert JPG / JPEG photos into a polished PDF document.',
    category: 'image-to-pdf',
    accept: 'image/jpeg,.jpg,.jpeg',
    multiple: true,
    maxFiles: 60,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },
  {
    id: 'png-to-pdf',
    name: 'PNG to PDF',
    fromFormat: 'PNG',
    toFormat: 'PDF',
    shortLabel: 'PNG → PDF',
    description: 'Convert transparent or crisp PNG graphics into a PDF.',
    category: 'image-to-pdf',
    accept: 'image/png,.png',
    multiple: true,
    maxFiles: 60,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },
  {
    id: 'webp-to-pdf',
    name: 'WEBP to PDF',
    fromFormat: 'WEBP',
    toFormat: 'PDF',
    shortLabel: 'WEBP → PDF',
    description: 'Convert modern WebP images into high quality PDF pages.',
    category: 'image-to-pdf',
    accept: 'image/webp,.webp',
    multiple: true,
    maxFiles: 60,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },

  // OFFICE & HTML -> PDF
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    fromFormat: 'Word',
    toFormat: 'PDF',
    shortLabel: 'Word → PDF',
    description: 'Convert Word (.docx) documents into clean, paginated PDF.',
    category: 'office-to-pdf',
    accept: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
    multiple: false,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    fromFormat: 'Excel',
    toFormat: 'PDF',
    shortLabel: 'Excel → PDF',
    description: 'Convert Excel spreadsheets (.xlsx, .xls) into organized PDF tables.',
    category: 'office-to-pdf',
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    multiple: false,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    fromFormat: 'PowerPoint',
    toFormat: 'PDF',
    shortLabel: 'PowerPoint → PDF',
    description: 'Convert PowerPoint slides (.pptx) into presentation PDF pages.',
    category: 'office-to-pdf',
    accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    multiple: false,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },
  {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    fromFormat: 'HTML',
    toFormat: 'PDF',
    shortLabel: 'HTML → PDF',
    description: 'Convert HTML documents or web templates into formatted PDF.',
    category: 'office-to-pdf',
    accept: '.html,.htm,text/html',
    multiple: false,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },

  // PDF -> IMAGE
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    fromFormat: 'PDF',
    toFormat: 'JPG',
    shortLabel: 'PDF → JPG',
    description: 'Extract every PDF page as a high-quality JPG image.',
    category: 'pdf-to-image',
    accept: '.pdf,application/pdf',
    multiple: false,
    outputExtension: 'jpg',
    outputMimeType: 'image/jpeg',
  },
  {
    id: 'pdf-to-png',
    name: 'PDF to PNG',
    fromFormat: 'PDF',
    toFormat: 'PNG',
    shortLabel: 'PDF → PNG',
    description: 'Render PDF pages into crisp, lossless PNG graphics.',
    category: 'pdf-to-image',
    accept: '.pdf,application/pdf',
    multiple: false,
    outputExtension: 'png',
    outputMimeType: 'image/png',
  },

  // PDF -> OFFICE
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    fromFormat: 'PDF',
    toFormat: 'Word',
    shortLabel: 'PDF → Word',
    description: 'Extract text, structure, and paragraphs into editable .docx format.',
    category: 'pdf-to-office',
    accept: '.pdf,application/pdf',
    multiple: false,
    outputExtension: 'docx',
    outputMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    fromFormat: 'PDF',
    toFormat: 'Excel',
    shortLabel: 'PDF → Excel',
    description: 'Extract tables, rows, and structured data into an .xlsx spreadsheet.',
    category: 'pdf-to-office',
    accept: '.pdf,application/pdf',
    multiple: false,
    outputExtension: 'xlsx',
    outputMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    fromFormat: 'PDF',
    toFormat: 'PowerPoint',
    shortLabel: 'PDF → PowerPoint',
    description: 'Convert each PDF page into a presentation slide in .pptx format.',
    category: 'pdf-to-office',
    accept: '.pdf,application/pdf',
    multiple: false,
    outputExtension: 'pptx',
    outputMimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },

  // PDF -> PDF/A
  {
    id: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    fromFormat: 'PDF',
    toFormat: 'PDF/A',
    shortLabel: 'PDF → PDF/A',
    description: 'Convert standard PDF to archival PDF/A-2b standard for long-term storage.',
    category: 'pdf-to-pdfa',
    accept: '.pdf,application/pdf',
    multiple: false,
    outputExtension: 'pdf',
    outputMimeType: 'application/pdf',
  },
];

export const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  'image-to-pdf': {
    label: 'IMAGE → PDF',
    description: 'Combine and format photos into high-quality PDF files',
  },
  'office-to-pdf': {
    label: 'OFFICE / HTML → PDF',
    description: 'Convert Word, Excel, PowerPoint, and HTML documents into PDF',
  },
  'pdf-to-image': {
    label: 'PDF → IMAGE',
    description: 'Export PDF pages to individual JPG or PNG images',
  },
  'pdf-to-office': {
    label: 'PDF → OFFICE',
    description: 'Convert PDF files back to editable Word, Excel, and PowerPoint',
  },
  'pdf-to-pdfa': {
    label: 'PDF → PDF/A',
    description: 'Standardize PDF for digital preservation and legal archiving',
  },
};

export function getToolMeta(toolId: string | null): ConverterToolMeta {
  const found = CONVERTER_TOOLS.find((t) => t.id === toolId);
  return found || CONVERTER_TOOLS[0];
}

export const getToolById = getToolMeta;

export function isValidToolId(toolId: string | null): boolean {
  return CONVERTER_TOOLS.some((t) => t.id === toolId);
}
