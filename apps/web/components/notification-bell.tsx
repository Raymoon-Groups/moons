'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationType, UserRole } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';
import {
  fetchNotifications,
  fetchUnreadCount,
  formatNotificationTime,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/notifications';

const POLL_MS = 10_000;
const INITIAL_DELAY_MS = 1200;

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
    default:
      return 'bg-surface text-moons-muted';
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const refreshUnread = useCallback(async () => {
    if (!user) return;
    try {
      const { count } = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore when logged out or API unavailable
    }
  }, [user]);

  const loadNotifications = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) return;
      if (!opts?.silent) setLoading(true);
      try {
        const [data, { count }] = await Promise.all([
          fetchNotifications(),
          fetchUnreadCount(),
        ]);
        setItems(data);
        setUnreadCount(count);
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
    } else {
      await refreshUnread();
    }
  }, [user, loadNotifications, refreshUnread]);

  useEffect(() => {
    if (!ready || !user) return;

    const initialTimer = window.setTimeout(() => {
      void refreshUnread();
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
  }, [ready, user, refreshUnread, loadNotifications, refreshLive]);

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

  async function handleItemClick(item: NotificationItem) {
    if (!item.readAt) {
      try {
        await markNotificationRead(item.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setItems((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
        );
      } catch {
        // continue navigation
      }
    }
    setOpen(false);
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  }

  async function markAllRead() {
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    try {
      await markAllNotificationsRead();
    } catch {
      await loadNotifications();
    }
  }

  function handleBellClick() {
    setOpen((prev) => !prev);
  }

  if (!ready || !user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleBellClick}
        className="relative rounded-full p-1 text-moons-muted transition hover:bg-surface-hover hover:text-moons-blue"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
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
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-bold text-moons-navy">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
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
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-surface-hover ${
                    item.readAt ? 'opacity-75' : 'bg-blue-50/80'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconStyles(item.type)}`}
                  >
                    {notificationIcon(item.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-moons-navy">{item.title}</span>
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
              ))}
          </div>

          <div className="border-t border-border bg-surface px-4 py-2 text-center">
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
