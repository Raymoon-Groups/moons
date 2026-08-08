import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  loadSavedJobEntries,
  removeSavedJob,
  subscribeSavedJobs,
  toggleSavedJob,
  type SavedJobEntry,
} from '@/lib/saved-jobs';
import type { JobListing } from '@/lib/types';

type SavedJobsContextValue = {
  entries: SavedJobEntry[];
  savedIds: string[];
  savedCount: number;
  ready: boolean;
  isSaved: (jobId: string) => boolean;
  toggle: (job: JobListing) => Promise<boolean>;
  remove: (jobId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const SavedJobsContext = createContext<SavedJobsContextValue | null>(null);

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [entries, setEntries] = useState<SavedJobEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadSavedJobEntries(userId);
    setEntries(next);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    setReady(false);
    void refresh();
    return subscribeSavedJobs((next) => {
      setEntries(next);
      setReady(true);
    });
  }, [refresh]);

  const savedIds = useMemo(() => entries.map((e) => e.id), [entries]);

  const isSaved = useCallback((jobId: string) => savedIds.includes(jobId), [savedIds]);

  const toggle = useCallback(
    async (job: JobListing) => {
      // Optimistic UI update so the bookmark + Saved list update immediately.
      setEntries((prev) => {
        const exists = prev.some((e) => e.id === job.id);
        if (exists) return prev.filter((e) => e.id !== job.id);
        return [{ id: job.id, savedAt: Date.now(), job }, ...prev.filter((e) => e.id !== job.id)];
      });
      return toggleSavedJob(job, userId);
    },
    [userId],
  );

  const remove = useCallback(
    async (jobId: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== jobId));
      await removeSavedJob(jobId, userId);
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      entries,
      savedIds,
      savedCount: entries.length,
      ready,
      isSaved,
      toggle,
      remove,
      refresh,
    }),
    [entries, isSaved, ready, refresh, remove, savedIds, toggle],
  );

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs() {
  const ctx = useContext(SavedJobsContext);
  if (!ctx) {
    throw new Error('useSavedJobs must be used within SavedJobsProvider');
  }
  return ctx;
}
