import { INDIAN_CITIES, INDIAN_CITY_OPTIONS, type IndianCity } from '@moons/shared';
import { apiFetch } from './api-client';

export interface LocationSuggestion {
  name: string;
  state?: string;
}

export { INDIAN_CITY_OPTIONS };

function scoreCity(city: LocationSuggestion, q: string): number {
  const name = city.name.toLowerCase();
  const state = city.state?.toLowerCase() ?? '';
  if (name.startsWith(q)) return 100 - name.length;
  if (name.includes(q)) return 50 - name.length;
  if (state.startsWith(q)) return 30;
  if (state.includes(q)) return 20;
  return 0;
}

export function filterStaticLocations(query: string, limit = 8): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return (INDIAN_CITIES as IndianCity[])
    .filter((city) => scoreCity(city, q) > 0)
    .sort((a, b) => scoreCity(b, q) - scoreCity(a, q))
    .slice(0, limit);
}

export async function fetchLocationSuggestions(
  query: string,
  limit = 8,
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const staticMatches = filterStaticLocations(q, limit);

  try {
    const params = new URLSearchParams({ q, limit: String(limit) });
    const fromApi = await apiFetch<string[]>(`/jobs/locations/suggest?${params}`, {
      cache: false,
    });

    const merged = new Map<string, LocationSuggestion>();
    for (const item of staticMatches) {
      merged.set(item.name.toLowerCase(), item);
    }
    for (const name of fromApi) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!merged.has(key)) {
        merged.set(key, { name: trimmed });
      }
    }

    const combined = Array.from(merged.values());
    combined.sort((a, b) => scoreCity(b, q) - scoreCity(a, q));
    return combined.slice(0, limit);
  } catch {
    return staticMatches;
  }
}

/** Split city label to highlight the typed segment (Naukri-style). */
export function splitLocationHighlight(name: string, query: string) {
  const q = query.trim();
  if (!q) return { before: name, match: '', after: '' };
  const idx = name.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return { before: name, match: '', after: '' };
  return {
    before: name.slice(0, idx),
    match: name.slice(idx, idx + q.length),
    after: name.slice(idx + q.length),
  };
}
