import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { FeedComposer } from '@/components/feed/feed-composer';
import { PostCard } from '@/components/feed/post-card';
import { PostSkeleton } from '@/components/feed/post-skeleton';
import { EmptyState } from '@/components/portal-ui';
import { fontStyle } from '@/lib/font-style';
import { fetchFeed } from '@/lib/posts';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';

/** Drops duplicate posts and repeat shares of the same original post. */
function dedupePosts(items: FeedPost[]) {
  const seenIds = new Set<string>();
  const seenRoots = new Set<string>();
  return items.filter((post) => {
    if (seenIds.has(post.id)) return false;
    seenIds.add(post.id);
    const rootId = post.originalPost ? post.originalPost.id : post.id;
    if (seenRoots.has(rootId)) return false;
    seenRoots.add(rootId);
    return true;
  });
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(() => new Set());
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 100,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<FeedPost>[] }) => {
      setVisiblePostIds(
        new Set(
          viewableItems
            .filter((token) => token.isViewable && token.item)
            .map((token) => token.item.id),
        ),
      );
    },
  ).current;

  const load = useCallback(async (nextPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else if (nextPage === 1) setLoading(true);
    try {
      const data = await fetchFeed(nextPage, 20);
      setPosts((prev) => dedupePosts(append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      Alert.alert('Feed', err instanceof Error ? err.message : 'Could not load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(1, false);
  }, [load]);

  return (
    <AppScreen>
      <AuthenticatedScreen padBottom={false}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(1, false);
              }}
              tintColor={colors.blue}
            />
          }
          ListHeaderComponent={
            <FeedComposer
              onPosted={(created) => setPosts((prev) => dedupePosts([created, ...prev]))}
            />
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isVisible={visiblePostIds.has(item.id)}
              onChange={(next) => setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
              onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <View>
                <PostSkeleton />
                <PostSkeleton />
              </View>
            ) : (
              <EmptyState
                icon="newspaper-outline"
                title="Your feed is quiet"
                message="Share the first update with your network, or connect with more people to see their posts here."
              />
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.blue} style={{ marginVertical: 18 }} />
            ) : posts.length > 0 && !hasMore ? (
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 6,
                  marginBottom: 10,
                  ...fontStyle('semibold'),
                }}
              >
                You're all caught up
              </Text>
            ) : null
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loading && !loadingMore) void load(page + 1, true);
          }}
        />
      </AuthenticatedScreen>
    </AppScreen>
  );
}
