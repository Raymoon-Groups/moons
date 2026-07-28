import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FeedPost, PostCommentItem } from '@moons/shared';
import { ForwardPostModal } from '@/components/feed/forward-post-modal';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { sendConnectionRequest } from '@/lib/network';
import { pickMessageDocument, pickMessageImage } from '@/lib/message-attachments';
import {
  addComment,
  deleteComment,
  deletePost,
  fetchComments,
  likePost,
  type LocalMediaFile,
  unlikePost,
  updatePost,
} from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function PostCard({
  post,
  onChange,
  onRemove,
}: {
  post: FeedPost;
  onChange: (next: FeedPost) => void;
  onRemove: (id: string) => void;
}) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState((post.recentComments?.length ?? 0) > 0);
  const [comments, setComments] = useState<PostCommentItem[]>(post.recentComments ?? []);
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<LocalMediaFile | null>(null);
  const [hiddenCommentIds, setHiddenCommentIds] = useState<Set<string>>(() => new Set());
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(() => new Set());
  const [showForward, setShowForward] = useState(false);
  const isMine = post.author.userId === user?.id;
  const isConnected =
    post.connectionStatus === 'ACCEPTED' || post.connectionStatus === 'SELF';
  const canConnect =
    !isMine &&
    (post.connectionStatus === 'NONE' ||
      post.connectionStatus === 'REJECTED' ||
      post.connectionStatus === 'CANCELLED');
  const showAuthorActions = !isMine && !isConnected;
  const avatar = resolveAssetUrl(post.author.avatarUrl);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          marginBottom: 12,
        },
        row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${colors.blue}22`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarImg: { width: 44, height: 44, borderRadius: 22 },
        name: { color: colors.heading, ...fontStyle('semibold'), fontSize: 15 },
        meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
        body: { color: colors.heading, fontSize: 15, lineHeight: 22, marginTop: 10 },
        media: { width: '100%', height: 220, borderRadius: 12, marginTop: 10, backgroundColor: '#000' },
        counts: { flexDirection: 'row', gap: 14, marginTop: 12 },
        countText: { color: colors.muted, fontSize: 12 },
        actions: {
          flexDirection: 'row',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          marginTop: 10,
          paddingTop: 6,
        },
        actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
        actionText: { color: colors.heading, ...fontStyle('semibold'), fontSize: 13 },
        liked: { color: colors.blue },
        connect: {
          borderWidth: 1,
          borderColor: `${colors.blue}66`,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        connectText: { color: colors.blue, fontSize: 12, ...fontStyle('semibold') },
        authorActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        sharedBox: {
          marginTop: 10,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 10,
          backgroundColor: colors.surface,
        },
        commentRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
        commentBox: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        input: {
          flex: 1,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          color: colors.heading,
          backgroundColor: colors.surface,
        },
      }),
    [colors],
  );

  async function toggleLike() {
    setBusy(true);
    try {
      onChange(post.likedByMe ? await unlikePost(post.id) : await likePost(post.id));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update like');
    } finally {
      setBusy(false);
    }
  }

  async function openComments() {
    setShowComments(true);
    try {
      const data = await fetchComments(post.id);
      setComments(data.items);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load comments');
    }
  }

  async function submitComment() {
    if (!commentText.trim() && !commentFile) return;
    setBusy(true);
    try {
      const created = await addComment(post.id, commentText.trim(), commentFile ?? undefined);
      setComments((prev) => [...prev, created]);
      setCommentText('');
      setCommentFile(null);
      onChange({ ...post, commentCount: post.commentCount + 1 });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not comment');
    } finally {
      setBusy(false);
    }
  }

  function pickCommentAttachment() {
    Alert.alert('Attach file', undefined, [
      {
        text: 'Photo',
        onPress: () => {
          void pickMessageImage().then((result) => {
            if (!result) return;
            if ('error' in result) {
              Alert.alert(result.error.title, result.error.message);
              return;
            }
            setCommentFile({
              uri: result.file.uri,
              name: result.file.name,
              mimeType: result.file.mimeType ?? 'image/jpeg',
            });
          });
        },
      },
      {
        text: 'Document',
        onPress: () => {
          void pickMessageDocument().then((result) => {
            if (!result) return;
            if ('error' in result) {
              Alert.alert(result.error.title, result.error.message);
              return;
            }
            setCommentFile({
              uri: result.file.uri,
              name: result.file.name,
              mimeType: result.file.mimeType ?? 'application/octet-stream',
            });
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const original = post.originalPost && !('unavailable' in post.originalPost) ? post.originalPost : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable onPress={() => router.push(`/network/${post.author.userId}` as never)}>
          <View style={styles.avatar}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={{ color: colors.blue, ...fontStyle('bold') }}>
                {(post.author.fullName?.[0] || '?').toUpperCase()}
              </Text>
            )}
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{post.author.fullName || 'MoonsJob member'}</Text>
          <Text style={styles.meta}>
            {[post.author.headline, timeAgo(post.createdAt)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {showAuthorActions ? (
          <View style={styles.authorActions}>
            {canConnect ? (
              <Pressable
                style={styles.connect}
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    await sendConnectionRequest(post.author.userId);
                    onChange({ ...post, connectionStatus: 'PENDING', connectionDirection: 'sent' });
                  } catch (err) {
                    Alert.alert('Error', err instanceof Error ? err.message : 'Could not connect');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Text style={styles.connectText}>Connect</Text>
              </Pressable>
            ) : post.connectionStatus === 'PENDING' ? (
              <View style={styles.connect}>
                <Text style={[styles.connectText, { color: colors.muted }]}>
                  {post.connectionDirection === 'received' ? 'Respond' : 'Pending'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {isMine ? (
          <Pressable
            onPress={() => {
              const buttons: {
                text: string;
                style?: 'cancel' | 'destructive' | 'default';
                onPress?: () => void;
              }[] = [];
              if (Platform.OS === 'ios') {
                buttons.push({
                  text: 'Edit',
                  onPress: () => {
                    Alert.prompt(
                      'Edit post',
                      'Update your post text',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Save',
                          onPress: (value?: string) => {
                            if (value == null) return;
                            void updatePost(post.id, value)
                              .then((next) => onChange(next))
                              .catch((err) =>
                                Alert.alert(
                                  'Error',
                                  err instanceof Error ? err.message : 'Could not save',
                                ),
                              );
                          },
                        },
                      ],
                      'plain-text',
                      post.body,
                    );
                  },
                });
              }
              buttons.push(
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    void deletePost(post.id)
                      .then(() => onRemove(post.id))
                      .catch((err) =>
                        Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete'),
                      );
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              );
              Alert.alert('Post options', undefined, buttons);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.media.length > 0 ? (
        post.media.length === 1 && post.media[0].type === 'VIDEO' ? (
          <Text style={[styles.meta, { marginTop: 10 }]}>Video attached — open on web for playback</Text>
        ) : post.media.length === 1 ? (
          <Image
            source={{ uri: resolveAssetUrl(post.media[0].url) ?? undefined }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : (
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={post.media}
            keyExtractor={(item) => item.id}
            style={{ marginTop: 10 }}
            renderItem={({ item, index }) => (
              <View style={{ width: 320, marginRight: 8 }}>
                {item.type === 'VIDEO' ? (
                  <Text style={styles.meta}>Video {index + 1}</Text>
                ) : (
                  <Image
                    source={{ uri: resolveAssetUrl(item.url) ?? undefined }}
                    style={[styles.media, { marginTop: 0 }]}
                    resizeMode="cover"
                  />
                )}
                <Text style={[styles.meta, { marginTop: 6, textAlign: 'center' }]}>
                  {index + 1} / {post.media.length}
                </Text>
              </View>
            )}
          />
        )
      ) : null}

      {original ? (
        <View style={styles.sharedBox}>
          <Text style={styles.meta}>Shared from {original.author.fullName || 'a member'}</Text>
          {original.body ? <Text style={styles.body}>{original.body}</Text> : null}
        </View>
      ) : null}

      <View style={styles.counts}>
        <Text style={styles.countText}>
          {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
        </Text>
        <Text style={styles.countText}>
          {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
        </Text>
      </View>

      <ForwardPostModal
        visible={showForward}
        post={post}
        onClose={() => setShowForward(false)}
      />

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} disabled={busy} onPress={() => void toggleLike()}>
          <Text style={[styles.actionText, post.likedByMe && styles.liked]}>
            {post.likedByMe ? 'Liked' : 'Like'}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => void openComments()}>
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => setShowForward(true)}>
          <Text style={styles.actionText}>Forward</Text>
        </Pressable>
      </View>

      {showComments ? (
        <View>
          {comments
            .filter((c) => !reportedCommentIds.has(c.id))
            .map((c) => {
            const isHidden = hiddenCommentIds.has(c.id);
            const showMenu = isMine || (!isMine && !c.isMine);
            return (
            <View key={c.id} style={[styles.commentRow, isHidden ? { opacity: 0.4 } : null]}>
              <View style={[styles.commentBox, { flexDirection: 'row', alignItems: 'flex-start' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.author.fullName || 'Member'}</Text>
                  <Text style={styles.meta}>
                    {isHidden ? 'Hidden · ' : ''}commented
                  </Text>
                  {c.body.trim() &&
                  !(
                    c.attachmentUrl &&
                    c.attachmentMimeType?.startsWith('image/') &&
                    c.body.trim().startsWith('📎')
                  ) ? (
                    <Text style={{ color: colors.heading, marginTop: 2 }}>{c.body}</Text>
                  ) : null}
                  {c.attachmentUrl ? (
                    c.attachmentMimeType?.startsWith('image/') ? (
                      <Image
                        source={{ uri: resolveAssetUrl(c.attachmentUrl) ?? undefined }}
                        style={{
                          width: '100%',
                          height: 140,
                          borderRadius: 10,
                          marginTop: 8,
                          backgroundColor: colors.surface,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ color: colors.blue, fontSize: 12, marginTop: 6, ...fontStyle('semibold') }}>
                        📎 {c.attachmentFileName || 'Attachment'}
                      </Text>
                    )
                  ) : null}
                </View>
                {showMenu ? (
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      const buttons: {
                        text: string;
                        style?: 'cancel' | 'destructive' | 'default';
                        onPress?: () => void;
                      }[] = [];
                      if (isMine) {
                        buttons.push({
                          text: isHidden ? 'Unhide' : 'Hide',
                          onPress: () =>
                            setHiddenCommentIds((prev) => {
                              const next = new Set(prev);
                              if (isHidden) next.delete(c.id);
                              else next.add(c.id);
                              return next;
                            }),
                        });
                        buttons.push({
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            void deleteComment(post.id, c.id)
                              .then(() => {
                                setComments((prev) => prev.filter((x) => x.id !== c.id));
                                onChange({
                                  ...post,
                                  commentCount: Math.max(0, post.commentCount - 1),
                                });
                              })
                              .catch((err) =>
                                Alert.alert(
                                  'Error',
                                  err instanceof Error ? err.message : 'Could not delete',
                                ),
                              );
                          },
                        });
                      } else if (!c.isMine) {
                        buttons.push({
                          text: 'Report',
                          onPress: () => {
                            Alert.alert(
                              'Report comment',
                              'Report this comment as inappropriate or spam?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Report',
                                  style: 'destructive',
                                  onPress: () => {
                                    setReportedCommentIds((prev) => {
                                      const next = new Set(prev);
                                      next.add(c.id);
                                      return next;
                                    });
                                    Alert.alert('Thanks', 'Your report was submitted.');
                                  },
                                },
                              ],
                            );
                          },
                        });
                      }
                      buttons.push({ text: 'Cancel', style: 'cancel' });
                      Alert.alert('Comment options', undefined, buttons);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            </View>
            );
          })}
          {commentFile ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: colors.surface,
              }}
            >
              <Ionicons name="attach" size={16} color={colors.blue} />
              <Text style={{ flex: 1, color: colors.heading, fontSize: 13 }} numberOfLines={1}>
                {commentFile.name}
              </Text>
              <Pressable onPress={() => setCommentFile(null)}>
                <Text style={{ color: colors.muted, fontSize: 12, ...fontStyle('semibold') }}>
                  Remove
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.commentRow, { alignItems: 'center' }]}>
            <Pressable onPress={pickCommentAttachment} hitSlop={8} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="attach" size={22} color={colors.blue} />
            </Pressable>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment…"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Pressable onPress={() => void submitComment()} disabled={busy}>
              <Text style={{ color: colors.blue, ...fontStyle('semibold') }}>Post</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

