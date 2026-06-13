import { apiFetch } from './api-client';

export interface LocationSuggestion {
  name: string;
  state?: string;
}

/** Major Indian cities + common job locations (Naukri-style autocomplete source) */
const INDIAN_CITIES: LocationSuggestion[] = [
  { name: 'Gurugram', state: 'Haryana' },
  { name: 'Gurgaon', state: 'Haryana' },
  { name: 'Gurua', state: 'Odisha' },
  { name: 'Gurudijhatia', state: 'Odisha' },
  { name: 'Gurundia', state: 'Odisha' },
  { name: 'Gurur', state: 'Karnataka' },
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
  { name: 'Thiruvananthapuram', state: 'Kerala' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { name: 'Vijayawada', state: 'Andhra Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Bhubaneswar', state: 'Odisha' },
  { name: 'Cuttack', state: 'Odisha' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Rajkot', state: 'Gujarat' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Thane', state: 'Maharashtra' },
  { name: 'Faridabad', state: 'Haryana' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { name: 'Agra', state: 'Uttar Pradesh' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Dehradun', state: 'Uttarakhand' },
  { name: 'Mohali', state: 'Punjab' },
  { name: 'Ludhiana', state: 'Punjab' },
  { name: 'Amritsar', state: 'Punjab' },
  { name: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Udaipur', state: 'Rajasthan' },
  { name: 'Raipur', state: 'Chhattisgarh' },
  { name: 'Ranchi', state: 'Jharkhand' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Mysore', state: 'Karnataka' },
  { name: 'Mysuru', state: 'Karnataka' },
  { name: 'Mangalore', state: 'Karnataka' },
  { name: 'Hubli', state: 'Karnataka' },
  { name: 'Madurai', state: 'Tamil Nadu' },
  { name: 'Trichy', state: 'Tamil Nadu' },
  { name: 'Trivandrum', state: 'Kerala' },
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
