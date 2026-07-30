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
    instance.play();
  });

  useEffect(() => {
    if (active) {
      player.muted = false;
      player.play();
    } else {
      player.pause();
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

/** Full-screen image and video viewer with the author's caption underneath. */
export function MediaViewer({
  visible,
  media,
  initialIndex = 0,
  caption,
  authorName,
  timeLabel,
  onClose,
}: {
  visible: boolean;
  media: PostMediaItem[];
  initialIndex?: number;
  caption?: string;
  authorName?: string | null;
  timeLabel?: string;
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

        {hasCaption || authorName ? (
          <View style={[styles.captionWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
