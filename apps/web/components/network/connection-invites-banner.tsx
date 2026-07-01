'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import { truncateMessagePreview } from '@/lib/messages';
import { fetchPendingReceived, type PendingRequestItem } from '@/lib/network';

export function ConnectionInvitesBanner() {
  const { user, ready } = useAuth();
  const [invites, setInvites] = useState<PendingRequestItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchPendingReceived();
      setInvites(data.items);
    } catch {
      setInvites([]);
    }
  }, [user]);

  useEffect(() => {
    if (!ready || !user) return;
    void load();
    const onRefresh = () => void load();
    window.addEventListener('moons:connections-refresh', onRefresh);
    window.addEventListener('moons:notifications-refresh', onRefresh);
    return () => {
      window.removeEventListener('moons:connections-refresh', onRefresh);
      window.removeEventListener('moons:notifications-refresh', onRefresh);
    };
  }, [ready, user, load]);

  if (!ready || !user || invites.length === 0) return null;

  async function handleAccept(connectionId: string) {
    setLoadingId(connectionId);
    try {
      await acceptConnectionInvite(connectionId);
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleIgnore(connectionId: string) {
    setLoadingId(connectionId);
    try {
      await ignoreConnectionInvite(connectionId);
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
    } finally {
      setLoadingId(null);
    }
  }

  const first = invites[0];
  const person = first.fromUser;
  const name = person?.fullName?.trim() || 'Someone';
  const avatar = person ? resolveAvatarUrl(person.avatarUrl) : null;
  const moreCount = invites.length - 1;

  return (
    <div className="border-b border-moons-blue/20 bg-moons-blue/8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-bold text-moons-navy ring-2 ring-surface-elevated">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-heading">
              {name} invited you to connect
              {moreCount > 0 ? ` · +${moreCount} more` : ''}
            </p>
            {first.message ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-foreground">
                &ldquo;{truncateMessagePreview(first.message, 140)}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-moons-muted">Accept to add them to your network</p>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          {first.message && person && (
            <Link
              href={`/messages?with=${person.userId}`}
              className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-surface-elevated px-4 text-xs font-semibold text-heading transition hover:bg-surface"
            >
              View note
            </Link>
          )}
          <button
            type="button"
            disabled={loadingId === first.id}
            onClick={() => void handleIgnore(first.id)}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-full border border-border bg-surface-elevated px-4 text-xs font-semibold text-heading transition hover:bg-surface disabled:opacity-60 sm:flex-none"
          >
            Ignore
          </button>
          <button
            type="button"
            disabled={loadingId === first.id}
            onClick={() => void handleAccept(first.id)}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-full bg-moons-blue px-4 text-xs font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60 sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
