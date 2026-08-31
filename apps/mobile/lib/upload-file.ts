import { cacheDirectory, copyAsync, getInfoAsync } from 'expo-file-system/legacy';
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
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'pdf') return 'application/pdf';
  return 'image/jpeg';
}

function extensionForMime(mimeType: string, fallback = 'jpg'): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
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

function toFileUri(path: string): string {
  if (path.startsWith('file://')) return path;
  if (path.startsWith('/')) return `file://${path}`;
  return path;
}

/** iOS multipart uploads expect a path without the file:// prefix. */
export function toFormDataPart(file: UploadableFile): UploadableFile {
  const uri =
    Platform.OS === 'ios' && file.uri.startsWith('file://')
      ? file.uri.replace('file://', '')
      : file.uri;
  return { ...file, uri };
}

function isInAppCache(uri: string): boolean {
  if (!cacheDirectory) return false;
  const normalized = uri.replace('file://', '');
  const cachePath = cacheDirectory.replace('file://', '');
  return normalized.startsWith(cachePath);
}

function mustCopyToCache(uri: string): boolean {
  if (!uri) return false;
  if (isInAppCache(uri)) return false;

  // Release Android builds cannot stream gallery content:// URIs in FormData.
  if (Platform.OS === 'android') return true;

  return (
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    uri.startsWith('data:')
  );
}

async function assertReadableFile(uri: string) {
  const info = await getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('Could not read the selected file. Try choosing it again.');
  }
  if ('size' in info && typeof info.size === 'number' && info.size <= 0) {
    throw new Error('The selected file is empty. Try another photo or video.');
  }
}

/**
 * Gallery/camera URIs (especially Android content://) cannot be streamed in multipart
 * uploads in Play Store builds. Copy to a cache file:// path first.
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

  if (mustCopyToCache(uri)) {
    const baseDir = cacheDirectory;
    if (!baseDir) {
      throw new Error('Could not prepare file for upload. Please try again.');
    }
    const ext = safeName.includes('.') ? safeName.split('.').pop()! : extensionForMime(type);
    const dest = `${baseDir}upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    try {
      await copyAsync({ from: uri, to: dest });
      uri = toFileUri(dest);
    } catch {
      throw new Error('Could not read the selected file. Try choosing it again.');
    }
  } else {
    uri = toFileUri(uri);
  }

  await assertReadableFile(uri);

  return toFormDataPart({ uri, name: safeName, type });
}

export async function prepareUploadFiles(
  files: Array<{ uri: string; name: string; mimeType?: string | null; type?: string | null }>,
): Promise<UploadableFile[]> {
  return Promise.all(files.map((file) => prepareUploadFile(file)));
}

export async function appendUploadFile(
  formData: FormData,
  fieldName: string,
  file: { uri: string; name: string; mimeType?: string | null; type?: string | null },
) {
  const uploadable = await prepareUploadFile(file);
  formData.append(fieldName, uploadable as unknown as Blob);
}
