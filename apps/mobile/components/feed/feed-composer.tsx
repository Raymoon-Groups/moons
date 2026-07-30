import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { createPost, type LocalMediaFile } from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const MAX_BODY = 3000;

export function FeedComposer({ onPosted }: { onPosted: (post: FeedPost) => void }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<LocalMediaFile[]>([]);
  const [posting, setPosting] = useState(false);

  const avatar = resolveAssetUrl(user?.avatarUrl ?? null);
  const initial = (user?.fullName?.[0] || user?.email?.[0] || '?').toUpperCase();
  const canPost = (body.trim().length > 0 || files.length > 0) && !posting;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          marginBottom: 14,
          ...theme.shadow.soft,
        },
        row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        avatar: {
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: `${colors.blue}18`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: 42, height: 42, borderRadius: 21 },
        avatarInitial: { color: colors.blue, fontSize: 16, ...fontStyle('bold') },
        prompt: {
          flex: 1,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        promptText: { color: colors.muted, fontSize: 14 },
        iconBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${colors.blue}14`,
        },
        name: { color: colors.heading, fontSize: 15, ...fontStyle('bold') },
        meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
        input: {
          minHeight: 96,
          marginTop: 12,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          padding: 14,
          color: colors.heading,
          backgroundColor: colors.surface,
          textAlignVertical: 'top',
          fontSize: 15,
          lineHeight: 22,
        },
        thumb: {
          width: 84,
          height: 84,
          borderRadius: theme.radius.sm,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        thumbImg: { width: '100%', height: '100%' },
        thumbVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        removeThumb: {
          position: 'absolute',
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 38, 0.72)',
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          gap: 10,
        },
        attachBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: `${colors.blue}12`,
        },
        attachText: { color: colors.blue, fontSize: 13, ...fontStyle('semibold') },
        counter: { color: colors.muted, fontSize: 11 },
        postBtn: {
          backgroundColor: colors.blue,
          borderRadius: 999,
          paddingHorizontal: 20,
          paddingVertical: 10,
          ...theme.shadow.button,
        },
        postText: { color: '#fff', fontSize: 14, ...fontStyle('bold') },
        cancelText: { color: colors.muted, fontSize: 13, ...fontStyle('semibold') },
      }),
    [colors],
  );

  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10,
    });
    if (result.canceled) return;
    setExpanded(true);
    setFiles(
      result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `media-${index}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      })),
    );
  }

  async function submit() {
    if (!canPost) return;
    setPosting(true);
    try {
      const created = await createPost(body, files);
      onPosted(created);
      setBody('');
      setFiles([]);
      setExpanded(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create post');
    } finally {
      setPosting(false);
    }
  }

  const avatarNode = (
    <View style={styles.avatar}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatarImg} />
      ) : (
        <Text style={styles.avatarInitial}>{initial}</Text>
      )}
    </View>
  );

  if (!expanded) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          {avatarNode}
          <Pressable style={styles.prompt} onPress={() => setExpanded(true)}>
            <Text style={styles.promptText}>Share an update…</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => void pickMedia()} accessibilityLabel="Add photo or video">
            <Ionicons name="image-outline" size={20} color={colors.blue} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {avatarNode}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.fullName || 'MoonsJob member'}</Text>
          <Text style={styles.meta}>Sharing with your network</Text>
        </View>
      </View>

      <TextInput
        value={body}
        onChangeText={(text) => setBody(text.slice(0, MAX_BODY))}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.muted}
        multiline
        autoFocus
        style={styles.input}
      />

      {files.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 12 }}
        >
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.thumb}>
              {file.mimeType?.startsWith('video') ? (
                <View style={styles.thumbVideo}>
                  <Ionicons name="videocam-outline" size={22} color={colors.muted} />
                </View>
              ) : (
                <Image source={{ uri: file.uri }} style={styles.thumbImg} resizeMode="cover" />
              )}
              <Pressable
                style={styles.removeThumb}
                hitSlop={6}
                onPress={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                accessibilityLabel="Remove attachment"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.footer}>
        <Pressable style={styles.attachBtn} onPress={() => void pickMedia()}>
          <Ionicons name="image-outline" size={17} color={colors.blue} />
          <Text style={styles.attachText}>Photo / video</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {body.length > MAX_BODY - 300 ? (
          <Text style={styles.counter}>{MAX_BODY - body.length}</Text>
        ) : null}
        <Pressable
          onPress={() => {
            setExpanded(false);
            setBody('');
            setFiles([]);
          }}
          style={{ paddingHorizontal: 8, paddingVertical: 10 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => void submit()}
          disabled={!canPost}
          style={[styles.postBtn, !canPost && { opacity: 0.5 }]}
        >
          <Text style={styles.postText}>{posting ? 'Posting…' : 'Post'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
