import { acceptConnection, rejectConnection } from '@/lib/network';
import { notifyNotificationsRefresh } from '@/lib/notifications';

export function notifyConnectionsRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('moons:connections-refresh'));
  }
}

export async function acceptConnectionInvite(connectionId: string) {
  await acceptConnection(connectionId);
  notifyConnectionsRefresh();
  notifyNotificationsRefresh();
}

export async function ignoreConnectionInvite(connectionId: string) {
  await rejectConnection(connectionId);
  notifyConnectionsRefresh();
  notifyNotificationsRefresh();
}
