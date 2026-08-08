import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { JobListing } from '@/lib/types';

const STORAGE_PREFIX = 'moons.savedJobs.v2';

export type SavedJobEntry = {
  id: string;
  savedAt: number;
  job: JobListing;
};

type Listener = (entries: SavedJobEntry[]) => void;

const listeners = new Set<Listener>();
let memoryCache: { key: string; entries: SavedJobEntry[] } | null = null;

const isWeb = Platform.OS === 'web';

function notify(entries: SavedJobEntry[]) {
  listeners.forEach((listener) => listener(entries));
}

function storageKey(userId?: string | null) {
  // SecureStore allows letters, digits, `.`, `-`, `_` only.
  const scope = (userId || 'guest').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${STORAGE_PREFIX}.${scope}`;
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function readEntries(userId?: string | null): Promise<SavedJobEntry[]> {
  const key = storageKey(userId);
  if (memoryCache?.key === key) return memoryCache.entries;

  try {
    const raw = await getItem(key);
    if (!raw) {
      memoryCache = { key, entries: [] };
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed) ? parsed : [];
    const entries: SavedJobEntry[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Partial<SavedJobEntry>;
      if (typeof row.id !== 'string' || !row.job || typeof row.job !== 'object') continue;
      entries.push({
        id: row.id,
        savedAt: typeof row.savedAt === 'number' ? row.savedAt : Date.now(),
        job: row.job as JobListing,
      });
    }
    memoryCache = { key, entries };
    return entries;
  } catch {
    memoryCache = { key, entries: [] };
    return [];
  }
}

async function writeEntries(userId: string | null | undefined, entries: SavedJobEntry[]) {
  const key = storageKey(userId);
  // Newest first; cap size (storage limits on some devices).
  const next = entries.slice(0, 40);
  memoryCache = { key, entries: next };
  try {
    await setItem(key, JSON.stringify(next));
  } catch {
    // Still keep memory cache so the UI works for this session.
  }
  notify(next);
}

export function subscribeSavedJobs(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadSavedJobEntries(userId?: string | null) {
  return readEntries(userId);
}

export async function loadSavedJobIds(userId?: string | null) {
  const entries = await readEntries(userId);
  return entries.map((e) => e.id);
}

/** Toggle save. Pass full job so Saved list works without re-fetch. */
export async function toggleSavedJob(
  job: JobListing,
  userId?: string | null,
): Promise<boolean> {
  const entries = await readEntries(userId);
  const exists = entries.some((e) => e.id === job.id);
  let next: SavedJobEntry[];
  if (exists) {
    next = entries.filter((e) => e.id !== job.id);
  } else {
    next = [{ id: job.id, savedAt: Date.now(), job }, ...entries.filter((e) => e.id !== job.id)];
  }
  await writeEntries(userId, next);
  return !exists;
}

export async function removeSavedJob(jobId: string, userId?: string | null) {
  const entries = await readEntries(userId);
  if (!entries.some((e) => e.id === jobId)) return;
  await writeEntries(
    userId,
    entries.filter((e) => e.id !== jobId),
  );
}
