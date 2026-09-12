import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { FeedComposer, type FeedUploadState } from '@/components/feed/feed-composer';
import { InlineUploadProgress } from '@/components/feed/inline-upload-progress';
import { MoonsPlusPromoCard } from '@/components/feed/moons-plus-promo';
import { PostCard } from '@/components/feed/post-card';
import { PostSkeleton } from '@/components/feed/post-skeleton';
import { EmptyState } from '@/components/portal-ui';
import { fontStyle } from '@/lib/font-style';
import { useNavChromeScrollProps } from '@/lib/nav-chrome';
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

/** Moons Plus “Coming soon” teaser — same as web (non-interactive promo only). */
function buildFeedRows(posts: FeedPost[]): FeedRow[] {
  const rows: FeedRow[] = posts.map((post) => ({ type: 'post', post, key: post.id }));
  // Keep mid-feed placement so the teaser appears while scrolling (matches web feed).
  if (rows.length === 0) {
    rows.push({ type: 'moons-plus', key: 'moons-plus' });
    return rows;
  }
  const insertAt = posts.length >= 2 ? 2 : rows.length;
  rows.splice(insertAt, 0, { type: 'moons-plus', key: 'moons-plus' });
  return rows;
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const topPadding = useTabScreenTopPadding();
  const navScroll = useNavChromeScrollProps();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(() => new Set());
  const [upload, setUpload] = useState<FeedUploadState>(null);
  const uploadHoldRef = useRef<(() => void) | null>(null);

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
      // Fallback if the progress banner remounts or never reaches success.
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

  const rows = useMemo(() => {
    // Keep list empty while first load so skeletons (ListEmptyComponent) can show.
    if (loading && posts.length === 0) return [];
    return buildFeedRows(posts);
  }, [loading, posts]);

  const listHeader = (
    <View style={{ paddingBottom: 4 }}>
      <FeedComposer
        uploading={!!upload}
        onUploadChange={setUpload}
        waitForUploadHold={waitForUploadHold}
        onPosted={async (created) => {
          setPosts((prev) => dedupePosts([created, ...prev]));
          await load(1, false);
        }}
      />
    </View>
  );

  return (
    <AppScreen>
      <AuthenticatedScreen padBottom={false}>
        {/* Keep progress outside FlatList so it always paints when upload state changes. */}
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

        <FlatList
          data={rows}
          extraData={upload}
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
          {...navScroll}
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
          ListHeaderComponent={listHeader}
          renderItem={({ item }) =>
            item.type === 'moons-plus' ? (
              <MoonsPlusPromoCard />
            ) : (
              <PostCard
                post={item.post}
                isVisible={visiblePostIds.has(item.post.id)}
                onChange={(next) =>
                  setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))
                }
                onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            )
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingTop: 8 }}>
                <PostSkeleton />
                <PostSkeleton />
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.blue} style={{ marginVertical: 22 }} />
            ) : posts.length === 0 && !loading ? (
              <EmptyState
                icon="newspaper-outline"
                title="Nothing in your feed yet"
                message="Create a post or connect with more people to start seeing updates here."
              />
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
            if (hasMore && !loading && !loadingMore) void load(page + 1, true);
          }}
        />
      </AuthenticatedScreen>
    </AppScreen>
  );
}
