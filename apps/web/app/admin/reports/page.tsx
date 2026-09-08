'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiError, authFetch } from '@/lib/api-client';

type AbuseReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
type AbuseReportTarget = 'COMMENT' | 'POST' | 'USER' | 'JOB' | 'MESSAGE';

type AbuseReportItem = {
  id: string;
  targetType: AbuseReportTarget;
  targetId: string;
  reason: string | null;
  details: string | null;
  status: AbuseReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    email: string;
    fullName: string | null;
  };
};

const STATUS_FILTERS: Array<{ value: '' | AbuseReportStatus; label: string }> = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ACTIONED', label: 'Actioned' },
];

const NEXT_ACTIONS: Array<{ status: AbuseReportStatus; label: string }> = [
  { status: 'REVIEWED', label: 'Mark reviewed' },
  { status: 'ACTIONED', label: 'Mark actioned' },
  { status: 'DISMISSED', label: 'Dismiss' },
  { status: 'OPEN', label: 'Reopen' },
];

export default function AdminReportsPage() {
  const [items, setItems] = useState<AbuseReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | AbuseReportStatus>('OPEN');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100';
      const data = await authFetch<{ items: AbuseReportItem[] }>(`/reports/admin${query}`);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: AbuseReportStatus) {
    setUpdatingId(id);
    setError('');
    setMessage('');
    try {
      await authFetch(`/reports/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage(`Report marked ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update report');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Abuse reports</h2>
            <p className="mt-1 text-sm text-moons-muted">
              Review user-submitted reports for comments, posts, and other targets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  statusFilter === filter.value
                    ? 'bg-moons-blue text-white'
                    : 'bg-surface text-moons-muted hover:text-foreground'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-moons-muted">Loading reports…</p>
        ) : items.length === 0 ? (
          <p className="mt-8 text-sm text-moons-muted">No reports in this filter.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border/70 bg-surface-elevated/80 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.targetType} ·{' '}
                      <span className="font-mono text-xs text-moons-muted">{item.targetId}</span>
                    </p>
                    <p className="mt-1 text-sm text-moons-muted">
                      Reported by {item.reporter.fullName || item.reporter.email} ·{' '}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-moons-muted">
                    {item.status}
                  </span>
                </div>
                {(item.reason || item.details) && (
                  <p className="mt-3 text-sm text-foreground">
                    {item.reason}
                    {item.reason && item.details ? ' — ' : null}
                    {item.details}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {NEXT_ACTIONS.filter((action) => action.status !== item.status).map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => void updateStatus(item.id, action.status)}
                      className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-moons-blue hover:text-white disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
