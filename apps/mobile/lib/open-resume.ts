import {
  cacheDirectory,
  documentDirectory,
  downloadAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import { getAssetAuthToken, resolveAssetUrl } from '@/lib/assets';

/**
 * Reliably open/download a resume with auth (works after /uploads was locked down).
 */
export async function openResumeFile(
  url: string | null | undefined,
  fileName?: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const href = resolveAssetUrl(url);
  if (!href) {
    return { ok: false, message: 'Resume is not available.' };
  }

  try {
    const token = getAssetAuthToken();
    const name = (fileName || 'resume.pdf').replace(/[^\w.\-()+ ]+/g, '_');

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const response = await fetch(href, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { ok: false, message: 'You do not have permission to open this resume.' };
        }
        return { ok: false, message: 'Could not open resume. Please try again.' };
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return { ok: true };
    }

    const baseDir = cacheDirectory ?? documentDirectory;
    if (baseDir) {
      const target = `${baseDir}${name}`;
      const result = await downloadAsync(href, target, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (result.status >= 200 && result.status < 300) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri, {
            mimeType: name.toLowerCase().endsWith('.pdf')
              ? 'application/pdf'
              : 'application/octet-stream',
            dialogTitle: 'Open resume',
          });
          return { ok: true };
        }
        await WebBrowser.openBrowserAsync(result.uri);
        return { ok: true };
      }
      if (result.status === 401 || result.status === 403) {
        return { ok: false, message: 'You do not have permission to open this resume.' };
      }
    }

    await WebBrowser.openBrowserAsync(href);
    return { ok: true };
  } catch {
    try {
      await WebBrowser.openBrowserAsync(href);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Could not open resume. Please try again.' };
    }
  }
}

export async function openResumeFileOrAlert(
  url: string | null | undefined,
  fileName?: string | null,
) {
  const result = await openResumeFile(url, fileName);
  if (!result.ok) {
    Alert.alert('Resume', result.message);
  }
}
