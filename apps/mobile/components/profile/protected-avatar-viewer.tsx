import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontStyle } from '@/lib/font-style';

const CAPTURE_KEY = 'moons-protected-photo';

/**
 * Full-screen photo viewer with screenshot / screen-recording blocked while open.
 * Long-press save and share actions are disabled.
 */
export function ProtectedPhotoViewer({
  visible,
  uri,
  name,
  variant = 'avatar',
  onClose,
}: {
  visible: boolean;
  uri: string;
  name?: string | null;
  variant?: 'avatar' | 'cover';
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCover = variant === 'cover';
  const imageWidth = isCover ? width - 32 : Math.min(width - 48, height * 0.62, 420);
  const imageHeight = isCover
    ? Math.min((imageWidth * 5) / 16, height * 0.45)
    : imageWidth;

  useEffect(() => {
    if (!visible || Platform.OS === 'web') return;

    let active = true;
    void (async () => {
      try {
        const available = await ScreenCapture.isAvailableAsync();
        if (!available || !active) return;
        await ScreenCapture.preventScreenCaptureAsync(CAPTURE_KEY);
        if (active && Platform.OS === 'ios') {
          await ScreenCapture.enableAppSwitcherProtectionAsync(0.85);
        }
      } catch {
        // Native module may be unavailable in some environments.
      }
    })();

    return () => {
      active = false;
      void (async () => {
        try {
          if (Platform.OS === 'ios') {
            await ScreenCapture.disableAppSwitcherProtectionAsync();
          }
          await ScreenCapture.allowScreenCaptureAsync(CAPTURE_KEY);
        } catch {
          // ignore
        }
      })();
    };
  }, [visible]);

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close photo" />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <View style={styles.shield}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={[styles.shieldText, fontStyle('semibold')]}>Protected</Text>
          </View>
        </View>

        <View style={styles.center} pointerEvents="box-none">
          <View
            style={[
              styles.frame,
              {
                width: imageWidth,
                height: imageHeight,
                borderRadius: isCover ? 16 : imageWidth / 2,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Image
              source={{ uri }}
              style={{ width: imageWidth, height: imageHeight }}
              contentFit="cover"
              transition={120}
              cachePolicy="memory"
              pointerEvents="none"
            />
          </View>
          {name ? (
            <Text style={[styles.name, fontStyle('bold')]} numberOfLines={1}>
              {name}
            </Text>
          ) : isCover ? (
            <Text style={[styles.name, fontStyle('semibold')]}>Cover photo</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/** @deprecated Prefer ProtectedPhotoViewer — kept for existing imports. */
export function ProtectedAvatarViewer(
  props: Omit<Parameters<typeof ProtectedPhotoViewer>[0], 'variant'>,
) {
  return <ProtectedPhotoViewer {...props} variant="avatar" />;
}

/** Wraps an avatar; tap opens the protected viewer when a photo URI exists. */
export function ViewableAvatar({
  uri,
  name,
  children,
  disabled,
  style,
}: {
  uri?: string | null;
  name?: string | null;
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const canOpen = Boolean(uri) && !disabled;

  if (!canOpen) {
    return <View style={style}>{children}</View>;
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={style}
        accessibilityRole="imagebutton"
        accessibilityLabel={name ? `View ${name}'s photo` : 'View profile photo'}
      >
        {children}
      </Pressable>
      <ProtectedPhotoViewer
        visible={open}
        uri={uri!}
        name={name}
        variant="avatar"
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  shield: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  shieldText: {
    color: '#fff',
    fontSize: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  frame: {
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  name: {
    marginTop: 20,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
