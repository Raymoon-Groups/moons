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
import { SuccessModal } from '@/components/success-modal';
import { UploadProgressModal } from '@/components/upload-progress-modal';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { createPost, type LocalMediaFile } from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';

const MAX_BODY = 3000;

type PostSuccessState = {
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function getPostSuccessState(files: LocalMediaFile[]): PostSuccessState {
  if (!files.length) {
    return {
      title: 'Posted',
      message: 'Your update was shared successfully.',
      icon: 'checkmark-circle-outline',
    };
  }

  const hasVideo = files.some((file) => file.mimeType?.startsWith('video'));
  if (hasVideo) {
    return {
      title: 'Uploaded successfully',
      message: 'Your video was uploaded and posted to your feed.',
      icon: 'videocam-outline',
    };
  }

  if (files.length > 1) {
    return {
      title: 'Uploaded successfully',
      message: 'Your photos were uploaded and posted to your feed.',
      icon: 'images-outline',
    };
  }

  return {
    title: 'Uploaded successfully',
    message: 'Your photo was uploaded and posted to your feed.',
    icon: 'image-outline',
  };
}

function getUploadLabel(files: LocalMediaFile[]): string {
  if (!files.length) return 'Posting update';
  if (files.some((file) => file.mimeType?.startsWith('video'))) return 'Uploading video';
  if (files.length > 1) return 'Uploading photos';
  return 'Uploading photo';
}

export function FeedComposer({ onPosted }: { onPosted: (post: FeedPost) => void }) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<LocalMediaFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState('Uploading');
  const [success, setSuccess] = useState<PostSuccessState | null>(null);

  const avatar = resolveAssetUrl(user?.avatarUrl ?? null);
  const initial = (user?.fullName?.[0] || user?.email?.[0] || '?').toUpperCase();
  const canPost = (body.trim().length > 0 || files.length > 0) && !posting;
  const hairline = isDark ? colors.border : colors.borderSubtle;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          marginHorizontal: 16,
          marginBottom: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: colors.surfaceElevated,
          overflow: 'hidden',
          shadowColor: '#0f1c33',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.28 : 0.07,
          shadowRadius: 16,
          elevation: 3,
        },
        body: {
          padding: 16,
        },
        row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        avatar: {
          width: 46,
          height: 46,
          borderRadius: 16,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: 46, height: 46, borderRadius: 16 },
        avatarInitial: { color: colors.blue, fontSize: 16, ...fontStyle('bold') },
        prompt: {
          flex: 1,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: isDark ? colors.surface : colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 13,
        },
        promptText: {
          color: colors.muted,
          fontSize: 14,
          ...fontStyle('medium'),
        },
        name: { color: colors.heading, fontSize: 15, ...fontStyle('bold') },
        audience: {
          color: colors.muted,
          fontSize: 12,
          marginTop: 2,
        },
        input: {
          minHeight: 100,
          marginTop: 14,
          color: colors.heading,
          fontSize: 16,
          lineHeight: 24,
          textAlignVertical: 'top',
        },
        quickRow: {
          flexDirection: 'row',
          gap: 8,
          marginTop: 12,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderRadius: 12,
          backgroundColor: isDark ? colors.surface : `${colors.blue}0C`,
          borderWidth: 1,
          borderColor: hairline,
        },
        chipLabel: {
          color: colors.foreground,
          fontSize: 13,
          ...fontStyle('semibold'),
        },
        thumb: {
          width: 86,
          height: 86,
          borderRadius: 12,
          backgroundColor: isDark ? colors.surface : colors.surfaceHover,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: hairline,
        },
        thumbImg: { width: '100%', height: '100%' },
        thumbVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        removeThumb: {
          position: 'absolute',
          top: 6,
          right: 6,
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
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: hairline,
          gap: 10,
        },
        attachBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
        },
        attachText: { color: colors.muted, fontSize: 13, ...fontStyle('semibold') },
        counter: { color: colors.muted, fontSize: 11 },
        postBtn: {
          backgroundColor: colors.blue,
          borderRadius: 12,
          paddingHorizontal: 18,
          paddingVertical: 10,
        },
        postText: { color: '#fff', fontSize: 14, ...fontStyle('bold') },
        cancelText: { color: colors.muted, fontSize: 13, ...fontStyle('semibold') },
      }),
    [colors, hairline, isDark],
  );

  async function pickMedia(mode: 'all' | 'images' | 'videos' = 'all') {
    const mediaTypes =
      mode === 'images'
        ? (['images'] as const)
        : mode === 'videos'
          ? (['videos'] as const)
          : (['images', 'videos'] as const);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [...mediaTypes],
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
    const attachedFiles = files;
    setUploadLabel(getUploadLabel(attachedFiles));
    setUploadProgress(0);
    try {
      const created = await createPost(body, attachedFiles, setUploadProgress);
      onPosted(created);
      setBody('');
      setFiles([]);
      setExpanded(false);
      setUploadProgress(null);
      setSuccess(getPostSuccessState(attachedFiles));
    } catch (err) {
      setUploadProgress(null);
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create post');
    } finally {
      setPosting(false);
    }
  }

  function cancel() {
    setExpanded(false);
    setBody('');
    setFiles([]);
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

  const successModal = (
    <SuccessModal
      visible={!!success}
      onClose={() => setSuccess(null)}
      title={success?.title ?? 'Success'}
      message={success?.message ?? ''}
      primaryLabel="Got it"
      variant="success"
      icon={success?.icon ?? 'checkmark'}
    />
  );

  const progressModal = (
    <UploadProgressModal
      visible={uploadProgress !== null}
      progress={uploadProgress ?? 0}
      label={uploadLabel}
    />
  );

  if (!expanded) {
    return (
      <>
        <View style={styles.shell}>
        <View style={styles.body}>
          <View style={styles.row}>
            {avatarNode}
            <Pressable
              style={styles.prompt}
              onPress={() => setExpanded(true)}
              accessibilityRole="button"
              accessibilityLabel="Create a post"
            >
              <Text style={styles.promptText}>What's new with you?</Text>
            </Pressable>
          </View>
          <View style={styles.quickRow}>
            <Pressable style={styles.chip} onPress={() => void pickMedia('images')}>
              <Ionicons name="image-outline" size={16} color={colors.blue} />
              <Text style={styles.chipLabel}>Photo</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => void pickMedia('videos')}>
              <Ionicons name="videocam-outline" size={16} color={colors.blue} />
              <Text style={styles.chipLabel}>Video</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => setExpanded(true)}>
              <Ionicons name="create-outline" size={16} color={colors.blue} />
              <Text style={styles.chipLabel}>Write</Text>
            </Pressable>
          </View>
        </View>
        </View>
        {successModal}
        {progressModal}
      </>
    );
  }

  return (
    <>
      <View style={styles.shell}>
      <View style={styles.body}>
        <View style={styles.row}>
          {avatarNode}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName || 'MoonsJob member'}</Text>
            <Text style={styles.audience}>Visible to your network</Text>
          </View>
          <Pressable onPress={cancel} hitSlop={8} accessibilityLabel="Close composer">
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>

        <TextInput
          value={body}
          onChangeText={(text) => setBody(text.slice(0, MAX_BODY))}
          placeholder="Share an update with your network…"
          placeholderTextColor={colors.muted}
          multiline
          autoFocus
          style={styles.input}
        />

        {files.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
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
          <Pressable style={styles.attachBtn} onPress={() => void pickMedia('all')}>
            <Ionicons name="images-outline" size={18} color={colors.muted} />
            <Text style={styles.attachText}>Media</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          {body.length > MAX_BODY - 300 ? (
            <Text style={styles.counter}>{MAX_BODY - body.length}</Text>
          ) : null}
          <Pressable onPress={cancel} style={{ paddingHorizontal: 6, paddingVertical: 10 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={!canPost}
            style={[styles.postBtn, !canPost && { opacity: 0.45 }]}
          >
            <Text style={styles.postText}>{posting ? 'Posting…' : 'Post'}</Text>
          </Pressable>
        </View>
      </View>
      </View>
      {successModal}
      {progressModal}
    </>
  );
}
