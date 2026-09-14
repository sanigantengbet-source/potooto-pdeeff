export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  rotation: 0 | 90 | 180 | 270;
  width: number;
  height: number;
}

export type QualitySetting = 'standard' | 'high' | 'maximum';

// Configurable constants
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per image
export const MAX_IMAGES_COUNT = 60; // 60 images per conversion
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const isTypeSupported =
    SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isTypeSupported) {
    return {
      valid: false,
      error: `"${file.name}" has an unsupported format. Please upload JPG, PNG, or WEBP images.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the 25MB limit. Please upload a smaller image.`,
    };
  }

  return { valid: true };
}

export async function createImageItem(file: File): Promise<ImageItem> {
  const previewUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        rotation: 0,
        width: img.naturalWidth || 800,
        height: img.naturalHeight || 600,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error(`Unable to load image "${file.name}". The file may be corrupt.`));
    };
    img.src = previewUrl;
  });
}

export function revokeImageItem(item: ImageItem) {
  if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(item.previewUrl);
  }
}

export interface ProcessedImageData {
  bytes: Uint8Array;
  format: 'jpg' | 'png';
  width: number;
  height: number;
}

/**
 * Prepares image for PDF embedding:
 * - Rotates image if needed
 * - Converts WEBP or uncompressed images to JPEG/PNG compatible with pdf-lib
 * - Scales according to quality profile to keep PDF responsive and reasonably sized
 */
export async function processImageForPdf(
  item: ImageItem,
  quality: QualitySetting
): Promise<ProcessedImageData> {
  const isWebp = item.type.includes('webp') || /\.webp$/i.test(item.name);
  const isPng = item.type.includes('png') || /\.png$/i.test(item.name);
  const isJpg = item.type.includes('jpeg') || item.type.includes('jpg') || /\.(jpe?g)$/i.test(item.name);

  // If no rotation, maximum quality, and already supported JPG or PNG, we can use original bytes directly!
  if (item.rotation === 0 && quality === 'maximum' && (isJpg || isPng) && !isWebp) {
    const arrayBuffer = await item.file.arrayBuffer();
    return {
      bytes: new Uint8Array(arrayBuffer),
      format: isPng ? 'png' : 'jpg',
      width: item.width,
      height: item.height,
    };
  }

  // Otherwise, use Canvas to apply rotation, format conversion, and optional compression
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const rad = (item.rotation * Math.PI) / 180;
        const isRotated90or270 = item.rotation === 90 || item.rotation === 270;

        const origW = img.naturalWidth || item.width;
        const origH = img.naturalHeight || item.height;

        // Determine max boundary based on quality
        let maxDimension = 3600;
        let compressionRatio = 0.92;

        if (quality === 'standard') {
          maxDimension = 1800;
          compressionRatio = 0.78;
        } else if (quality === 'high') {
          maxDimension = 2600;
          compressionRatio = 0.88;
        } else {
          maxDimension = 4200;
          compressionRatio = 0.98;
        }

        // Calculate scaling
        let scale = 1;
        const maxCurrent = Math.max(origW, origH);
        if (maxCurrent > maxDimension) {
          scale = maxDimension / maxCurrent;
        }

        const targetW = Math.round(origW * scale);
        const targetH = Math.round(origH * scale);

        const canvas = document.createElement('canvas');
        if (isRotated90or270) {
          canvas.width = targetH;
          canvas.height = targetW;
        } else {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // Fill background white for JPEG (in case of transparent PNG/WebP)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply rotation around center
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();

        // Export as JPEG blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error(`Failed to encode image "${item.name}"`));
              return;
            }
            const buffer = await blob.arrayBuffer();
            resolve({
              bytes: new Uint8Array(buffer),
              format: 'jpg',
              width: canvas.width,
              height: canvas.height,
            });
          },
          'image/jpeg',
          compressionRatio
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image for processing: "${item.name}"`));
    };

    img.src = item.previewUrl;
  });
}
