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
    const response = await fetch(href, {
      // Cookie session is primary; Bearer is optional (in-memory) for local cross-origin media.
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, message: 'You do not have permission to open this resume.' };
      }
      return { ok: false, message: 'Could not open resume. Please try again.' };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const name = (fileName || 'resume.pdf').replace(/[^\w.\-()+ ]+/g, '_');

    // Prefer download for recruiters; PDF still opens from downloads folder.
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Also open in a new tab when browser allows (PDF preview).
    window.setTimeout(() => {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    }, 150);

    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not open resume. Please try again.' };
  }
}
