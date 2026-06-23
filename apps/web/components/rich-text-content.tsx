'use client';

import DOMPurify from 'isomorphic-dompurify';
import { isRichTextHtml } from '@/lib/rich-text';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  's',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'code',
];

export function RichTextContent({ content }: { content: string }) {
  if (!content.trim()) return null;

  if (!isRichTextHtml(content)) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{content}</p>
    );
  }

  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });

  return (
    <div
      className="rich-text-content text-sm leading-relaxed text-foreground"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
