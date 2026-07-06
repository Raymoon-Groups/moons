import { ApiError } from '@/lib/api';
import { acceptConnection, rejectConnection } from '@/lib/network';
import { emitRefresh } from '@/lib/refresh-events';

export function notifyConnectionsRefresh() {
  emitRefresh('moons:connections-refresh');
}

export function isStaleConnectionInviteError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 404) return true;
  return err.status === 400 && /no longer pending/i.test(err.message);
}

export async function acceptConnectionInvite(connectionId: string) {
  try {
    await acceptConnection(connectionId);
  } catch (err) {
    if (!isStaleConnectionInviteError(err)) throw err;
  }
  notifyConnectionsRefresh();
  emitRefresh('moons:notifications-refresh');
}

export async function ignoreConnectionInvite(connectionId: string) {
  try {
    await rejectConnection(connectionId);
  } catch (err) {
    if (!isStaleConnectionInviteError(err)) throw err;
  }
  notifyConnectionsRefresh();
  emitRefresh('moons:notifications-refresh');
}
