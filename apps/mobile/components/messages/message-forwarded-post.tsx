import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { extractForwardedPostId, stripForwardedPostUrl, type FeedPost } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { fetchPost } from '@/lib/posts';

function postMedia(post: FeedPost) {
  const original = post.originalPost;
  if (original && !('unavailable' in original) && original.media.length) {
    return original.media;
  }
  return post.media;
}

export function MessageForwardedPost({
  body,
  textColor,
  mutedColor,
}: {
  body: string;
  textColor: string;
  mutedColor: string;
}) {
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
    return <Text style={[styles.body, { color: textColor }, fontStyle('regular')]}>{body}</Text>;
  }

  const media = post ? postMedia(post) : [];
  const first = media[0];
  const href = resolveAssetUrl(first?.url);
  const isVideo = first?.type === 'VIDEO' || Boolean(first?.mimeType?.startsWith('video/'));

  return (
    <View style={{ gap: 8 }}>
      {note ? (
        <Text style={[styles.body, { color: textColor }, fontStyle('regular')]}>{note}</Text>
      ) : null}
      <Pressable
        onPress={() => router.push(`/post/${postId}` as never)}
        style={styles.card}
      >
        {href ? (
          <View style={styles.media}>
            <Image source={{ uri: href }} style={styles.image} contentFit="cover" />
            {isVideo ? (
              <View style={styles.play}>
                <Ionicons name="play" size={22} color="#fff" />
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={[{ color: mutedColor, fontSize: 12, padding: 10 }, fontStyle('medium')]}>
            {post ? 'Open this post' : 'Loading post…'}
          </Text>
        )}
        {media.length > 1 ? (
          <Text style={[{ color: mutedColor, fontSize: 11, paddingHorizontal: 10, paddingVertical: 6 }, fontStyle('medium')]}>
            +{media.length - 1} more
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  media: {
    height: 180,
    width: '100%',
    backgroundColor: '#111',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  play: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
});
