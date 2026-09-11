import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle, View } from 'react-native';
import { safeVideoPause, safeVideoPlay } from '@/lib/safe-video';

/** Session-wide feed mute preference — survives scroll remounts. */
let feedVideosMuted = true;
const playbackPositions = new Map<string, number>();

const DEFAULT_RATIO = 16 / 9;
const MAX_HEIGHT = 560;
const FALLBACK_MIN = 72;

function frameHeightFor(width: number, ratio: number, maxHeight: number) {
  if (!(width > 0) || !(ratio > 0)) return Math.min(maxHeight, width * 0.56);
  return Math.min(maxHeight, Math.max(FALLBACK_MIN, width / ratio));
}

/**
 * Looping video preview for the feed.
 * Frame height follows the video’s own aspect ratio (no forced portrait crop).
 */
export function InlineFeedVideo({
  uri,
  width,
  playing = true,
  maxHeight = MAX_HEIGHT,
  style,
  onPress,
}: {
  uri: string;
  /** Feed column width — required so the frame can match the video aspect ratio. */
  width: number;
  /** Pause when this card's fullscreen viewer is open, or when scrolled off-screen. */
  playing?: boolean;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}) {
  const [muted, setMuted] = useState(feedVideosMuted);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = feedVideosMuted;
    const saved = playbackPositions.get(uri);
    if (typeof saved === 'number' && saved > 0) {
      instance.currentTime = saved;
    }
    if (playing) safeVideoPlay(instance);
  });

  useEffect(() => {
    setMuted(feedVideosMuted);
    setRatio(DEFAULT_RATIO);
  }, [uri]);

  useEffect(() => {
    function applySize(size?: { width: number; height: number } | null) {
      if (size && size.width > 0 && size.height > 0) {
        setRatio(size.width / size.height);
      }
    }

    applySize(player.videoTrack?.size);

    const sourceSub = player.addListener('sourceLoad', (payload) => {
      const track = payload.availableVideoTracks?.[0];
      applySize(track?.size ?? player.videoTrack?.size);
    });
    const trackSub = player.addListener('videoTrackChange', (payload) => {
      applySize(payload.videoTrack?.size);
    });

    return () => {
      sourceSub.remove();
      trackSub.remove();
    };
  }, [player]);

  useEffect(() => {
    player.muted = muted;
    if (!muted) player.volume = 1;
  }, [muted, player]);

  useEffect(() => {
    if (playing) {
      const saved = playbackPositions.get(uri);
      if (typeof saved === 'number' && saved > 0) {
        try {
          player.currentTime = saved;
        } catch {
          // ignore seek errors on recycled players
        }
      }
      player.muted = feedVideosMuted;
      setMuted(feedVideosMuted);
      safeVideoPlay(player);
    } else {
      try {
        playbackPositions.set(uri, player.currentTime ?? 0);
      } catch {
        // ignore
      }
      safeVideoPause(player);
    }
  }, [playing, player, uri]);

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      feedVideosMuted = next;
      return next;
    });
  }

  const frameHeight = frameHeightFor(width, ratio, maxHeight);

  return (
    <Pressable
      style={[
        styles.wrap,
        {
          width,
          height: frameHeight,
          backgroundColor: '#0f1726',
        },
        style,
      ]}
      onPress={onPress}
      accessibilityLabel="Open video fullscreen"
    >
      <VideoView
        player={player}
        style={{ width, height: frameHeight }}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
        pointerEvents="none"
      />
      <View style={styles.badge} pointerEvents="none">
        <Ionicons name="expand-outline" size={16} color="#fff" />
      </View>
      <Pressable
        style={styles.muteChip}
        hitSlop={10}
        onPress={toggleMute}
        accessibilityRole="button"
        accessibilityLabel={muted ? 'Unmute video' : 'Mute video'}
        accessibilityState={{ selected: !muted }}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={15} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  muteChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
