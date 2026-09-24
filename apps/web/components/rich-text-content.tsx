'use client';

import DOMPurify from 'isomorphic-dompurify';
import { isRichTextHtml } from '@/lib/rich-text';
import { storedHtmlWithMentionLinks } from '@/lib/post-rich-text';
import { MentionText } from '@/components/mentions/mention-text';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'code',
  'a',
];

const ALLOWED_ATTR = ['href', 'class', 'data-mention-id', 'rel', 'target'];

export function RichTextContent({
  content,
  className = '',
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) return null;

  if (!isRichTextHtml(content)) {
    return (
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed ${
          className || 'text-foreground'
        }`}
      >
        <MentionText value={content} />
      </p>
    );
  }

  const withMentions = storedHtmlWithMentionLinks(content);
  const clean = DOMPurify.sanitize(withMentions, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/network\/)/i,
  });

  return (
    <div
      className={`rich-text-content text-sm leading-relaxed ${
        className || 'text-foreground'
      }`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** Feed / post body — rich HTML or legacy plain text with mentions. */
export function PostBody({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  if (!value.trim()) return null;

  if (!isRichTextHtml(value)) {
    return (
      <p
        className={`whitespace-pre-wrap text-[15px] leading-7 ${
          className || 'text-heading'
        }`}
      >
        <MentionText value={value} />
      </p>
    );
  }

  return <RichTextContent content={value} className={className} />;
}
