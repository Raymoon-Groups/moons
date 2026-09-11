import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import { iosCompatibleAssetOptions } from '@/lib/image-picker-access';
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
import {
  MAX_POST_IMAGE_BYTES,
  MAX_POST_IMAGES,
  MAX_POST_VIDEO_BYTES,
  MAX_POST_VIDEOS,
  isPostImageMime,
  isPostVideoMime,
  postImageTooLargeMessage,
  postVideoTooLargeMessage,
} from '@moons/shared';
import { MentionSuggestions } from '@/components/mentions/mention-suggestions';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { createPost, type LocalMediaFile } from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';
import { useMentionComposer } from '@/lib/use-mention-composer';

const MAX_BODY = 3000;
const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_HEIGHT = 180;

export type FeedUploadState = {
  progress: number;
  label: string;
} | null;

function getUploadLabel(files: LocalMediaFile[], progress = 0): string {
  if (!files.length) return progress >= 100 ? 'Posted' : 'Posting…';
  if (progress >= 100) return 'Posted';
  if (progress >= 92) return 'Finishing…';
  if (progress < 12) return 'Preparing…';
  if (files.some((file) => file.mimeType?.startsWith('video'))) return 'Uploading video…';
  if (files.length > 1) return 'Uploading photos…';
  return 'Uploading photo…';
}

function guessMime(name: string, fallback: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'webm') return 'video/webm';
  return fallback;
}

function mergeMediaFiles(existing: LocalMediaFile[], incoming: LocalMediaFile[]): LocalMediaFile[] | string {
  const combined = [...existing, ...incoming];
  const images = combined.filter((f) => isPostImageMime(f.mimeType) || f.mimeType.startsWith('image/'));
  const videos = combined.filter((f) => isPostVideoMime(f.mimeType) || f.mimeType.startsWith('video/'));

  if (images.length && videos.length) {
    return 'A post can include images or one video, not both';
  }
  if (videos.length > MAX_POST_VIDEOS) {
    return 'Only one video per post is allowed';
  }
  if (videos.length === 1) return [videos[0]];
  return images.slice(0, MAX_POST_IMAGES);
}

