import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Image as RNImage,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { PostMediaItem } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { InlineFeedVideo } from '@/components/feed/inline-feed-video';

const MAX_HEIGHT = 560;
const FALLBACK_MIN = 72;
/** Placeholder while dimensions load — short so feed doesn’t jump to a tall empty frame. */
const LOADING_HEIGHT = 180;

export function clampMediaHeight(width: number, ratio: number, maxHeight = MAX_HEIGHT) {
  if (!(width > 0) || !(ratio > 0)) return Math.min(maxHeight, width * 0.56);
  const natural = width / ratio;
  return Math.min(maxHeight, Math.max(FALLBACK_MIN, natural));
}

function readRatioFromUri(uri: string | null | undefined, onRatio: (ratio: number) => void) {
  if (!uri) return () => {};
  let cancelled = false;
  RNImage.getSize(
    uri,
    (w, h) => {
      if (!cancelled && w > 0 && h > 0) onRatio(w / h);
    },
    () => {
      // keep previous / fallback
    },
  );
  return () => {
    cancelled = true;
  };
}

/**
 * Feed image sized to its own aspect ratio (explicit height — no flex/aspectRatio gaps).
 * Tall images are capped and letterboxed; short/wide images keep natural height.
 */
export function FeedMediaImage({
  uri,
  width,
  onPress,
  style,
  maxHeight = MAX_HEIGHT,
  borderRadius = 0,
  onHeightChange,
}: {
  uri?: string | null;
  width: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  maxHeight?: number;
  borderRadius?: number;
  onHeightChange?: (height: number) => void;
}) {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    setRatio(null);
    return readRatioFromUri(uri, setRatio);
  }, [uri]);

  const naturalHeight = ratio ? width / ratio : 0;
  const capped = Boolean(ratio && naturalHeight > maxHeight);
  const boxHeight = ratio ? clampMediaHeight(width, ratio, maxHeight) : LOADING_HEIGHT;

  useEffect(() => {
    if (ratio && boxHeight > 0) onHeightChange?.(boxHeight);
  }, [boxHeight, onHeightChange, ratio]);

  if (!uri) return null;

  const content = (
    <View
      style={[
        styles.box,
        {
          width,
          height: boxHeight,
          borderRadius,
          backgroundColor: capped || !ratio ? '#0f1726' : 'transparent',
        },
        style,
      ]}
    >
      <ExpoImage
        source={{ uri }}
        style={{ width, height: boxHeight, opacity: ratio ? 1 : 0 }}
        contentFit={capped ? 'contain' : 'cover'}
        transition={120}
        onLoad={(event) => {
          const source = event.source;
          if (source?.width && source?.height) {
            setRatio(source.width / source.height);
          }
        }}
      />
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="imagebutton">
      {content}
    </Pressable>
  );
}

/** Default video frame — portrait-friendly, still uses contain so nothing is cropped. */
export function feedMediaFrameStyle(width: number, maxHeight = MAX_HEIGHT): ViewStyle {
  const height = Math.min(maxHeight, Math.max(220, width * 0.56));
  return {
    width,
    height,
    backgroundColor: '#0f1726',
  };
}

export function videoFrameHeight(width: number, maxHeight = MAX_HEIGHT) {
  return Math.min(maxHeight, Math.max(220, width * 0.56));
}

/**
 * Multi-image/video carousel — only the active slide is mounted so height
 * always matches that item (no shared tall empty frame).
 */
export function FeedMediaCarousel({
  media,
  width,
  isVisible,
  onOpenViewer,
  dotColor,
  activeDotColor,
}: {
  media: PostMediaItem[];
  width: number;
  isVisible: boolean;
  onOpenViewer: (index: number) => void;
  dotColor: string;
  activeDotColor: string;
}) {
  const [index, setIndex] = useState(0);
  const mediaKey = media.map((item, i) => item.id || `${i}:${item.url}`).join('|');

  useEffect(() => {
    setIndex(0);
  }, [mediaKey]);

  const safeIndex = Math.min(index, Math.max(0, media.length - 1));
  const item = media[safeIndex];
  if (!item) return null;

  const uri = resolveAssetUrl(item.url);
  const isVideo = item.type === 'VIDEO' && Boolean(uri);

  function go(next: number) {
    if (media.length <= 1) return;
    setIndex(((next % media.length) + media.length) % media.length);
  }

  return (
    <View style={{ width }}>
      {isVideo && uri ? (
        <InlineFeedVideo
          uri={uri}
          width={width}
          playing={isVisible}
          onPress={() => onOpenViewer(safeIndex)}
        />
      ) : (
        <View style={{ width, position: 'relative' }}>
          <FeedMediaImage
            key={`${item.id || safeIndex}-${safeIndex}`}
            uri={uri}
            width={width}
            onPress={() => onOpenViewer(safeIndex)}
          />
          {media.length > 1 ? (
            <>
              <Pressable
                style={[styles.edgeHit, { left: 0 }]}
                onPress={() => go(safeIndex - 1)}
                accessibilityLabel="Previous media"
              />
              <Pressable
                style={[styles.edgeHit, { right: 0 }]}
                onPress={() => go(safeIndex + 1)}
                accessibilityLabel="Next media"
              />
            </>
          ) : null}
        </View>
      )}

      {media.length > 1 ? (
        <View style={styles.dotRow}>
          {media.map((entry, i) => (
            <Pressable
              key={entry.id || `dot-${i}`}
              onPress={() => setIndex(i)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Media ${i + 1}`}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: dotColor },
                  i === safeIndex && [styles.dotActive, { backgroundColor: activeDotColor }],
                ]}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
  },
  edgeHit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '22%',
    zIndex: 2,
  },
});
