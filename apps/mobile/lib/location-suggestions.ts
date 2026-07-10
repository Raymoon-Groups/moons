import { apiFetch } from '@/lib/api';

export interface LocationSuggestion {
  name: string;
  state?: string;
}

const INDIAN_CITIES: LocationSuggestion[] = [
  { name: 'Gurugram', state: 'Haryana' },
  { name: 'Gurgaon', state: 'Haryana' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'New Delhi', state: 'Delhi' },
  { name: 'Noida', state: 'Uttar Pradesh' },
  { name: 'Greater Noida', state: 'Uttar Pradesh' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Kochi', state: 'Kerala' },
  { name: 'Remote' },
  { name: 'Work from home' },
];

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

  return INDIAN_CITIES.filter((city) => scoreCity(city, q) > 0)
    .sort((a, b) => scoreCity(b, q) - scoreCity(a, q))
    .slice(0, limit);
}

export async function fetchLocationSuggestions(query: string, limit = 8): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const staticMatches = filterStaticLocations(q, limit);

  try {
    const params = new URLSearchParams({ q, limit: String(limit) });
    const fromApi = await apiFetch<string[]>(`/jobs/locations/suggest?${params}`);
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
