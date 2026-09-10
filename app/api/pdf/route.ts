import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 60;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    const pageSize = (formData.get('pageSize') as string) || 'a4';
    const orientation = (formData.get('orientation') as string) || 'auto';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided for PDF generation.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many images. Maximum allowed is ${MAX_FILES}.` },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('Photo to PDF Document');
    pdfDoc.setProducer('Photo to PDF Engine');
    pdfDoc.setCreator('Photo to PDF');
    pdfDoc.setCreationDate(new Date());

    const A4: [number, number] = [595.28, 841.89];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 25MB limit.` },
          { status: 400 }
        );
      }

      const fileType = file.type.toLowerCase();
      if (!SUPPORTED_TYPES.includes(fileType) && !/\.(jpe?g|png)$/i.test(file.name)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has an unsupported format on the server. Please provide JPEG or PNG.`,
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let embeddedImg;
      if (fileType.includes('png') || /\.png$/i.test(file.name)) {
        embeddedImg = await pdfDoc.embedPng(bytes);
      } else {
        embeddedImg = await pdfDoc.embedJpg(bytes);
      }

      const imgWidth = embeddedImg.width;
      const imgHeight = embeddedImg.height;

      let pageWidth = A4[0];
      let pageHeight = A4[1];

      if (orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight)) {
        pageWidth = A4[1];
        pageHeight = A4[0];
      }

      const margin = 18;
      const printableW = pageWidth - margin * 2;
      const printableH = pageHeight - margin * 2;

      const scale = Math.min(printableW / imgWidth, printableH / imgHeight);
      const drawW = imgWidth * scale;
      const drawH = imgHeight * scale;
      const x = margin + (printableW - drawW) / 2;
      const y = margin + (printableH - drawH) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImg, {
        x,
        y,
        width: drawW,
        height: drawH,
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="photo-to-pdf.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate PDF on server.';
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
