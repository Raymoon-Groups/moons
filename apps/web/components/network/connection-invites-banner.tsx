'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import { truncateMessagePreview } from '@/lib/messages';
import { fetchPendingReceived, type PendingRequestItem } from '@/lib/network';

const DISMISS_MS = 5000;

type InviteAction = 'idle' | 'accepted' | 'ignored';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M4.5 10.5 8 14l7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="7.5" cy="6.5" r="2.5" />
      <path d="M2.5 16.5c0-2.5 2.2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" />
      <path d="M17.5 16.5c0-2-1.6-3.5-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function ConnectionInvitesBanner() {
  const { user, ready } = useAuth();
  const [invites, setInvites] = useState<PendingRequestItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<InviteAction>('idle');
  const [dismissing, setDismissing] = useState(false);
  const [entered, setEntered] = useState(false);
  const holdInviteRef = useRef<PendingRequestItem | null>(null);
  const dismissTimersRef = useRef<{ fade?: number; remove?: number }>({});

  const clearDismissTimers = useCallback(() => {
    if (dismissTimersRef.current.fade) window.clearTimeout(dismissTimersRef.current.fade);
    if (dismissTimersRef.current.remove) window.clearTimeout(dismissTimersRef.current.remove);
    dismissTimersRef.current = {};
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchPendingReceived();
      const held = holdInviteRef.current;
      if (held) {
        const rest = data.items.filter((item) => item.id !== held.id);
        setInvites([held, ...rest]);
        return;
      }
      setInvites(data.items);
    } catch {
      if (!holdInviteRef.current) setInvites([]);
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

  useEffect(() => {
    return () => clearDismissTimers();
  }, [clearDismissTimers]);

  const first = invites[0];

  useEffect(() => {
    if (!first) return;
    setEntered(false);
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [first?.id]);

  const person = first?.fromUser;
  const name = person?.fullName?.trim() || 'Someone';
  const avatar = person ? resolveAvatarUrl(person.avatarUrl) : null;
  const moreCount = invites.length - 1;

  function scheduleDismiss(connectionId: string) {
    clearDismissTimers();
    setDismissing(false);
    dismissTimersRef.current.fade = window.setTimeout(() => {
      setDismissing(true);
      dismissTimersRef.current.remove = window.setTimeout(() => {
        holdInviteRef.current = null;
        setInvites((prev) => prev.filter((i) => i.id !== connectionId));
        setActionState('idle');
        setDismissing(false);
        setLoadingId(null);
        void load();
      }, 320);
    }, DISMISS_MS);
  }

  async function handleAccept(connectionId: string) {
    const current = invites.find((item) => item.id === connectionId) ?? first;
    if (!current) return;
    setLoadingId(connectionId);
    holdInviteRef.current = current;
    try {
      await acceptConnectionInvite(connectionId);
      setActionState('accepted');
      scheduleDismiss(connectionId);
    } catch {
      holdInviteRef.current = null;
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
      setActionState('idle');
      setLoadingId(null);
      void load();
    }
  }

  async function handleIgnore(connectionId: string) {
    const current = invites.find((item) => item.id === connectionId) ?? first;
    if (!current) return;
    setLoadingId(connectionId);
    holdInviteRef.current = current;
    try {
      await ignoreConnectionInvite(connectionId);
      setActionState('ignored');
      scheduleDismiss(connectionId);
    } catch {
      holdInviteRef.current = null;
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
      setActionState('idle');
      setLoadingId(null);
      void load();
    }
  }

  if (!ready || !user || !first) return null;

  const isAccepted = actionState === 'accepted';
  const isIgnored = actionState === 'ignored';
  const actionTaken = isAccepted || isIgnored;

  return (
    <div
      className={`pointer-events-none fixed right-4 top-[4.75rem] z-40 w-[min(100vw-2rem,24rem)] transition-all duration-500 ease-out ${
        entered && !dismissing ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-[0_20px_50px_-12px_rgba(26,39,68,0.28)] backdrop-blur-md transition-colors duration-500 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] ${
          isAccepted
            ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:border-emerald-500/35 dark:from-emerald-500/10 dark:via-surface-elevated dark:to-emerald-500/5'
            : isIgnored
              ? 'border-red-300/80 bg-gradient-to-br from-red-50 via-white to-red-50/60 dark:border-red-500/35 dark:from-red-500/10 dark:via-surface-elevated dark:to-red-500/5'
              : 'border-border/70 bg-gradient-to-br from-white via-surface-elevated to-moons-blue/[0.06] dark:from-surface-elevated dark:via-surface-elevated dark:to-moons-blue/10'
        }`}
      >
        <div
          className={`h-1 w-full ${
            isAccepted
              ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600'
              : isIgnored
                ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                : 'bg-gradient-to-r from-moons-blue via-sky-400 to-moons-blue'
          }`}
        />

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-moons-blue">
              <UsersIcon className="h-3 w-3" />
              Connection
            </span>
            {!actionTaken && moreCount > 0 && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-moons-muted ring-1 ring-border/60">
                +{moreCount} more
              </span>
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div
                className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold shadow-sm ring-2 ${
                  isAccepted
                    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                    : isIgnored
                      ? 'bg-red-100 text-red-800 ring-red-200'
                      : 'bg-gradient-to-br from-moons-blue/15 to-sky-100 text-moons-navy ring-white dark:ring-surface-elevated'
                }`}
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              {actionTaken && (
                <span
                  className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md ${
                    isAccepted ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                >
                  {isAccepted ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-snug text-heading">
                {isAccepted
                  ? 'Connection accepted'
                  : isIgnored
                    ? 'Request declined'
                    : `${name} invited you`}
              </p>
              {actionTaken ? (
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isAccepted ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {isAccepted
                    ? `${name} is now in your network.`
                    : `You declined ${name}'s connection request.`}
                </p>
              ) : first.message ? (
                <p className="mt-1 line-clamp-2 rounded-lg bg-surface/80 px-2.5 py-1.5 text-xs leading-relaxed text-foreground ring-1 ring-border/50">
                  &ldquo;{truncateMessagePreview(first.message, 110)}&rdquo;
                </p>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-moons-muted">
                  Accept to add them to your professional network.
                </p>
              )}
            </div>
          </div>

          {!actionTaken && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                disabled={loadingId === first.id}
                onClick={() => void handleAccept(first.id)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-moons-blue to-sky-500 px-3 text-xs font-bold text-white shadow-md shadow-moons-blue/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {loadingId === first.id ? '…' : 'Accept'}
              </button>
              <button
                type="button"
                disabled={loadingId === first.id}
                onClick={() => void handleIgnore(first.id)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200/80 bg-white/80 px-3 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:bg-transparent dark:hover:bg-red-500/10"
              >
                Ignore
              </button>
            </div>
          )}

          {!actionTaken && first.message && person && (
            <Link
              href={`/messages?with=${person.userId}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg py-1.5 text-[11px] font-semibold text-moons-blue transition hover:underline"
            >
              View invitation note →
            </Link>
          )}

          {actionTaken && (
            <div
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-md ${
                isAccepted ? 'bg-emerald-600 shadow-emerald-600/25' : 'bg-red-600 shadow-red-600/25'
              }`}
            >
              {isAccepted ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
              {isAccepted ? 'Added to your network' : 'Invite declined'}
            </div>
          )}

          {actionTaken && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                key={`${first.id}-${actionState}`}
                className={`h-full origin-left rounded-full ${
                  isAccepted ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ animation: `invite-dismiss ${DISMISS_MS}ms linear forwards` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
