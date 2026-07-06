import { authFetch, authUpload } from '@/lib/api';
import { emitRefresh } from '@/lib/refresh-events';

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

export function fetchMessages(conversationId: string, page = 1) {
  return authFetch<Paginated<MessageItem>>(
    `/messages/conversations/${conversationId}/messages?page=${page}`,
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
}
