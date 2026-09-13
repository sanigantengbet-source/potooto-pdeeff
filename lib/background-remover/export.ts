export async function createSolidBackgroundBlob(
  transparentImageSource: string | HTMLImageElement,
  backgroundColor: string = '#FFFFFF',
  width: number,
  height: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw transparent image on top
  let imgElement: HTMLImageElement;
  if (typeof transparentImageSource === 'string') {
    imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = transparentImageSource;
    });
  } else {
    imgElement = transparentImageSource;
  }

  ctx.drawImage(imgElement, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image blob'));
      },
      format,
      quality
    );
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard API tidak didukung di browser ini.');
  }

  // Ensure blob is PNG for clipboard
  let pngBlob = blob;
  if (blob.type !== 'image/png') {
    // Convert to PNG
    const img = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const converted = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/png')
      );
      if (converted) pngBlob = converted;
    }
  }

  const item = new ClipboardItem({ 'image/png': pngBlob });
  await navigator.clipboard.write([item]);
  return true;
}
