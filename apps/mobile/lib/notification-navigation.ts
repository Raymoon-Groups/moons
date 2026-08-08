import { router } from 'expo-router';
import { NotificationType, type NotificationItem } from '@moons/shared';

function metaString(meta: Record<string, unknown> | undefined, key: string): string | null {
  if (!meta) return null;
  const value = meta[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function queryParam(linkUrl: string | null | undefined, key: string): string | null {
  if (!linkUrl) return null;
  try {
    // Support relative paths: /dashboard?post=x
    const url = new URL(linkUrl, 'https://moonsjob.local');
    const value = url.searchParams.get(key);
    return value?.trim() || null;
  } catch {
    const match = linkUrl.match(new RegExp(`[?&]${key}=([^&]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

function postIdFrom(item: NotificationItem): string | null {
  return (
    metaString(item.metadata, 'postId') ||
    queryParam(item.linkUrl, 'post') ||
    null
  );
}

/**
 * Maps API notification linkUrls (web paths) to mobile routes.
 */
export function resolveNotificationHref(item: NotificationItem): string | null {
  const link = item.linkUrl?.trim() || '';
  const meta = item.metadata;

  // Post engagement → post detail (open comments for comment notifications)
  const postId = postIdFrom(item);
  if (
    postId &&
    (item.type === NotificationType.POST_COMMENT ||
      item.type === NotificationType.POST_LIKE ||
      item.type === NotificationType.POST_SHARE ||
      link.includes('/dashboard') ||
      link.includes('post='))
  ) {
    const openComments =
      item.type === NotificationType.POST_COMMENT || Boolean(metaString(meta, 'commentId'));
    return openComments ? `/post/${postId}?comments=1` : `/post/${postId}`;
  }

  // Direct message thread
  const conversationId =
    metaString(meta, 'conversationId') || queryParam(link, 'conversation');
  if (conversationId) {
    return `/messages/${conversationId}`;
  }
  if (link.startsWith('/messages/')) {
    const id = link.replace('/messages/', '').split(/[?#]/)[0];
    if (id) return `/messages/${id}`;
  }

  // Start / open chat with user
  const withUser =
    metaString(meta, 'fromUserId') ||
    metaString(meta, 'userId') ||
    queryParam(link, 'with');
  if (item.type === NotificationType.MESSAGE_RECEIVED && withUser && !conversationId) {
    return `/(tabs)/messages?with=${encodeURIComponent(withUser)}`;
  }
  if (link.includes('with=') || (link.startsWith('/messages') && withUser)) {
    if (withUser) return `/(tabs)/messages?with=${encodeURIComponent(withUser)}`;
    return '/(tabs)/messages';
  }

  // Network profile
  if (link.startsWith('/network/')) {
    const userId = link.replace('/network/', '').split(/[?#]/)[0];
    if (userId) return `/network/${userId}`;
  }
  if (item.type === NotificationType.CONNECTION_ACCEPTED) {
    const acceptorId = metaString(meta, 'userId') || withUser;
    if (acceptorId) return `/network/${acceptorId}`;
  }
  if (item.type === NotificationType.CONNECTION_REQUEST) {
    const requesterId = metaString(meta, 'fromUserId') || withUser;
    if (requesterId) return `/network/${requesterId}`;
    return '/(tabs)/network?tab=pending';
  }

  // Network tabs
  if (link.includes('networkTab=pending') || link.includes('tab=pending')) {
    return '/(tabs)/network?tab=pending';
  }
  if (
    link.includes('networkTab=visitors') ||
    item.type === NotificationType.PROFILE_VIEW
  ) {
    const viewerId = metaString(meta, 'viewerId');
    // Prefer the visitor profile if known; otherwise My network visitors tab
    if (viewerId) return `/network/${viewerId}`;
    return '/profile/network?tab=visitors';
  }
  if (item.type === NotificationType.NETWORK_SUGGESTION) {
    return '/(tabs)/network';
  }

  // Applications / jobs
  if (link.startsWith('/applications') || item.type === NotificationType.APPLICATION_SUBMITTED) {
    return '/(tabs)/applications';
  }
  if (link.startsWith('/recruiter/jobs/') && link.includes('/applicants')) {
    const match = link.match(/\/recruiter\/jobs\/([^/]+)\/applicants/);
    if (match?.[1]) return `/recruiter/jobs/${match[1]}/applicants`;
  }
  if (link.startsWith('/recruiter/jobs/')) {
    const match = link.match(/\/recruiter\/jobs\/([^/?#]+)/);
    if (match?.[1]) return `/recruiter/jobs/${match[1]}`;
  }
  if (link.startsWith('/jobs/')) {
    const jobId = link.replace('/jobs/', '').split(/[?#]/)[0];
    if (jobId) return `/job/${jobId}`;
  }
  if (
    item.type === NotificationType.APPLICATION_RECEIVED ||
    item.type === NotificationType.APPLICATION_VIEWED ||
    item.type === NotificationType.APPLICATION_SHORTLISTED ||
    item.type === NotificationType.APPLICATION_REJECTED
  ) {
    const jobId = metaString(meta, 'jobId');
    if (jobId && item.type === NotificationType.APPLICATION_RECEIVED) {
      return `/recruiter/jobs/${jobId}/applicants`;
    }
    if (link.includes('/applicants') && jobId) {
      return `/recruiter/jobs/${jobId}/applicants`;
    }
    return '/(tabs)/applications';
  }

  // Dashboard / home feed
  if (link.startsWith('/dashboard') || link === '/' || !link) {
    return '/(tabs)';
  }

  // Absolute fallback for remaining absolute app paths if they exist on mobile
  if (link.startsWith('/') && !link.startsWith('//')) {
    // Avoid pushing web-only destinations that would 404 on mobile
    if (
      link.startsWith('/profile') ||
      link.startsWith('/settings') ||
      link.startsWith('/network') ||
      link.startsWith('/messages') ||
      link.startsWith('/recruiter') ||
      link.startsWith('/job')
    ) {
      if (link.startsWith('/messages')) return '/(tabs)/messages';
      if (link === '/profile' || link.startsWith('/profile?')) return '/(tabs)/profile';
      return link.split('?')[0] || null;
    }
  }

  return null;
}

export function openNotification(item: NotificationItem) {
  const href = resolveNotificationHref(item);
  if (!href) {
    router.push('/(tabs)' as never);
    return;
  }
  router.push(href as never);
}
