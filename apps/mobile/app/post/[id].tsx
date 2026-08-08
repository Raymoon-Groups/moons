import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { PostCard } from '@/components/feed/post-card';
import { fontStyle } from '@/lib/font-style';
import { fetchPost } from '@/lib/posts';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';

/**
 * Single post screen for notification deep-links (like, comment, share).
 */
export default function PostDetailScreen() {
  const { id, comments } = useLocalSearchParams<{ id: string; comments?: string }>();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const bottomPadding = useTabScreenPadding();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const openComments = comments === '1' || comments === 'true';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Post',
      headerShown: true,
      headerStyle: { backgroundColor: colors.surfaceElevated },
      headerTintColor: colors.heading,
    });
  }, [navigation, colors]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPost(id);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load post');
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppScreen>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.blue} size="large" />
        </View>
      ) : error || !post ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
            backgroundColor: isDark ? colors.background : '#E8EDF4',
          }}
        >
          <Ionicons name="alert-circle-outline" size={36} color={colors.muted} />
          <Text
            style={{
              color: colors.heading,
              marginTop: 12,
              fontSize: 16,
              textAlign: 'center',
              ...fontStyle('bold'),
            }}
          >
            Post unavailable
          </Text>
          <Text
            style={{
              color: colors.muted,
              marginTop: 6,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {error || 'This post may have been deleted or is no longer visible.'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 18,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.blue,
            }}
          >
            <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: isDark ? colors.background : '#E8EDF4' }}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPadding }}
          keyboardShouldPersistTaps="handled"
        >
          <PostCard
            post={post}
            isVisible
            openCommentsOnMount={openComments}
            onChange={setPost}
            onRemove={() => {
              router.back();
            }}
          />
        </ScrollView>
      )}
    </AppScreen>
  );
}
