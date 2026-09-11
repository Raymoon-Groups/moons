/**
 * Build the CORS allow-list from CORS_ORIGIN, and always include the www/apex
 * twin so https://moonsjob.com and https://www.moonsjob.com both work.
 */
export function expandCorsOrigins(configured: string[]): Set<string> {
  const origins = new Set<string>();

  for (const raw of configured) {
    const origin = raw.trim().replace(/\/$/, '');
    if (!origin) continue;
    origins.add(origin);

    try {
      const url = new URL(origin);
      if (url.hostname.startsWith('www.')) {
        const apex = new URL(origin);
        apex.hostname = url.hostname.slice(4);
        origins.add(apex.origin);
      } else if (url.hostname.includes('.')) {
        const www = new URL(origin);
        www.hostname = `www.${url.hostname}`;
        origins.add(www.origin);
      }
    } catch {
      // ignore invalid entries
    }
  }

  return origins;
}

export function isConfiguredCorsOrigin(origin: string): boolean {
  const configured = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allowed = expandCorsOrigins([
    ...configured,
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  return allowed.has(origin);
}
