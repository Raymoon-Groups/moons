'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FeedPost } from '@moons/shared';
import { FeedPostCard } from '@/components/feed/feed-page-client';
import { fetchUserPosts } from '@/lib/posts';

export function ProfilePostsSection({
  userId,
  title = 'Posts',
  emptyMessage = 'No posts yet.',
  className = '',
}: {
  userId: string;
  title?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUserPosts(userId, nextPage, 10);
        setPosts((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(data.page);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load posts');
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void load(1, false);
  }, [load]);

  return (
    <section
      className={`overflow-hidden rounded-lg border border-border/80 bg-surface-elevated shadow-sm ${className}`}
    >
      <header className="border-b border-border/50 px-5 pb-3 pt-5 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-heading sm:text-base">{title}</h2>
        <p className="mt-0.5 text-xs text-moons-muted">
          {loading && posts.length === 0
            ? 'Loading activity…'
            : total === 1
              ? '1 post'
              : `${total} posts`}
        </p>
      </header>

      <div className="space-y-3 p-4 sm:p-5">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            onChange={(next) => setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
            onRemove={(id) => {
              setPosts((prev) => prev.filter((p) => p.id !== id));
              setTotal((n) => Math.max(0, n - 1));
            }}
          />
        ))}

        {!loading && !error && posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-moons-muted">{emptyMessage}</p>
        ) : null}

        {hasMore ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void load(page + 1, true)}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-heading transition hover:bg-surface disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Show more posts'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
