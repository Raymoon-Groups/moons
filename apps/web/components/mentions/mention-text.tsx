'use client';

import Link from 'next/link';
import { parseMentions } from '@moons/shared';

export function MentionText({
  value,
  className,
  mentionClassName = 'font-semibold text-moons-blue hover:underline',
}: {
  value: string;
  className?: string;
  mentionClassName?: string;
}) {
  const segments = parseMentions(value);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={`t-${index}`}>{segment.value}</span>;
        }
        return (
          <Link
            key={`m-${segment.userId}-${index}`}
            href={`/network/${segment.userId}`}
            className={mentionClassName}
          >
            @{segment.displayName}
          </Link>
        );
      })}
    </span>
  );
}