export function FeedComposer({
  onPosted,
  onUploadChange,
  waitForUploadHold,
  uploading = false,
}: {
  onPosted: (post: FeedPost) => void | Promise<void>;
  onUploadChange: (state: FeedUploadState) => void;
  waitForUploadHold: () => Promise<void>;
  uploading?: boolean;
}) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<LocalMediaFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  const mention = useMentionComposer();
  const mentionSuggestions = mention.suggestionsFor(body);

  const avatar = resolveAssetUrl(user?.avatarUrl ?? null);
  const initial = (user?.fullName?.[0] || user?.email?.[0] || '?').toUpperCase();
  const locked = posting || uploading;
  const canPost = (body.trim().length > 0 || files.length > 0) && !locked;
  const hairline = isDark ? colors.border : colors.borderSubtle;
  const hasImages = files.some(
    (f) => isPostImageMime(f.mimeType) || f.mimeType.startsWith('image/'),
  );
  const hasVideo = files.some(
    (f) => isPostVideoMime(f.mimeType) || f.mimeType.startsWith('video/'),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          marginHorizontal: 16,
          marginBottom: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          overflow: 'hidden',
        },
        body: { padding: 14 },
        row: { flexDirection: 'row', alignItems: 'center' },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 18,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.blue,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        },
        avatarImg: { width: 40, height: 40 },
        avatarInitial: { color: '#fff', fontSize: 16, ...fontStyle('bold') },
        headerTitle: {
          color: colors.heading,
          fontSize: 15,
          ...fontStyle('bold'),
        },
        prompt: {
          flex: 1,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isDark ? colors.surface : '#F3F4F6',
        },
        promptText: { color: colors.muted, fontSize: 14, ...fontStyle('regular') },
        quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: hairline,
          paddingHorizontal: 12,
          paddingVertical: 7,
          backgroundColor: isDark ? colors.surface : '#fff',
        },
        chipLabel: { color: colors.heading, fontSize: 12, ...fontStyle('semibold') },
        input: {
          color: colors.heading,
          fontSize: 15,
          lineHeight: 22,
          paddingTop: 0,
          paddingBottom: 0,
          textAlignVertical: 'top',
          ...fontStyle('regular'),
        },
        thumb: {
          width: 72,
          height: 72,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: isDark ? colors.surface : '#F3F4F6',
        },
        thumbImg: { width: '100%', height: '100%' },
        thumbVideo: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        removeThumb: {
          position: 'absolute',
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: 'rgba(0,0,0,0.65)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 10,
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
    if (locked) return;
    const hasVideoAlready = files.some(
      (f) => isPostVideoMime(f.mimeType) || f.mimeType.startsWith('video/'),
    );
    if (hasVideoAlready) {
      Alert.alert('Limit reached', 'Only one video per post is allowed');
      return;
    }

    const mediaTypes =
      mode === 'images'
        ? (['images'] as const)
        : mode === 'videos'
          ? (['videos'] as const)
          : files.length > 0
            ? (['images'] as const)
            : (['images', 'videos'] as const);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [...mediaTypes],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: hasVideoAlready ? 1 : Math.max(1, MAX_POST_IMAGES - files.length),
      ...iosCompatibleAssetOptions(),
    });
    if (result.canceled) return;

    const picked: LocalMediaFile[] = [];
    for (let index = 0; index < result.assets.length; index += 1) {
      const asset = result.assets[index];
      const isVideo = asset.type === 'video' || Boolean(asset.mimeType?.startsWith('video'));
      const name =
        asset.fileName ||
        `media-${Date.now()}-${index}.${isVideo ? (asset.uri.toLowerCase().includes('.mov') ? 'mov' : 'mp4') : 'jpg'}`;
      const mimeType = guessMime(
        name,
        asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      );

      if (!isPostImageMime(mimeType) && !isPostVideoMime(mimeType)) {
        Alert.alert(
          'Unsupported file',
          'Only JPEG, PNG, WEBP, GIF, HEIC images and MP4/WEBM/MOV videos are allowed',
        );
        return;
      }

      let size = asset.fileSize ?? 0;
      if (!size) {
        try {
          const info = await getInfoAsync(asset.uri);
          if (info.exists && 'size' in info && typeof info.size === 'number') {
            size = info.size;
          }
        } catch {
          // size unknown — server will still enforce limits
        }
      }

      if (isPostVideoMime(mimeType) && size > MAX_POST_VIDEO_BYTES) {
        Alert.alert('File too large', postVideoTooLargeMessage());
        return;
      }
      if (isPostImageMime(mimeType) && size > MAX_POST_IMAGE_BYTES) {
        Alert.alert('File too large', postImageTooLargeMessage());
        return;
      }

      picked.push({ uri: asset.uri, name, mimeType, size: size || undefined });
    }

    const merged = mergeMediaFiles(files, picked);
    if (typeof merged === 'string') {
      Alert.alert('Could not add media', merged);
      return;
    }

    setExpanded(true);
    setFiles(merged);
  }

  async function submit() {
    if (!canPost) return;
    setPosting(true);
    const attachedFiles = files;
    const storedBody = mention.toStored(body);
    const startProgress = attachedFiles.length ? 8 : 30;

    setBody('');
    mention.resetMentions();
    setFiles([]);
    setExpanded(false);
    setInputHeight(INPUT_MIN_HEIGHT);
    onUploadChange({
      progress: startProgress,
      label: getUploadLabel(attachedFiles, startProgress),
    });

    try {
      const created = await createPost(storedBody, attachedFiles, (progress) => {
        const next = attachedFiles.length ? Math.max(8, progress) : Math.max(30, progress);
        onUploadChange({
          progress: Math.min(96, next),
          label: getUploadLabel(attachedFiles, next),
        });
      });
      onUploadChange({ progress: 100, label: getUploadLabel(attachedFiles, 100) });
      await waitForUploadHold();
      await onPosted(created);
      onUploadChange(null);
    } catch (err) {
      onUploadChange(null);
      const message = err instanceof Error ? err.message : 'Could not create post';
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setPosting(false);
    }
  }

  function cancel() {
    setExpanded(false);
    setBody('');
    mention.resetMentions();
    setFiles([]);
    setInputHeight(INPUT_MIN_HEIGHT);
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
      <View style={[styles.shell, locked && { opacity: 0.75 }]}>
        <View style={styles.body}>
          <View style={styles.row}>
            {avatarNode}
            <Pressable
              style={styles.prompt}
              onPress={() => {
                if (!locked) setExpanded(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Create a post"
            >
              <Text style={styles.promptText}>
                {locked ? 'Posting your update…' : "What's new with you?"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.quickRow}>
            <Pressable
              style={[styles.chip, (locked || hasVideo) && { opacity: 0.45 }]}
              onPress={() => void pickMedia('images')}
              disabled={locked || hasVideo}
            >
              <Ionicons name="image-outline" size={16} color={colors.blue} />
              <Text style={styles.chipLabel}>Photo</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, (locked || hasImages || hasVideo) && { opacity: 0.45 }]}
              onPress={() => void pickMedia('videos')}
              disabled={locked || hasImages || hasVideo}
            >
              <Ionicons name="videocam-outline" size={16} color={colors.blue} />
              <Text style={styles.chipLabel}>Video</Text>
            </Pressable>
            <Pressable
              style={styles.chip}
              onPress={() => {
                if (!locked) setExpanded(true);
              }}
              disabled={locked}
            >
              <Ionicons name="create-outline" size={16} color={colors.blue} />
              <Text style={styles.chipLabel}>Write</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.shell, locked && { opacity: 0.75 }]}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          {avatarNode}
          <Text style={styles.headerTitle}>New post</Text>
        </View>

        <TextInput
          value={body}
          editable={!locked}
          onChangeText={(text) => {
            const next = text.slice(0, MAX_BODY);
            setBody(next);
            mention.setCaret(next.length);
            mention.syncMentionsFromText(next);
            mention.ensureLoaded();
            if (!next.trim()) setInputHeight(INPUT_MIN_HEIGHT);
          }}
          onContentSizeChange={(e) => {
            const next = Math.ceil(e.nativeEvent.contentSize.height);
            setInputHeight(Math.min(INPUT_MAX_HEIGHT, Math.max(INPUT_MIN_HEIGHT, next)));
          }}
          onSelectionChange={(e) => mention.setCaret(e.nativeEvent.selection.end)}
          placeholder="Share an update with your network…"
          placeholderTextColor={colors.muted}
          multiline
          scrollEnabled={inputHeight >= INPUT_MAX_HEIGHT}
          autoFocus
          style={[styles.input, { height: inputHeight }]}
        />

        <MentionSuggestions
          people={mentionSuggestions}
          onSelect={(person) => {
            const result = mention.pickMention(body, person);
            setBody(result.text.slice(0, MAX_BODY));
          }}
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
                  disabled={locked}
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
          <Pressable
            style={[styles.attachBtn, (locked || hasVideo) && { opacity: 0.45 }]}
            onPress={() => void pickMedia('all')}
            disabled={locked || hasVideo}
          >
            <Ionicons name="images-outline" size={18} color={colors.muted} />
            <Text style={styles.attachText}>Media</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          {body.length > MAX_BODY - 300 ? (
            <Text style={styles.counter}>{MAX_BODY - body.length}</Text>
          ) : null}
          <Pressable
            onPress={cancel}
            disabled={locked}
            style={{ paddingHorizontal: 6, paddingVertical: 10 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={!canPost}
            style={[styles.postBtn, !canPost && { opacity: 0.45 }]}
          >
            <Text style={styles.postText}>{locked ? 'Posting…' : 'Post'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
