import type { NetworkStats, NetworkUserCard } from '@moons/shared';
import { authFetch } from '@/lib/api-client';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionListItem {
  connectionId: string;
  connectedAt: string;
  user: NetworkUserCard;
}

export interface PendingRequestItem {
  id: string;
  message: string | null;
  createdAt: string;
  fromUser?: NetworkUserCard;
  toUser?: NetworkUserCard;
}

export interface ProfileVisitorItem {
  viewedAt: string;
  viewer: NetworkUserCard;
}

export interface NetworkProfileResponse {
  profile: Record<string, unknown> & {
    userId: string;
    fullName: string | null;
    headline: string | null;
    avatarUrl: string | null;
    bannerUrl?: string | null;
    updatedAt?: string;
    limited?: boolean;
  };
  connectionCount: number;
  connectionStatus: string;
  connectionId: string | null;
  connectionDirection: 'sent' | 'received' | null;
  mutualConnections: { count: number; items: NetworkUserCard[] };
  sharedSkills: string[];
  sharedInterests: string[];
}

export function fetchNetworkStats() {
  return authFetch<NetworkStats>('/network/stats');
}

export function fetchConnections(page = 1) {
  return authFetch<Paginated<ConnectionListItem>>(`/network/connections?page=${page}`);
}

export function fetchPendingReceived(page = 1) {
  return authFetch<Paginated<PendingRequestItem>>(
    `/network/connections/pending/received?page=${page}`,
  );
}

export function fetchPendingSent(page = 1) {
  return authFetch<Paginated<PendingRequestItem>>(
    `/network/connections/pending/sent?page=${page}`,
  );
}

export function fetchSuggestions(page = 1) {
  return authFetch<Paginated<NetworkUserCard>>(`/network/suggestions?page=${page}`);
}

export function fetchRecentConnections() {
  return authFetch<ConnectionListItem[]>('/network/connections/recent');
}

export function fetchProfileVisitors(page = 1) {
  return authFetch<Paginated<ProfileVisitorItem>>(`/network/visitors?page=${page}`);
}

export function searchProfessionals(params: Record<string, string | number | boolean>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  return authFetch<Paginated<NetworkUserCard>>(`/network/search?${query.toString()}`);
}

export function fetchNetworkProfile(userId: string) {
  return authFetch<NetworkProfileResponse>(`/network/profiles/${userId}`);
}

export function sendConnectionRequest(toUserId: string, message?: string) {
  return authFetch('/network/connections/request', {
    method: 'POST',
    body: JSON.stringify({ toUserId, message }),
  });
}

export function acceptConnection(connectionId: string) {
  return authFetch(`/network/connections/${connectionId}/accept`, { method: 'POST' });
}

export function rejectConnection(connectionId: string) {
  return authFetch(`/network/connections/${connectionId}/reject`, { method: 'POST' });
}

export function cancelConnection(connectionId: string) {
  return authFetch(`/network/connections/${connectionId}/cancel`, { method: 'POST' });
}

export function removeConnection(userId: string) {
  return authFetch(`/network/connections/user/${userId}`, { method: 'DELETE' });
}

export function blockUser(userId: string, reason?: string) {
  return authFetch(`/network/block/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
