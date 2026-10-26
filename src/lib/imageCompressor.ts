/**
 * Fast client-side image compression utility.
 * Resizes images to max dimensions and converts them to efficient base64 data URIs.
 * Works seamlessly across mobile browsers (Android/iOS) and desktop PCs.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/webp';
}

export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.82,
    outputFormat = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context for compression'));
          return;
        }

        // Fill with subtle background for transparent PNG conversions
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw downscaled image with high image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL(outputFormat, quality);
          resolve(dataUrl);
        } catch (err) {
          // Fallback to JPEG if WebP is unsupported
          try {
            const fallbackUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(fallbackUrl);
          } catch (fallbackErr) {
            reject(fallbackErr);
          }
        }
      };

      img.onerror = (err) => {
        reject(new Error('Failed to load image for compression'));
      };

      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      } else {
        reject(new Error('Invalid image file reader result'));
      }
    };

    reader.onerror = (err) => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}
