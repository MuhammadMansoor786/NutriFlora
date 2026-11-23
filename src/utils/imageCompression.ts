export interface ResizedDimensions {
  width: number;
  height: number;
}

export function calculateResizedDimensions(
  width: number,
  height: number,
  maxWidth: number = 1024
): ResizedDimensions {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : maxWidth;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : maxWidth;

  if (safeWidth <= maxWidth) {
    return {
      width: Math.max(1, Math.round(safeWidth)),
      height: Math.max(1, Math.round(safeHeight)),
    };
  }

  const scale = maxWidth / safeWidth;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export interface CompressedImageResult {
  dataUrl: string;
  file?: File;
  width: number;
  height: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to decode image for compression.'));
    img.src = src;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

export async function compressImageForUpload(
  source: File | string,
  maxWidth: number = 1024,
  quality: number = 0.85
): Promise<CompressedImageResult> {
  const inputDataUrl = typeof source === 'string' ? source : await readFileAsDataUrl(source);
  const originalFile = typeof source === 'string' ? undefined : source;

  try {
    const img = await loadImageElement(inputDataUrl);
    const { width, height } = calculateResizedDimensions(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      maxWidth
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { dataUrl: inputDataUrl, file: originalFile, width, height };
    }

    ctx.drawImage(img, 0, 0, width, height);
    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    const blob = await canvasToJpegBlob(canvas, quality);

    const baseName = originalFile
      ? originalFile.name.replace(/\.[^.]+$/, '') || 'produce-upload'
      : 'produce-upload';
    const compressedFile = blob
      ? new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
      : originalFile;

    return {
      dataUrl: compressedDataUrl,
      file: compressedFile,
      width,
      height,
    };
  } catch {
    return {
      dataUrl: inputDataUrl,
      file: originalFile,
      width: maxWidth,
      height: maxWidth,
    };
  }
}
