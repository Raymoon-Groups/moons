const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

/** Stored form: @[Display Name](userId) */
export const MENTION_TOKEN_RE = new RegExp(`@\\[([^\\]]+)\\]\\((${UUID})\\)`, 'gi');

export type MentionRef = {
  userId: string;
  displayName: string;
};

export type MentionSegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; userId: string; displayName: string };

export function serializeMention(displayName: string, userId: string): string {
  const safeName = displayName.replace(/[\[\]]/g, '').trim() || 'Member';
  return `@[${safeName}](${userId})`;
}

export function parseMentions(text: string): MentionSegment[] {
  if (!text) return [];
  const segments: MentionSegment[] = [];
  const re = new RegExp(MENTION_TOKEN_RE.source, 'gi');
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) });
    }
    segments.push({
      type: 'mention',
      displayName: match[1],
      userId: match[2],
    });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }
  return segments.length ? segments : [{ type: 'text', value: text }];
}

/** Convert stored tokens → editable `@Name` plus mention refs. */
export function storedToEditable(stored: string): { text: string; mentions: MentionRef[] } {
  const mentions: MentionRef[] = [];
  const text = stored.replace(new RegExp(MENTION_TOKEN_RE.source, 'gi'), (_, name: string, id: string) => {
    mentions.push({ displayName: name, userId: id });
    return `@${name}`;
  });
  return { text, mentions };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert editable `@Name` text + refs → stored tokens before submit. */
export function editableToStored(text: string, mentions: MentionRef[]): string {
  if (!mentions.length) return text;
  const byName = new Map<string, MentionRef>();
  for (const m of mentions) {
    const key = m.displayName.trim().toLowerCase();
    if (key && !byName.has(key)) byName.set(key, m);
  }
  const sorted = [...byName.values()].sort((a, b) => b.displayName.length - a.displayName.length);
  let out = text;
  for (const m of sorted) {
    const token = serializeMention(m.displayName, m.userId);
    const re = new RegExp(`@${escapeRegExp(m.displayName)}(?!\\]\\()`, 'g');
    out = out.replace(re, token);
  }
  return out;
}

export type ActiveMention = {
  /** Index of the `@` that starts the incomplete mention */
  start: number;
  query: string;
};

/**
 * Detect an in-progress @mention before the caret.
 * Does not trigger inside an already-completed `@[Name](id)` token.
 */
export function getActiveMention(text: string, caret: number): ActiveMention | null {
  if (caret < 0 || caret > text.length) return null;
  const before = text.slice(0, caret);
  // Completed token ending at caret → no active query
  if (new RegExp(`@\\[[^\\]]*\\]\\(${UUID}\\)$`, 'i').test(before)) return null;

  const at = before.lastIndexOf('@');
  if (at < 0) return null;
  if (at > 0) {
    const prev = before[at - 1];
    if (prev && !/[\s\n([{`'"]/.test(prev)) return null;
  }

  const between = before.slice(at + 1);
  // Abort if this looks like a stored token in progress past `](`
  if (between.includes('](')) return null;
  // Mentions don't span newlines
  if (between.includes('\n')) return null;
  // Reasonable query length
  if (between.length > 48) return null;

  return { start: at, query: between };
}

export function insertMentionText(
  text: string,
  caret: number,
  mentionStart: number,
  displayName: string,
): { text: string; caret: number; mention: MentionRef } {
  const safeName = displayName.replace(/[\[\]]/g, '').trim() || 'Member';
  const inserted = `@${safeName} `;
  const next = text.slice(0, mentionStart) + inserted + text.slice(caret);
  return {
    text: next,
    caret: mentionStart + inserted.length,
    mention: { displayName: safeName, userId: '' },
  };
}

export function filterMentionCandidates<T extends { fullName?: string | null }>(
  people: T[],
  query: string,
  limit = 8,
): T[] {
  const q = query.trim().toLowerCase();
  const scored = people
    .map((person) => {
      const name = (person.fullName || '').trim();
      if (!name) return null;
      const lower = name.toLowerCase();
      if (!q) return { person, score: 1 };
      if (lower.startsWith(q)) return { person, score: 3 };
      if (lower.split(/\s+/).some((part) => part.startsWith(q))) return { person, score: 2 };
      if (lower.includes(q)) return { person, score: 1 };
      return null;
    })
    .filter((row): row is { person: T; score: number } => Boolean(row))
    .sort((a, b) => b.score - a.score || (a.person.fullName || '').localeCompare(b.person.fullName || ''));
  return scored.slice(0, limit).map((row) => row.person);
}
