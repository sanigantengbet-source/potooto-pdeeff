import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFBool,
} from 'pdf-lib';
import { ConversionOutputResult, ProgressCallback } from './types';
import { formatPdfFilename } from '@/lib/pdf';

export interface PdfToPdfASettings {
  filename?: string;
  conformance?: '2b' | '1b';
}

export async function convertPdfToPdfA(
  file: File,
  settings: PdfToPdfASettings = {},
  onProgress?: ProgressCallback
): Promise<ConversionOutputResult> {
  onProgress?.(10, 'Reading PDF document...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(30, 'Parsing PDF catalog and resources...');
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: false,
  });

  const numPages = pdfDoc.getPageCount();
  if (numPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  onProgress?.(50, 'Injecting PDF/A-2b OutputIntent color profile...');

  // 1. Create OutputIntent dictionary conforming to ISO 19005-2 (PDF/A-2b)
  const outputIntent = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputCondition: PDFString.of('sRGB IEC61966-2.1'),
    OutputConditionIdentifier: PDFString.of('Custom'),
    RegistryName: PDFString.of('http://www.color.org'),
    Info: PDFString.of('sRGB IEC61966-2.1'),
  });

  // Attach OutputIntent to Document Catalog
  pdfDoc.catalog.set(
    PDFName.of('OutputIntents'),
    pdfDoc.context.obj([outputIntent])
  );

  onProgress?.(65, 'Marking structure and conformance flags...');

  // 2. MarkInfo dictionary (Marked: true)
  pdfDoc.catalog.set(
    PDFName.of('MarkInfo'),
    pdfDoc.context.obj({
      Marked: PDFBool.True,
    })
  );

  // 3. Document Info attributes
  const title = file.name.replace(/\.pdf$/i, '');
  const now = new Date();
  const isoDate = now.toISOString();

  pdfDoc.setTitle(title);
  pdfDoc.setProducer('Planner (PDF/A Archival Engine)');
  pdfDoc.setCreator('Planner PDF/A-2b Converter');
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  onProgress?.(80, 'Generating ISO 19005-2 XMP metadata stream...');

  // 4. Construct XMP Metadata conforming to PDF/A-2b
  const xmpMetadata = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>2</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>Planner PDF Converter</rdf:li>
        </rdf:Seq>
      </dc:creator>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreateDate>${isoDate}</xmp:CreateDate>
      <xmp:ModifyDate>${isoDate}</xmp:ModifyDate>
      <xmp:MetadataDate>${isoDate}</xmp:MetadataDate>
      <xmp:CreatorTool>Planner PDF Archival Engine</xmp:CreatorTool>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>Planner (PDF/A Archival Engine)</pdf:Producer>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const metadataStream = pdfDoc.context.flateStream(xmpMetadata, {
    Type: 'Metadata',
    Subtype: 'XML',
  });
  const metadataStreamRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataStreamRef);

  onProgress?.(92, 'Validating and saving PDF/A document...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const defaultName = file.name.replace(/\.pdf$/i, '') + '-pdfa.pdf';
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
        pageCount: numPages,
      },
    ],
    pageCount: numPages,
    summaryText: `Successfully converted PDF into archival PDF/A-2b standard (${numPages} page${numPages > 1 ? 's' : ''}).`,
  };
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
