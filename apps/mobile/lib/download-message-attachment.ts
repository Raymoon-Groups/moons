import { Linking, Platform } from 'react-native';
import { getAssetAuthToken, resolveAssetUrl } from '@/lib/assets';

/**
 * Open a chat attachment so the recipient can view or save it.
 * Uses authenticated /api/v1/media URLs (legacy /uploads paths are rewritten).
 */
export async function downloadMessageAttachment(opts: {
  url: string;
  fileName: string;
  mimeType?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const href = resolveAssetUrl(opts.url) ?? opts.url;
  if (!href) {
    return { ok: false, message: 'This file is unavailable.' };
  }

  try {
    // On web, fetch with auth then trigger a download (Linking may drop query tokens).
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const token = getAssetAuthToken();
      const response = await fetch(href, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        return { ok: false, message: 'Could not download this file. Please try again.' };
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = opts.fileName || 'attachment';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      return { ok: true };
    }

    const canOpen = await Linking.canOpenURL(href);
    if (!canOpen) {
      return { ok: false, message: 'Could not open this file on your device.' };
    }
    await Linking.openURL(href);
    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not download this file. Please try again.' };
  }
}
