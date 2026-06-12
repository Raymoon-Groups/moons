import type { NotificationItem } from '@moons/shared';
import { authFetch } from './api-client';

export type { NotificationItem };

export function fetchNotifications(limit = 30) {
  return authFetch<NotificationItem[]>(`/notifications?limit=${limit}`);
}

export function fetchUnreadCount() {
  return authFetch<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: string) {
  return authFetch<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return authFetch<{ success: boolean }>('/notifications/read-all', { method: 'POST' });
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
