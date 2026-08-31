'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiError, authFetch } from '@/lib/api-client';

type Subscriber = {
  id: string;
  email: string;
  createdAt: string;
};

export default function AdminNewsletterPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch<{ total: number; items: Subscriber[] }>('/newsletter/subscribers')
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load subscribers');
      })
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    const rows = ['email,subscribed_at', ...items.map((i) => `${i.email},${i.createdAt}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moonsjob-newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Newsletter subscribers</h2>
            <p className="mt-1 text-sm text-moons-muted">{total} active subscribers</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!items.length}
            className="rounded-full bg-moons-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-moons-muted">Loading…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-500">{error}</p>
        ) : items.length === 0 ? (
          <p className="mt-6 text-sm text-moons-muted">No subscribers yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border/70">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="font-medium text-foreground">{item.email}</span>
                <span className="text-xs text-moons-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
