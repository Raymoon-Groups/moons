'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationType, UserRole } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import {
  fetchBellNotifications,
  formatNotificationTime,
  markBellNotificationsRead,
  markNotificationRead,
  notifyNotificationsRefresh,
  type NotificationItem,
} from '@/lib/notifications';

const POLL_MS = 10_000;
const INITIAL_DELAY_MS = 1200;

type InviteActionState = 'accepted' | 'ignored';

function notificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.APPLICATION_SHORTLISTED:
      return '★';
    case NotificationType.APPLICATION_REJECTED:
      return '✕';
    case NotificationType.APPLICATION_RECEIVED:
      return '↓';
    case NotificationType.APPLICATION_SUBMITTED:
      return '✓';
    case NotificationType.APPLICATION_VIEWED:
      return '👁';
    case NotificationType.PROFILE_VIEW:
      return '👤';
    case NotificationType.CONNECTION_REQUEST:
      return '⊕';
    case NotificationType.CONNECTION_ACCEPTED:
      return '🤝';
    default:
      return '•';
  }
}

function iconStyles(type: NotificationType) {
  switch (type) {
    case NotificationType.APPLICATION_SHORTLISTED:
      return 'bg-emerald-100 text-emerald-700';
    case NotificationType.APPLICATION_REJECTED:
      return 'bg-red-100 text-red-600';
    case NotificationType.APPLICATION_RECEIVED:
      return 'bg-blue-100 text-moons-blue';
    case NotificationType.APPLICATION_SUBMITTED:
      return 'bg-green-100 text-green-700';
    case NotificationType.APPLICATION_VIEWED:
      return 'bg-sky-100 text-sky-700';
    case NotificationType.PROFILE_VIEW:
      return 'bg-violet-100 text-violet-700';
    case NotificationType.CONNECTION_REQUEST:
      return 'bg-indigo-100 text-indigo-700';
    case NotificationType.CONNECTION_ACCEPTED:
      return 'bg-teal-100 text-teal-700';
    default:
      return 'bg-surface text-moons-muted';
  }
}

function getConnectionId(item: NotificationItem): string | null {
  const meta = item.metadata;
  if (!meta || typeof meta !== 'object') return null;
  const id = (meta as { connectionId?: unknown }).connectionId;
  return typeof id === 'string' && id.trim() ? id : null;
}

function NotificationDot() {
  return (
    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-elevated bg-moons-blue" />
  );
}

