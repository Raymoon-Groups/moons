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

function getLocalDayKey(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  | {
      type: 'message';
      id: string;
      item: MessageItem;
      showAvatar: boolean;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    };

export function buildMessageRows(messages: MessageItem[]): MessageListRow[] {
  const rows: MessageListRow[] = [];
  let lastDayKey: string | null = null;

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const dayKey = getLocalDayKey(message.createdAt);
    const label = formatDayLabel(message.createdAt);

    if (dayKey !== lastDayKey) {
      rows.push({ type: 'day', id: `day-${dayKey}`, label });
      lastDayKey = dayKey;
    }

    const prev = messages[index - 1];
    const next = messages[index + 1];
    const sameDay = (other: MessageItem | undefined) =>
      other ? getLocalDayKey(other.createdAt) === dayKey : false;

    const continuesFromPrev =
      !!prev && prev.isMine === message.isMine && sameDay(prev);
    const continuesToNext =
      !!next && next.isMine === message.isMine && sameDay(next);

    rows.push({
      type: 'message',
      id: message.id,
      item: message,
      showAvatar: !message.isMine && !continuesFromPrev,
      isFirstInGroup: !continuesFromPrev,
      isLastInGroup: !continuesToNext,
    });
  }

  return rows;
}
