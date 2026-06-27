'use client';

import { useCallback, useEffect, useState } from 'react';
import { PersonCard } from '@/components/network/person-card';
import {
  fetchConnections,
  fetchPendingReceived,
  fetchPendingSent,
  fetchProfileVisitors,
  type ConnectionListItem,
  type PendingRequestItem,
  type ProfileVisitorItem,
} from '@/lib/network';

const SECTION_TABS = [
  { id: 'connections', label: 'My Connections' },
  { id: 'pending', label: 'Pending Requests' },
  { id: 'sent', label: 'Sent Requests' },
  { id: 'visitors', label: 'Profile Visitors' },
] as const;

type SectionTab = (typeof SECTION_TABS)[number]['id'];

export function ProfileNetworkSection() {
  const [tab, setTab] = useState<SectionTab>('connections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [pending, setPending] = useState<PendingRequestItem[]>([]);
  const [sent, setSent] = useState<PendingRequestItem[]>([]);
  const [visitors, setVisitors] = useState<ProfileVisitorItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      switch (tab) {
        case 'connections': {
          const data = await fetchConnections();
          setConnections(data.items);
          break;
        }
        case 'pending': {
          const data = await fetchPendingReceived();
          setPending(data.items);
          break;
        }
        case 'sent': {
          const data = await fetchPendingSent();
          setSent(data.items);
          break;
        }
        case 'visitors': {
          const data = await fetchProfileVisitors();
          setVisitors(data.items);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="dash-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold text-heading">My network</h2>
        <p className="mt-1 text-xs text-moons-muted">
          Connections, requests, and profile visitors.
        </p>
      </div>

      <div className="border-b border-border bg-surface/50 p-1.5">
        <div className="flex flex-wrap gap-1">
          {SECTION_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === item.id
                  ? 'bg-surface-elevated text-heading shadow-sm ring-1 ring-border'
                  : 'text-moons-muted hover:bg-surface hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-moons-muted">Loading…</p>
        ) : tab === 'connections' ? (
          connections.length === 0 ? (
            <Empty message="No connections yet. Visit My Network to find people to connect with." />
          ) : (
            <CardGrid>
              {connections.map((item) => (
                <PersonCard
                  key={item.connectionId}
                  variant="network"
                  person={{
                    ...item.user,
                    connectionStatus: 'ACCEPTED',
                    connectionId: item.connectionId,
                  }}
                  onUpdated={load}
                />
              ))}
            </CardGrid>
          )
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <Empty message="No pending connection requests." />
          ) : (
            <CardGrid>
              {pending.map((item) =>
                item.fromUser ? (
                  <PersonCard
                    key={item.id}
                    variant="discovery"
                    person={{
                      ...item.fromUser,
                      connectionStatus: 'PENDING',
                      connectionId: item.id,
                      connectionDirection: 'received',
                    }}
                    message={item.message ?? undefined}
                    onDismiss={() =>
                      setPending((prev) => prev.filter((p) => p.id !== item.id))
                    }
                  />
                ) : null,
              )}
            </CardGrid>
          )
        ) : tab === 'sent' ? (
          sent.length === 0 ? (
            <Empty message="You have not sent any connection requests." />
          ) : (
            <CardGrid>
              {sent.map((item) =>
                item.toUser ? (
                  <PersonCard
                    key={item.id}
                    variant="network"
                    person={{
                      ...item.toUser,
                      connectionStatus: 'PENDING',
                      connectionId: item.id,
                      connectionDirection: 'sent',
                    }}
                    onUpdated={load}
                  />
                ) : null,
              )}
            </CardGrid>
          )
        ) : visitors.length === 0 ? (
          <Empty message="No profile visitors yet, or visitor tracking is disabled in privacy settings." />
        ) : (
          <CardGrid>
            {visitors.map((item, index) => (
              <div key={`${item.viewer.userId}-${index}`}>
                <PersonCard person={item.viewer} onUpdated={load} />
                <p className="mt-1 px-1 text-[10px] text-moons-muted">
                  Viewed{' '}
                  {new Date(item.viewedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </CardGrid>
        )}
      </div>
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Empty({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-moons-muted">{message}</p>;
}
