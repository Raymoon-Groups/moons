import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PostMediaItem } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { safeVideoPause, safeVideoPlay } from '@/lib/safe-video';

function FullscreenVideo({
  uri,
  active,
  width,
  height,
}: {
  uri: string;
  active: boolean;
  width: number;
  height: number;
}) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    if (active) {
      player.muted = false;
      safeVideoPlay(player);
    } else {
      safeVideoPause(player);
    }
  }, [active, player]);

  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

function formatCount(n: number) {
  if (n <= 0) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

/** Full-screen image and video viewer with the author's caption underneath. */
export function MediaViewer({
  visible,
  media,
  initialIndex = 0,
  caption,
  authorName,
  timeLabel,
  liked = false,
  likeCount = 0,
  commentCount = 0,
  likeDisabled = false,
  onLike,
  onComment,
  onShare,
  onClose,
}: {
  visible: boolean;
  media: PostMediaItem[];
  initialIndex?: number;
  caption?: string;
  authorName?: string | null;
  timeLabel?: string;
  liked?: boolean;
  likeCount?: number;
  commentCount?: number;
  likeDisabled?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setCaptionExpanded(false);
    }
  }, [visible, initialIndex]);

  const hasCaption = Boolean(caption && caption.trim());
  const showActions = Boolean(onLike || onComment || onShare);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.root}>
        <FlatList
          data={media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(event) => {
            setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item, index: itemIndex }) => {
            const uri = resolveAssetUrl(item.url) ?? undefined;
            const isVideo = item.type === 'VIDEO';
            if (isVideo && uri) {
              return (
                <FullscreenVideo
                  uri={uri}
                  active={visible && index === itemIndex}
                  width={width}
                  height={height}
                />
              );
            }
            return (
              <Pressable style={{ width, height }} onPress={onClose}>
                <Image
                  source={{ uri }}
                  style={{ width, height }}
                  contentFit="contain"
                  transition={140}
                />
              </Pressable>
            );
          }}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          {media.length > 1 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {media.length}
              </Text>
            </View>
          ) : null}
        </View>

        {showActions ? (
          <View
            style={[
              styles.actionRail,
              { bottom: Math.max(insets.bottom, 16) + (hasCaption || authorName ? 108 : 24) },
            ]}
            pointerEvents="box-none"
          >
            {onLike ? (
              <Pressable
                style={styles.actionBtn}
                onPress={onLike}
                disabled={likeDisabled}
                accessibilityLabel={liked ? 'Unlike' : 'Like'}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={26}
                    color={liked ? '#ff4d6d' : '#fff'}
                  />
                </View>
                {likeCount > 0 ? (
                  <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
                ) : (
                  <Text style={styles.actionLabel}>Like</Text>
                )}
              </Pressable>
            ) : null}

            {onComment ? (
              <Pressable
                style={styles.actionBtn}
                onPress={onComment}
                accessibilityLabel="Comment"
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                </View>
                {commentCount > 0 ? (
                  <Text style={styles.actionCount}>{formatCount(commentCount)}</Text>
                ) : (
                  <Text style={styles.actionLabel}>Comment</Text>
                )}
              </Pressable>
            ) : null}

            {onShare ? (
              <Pressable style={styles.actionBtn} onPress={onShare} accessibilityLabel="Forward">
                <View style={styles.actionIcon}>
                  <Ionicons name="arrow-redo-outline" size={25} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>Forward</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {hasCaption || authorName ? (
          <View
            style={[
              styles.captionWrap,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                paddingRight: showActions ? 72 : 18,
              },
            ]}
          >
            {authorName ? (
              <Text style={styles.author}>
                {authorName}
                {timeLabel ? <Text style={styles.time}> · {timeLabel}</Text> : null}
              </Text>
            ) : null}
            {hasCaption ? (
              captionExpanded ? (
                <ScrollView style={{ maxHeight: height * 0.32 }} showsVerticalScrollIndicator={false}>
                  <Text style={styles.caption}>{caption}</Text>
                </ScrollView>
              ) : (
                <Pressable onPress={() => setCaptionExpanded(true)}>
                  <Text style={styles.caption} numberOfLines={3}>
                    {caption}
                  </Text>
                </Pressable>
              )
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  counterText: { color: '#fff', fontSize: 12, ...fontStyle('semibold') },
  actionRail: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    alignItems: 'center',
    minWidth: 52,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionCount: {
    marginTop: 4,
    color: '#fff',
    fontSize: 12,
    ...fontStyle('semibold'),
  },
  actionLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    ...fontStyle('semibold'),
  },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  author: { color: '#fff', fontSize: 14, marginBottom: 6, ...fontStyle('bold') },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 12, ...fontStyle('regular') },
  caption: { color: 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 21 },
});
