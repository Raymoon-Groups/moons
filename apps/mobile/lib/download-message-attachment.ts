import { Linking } from 'react-native';
import { resolveAssetUrl } from '@/lib/assets';

/**
 * Open a chat attachment so the recipient can view or save it.
 * Uses the hosted file URL (same path production serves under /uploads).
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
