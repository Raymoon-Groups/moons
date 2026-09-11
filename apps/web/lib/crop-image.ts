import type { Area } from 'react-easy-crop';

const MAX_EDGE_BY_KIND = {
  avatar: 1024,
  logo: 1024,
  cover: 1600,
} as const;

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  maxEdge: number = MAX_EDGE_BY_KIND.avatar,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not crop image');

  const sourceWidth = Math.max(1, Math.round(pixelCrop.width));
  const sourceHeight = Math.max(1, Math.round(pixelCrop.height));
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  const blob = await canvasToJpegBlob(canvas);
  const safeName = fileName.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${safeName}.jpg`, { type: 'image/jpeg' });
}

export function maxEdgeForCropKind(kind: 'avatar' | 'logo' | 'cover'): number {
  return MAX_EDGE_BY_KIND[kind];
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const qualities = [0.92, 0.82, 0.7, 0.58];
  let last: Blob | null = null;

  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
    });
    if (!blob) continue;
    last = blob;
    // Keep under API avatar/logo limit with headroom.
    if (blob.size <= 1.8 * 1024 * 1024) return blob;
  }

  if (last) return last;
  throw new Error('Could not crop image');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load image')));
    if (src.startsWith('http://') || src.startsWith('https://')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = src;
  });
}
