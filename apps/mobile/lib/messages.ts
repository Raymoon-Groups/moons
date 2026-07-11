import { authFetch, authUpload } from '@/lib/api';
import { emitRefresh } from '@/lib/refresh-events';

/** How often the inbox list refreshes while the Messages tab is open. */
export const MESSAGE_INBOX_POLL_MS = 2_000;
/** How often an open chat thread refreshes for new replies. */
export const MESSAGE_THREAD_POLL_MS = 2_000;
export const MESSAGE_FETCH_LIMIT = 100;

export interface MessageParticipant {
  userId: string;
  fullName: string | null;
  headline: string | null;
  avatarUrl: string | null;
}

export interface MessageItem {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
  attachmentUrl?: string | null;
  attachmentFileName?: string | null;
  attachmentMimeType?: string | null;
}

export interface ConversationDetail {
  id: string;
  otherUser: MessageParticipant;
  connectionId: string | null;
  connectionStatus: string;
  connectionDirection: 'sent' | 'received' | null;
  canReply: boolean;
}

export interface ConversationPreview {
  id: string;
  otherUser: MessageParticipant;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
    isMine: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type MessageAttachment = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

export function fetchConversations(page = 1) {
  return authFetch<Paginated<ConversationPreview>>(`/messages/conversations?page=${page}`);
}

export function fetchConversation(conversationId: string) {
  return authFetch<ConversationDetail>(`/messages/conversations/${conversationId}`);
}

export function fetchConversationWithUser(userId: string) {
  return authFetch<ConversationDetail>(`/messages/conversations/with/${userId}`);
}

export function fetchMessages(conversationId: string, page = 1, limit = 100) {
  return authFetch<Paginated<MessageItem>>(
    `/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
  );
}

export function sendMessage(
  conversationId: string,
  body: string,
  attachment?: MessageAttachment,
) {
  if (attachment) {
    const formData = new FormData();
    formData.append('body', body);
    formData.append('attachment', {
      uri: attachment.uri,
      name: attachment.name,
      type: attachment.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);
    return authUpload<MessageItem>(`/messages/conversations/${conversationId}/messages`, formData);
  }
  return authFetch<MessageItem>(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function truncateMessagePreview(body: string, max = 100) {
  const trimmed = body.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function notifyMessagesRefresh() {
  emitRefresh('moons:messages-refresh');
  emitRefresh('moons:notifications-refresh');
}

export function conversationsChanged(
  prev: ConversationPreview[],
  next: ConversationPreview[],
): boolean {
  if (prev.length !== next.length) return true;

  const orderChanged = prev.some((conv, index) => conv.id !== next[index]?.id);
  if (orderChanged) return true;

  const prevMap = new Map(prev.map((conv) => [conv.id, conv]));
  return next.some((conv) => {
    const old = prevMap.get(conv.id);
    if (!old) return true;
    if (old.updatedAt !== conv.updatedAt) return true;
    if (old.unreadCount !== conv.unreadCount) return true;
    if (old.lastMessage?.id !== conv.lastMessage?.id) return true;
    if (old.lastMessage?.body !== conv.lastMessage?.body) return true;
    return false;
  });
}