export function NotificationBell({ hasUnread = false }: { hasUnread?: boolean }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionById, setActionById] = useState<Record<string, InviteActionState>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  const unreadInList = items.some((item) => !item.readAt);
  const showDot = hasUnread || unreadInList;

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const loadNotifications = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) return;
      if (!opts?.silent) setLoading(true);
      try {
        const data = await fetchBellNotifications();
        setItems(data);
      } catch {
        if (!opts?.silent) setItems([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [user],
  );

  const refreshLive = useCallback(async () => {
    if (!user) return;
    if (openRef.current) {
      await loadNotifications({ silent: true });
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!ready || !user) return;

    const initialTimer = window.setTimeout(() => {
      void loadNotifications({ silent: true });
    }, INITIAL_DELAY_MS);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshLive();
      }
    }, POLL_MS);

    function onVisible() {
      if (document.visibilityState === 'visible') {
        void refreshLive();
      }
    }

    let manualRefreshTimer: number | undefined;
    function onManualRefresh() {
      if (manualRefreshTimer) window.clearTimeout(manualRefreshTimer);
      manualRefreshTimer = window.setTimeout(() => {
        void refreshLive();
        void loadNotifications({ silent: true });
      }, INITIAL_DELAY_MS);
    }

    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('moons:notifications-refresh', onManualRefresh);

    return () => {
      window.clearTimeout(initialTimer);
      if (manualRefreshTimer) window.clearTimeout(manualRefreshTimer);
      window.clearInterval(interval);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('moons:notifications-refresh', onManualRefresh);
    };
  }, [ready, user, loadNotifications, refreshLive]);

  useEffect(() => {
    if (open && user) {
      void loadNotifications();
    }
  }, [open, user, loadNotifications]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function markItemRead(item: NotificationItem) {
    if (item.readAt) return;
    try {
      await markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      notifyNotificationsRefresh();
    } catch {
      // ignore
    }
  }

  async function handleItemClick(item: NotificationItem) {
    await markItemRead(item);
    setOpen(false);
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  }

  async function handleInviteAction(
    item: NotificationItem,
    action: 'accept' | 'ignore',
  ) {
    const connectionId = getConnectionId(item);
    if (!connectionId || actionLoadingId) return;

    setActionLoadingId(item.id);
    try {
      if (action === 'accept') {
        await acceptConnectionInvite(connectionId);
        setActionById((prev) => ({ ...prev, [item.id]: 'accepted' }));
      } else {
        await ignoreConnectionInvite(connectionId);
        setActionById((prev) => ({ ...prev, [item.id]: 'ignored' }));
      }
      await markItemRead(item);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((n) => n.id !== item.id));
        setActionById((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }, 1800);
    } catch {
      // keep item; user can retry
    } finally {
      setActionLoadingId(null);
    }
  }

  async function markAllRead() {
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    try {
      await markBellNotificationsRead();
      notifyNotificationsRefresh();
    } catch {
      await loadNotifications();
    }
  }

  if (!ready || !user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated text-heading shadow-sm transition hover:border-moons-blue/30 hover:bg-surface-hover hover:text-moons-blue"
        aria-label={`Notifications${showDot ? ', unread' : ''}`}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {showDot && <NotificationDot />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-bold text-heading">Notifications</h3>
            {unreadInList && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-moons-blue hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-moons-muted">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-moons-muted">
                No notifications yet
              </p>
            )}
            {!loading &&
              items.map((item) => {
                const isRequest = item.type === NotificationType.CONNECTION_REQUEST;
                const connectionId = getConnectionId(item);
                const inviteState = actionById[item.id];
                const canAct = isRequest && !!connectionId && !inviteState;

                if (isRequest) {
                  return (
                    <div
                      key={item.id}
                      className={`border-b border-border px-4 py-3 transition ${
                        inviteState === 'accepted'
                          ? 'bg-emerald-50/80 dark:bg-emerald-500/10'
                          : inviteState === 'ignored'
                            ? 'bg-red-50/80 dark:bg-red-500/10'
                            : item.readAt
                              ? 'opacity-90'
                              : 'bg-moons-blue/10'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconStyles(item.type)}`}
                        >
                          {notificationIcon(item.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-heading">{item.title}</p>
                            <span className="shrink-0 text-[10px] text-moons-muted">
                              {formatNotificationTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-foreground">{item.body}</p>

                          {inviteState === 'accepted' && (
                            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              Connection accepted
                            </p>
                          )}
                          {inviteState === 'ignored' && (
                            <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
                              Request ignored
                            </p>
                          )}

                          {canAct && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                disabled={actionLoadingId === item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleInviteAction(item, 'accept');
                                }}
                                className="inline-flex h-7 flex-1 items-center justify-center rounded-full bg-moons-blue px-3 text-[11px] font-bold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                              >
                                {actionLoadingId === item.id ? '…' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleInviteAction(item, 'ignore');
                                }}
                                className="inline-flex h-7 flex-1 items-center justify-center rounded-full border border-red-200 bg-white px-3 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:bg-transparent dark:hover:bg-red-500/10"
                              >
                                Ignore
                              </button>
                            </div>
                          )}
                        </div>
                        {!item.readAt && !inviteState && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-moons-blue" />
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleItemClick(item)}
                    className={`flex w-full gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-surface-hover ${
                      item.readAt ? 'opacity-75' : 'bg-moons-blue/10'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconStyles(item.type)}`}
                    >
                      {notificationIcon(item.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-heading">{item.title}</span>
                        <span className="shrink-0 text-[10px] text-moons-muted">
                          {formatNotificationTime(item.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-foreground">{item.body}</span>
                    </span>
                    {!item.readAt && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-moons-blue" />
                    )}
                  </button>
                );
              })}
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-border bg-surface px-4 py-2 text-center">
            <Link
              href="/network"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-moons-blue hover:underline"
            >
              View network
            </Link>
            <span className="text-border">·</span>
            <Link
              href={user.role === UserRole.RECRUITER ? '/recruiter/jobs' : '/applications'}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-moons-blue hover:underline"
            >
              {user.role === UserRole.RECRUITER ? 'View my jobs' : 'View my applications'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
