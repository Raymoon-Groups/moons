import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { PostCard } from '@/components/feed/post-card';
import { fontStyle } from '@/lib/font-style';
import { createPost, fetchFeed, type LocalMediaFile } from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function FeedScreen() {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<LocalMediaFile[]>([]);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async (nextPage = 1, append = false) => {
    if (nextPage === 1) setLoading(true);
    try {
      const data = await fetchFeed(nextPage, 20);
      setPosts((prev) => {
        const merged = append ? [...prev, ...data.items] : data.items;
        const seenIds = new Set<string>();
        const seenRoots = new Set<string>();
        return merged.filter((p) => {
          if (seenIds.has(p.id)) return false;
          seenIds.add(p.id);
          const rootId =
            p.originalPost && !('unavailable' in p.originalPost)
              ? p.originalPost.id
              : p.originalPost && 'unavailable' in p.originalPost
                ? p.originalPost.id
                : p.id;
          if (seenRoots.has(rootId)) return false;
          seenRoots.add(rootId);
          return true;
        });
      });
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      Alert.alert('Feed', err instanceof Error ? err.message : 'Could not load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(1, false);
  }, [load]);

  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10,
    });
    if (result.canceled) return;
    setFiles(
      result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `media-${index}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      })),
    );
  }

  async function submitPost() {
    if (!body.trim() && files.length === 0) return;
    setPosting(true);
    try {
      const created = await createPost(body, files);
      setPosts((prev) => [created, ...prev]);
      setBody('');
      setFiles([]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create post');
    } finally {
      setPosting(false);
    }
  }

  return (
    <AppScreen>
      <AuthenticatedScreen>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
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
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: colors.heading, ...fontStyle('bold'), fontSize: 20 }}>Feed</Text>
              <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 12 }}>
                Share updates with your network
              </Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.muted}
                multiline
                style={{
                  minHeight: 80,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.heading,
                  backgroundColor: colors.surface,
                  textAlignVertical: 'top',
                }}
              />
              {files.length > 0 ? (
                <Text style={{ color: colors.muted, marginTop: 8 }}>{files.length} media selected</Text>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Pressable onPress={() => void pickMedia()}>
                  <Text style={{ color: colors.blue, ...fontStyle('semibold') }}>Add photo/video</Text>
                </Pressable>
                <Pressable onPress={() => void submitPost()} disabled={posting}>
                  <Text style={{ color: colors.blue, ...fontStyle('bold') }}>
                    {posting ? 'Posting…' : 'Post'}
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onChange={(next) => setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
              onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
            ) : (
              <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 24 }}>
                No posts yet. Share the first update.
              </Text>
            )
          }
          onEndReached={() => {
            if (hasMore && !loading) void load(page + 1, true);
          }}
        />
      </AuthenticatedScreen>
    </AppScreen>
  );
}
