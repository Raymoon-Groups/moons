import { extname } from 'path';

/** Normalize mobile multipart mime types (HEIC, image/jpg, octet-stream). */
export function normalizeUploadMime(mimetype: string, filename: string): string {
  const base = (mimetype || '').toLowerCase().split(';')[0].trim();
  if (base === 'image/jpg') return 'image/jpeg';
  if (base && base !== 'application/octet-stream') return base;

  switch (extname(filename).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.heic':
      return 'image/heic';
    case '.heif':
      return 'image/heif';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.webm':
      return 'video/webm';
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt':
      return 'text/plain';
    default:
      return base || 'application/octet-stream';
  }
}
