import { Ionicons } from '@expo/vector-icons';
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
  const { colors, isDark } = useTheme();
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
        head: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        title: {
          fontSize: 11,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: colors.muted,
          ...fontStyle('semibold'),
        },
        count: {
          fontSize: 12,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        empty: {
          borderRadius: 20,
          padding: 28,
          alignItems: 'center',
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          marginBottom: 12,
          ...theme.shadow.soft,
        },
        emptyText: {
          marginTop: 10,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        more: {
          marginTop: 4,
          marginBottom: 8,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.borderSubtle,
          paddingVertical: 13,
          alignItems: 'center',
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
        },
        postsWrap: {
          marginHorizontal: -theme.spacing.md,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={styles.head}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.count}>
          {loading && posts.length === 0
            ? '…'
            : total === 1
              ? '1 post'
              : `${total} posts`}
        </Text>
      </View>

      {error ? (
        <Text style={{ color: colors.error, fontSize: 13, marginBottom: 8 }}>{error}</Text>
      ) : null}

      {loading && posts.length === 0 ? (
        <ActivityIndicator color={colors.blue} style={{ marginVertical: 20 }} />
      ) : null}

      {!loading && !error && posts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="newspaper-outline" size={24} color={colors.blue} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : null}

      <View style={styles.postsWrap}>
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
      </View>

      {hasMore ? (
        <Pressable
          disabled={loading}
          onPress={() => void load(page + 1, true)}
          style={[styles.more, { opacity: loading ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.heading, ...fontStyle('semibold'), fontSize: 13 }}>
            {loading ? 'Loading…' : 'Show more posts'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
