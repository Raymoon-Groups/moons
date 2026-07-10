import type { NotificationItem } from '@moons/shared';
import { authFetch } from '@/lib/api';
import { emitRefresh } from '@/lib/refresh-events';

export type { NotificationItem };

export function fetchBellNotifications(limit = 30) {
  return authFetch<NotificationItem[]>(`/notifications/bell?limit=${limit}`);
}

export function markBellNotificationsRead() {
  return authFetch<{ success: boolean }>('/notifications/read-bell', { method: 'POST' });
}

export function markNetworkNotificationsRead() {
  return authFetch<{ success: boolean }>('/notifications/read-network', { method: 'POST' });
}

export function notifyNotificationsRefresh() {
  emitRefresh('moons:notifications-refresh');
}

export function formatNotificationTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
