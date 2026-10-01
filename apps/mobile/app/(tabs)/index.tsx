import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { FeedComposer, type FeedUploadState } from '@/components/feed/feed-composer';
import { InlineUploadProgress } from '@/components/feed/inline-upload-progress';
import { MoonsPlusPromoCard } from '@/components/feed/moons-plus-promo';
import { PostCard } from '@/components/feed/post-card';
import { PostSkeleton } from '@/components/feed/post-skeleton';
import { EmptyState } from '@/components/portal-ui';
import {
  TabRefreshControl,
  TabRefreshIndicator,
  useTabRefreshScroll,
} from '@/components/tab-refresh-control';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { fetchFeed } from '@/lib/posts';
import { useTabScreenPadding, useTabScreenTopPadding } from '@/lib/tab-screen-padding';
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

type FeedRow =
  | { type: 'post'; post: FeedPost; key: string }
  | { type: 'moons-plus'; key: string };

/** Moons Plus teaser — only after real posts exist (never alone as a fake first card). */
function buildFeedRows(posts: FeedPost[]): FeedRow[] {
  const rows: FeedRow[] = posts.map((post) => ({ type: 'post', post, key: post.id }));
  if (rows.length === 0) return rows;
  const insertAt = posts.length >= 2 ? 2 : rows.length;
  rows.splice(insertAt, 0, { type: 'moons-plus', key: 'moons-plus' });
  return rows;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const topPadding = useTabScreenTopPadding();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(() => new Set());
  const [upload, setUpload] = useState<FeedUploadState>(null);
  const uploadHoldRef = useRef<(() => void) | null>(null);
  const userId = user?.id ?? null;
  const feedEpochRef = useRef(0);
  const { pullDistance, scrollProps } = useTabRefreshScroll(refreshing);

  function waitForUploadHold() {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        uploadHoldRef.current = null;
        resolve();
      };
      uploadHoldRef.current = finish;
      setTimeout(finish, 4500);
    });
  }

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 100,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<FeedRow>[] }) => {
      setVisiblePostIds(
        new Set(
          viewableItems
            .filter((token) => token.isViewable && token.item?.type === 'post')
            .map((token) => (token.item as Extract<FeedRow, { type: 'post' }>).post.id),
        ),
      );
    },
  ).current;

  const load = useCallback(async (nextPage = 1, append = false, opts?: { pull?: boolean }) => {
    const epoch = feedEpochRef.current;
    if (append) setLoadingMore(true);
    else if (nextPage === 1 && !opts?.pull) setLoading(true);
    try {
      const data = await fetchFeed(nextPage, 20);
      if (epoch !== feedEpochRef.current) return;
      setPosts((prev) => dedupePosts(append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasMore(data.hasMore);
      if (!append) setBootstrapping(false);
    } catch (err) {
      if (epoch !== feedEpochRef.current) return;
      Alert.alert('Feed', err instanceof Error ? err.message : 'Could not load feed');
      if (!append) setBootstrapping(false);
    } finally {
      if (epoch === feedEpochRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    feedEpochRef.current += 1;
    setPosts([]);
    setPage(1);
    setHasMore(false);
    setVisiblePostIds(new Set());
    setBootstrapping(true);
    setLoading(true);
    void load(1, false);
  }, [userId, load]);

  const rows = useMemo(() => {
    if (bootstrapping) return [];
    return buildFeedRows(posts);
  }, [bootstrapping, posts]);

  const listHeader = useCallback(
    () => (
      <View style={{ paddingBottom: 4 }}>
        <FeedComposer
          uploading={!!upload}
          onUploadChange={setUpload}
          waitForUploadHold={waitForUploadHold}
          onPosted={(created) => {
            setPosts((prev) => dedupePosts([created, ...prev]));
            setBootstrapping(false);
          }}
        />
      </View>
    ),
    [upload],
  );

  const showSkeleton = bootstrapping;

  return (
    <AppScreen>
      <AuthenticatedScreen padBottom={false}>
        {upload ? (
          <View style={{ paddingTop: topPadding, zIndex: 20 }}>
            <InlineUploadProgress
              progress={upload.progress}
              label={upload.label}
              onSuccessHoldComplete={() => {
                uploadHoldRef.current?.();
              }}
            />
          </View>
        ) : null}

        <View style={{ flex: 1 }}>
          <FlatList
            data={rows}
            extraData={`${upload ? 1 : 0}:${bootstrapping ? 1 : 0}:${userId ?? ''}`}
            keyExtractor={(item) => item.key}
            style={{ backgroundColor: colors.background, flex: 1 }}
            contentContainerStyle={{
              paddingTop: upload ? 8 : topPadding,
              paddingBottom: bottomPadding,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            removeClippedSubviews={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={7}
            {...scrollProps}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            refreshControl={
              <TabRefreshControl
                hideSystemTint
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load(1, false, { pull: true });
                }}
              />
            }
            ListHeaderComponent={listHeader}
            renderItem={({ item }) =>
              item.type === 'moons-plus' ? (
                <MoonsPlusPromoCard />
              ) : (
                <PostCard
                  key={item.post.id}
                  post={item.post}
                  isVisible={!bootstrapping && visiblePostIds.has(item.post.id)}
                  onChange={(next) =>
                    setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))
                  }
                  onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                />
              )
            }
            ListEmptyComponent={
              showSkeleton ? (
                <View style={{ paddingTop: 8 }}>
                  <PostSkeleton />
                  <PostSkeleton />
                </View>
              ) : !loading ? (
                <EmptyState
                  icon="newspaper-outline"
                  title="Nothing in your feed yet"
                  message="Create a post or connect with more people to start seeing updates here."
                />
              ) : null
            }
            ListFooterComponent={
              showSkeleton ? null : loadingMore ? (
                <ActivityIndicator color={colors.blue} style={{ marginVertical: 22 }} />
              ) : posts.length > 0 && !hasMore ? (
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 14,
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
              if (hasMore && !loading && !loadingMore && !bootstrapping) void load(page + 1, true);
            }}
          />

          <TabRefreshIndicator refreshing={refreshing} pullDistance={pullDistance} />
        </View>
      </AuthenticatedScreen>
    </AppScreen>
  );
}
