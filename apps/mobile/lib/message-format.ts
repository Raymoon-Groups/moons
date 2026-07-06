import type { MessageItem } from '@/lib/messages';

export function formatMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatConversationTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) return 'Today';

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export type MessageListRow =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; id: string; item: MessageItem };

export function buildMessageRows(messages: MessageItem[]): MessageListRow[] {
  const rows: MessageListRow[] = [];
  for (const message of messages) {
    const label = formatDayLabel(message.createdAt);
    const last = rows[rows.length - 1];
    if (last?.type !== 'day' || last.label !== label) {
      rows.push({ type: 'day', id: `day-${label}-${message.id}`, label });
    }
    rows.push({ type: 'message', id: message.id, item: message });
  }
  return rows;
}
