'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { extractForwardedPostId, stripForwardedPostUrl, type FeedPost } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { fetchPost } from '@/lib/posts';

function postMedia(post: FeedPost) {
  const original = post.originalPost;
  if (original && !('unavailable' in original) && original.media.length) {
    return original.media;
  }
  return post.media;
}

export function MessageForwardedPost({ body, isMine }: { body: string; isMine?: boolean }) {
  const postId = extractForwardedPostId(body);
  const note = stripForwardedPostUrl(body);
  const [post, setPost] = useState<FeedPost | null>(null);

  useEffect(() => {
    if (!postId) return;
    let active = true;
    void fetchPost(postId)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch(() => {
        if (active) setPost(null);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  if (!postId) {
    return <p className="whitespace-pre-wrap break-words">{body}</p>;
  }

  const media = post ? postMedia(post) : [];
  const first = media[0];
  const href = resolveAssetUrl(first?.url) ?? null;
  const isVideo =
    first?.type === 'VIDEO' || Boolean(first?.mimeType?.startsWith('video/'));

  return (
    <div className="space-y-2">
      {note ? <p className="whitespace-pre-wrap break-words">{note}</p> : null}
      <div
        className={`overflow-hidden rounded-xl border ${
          isMine ? 'border-white/25 bg-white/10' : 'border-border/70 bg-black/5'
        }`}
      >
        {href && isVideo ? (
          <video
            src={href}
            controls
            playsInline
            className="max-h-52 w-full bg-black object-contain"
          />
        ) : href ? (
          <Link href={`/dashboard?post=${postId}`} className="block">
            <img src={href} alt="" className="max-h-52 w-full object-cover" />
          </Link>
        ) : (
          <div className={`px-3 py-2 text-xs ${isMine ? 'text-white/80' : 'text-moons-muted'}`}>
            {post ? 'Photo unavailable' : 'Loading post…'}
          </div>
        )}
        <Link
          href={`/dashboard?post=${postId}`}
          className={`block px-3 py-1.5 text-[11px] font-semibold ${
            isMine ? 'text-white/85' : 'text-moons-blue'
          }`}
        >
          {media.length > 1 ? `View post · +${media.length - 1} more` : 'View post'}
        </Link>
      </div>
    </div>
  );
}
