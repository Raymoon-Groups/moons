import { cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type UploadableFile = {
  uri: string;
  name: string;
  type: string;
};

function normalizeMimeType(mimeType: string | undefined, fileName: string): string {
  const normalized = (mimeType ?? '').trim().toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  if (normalized) return normalized;

  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

function extensionForMime(mimeType: string, fallback = 'bin'): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'video/mp4':
      return 'mp4';
    case 'video/quicktime':
      return 'mov';
    case 'video/webm':
      return 'webm';
    case 'application/pdf':
      return 'pdf';
    default:
      return fallback;
  }
}

/**
 * Android release builds cannot stream `content://` URIs in multipart uploads.
 * Copy to a cache `file://` path first (preview still works with content URIs).
 */
export async function prepareUploadFile(file: {
  uri: string;
  name: string;
  mimeType?: string | null;
  type?: string | null;
}): Promise<UploadableFile> {
  const type = normalizeMimeType(file.mimeType ?? file.type ?? undefined, file.name);
  const safeName = file.name?.trim() || `upload.${extensionForMime(type)}`;
  let uri = file.uri;

  const needsCopy =
    Platform.OS === 'android' &&
    (uri.startsWith('content://') || uri.startsWith('ph://'));

  if (needsCopy) {
    const ext = safeName.includes('.') ? safeName.split('.').pop()! : extensionForMime(type);
    const baseDir = cacheDirectory ?? '';
    const dest = `${baseDir}upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await copyAsync({ from: uri, to: dest });
    uri = dest.startsWith('file://') ? dest : `file://${dest}`;
  }

  return { uri, name: safeName, type };
}

export async function prepareUploadFiles(
  files: Array<{ uri: string; name: string; mimeType?: string | null; type?: string | null }>,
): Promise<UploadableFile[]> {
  return Promise.all(files.map((file) => prepareUploadFile(file)));
}
