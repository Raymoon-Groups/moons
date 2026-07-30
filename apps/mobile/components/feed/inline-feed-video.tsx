import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Session-wide feed mute preference — survives scroll remounts. */
let feedVideosMuted = true;
const playbackPositions = new Map<string, number>();

/**
 * Looping video preview for the feed.
 * Mute/unmute choice is remembered while browsing the feed; scrolling away and back
 * keeps sound off/on as the user left it, and resumes near the same timestamp.
 */
export function InlineFeedVideo({
  uri,
  playing = true,
  style,
  onPress,
}: {
  uri: string;
  /** Pause when this card's fullscreen viewer is open, or when scrolled off-screen. */
  playing?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}) {
  const [muted, setMuted] = useState(feedVideosMuted);
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = feedVideosMuted;
    const saved = playbackPositions.get(uri);
    if (typeof saved === 'number' && saved > 0) {
      instance.currentTime = saved;
    }
    instance.play();
  });

  useEffect(() => {
    setMuted(feedVideosMuted);
  }, [uri]);

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
      player.play();
    } else {
      try {
        playbackPositions.set(uri, player.currentTime ?? 0);
      } catch {
        // ignore
      }
      player.pause();
      // Keep mute preference — do not force mute when scrolled off-screen.
    }
  }, [playing, player, uri]);

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      feedVideosMuted = next;
      return next;
    });
  }

  return (
    <Pressable style={[styles.wrap, style]} onPress={onPress} accessibilityLabel="Open video fullscreen">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
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
    backgroundColor: '#0f1726',
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
