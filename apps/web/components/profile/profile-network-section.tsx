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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('networkTab');
    if (t === 'pending' || t === 'sent' || t === 'visitors' || t === 'connections') {
      setTab(t);
    }
  }, []);

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
    <section className="overflow-hidden rounded-lg border border-border/80 bg-surface-elevated shadow-sm">
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-heading">My network</h2>
        <p className="mt-0.5 text-xs text-moons-muted">
          Connections and visitors. Respond to invites from the banner above or Notifications.
        </p>
      </div>

      <div className="flex border-b border-border">
        {SECTION_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 px-3 py-3 text-center text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${
              tab === item.id
                ? 'border-b-2 border-moons-blue text-moons-blue'
                : 'text-moons-muted hover:bg-surface/60 hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {error && (
          <p className="mb-4 rounded-lg border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
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
            <Empty message="No pending connection requests. New invites appear in the banner above and in Notifications." />
          ) : (
            <CardGrid>
              {pending.map((item) =>
                item.fromUser ? (
                  <PersonCard
                    key={item.id}
                    variant="discovery"
                    showConnect={false}
                    person={{
                      ...item.fromUser,
                      connectionStatus: 'PENDING',
                      connectionId: item.id,
                      connectionDirection: 'received',
                    }}
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
                <PersonCard
                  person={item.viewer}
                  variant={item.viewer.connectionStatus === 'ACCEPTED' ? 'network' : 'discovery'}
                  onUpdated={load}
                />
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
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function Empty({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-moons-muted">{message}</p>
    </div>
  );
}
