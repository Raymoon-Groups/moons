const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

/** Stored mention form: @[Display Name](userId) */
const MENTION_TOKEN_RE = new RegExp(`@\\[([^\\]]+)\\]\\((${UUID})\\)`, 'gi');

export function extractMentionUserIds(text: string): string[] {
  if (!text) return [];
  const ids = new Set<string>();
  const re = new RegExp(MENTION_TOKEN_RE.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[2]) ids.add(match[2]);
  }
  return [...ids];
}

/** Turn stored mention tokens into readable @Name text for notification previews. */
export function mentionPlainPreview(text: string, maxLen = 80): string {
  const plain = text.replace(new RegExp(MENTION_TOKEN_RE.source, 'gi'), '@$1').trim();
  if (!plain) return '';
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain;
}
