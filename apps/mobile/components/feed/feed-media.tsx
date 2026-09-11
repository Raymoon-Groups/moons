import { Image as ExpoImage } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
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
 * Feed image sized to its own aspect ratio (no crop, no forced shared height).
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
  const boxHeight = ratio ? clampMediaHeight(width, ratio, maxHeight) : 0;

  useEffect(() => {
    if (boxHeight > 0) onHeightChange?.(boxHeight);
  }, [boxHeight, onHeightChange]);

  if (!uri) return null;

  const imageStyle =
    ratio == null
      ? { width, height: 1, opacity: 0 }
      : capped
        ? { width, height: maxHeight }
        : { width, aspectRatio: ratio };

  const content = (
    <View
      style={[
        styles.box,
        {
          width,
          borderRadius,
          backgroundColor: capped ? '#0f1726' : 'transparent',
          ...(ratio == null ? { minHeight: 1 } : capped ? { height: maxHeight } : null),
        },
        style,
      ]}
    >
      <ExpoImage
        source={{ uri }}
        style={imageStyle}
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
  const height = Math.min(maxHeight, Math.max(220, width * 1.15));
  return {
    width,
    height,
    backgroundColor: '#0f1726',
  };
}

export function videoFrameHeight(width: number, maxHeight = MAX_HEIGHT) {
  return Math.min(maxHeight, Math.max(220, width * 1.15));
}

/**
 * Multi-image/video carousel that only mounts the active slide so height
 * always matches that media item (no shared tallest-slide frame).
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
  const gesture = useRef({ x: 0, y: 0, swiping: false });
  const mediaKey = media.map((item) => item.id).join('|');

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
    <View>
      {isVideo && uri ? (
        <InlineFeedVideo
          uri={uri}
          width={width}
          playing={isVisible}
          onPress={() => onOpenViewer(safeIndex)}
        />
      ) : (
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            gesture.current = {
              x: e.nativeEvent.pageX,
              y: e.nativeEvent.pageY,
              swiping: false,
            };
          }}
          onResponderMove={(e) => {
            const dx = Math.abs(e.nativeEvent.pageX - gesture.current.x);
            const dy = Math.abs(e.nativeEvent.pageY - gesture.current.y);
            if (dx > 12 && dx > dy) gesture.current.swiping = true;
          }}
          onResponderRelease={(e) => {
            const dx = e.nativeEvent.pageX - gesture.current.x;
            if (gesture.current.swiping) {
              if (dx <= -48) go(safeIndex + 1);
              else if (dx >= 48) go(safeIndex - 1);
              return;
            }
            onOpenViewer(safeIndex);
          }}
        >
          <FeedMediaImage key={`${item.id}-${safeIndex}`} uri={uri} width={width} />
        </View>
      )}

      {media.length > 1 ? (
        <View style={styles.dotRow}>
          {media.map((entry, i) => (
            <Pressable
              key={entry.id}
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
});
