import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { PostCard } from '@/components/feed/post-card';
import { fontStyle } from '@/lib/font-style';
import { fetchUserPosts } from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function ProfilePostsSection({
  userId,
  emptyMessage = 'No posts yet.',
}: {
  userId: string;
  emptyMessage?: string;
}) {
  const { colors } = useTheme();
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        title: { fontSize: 16, marginBottom: 4 },
        subtitle: { fontSize: 12, marginBottom: 12 },
        empty: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
        more: {
          marginTop: 4,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          paddingVertical: 12,
          alignItems: 'center',
        },
      }),
    [],
  );

  return (
    <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]}>Posts</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {loading && posts.length === 0
          ? 'Loading activity…'
          : total === 1
            ? '1 post'
            : `${total} posts`}
      </Text>

      {error ? (
        <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</Text>
      ) : null}

      {loading && posts.length === 0 ? (
        <ActivityIndicator color={colors.blue} style={{ marginVertical: 16 }} />
      ) : null}

      {posts.map((post) => (
        <PostCard
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
        <Text style={[styles.empty, { color: colors.muted }]}>{emptyMessage}</Text>
      ) : null}

      {hasMore ? (
        <Pressable
          disabled={loading}
          onPress={() => void load(page + 1, true)}
          style={[styles.more, { borderColor: colors.border, opacity: loading ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.heading, ...fontStyle('semibold'), fontSize: 13 }}>
            {loading ? 'Loading…' : 'Show more posts'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
