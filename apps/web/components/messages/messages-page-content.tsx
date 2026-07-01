'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashPageHero } from '@/components/dash/dash-page-shell';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  fetchConversation,
  fetchConversationWithUser,
  fetchConversations,
  fetchMessages,
  notifyMessagesRefresh,
  sendMessage,
  truncateMessagePreview,
  type ConversationDetail,
  type ConversationPreview,
  type MessageItem,
  type MessageParticipant,
} from '@/lib/messages';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import {
  MessageAttachmentContent,
  MessageComposeField,
} from '@/components/messages/message-compose-field';

const PAGE_BG = 'li-page-bg';
const POLL_MS = 10_000;

function conversationPreviewText(c: ConversationPreview) {
  if (!c.lastMessage) return 'No messages yet';
  const prefix = c.lastMessage.isMine ? 'You: ' : '';
  return `${prefix}${truncateMessagePreview(c.lastMessage.body, 72)}`;
}

function formatTime(iso: string) {
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

function formatDayLabel(iso: string) {
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

function groupMessagesByDay(messages: MessageItem[]) {
  const groups: { label: string; items: MessageItem[] }[] = [];
  for (const message of messages) {
    const label = formatDayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.items.push(message);
    } else {
      groups.push({ label, items: [message] });
    }
  }
  return groups;
}

function ParticipantAvatar({
  person,
  size = 'md',
}: {
  person: MessageParticipant;
  size?: 'sm' | 'md' | 'lg';
}) {
  const avatar = resolveAvatarUrl(person.avatarUrl);
  const initial = (person.fullName ?? '?').charAt(0).toUpperCase();
  const sizes = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-14 w-14 text-lg',
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-moons-blue/15 to-moons-navy/10 font-semibold text-moons-navy ring-2 ring-surface-elevated dark:text-heading ${sizes[size]}`}
    >
      {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
    </div>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M3 5.5A2.5 2.5 0 015.5 3h9A2.5 2.5 0 0117 5.5v6A2.5 2.5 0 0114.5 14H8l-3.5 2.5V14H5.5A2.5 2.5 0 013 11.5v-6z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12.5 15L7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: ConversationPreview;
  active: boolean;
  onSelect: () => void;
}) {
  const name = conversation.otherUser.fullName?.trim() || 'Professional';
  const unread = conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3.5 text-left transition ${
        active
          ? 'border-moons-blue bg-moons-blue/[0.06] shadow-md ring-1 ring-moons-blue/25'
          : 'border-border/70 bg-surface-elevated shadow-sm hover:border-moons-blue/35 hover:shadow'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <ParticipantAvatar person={conversation.otherUser} size="sm" />
          {unread && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface-elevated bg-moons-blue" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`truncate text-sm ${unread ? 'font-bold text-heading' : 'font-semibold text-heading'}`}>
              {name}
            </p>
            {conversation.lastMessage && (
              <span className="shrink-0 text-[10px] font-medium text-moons-muted">
                {formatTime(conversation.lastMessage.createdAt)}
              </span>
            )}
          </div>
          {conversation.otherUser.headline && (
            <p className="mt-0.5 truncate text-[11px] text-moons-muted">{conversation.otherUser.headline}</p>
          )}
          <p
            className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
              unread ? 'font-medium text-foreground' : 'text-moons-muted'
            }`}
          >
            {conversationPreviewText(conversation)}
          </p>
        </div>
        {unread && conversation.unreadCount > 1 && (
          <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue px-1.5 text-[10px] font-bold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const conversationParam = searchParams.get('conversation');
  const withParam = searchParams.get('with');

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [activeId, setActiveId] = useState<string | null>(conversationParam);
  const [otherUser, setOtherUser] = useState<MessageParticipant | null>(null);
  const [threadDetail, setThreadDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);

  const mobileShowThread = Boolean(activeId);
  const messageGroups = useMemo(() => groupMessagesByDay(messages), [messages]);

  const loadConversations = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingList(true);
    try {
      const data = await fetchConversations();
      setConversations(data.items);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      }
    } finally {
      if (!opts?.silent) setLoadingList(false);
    }
  }, []);

  const refreshActiveThread = useCallback(async () => {
    if (!activeId) return;
    try {
      const msgs = await fetchMessages(activeId);
      setMessages(msgs.items);
    } catch {
      // ignore background refresh errors
    }
  }, [activeId]);

  const loadThread = useCallback(async (conversationId: string) => {
    setLoadingThread(true);
    setError('');
    try {
      const [detail, msgs] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
      ]);
      setActiveId(conversationId);
      setOtherUser(detail.otherUser);
      setThreadDetail(detail);
      setMessages(msgs.items);
      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoadingThread(false);
    }
  }, [loadConversations]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const refresh = () => {
      void loadConversations({ silent: true });
      void refreshActiveThread();
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, POLL_MS);

    window.addEventListener('moons:messages-refresh', refresh);
    window.addEventListener('moons:notifications-refresh', refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('moons:messages-refresh', refresh);
      window.removeEventListener('moons:notifications-refresh', refresh);
    };
  }, [loadConversations, refreshActiveThread]);

  useEffect(() => {
    if (conversationParam) {
      void loadThread(conversationParam);
      return;
    }
    if (withParam) {
      setLoadingThread(true);
      fetchConversationWithUser(withParam)
        .then((detail) => {
          router.replace(`/messages?conversation=${detail.id}`, { scroll: false });
          setActiveId(detail.id);
          setOtherUser(detail.otherUser);
          setThreadDetail(detail);
          return fetchMessages(detail.id);
        })
        .then((msgs) => setMessages(msgs.items))
        .catch((err) =>
          setError(err instanceof Error ? err.message : 'Could not open conversation'),
        )
        .finally(() => setLoadingThread(false));
    }
  }, [conversationParam, withParam, loadThread, router]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!activeId || sending || !threadDetail?.canReply) return;
    if (!draft.trim() && !attachment) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendMessage(activeId, draft.trim(), attachment ?? undefined);
      setMessages((prev) => [...prev, sent]);
      setDraft('');
      setAttachment(null);
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: {
                  id: sent.id,
                  body: sent.body,
                  senderId: sent.senderId,
                  createdAt: sent.createdAt,
                  isMine: true,
                },
                unreadCount: 0,
                updatedAt: sent.createdAt,
              }
            : c,
        );
        return [...next].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });
      notifyMessagesRefresh();
      void loadConversations({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function selectConversation(id: string) {
    router.push(`/messages?conversation=${id}`, { scroll: false });
  }

  function backToInbox() {
    router.push('/messages', { scroll: false });
    setActiveId(null);
    setOtherUser(null);
    setThreadDetail(null);
    setMessages([]);
  }

  const displayName = otherUser?.fullName?.trim() || 'Professional';
  const pendingInvite =
    threadDetail?.connectionStatus === 'PENDING' &&
    threadDetail.connectionDirection === 'received' &&
    threadDetail.connectionId;

  async function handleAcceptInvite() {
    if (!threadDetail?.connectionId) return;
    setInviteLoading(true);
    setError('');
    try {
      await acceptConnectionInvite(threadDetail.connectionId);
      if (activeId) await loadThread(activeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invitation');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleIgnoreInvite() {
    if (!threadDetail?.connectionId) return;
    setInviteLoading(true);
    setError('');
    try {
      await ignoreConnectionInvite(threadDetail.connectionId);
      backToInbox();
      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ignore invitation');
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className={PAGE_BG}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <DashPageHero
          eyebrow="Inbox"
          eyebrowIcon={<MessageIcon className="h-3.5 w-3.5" />}
          title="Messaging"
          subtitle="Connection notes and conversations with your network. Accept invites here to start chatting."
        />

        <div className="mt-6 grid h-[calc(100vh-13.5rem)] min-h-[560px] gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
          {/* Inbox */}
          <div
            className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_4px_24px_rgba(26,39,68,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.28)] ${
              mobileShowThread ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="border-b border-border/60 px-4 py-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-heading">Conversations</p>
                {!loadingList && conversations.length > 0 && (
                  <span className="rounded-full bg-moons-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-moons-blue">
                    {conversations.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {loadingList ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-moons-blue/20" />
                  <p className="text-sm text-moons-muted">Loading conversations…</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-moons-blue/10 text-moons-blue">
                    <MessageIcon className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-heading">No messages yet</p>
                  <p className="mt-1.5 max-w-[240px] text-sm leading-relaxed text-moons-muted">
                    Connect with professionals on your network, then message them from their profile.
                  </p>
                  <Link
                    href="/network"
                    className="mt-5 inline-flex items-center rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                  >
                    Go to My Network
                  </Link>
                </div>
              ) : (
                conversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    active={c.id === activeId}
                    onSelect={() => selectConversation(c.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Thread */}
          <div
            className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_4px_24px_rgba(26,39,68,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.28)] ${
              mobileShowThread ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {!activeId ? (
              <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-moons-blue/[0.04] to-transparent p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-moons-blue/20 bg-moons-blue/10 text-moons-blue">
                  <MessageIcon className="h-8 w-8" />
                </div>
                <p className="mt-5 text-lg font-semibold text-heading">Select a conversation</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-moons-muted">
                  Pick someone from your inbox to read invitation notes and continue the conversation.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-border/60 bg-surface-elevated/95 px-4 py-3 backdrop-blur-sm sm:px-5">
                  <button
                    type="button"
                    onClick={backToInbox}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/80 text-moons-muted transition hover:border-moons-blue/30 hover:bg-surface hover:text-moons-blue lg:hidden"
                    aria-label="Back to inbox"
                  >
                    <BackIcon className="h-5 w-5" />
                  </button>
                  {otherUser && <ParticipantAvatar person={otherUser} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/network/${otherUser?.userId ?? ''}`}
                      className="block truncate text-base font-bold text-heading transition hover:text-moons-blue"
                    >
                      {displayName}
                    </Link>
                    {otherUser?.headline && (
                      <p className="truncate text-xs text-moons-muted">{otherUser.headline}</p>
                    )}
                  </div>
                  <Link
                    href={`/network/${otherUser?.userId ?? ''}`}
                    className="hidden shrink-0 rounded-full border border-border/80 px-3 py-1.5 text-xs font-semibold text-moons-blue transition hover:border-moons-blue/30 hover:bg-moons-blue/5 sm:inline-flex"
                  >
                    View profile
                  </Link>
                </div>

                {pendingInvite && (
                  <div className="promo-banner mx-4 mt-3 px-4 py-3.5 sm:mx-5">
                    <p className="text-sm font-bold text-heading">Connection invitation</p>
                    <p className="mt-1 text-xs leading-relaxed text-moons-muted">
                      {displayName} wants to connect. Read their note below, then accept or ignore.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={inviteLoading}
                        onClick={() => void handleIgnoreInvite()}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface-elevated px-4 text-xs font-semibold text-heading transition hover:bg-surface disabled:opacity-60"
                      >
                        Ignore
                      </button>
                      <button
                        type="button"
                        disabled={inviteLoading}
                        onClick={() => void handleAcceptInvite()}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-moons-blue px-5 text-xs font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                      >
                        Accept invitation
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-surface via-surface to-moons-blue/[0.03] px-4 py-5 sm:px-6">
                  {loadingThread ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-moons-muted">Loading messages…</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="text-sm font-medium text-heading">
                        {pendingInvite
                          ? 'No note was included with this invitation.'
                          : `Start the conversation with ${displayName.split(' ')[0]}`}
                      </p>
                      <p className="mt-1 text-xs text-moons-muted">
                        {pendingInvite
                          ? 'You can still accept to connect.'
                          : 'Say hello — your message will appear here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messageGroups.map((group) => (
                        <div key={group.label}>
                          <div className="mb-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border/70" />
                            <span className="shrink-0 rounded-full bg-surface-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-moons-muted ring-1 ring-border/60">
                              {group.label}
                            </span>
                            <div className="h-px flex-1 bg-border/70" />
                          </div>
                          <div className="space-y-3">
                            {group.items.map((m) => (
                              <div
                                key={m.id}
                                className={`flex gap-2 ${m.isMine ? 'justify-end' : 'justify-start'}`}
                              >
                                {!m.isMine && otherUser && (
                                  <div className="self-end">
                                    <ParticipantAvatar person={otherUser} size="sm" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                    m.isMine
                                      ? 'rounded-br-md bg-moons-blue text-white'
                                      : 'rounded-bl-md border border-border/50 bg-surface-elevated text-foreground'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                  {m.attachmentUrl && m.attachmentFileName && (
                                    <MessageAttachmentContent
                                      url={m.attachmentUrl}
                                      fileName={m.attachmentFileName}
                                      mimeType={m.attachmentMimeType}
                                      isMine={m.isMine}
                                    />
                                  )}
                                  <p
                                    className={`mt-1.5 text-[10px] ${
                                      m.isMine ? 'text-white/75' : 'text-moons-muted'
                                    }`}
                                  >
                                    {formatTime(m.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div ref={threadEndRef} />
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mx-4 mb-2 rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:mx-5">
                    {error}
                  </p>
                )}

                {threadDetail?.canReply ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSend(e);
                    }}
                    className="border-t border-border/60 bg-surface-elevated/95 p-4 backdrop-blur-sm sm:px-5"
                  >
                    <MessageComposeField
                      value={draft}
                      onChange={setDraft}
                      attachment={attachment}
                      onAttachmentChange={setAttachment}
                      onSubmit={() => void handleSend()}
                      sending={sending}
                      placeholder={`Message ${displayName.split(' ')[0]}…`}
                    />
                  </form>
                ) : !threadDetail?.canReply && messages.length > 0 ? (
                  <div className="border-t border-border/60 bg-surface px-5 py-4 text-center text-xs leading-relaxed text-moons-muted">
                    You&apos;re no longer connected. Reconnect to send new messages — your chat history
                    stays saved.
                  </div>
                ) : pendingInvite ? (
                  <div className="border-t border-border/60 bg-surface px-5 py-4 text-center text-xs text-moons-muted">
                    Accept the invitation above to reply.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessagesPageContent() {
  return (
    <Suspense
      fallback={
        <div className={`${PAGE_BG} flex min-h-[50vh] items-center justify-center text-sm text-moons-muted`}>
          Loading messages…
        </div>
      }
    >
      <MessagesPageInner />
    </Suspense>
  );
}
