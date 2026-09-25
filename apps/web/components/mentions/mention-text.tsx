'use client';

import Link from 'next/link';
import { parseMentions, splitTextWithUrls } from '@moons/shared';

export function MentionText({
  value,
  className,
  mentionClassName = 'font-semibold text-moons-blue hover:underline',
  linkClassName = 'font-semibold text-moons-blue underline underline-offset-2 break-all hover:opacity-90',
}: {
  value: string;
  className?: string;
  mentionClassName?: string;
  linkClassName?: string;
}) {
  const segments = parseMentions(value);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention') {
          return (
            <Link
              key={`m-${segment.userId}-${index}`}
              href={`/network/${segment.userId}`}
              className={mentionClassName}
            >
              @{segment.displayName}
            </Link>
          );
        }

        return splitTextWithUrls(segment.value).map((part, partIndex) => {
          const key = `t-${index}-${partIndex}`;
          if (part.type === 'text') {
            return <span key={key}>{part.value}</span>;
          }
          return (
            <a
              key={key}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {part.value}
            </a>
          );
        });
      })}
    </span>
  );
}
