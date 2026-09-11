import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export type MobileImageCropAspect = 'avatar' | 'cover' | 'logo';

const ASPECT_BY_KIND: Record<MobileImageCropAspect, number> = {
  avatar: 1,
  logo: 1,
  cover: 16 / 5,
};

const TITLE_BY_KIND: Record<MobileImageCropAspect, string> = {
  avatar: 'Adjust profile photo',
  logo: 'Adjust company logo',
  cover: 'Adjust cover photo',
};

type Props = {
  visible: boolean;
  uri: string | null;
  aspect?: MobileImageCropAspect;
  onCancel: () => void;
  onComplete: (result: { uri: string; width: number; height: number }) => void;
};

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

export function ImageCropModal({
  visible,
  uri,
  aspect = 'avatar',
  onCancel,
  onComplete,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!visible || !uri) {
      setImageSize(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setError('');
      setBusy(false);
      return;
    }
    let cancelled = false;
    RNImage.getSize(
      uri,
      (width, height) => {
        if (!cancelled) setImageSize({ width, height });
      },
      () => {
        if (!cancelled) setError('Could not load image');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [visible, uri]);

  const frameWidth = Math.min(windowWidth - 48, 360);
  const aspectRatio = ASPECT_BY_KIND[aspect];
  const frameHeight = frameWidth / aspectRatio;
  const roundMask = aspect === 'avatar';

  const baseScale = useMemo(() => {
    if (!imageSize) return 1;
    return Math.max(frameWidth / imageSize.width, frameHeight / imageSize.height);
  }, [frameHeight, frameWidth, imageSize]);

  const totalScale = baseScale * zoom;
  const displayWidth = (imageSize?.width ?? 0) * totalScale;
  const displayHeight = (imageSize?.height ?? 0) * totalScale;

  const clampOffset = useCallback(
    (x: number, y: number, nextZoom = zoom) => {
      if (!imageSize) return { x: 0, y: 0 };
      const scale = baseScale * nextZoom;
      const w = imageSize.width * scale;
      const h = imageSize.height * scale;
      const maxX = Math.max(0, (w - frameWidth) / 2);
      const maxY = Math.max(0, (h - frameHeight) / 2);
      return {
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
      };
    },
    [baseScale, frameHeight, frameWidth, imageSize, zoom],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStart.current = offsetRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          setOffset(
            clampOffset(dragStart.current.x + gesture.dx, dragStart.current.y + gesture.dy, zoomRef.current),
          );
        },
      }),
    [clampOffset],
  );

  function handleZoomChange(value: number) {
    const next = clamp(value, 1, 3);
    setZoom(next);
    setOffset((prev) => clampOffset(prev.x, prev.y, next));
  }

  async function handleApply() {
    if (!uri || !imageSize) return;
    setBusy(true);
    setError('');
    try {
      const scale = baseScale * zoom;
      const originX = (displayWidth / 2 - frameWidth / 2 - offset.x) / scale;
      const originY = (displayHeight / 2 - frameHeight / 2 - offset.y) / scale;
      const cropWidth = frameWidth / scale;
      const cropHeight = frameHeight / scale;

      const crop = {
        originX: clamp(Math.round(originX), 0, imageSize.width - 1),
        originY: clamp(Math.round(originY), 0, imageSize.height - 1),
        width: clamp(Math.round(cropWidth), 1, imageSize.width),
        height: clamp(Math.round(cropHeight), 1, imageSize.height),
      };

      if (crop.originX + crop.width > imageSize.width) {
        crop.width = imageSize.width - crop.originX;
      }
      if (crop.originY + crop.height > imageSize.height) {
        crop.height = imageSize.height - crop.originY;
      }

      const maxEdge = aspect === 'cover' ? 1600 : 1024;
      const longest = Math.max(crop.width, crop.height);
      const resize =
        longest > maxEdge
          ? {
              width: Math.round((crop.width / longest) * maxEdge),
              height: Math.round((crop.height / longest) * maxEdge),
            }
          : undefined;

      const result = await manipulateAsync(
        uri,
        [{ crop }, ...(resize ? [{ resize }] : [])],
        { compress: 0.9, format: SaveFormat.JPEG },
      );
      onComplete({ uri: result.uri, width: result.width, height: result.height });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, backgroundColor: '#0b1220' }]}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} disabled={busy} hitSlop={12}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>{TITLE_BY_KIND[aspect]}</Text>
          <Pressable onPress={() => void handleApply()} disabled={busy || !imageSize} hitSlop={12}>
            <Text style={[styles.headerAction, styles.headerPrimary, (!imageSize || busy) && styles.disabled]}>
              {busy ? '…' : 'Done'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>Drag to reposition · slide to zoom</Text>

        <View style={styles.stage}>
          <View
            style={[
              styles.frame,
              {
                width: frameWidth,
                height: frameHeight,
                borderRadius: roundMask ? frameWidth / 2 : 16,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {uri && imageSize ? (
              <Image
                source={{ uri }}
                style={{
                  position: 'absolute',
                  width: displayWidth,
                  height: displayHeight,
                  left: (frameWidth - displayWidth) / 2 + offset.x,
                  top: (frameHeight - displayHeight) / 2 + offset.y,
                }}
                contentFit="fill"
              />
            ) : (
              <ActivityIndicator color="#fff" />
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <Text style={[styles.zoomLabel, { color: colors.muted }]}>Zoom</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={3}
            step={0.01}
            value={zoom}
            onValueChange={handleZoomChange}
            minimumTrackTintColor={colors.blue}
            maximumTrackTintColor="rgba(255,255,255,0.25)"
            thumbTintColor="#fff"
            disabled={busy || !imageSize}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerAction: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    minWidth: 64,
    ...fontStyle('semibold'),
  },
  headerPrimary: {
    color: '#7eb6ff',
    textAlign: 'right',
  },
  disabled: { opacity: 0.5 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    ...fontStyle('bold'),
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    ...fontStyle('regular'),
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  zoomLabel: {
    fontSize: 12,
    marginBottom: 4,
    ...fontStyle('semibold'),
  },
  slider: { width: '100%', height: 36 },
  error: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    ...fontStyle('regular'),
  },
});
