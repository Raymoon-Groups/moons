import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { FeedPost, PostCommentItem } from '@moons/shared';
import { ForwardPostModal } from '@/components/feed/forward-post-modal';
import { InlineFeedVideo } from '@/components/feed/inline-feed-video';
import { MediaViewer } from '@/components/feed/media-viewer';
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
  isVisible = true,
  onChange,
  onRemove,
}: {
  post: FeedPost;
  isVisible?: boolean;
  onChange: (next: FeedPost) => void;
  onRemove: (id: string) => void;
}) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  /** Card sits inside 16px list padding and 16px card padding. */
  const mediaWidth = width - 64;
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<PostCommentItem[]>(post.recentComments ?? []);
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<LocalMediaFile | null>(null);
  const [hiddenCommentIds, setHiddenCommentIds] = useState<Set<string>>(() => new Set());
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(() => new Set());
  const [showForward, setShowForward] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [sharedViewerIndex, setSharedViewerIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.body);
  const [editSaving, setEditSaving] = useState(false);
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
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 14,
          ...theme.shadow.soft,
        },
        row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
        avatar: {
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: `${colors.blue}18`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: 46, height: 46, borderRadius: 23 },
        name: { color: colors.heading, ...fontStyle('bold'), fontSize: 15 },
        meta: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
        body: { color: colors.heading, fontSize: 15, lineHeight: 23, marginTop: 12 },
        media: {
          width: '100%',
          aspectRatio: 4 / 3,
          borderRadius: theme.radius.md,
          marginTop: 12,
          backgroundColor: colors.surface,
        },
        counts: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
        countRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
        countText: { color: colors.muted, fontSize: 12 },
        actions: {
          flexDirection: 'row',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          marginTop: 12,
          paddingTop: 4,
        },
        actionBtn: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
          paddingVertical: 12,
        },
        actionText: { color: colors.heading, ...fontStyle('semibold'), fontSize: 13 },
        liked: { color: colors.blue },
        connect: {
          borderWidth: 1,
          borderColor: `${colors.blue}55`,
          backgroundColor: `${colors.blue}12`,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        connectText: { color: colors.blue, fontSize: 12, ...fontStyle('bold') },
        authorActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        sharedBox: {
          marginTop: 12,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          padding: 12,
          backgroundColor: colors.surface,
        },
        sharedAvatar: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: `${colors.blue}18`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        sharedAvatarImg: { width: 30, height: 30, borderRadius: 15 },
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

  async function toggleComments() {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    setCommentsLoading(true);
    try {
      const data = await fetchComments(post.id);
      setComments(data.items);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load comments');
    } finally {
      setCommentsLoading(false);
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
              }[] = [
                {
                  text: 'Edit',
                  onPress: () => {
                    setEditText(post.body);
                    setEditOpen(true);
                  },
                },
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
              ];
              Alert.alert('Post options', undefined, buttons);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.media.length > 0 ? (
        post.media.length === 1 ? (
          post.media[0].type === 'VIDEO' ? (
            resolveAssetUrl(post.media[0].url) ? (
              <InlineFeedVideo
                uri={resolveAssetUrl(post.media[0].url)!}
                playing={isVisible && viewerIndex === null}
                style={styles.media}
                onPress={() => setViewerIndex(0)}
              />
            ) : null
          ) : (
            <Pressable onPress={() => setViewerIndex(0)}>
              <Image
                source={{ uri: resolveAssetUrl(post.media[0].url) ?? undefined }}
                style={styles.media}
                resizeMode="contain"
              />
            </Pressable>
          )
        ) : (
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={post.media}
            keyExtractor={(item) => item.id}
            style={{ marginTop: 12 }}
            snapToInterval={mediaWidth + 8}
            decelerationRate="fast"
            renderItem={({ item, index }) => {
              const uri = resolveAssetUrl(item.url);
              return (
                <View style={{ width: mediaWidth, marginRight: 8 }}>
                  {item.type === 'VIDEO' && uri ? (
                    <InlineFeedVideo
                      uri={uri}
                      playing={isVisible && viewerIndex === null}
                      style={[styles.media, { marginTop: 0 }]}
                      onPress={() => setViewerIndex(index)}
                    />
                  ) : (
                    <Pressable onPress={() => setViewerIndex(index)}>
                      <Image
                        source={{ uri: uri ?? undefined }}
                        style={[styles.media, { marginTop: 0 }]}
                        resizeMode="contain"
                      />
                    </Pressable>
                  )}
                  <Text style={[styles.meta, { marginTop: 6, textAlign: 'center' }]}>
                    {index + 1} / {post.media.length}
                  </Text>
                </View>
              );
            }}
          />
        )
      ) : null}

      {original ? (
        <Pressable
          style={styles.sharedBox}
          onPress={() => router.push(`/network/${original.author.userId}` as never)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.sharedAvatar}>
              {resolveAssetUrl(original.author.avatarUrl) ? (
                <Image
                  source={{ uri: resolveAssetUrl(original.author.avatarUrl) ?? undefined }}
                  style={styles.sharedAvatarImg}
                />
              ) : (
                <Text style={{ color: colors.blue, fontSize: 12, ...fontStyle('bold') }}>
                  {(original.author.fullName?.[0] || '?').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { fontSize: 13 }]} numberOfLines={1}>
                {original.author.fullName || 'MoonsJob member'}
              </Text>
              <Text style={styles.meta}>Original post · {timeAgo(original.createdAt)}</Text>
            </View>
          </View>
          {original.body ? (
            <Text style={[styles.body, { fontSize: 14, marginTop: 8 }]} numberOfLines={6}>
              {original.body}
            </Text>
          ) : null}
          {original.media.length > 0 ? (
            original.media[0].type === 'VIDEO' && resolveAssetUrl(original.media[0].url) ? (
              <InlineFeedVideo
                uri={resolveAssetUrl(original.media[0].url)!}
                playing={isVisible && sharedViewerIndex === null}
                style={[styles.media, { aspectRatio: 16 / 9, marginTop: 10 }]}
                onPress={() => setSharedViewerIndex(0)}
              />
            ) : original.media[0].type !== 'VIDEO' ? (
              <Pressable onPress={() => setSharedViewerIndex(0)}>
                <Image
                  source={{ uri: resolveAssetUrl(original.media[0].url) ?? undefined }}
                  style={[styles.media, { aspectRatio: 16 / 9, marginTop: 10 }]}
                  resizeMode="contain"
                />
              </Pressable>
            ) : null
          ) : null}
        </Pressable>
      ) : null}

      {post.likeCount > 0 || post.commentCount > 0 ? (
        <View style={styles.counts}>
          {post.likeCount > 0 ? (
            <View style={styles.countRow}>
              <Ionicons name="heart" size={13} color={colors.blue} />
              <Text style={styles.countText}>
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </Text>
            </View>
          ) : null}
          {post.commentCount > 0 ? (
            <Pressable style={styles.countRow} onPress={() => void toggleComments()} hitSlop={6}>
              <Ionicons name="chatbubble" size={12} color={colors.muted} />
              <Text style={styles.countText}>
                {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ForwardPostModal
        visible={showForward}
        post={post}
        onClose={() => setShowForward(false)}
      />

      <MediaViewer
        visible={viewerIndex !== null}
        media={post.media}
        initialIndex={viewerIndex ?? 0}
        caption={post.body}
        authorName={post.author.fullName || 'MoonsJob member'}
        timeLabel={timeAgo(post.createdAt)}
        onClose={() => setViewerIndex(null)}
      />

      {original ? (
        <MediaViewer
          visible={sharedViewerIndex !== null}
          media={original.media}
          initialIndex={sharedViewerIndex ?? 0}
          caption={original.body}
          authorName={original.author.fullName || 'MoonsJob member'}
          timeLabel={timeAgo(original.createdAt)}
          onClose={() => setSharedViewerIndex(null)}
        />
      ) : null}

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.heading, ...fontStyle('bold'), fontSize: 16, marginBottom: 10 }}>
              Edit post
            </Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={{
                minHeight: 120,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                color: colors.heading,
                textAlignVertical: 'top',
                backgroundColor: colors.surface,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => setEditOpen(false)}
                style={{ paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <Text style={{ color: colors.muted, ...fontStyle('semibold') }}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={editSaving}
                onPress={() => {
                  setEditSaving(true);
                  void updatePost(post.id, editText)
                    .then((next) => {
                      onChange(next);
                      setEditOpen(false);
                    })
                    .catch((err) =>
                      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save'),
                    )
                    .finally(() => setEditSaving(false));
                }}
                style={{
                  backgroundColor: colors.blue,
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  opacity: editSaving ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#fff', ...fontStyle('semibold') }}>
                  {editSaving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} disabled={busy} onPress={() => void toggleLike()}>
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.likedByMe ? colors.blue : colors.heading}
          />
          <Text style={[styles.actionText, post.likedByMe && styles.liked]}>
            {post.likedByMe ? 'Liked' : 'Like'}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() => void toggleComments()}
          accessibilityRole="button"
          accessibilityState={{ expanded: showComments }}
        >
          <Ionicons
            name={showComments ? 'chatbubble' : 'chatbubble-outline'}
            size={17}
            color={showComments ? colors.blue : colors.heading}
          />
          <Text style={[styles.actionText, showComments && styles.liked]}>
            {showComments ? 'Hide' : 'Comment'}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => setShowForward(true)}>
          <Ionicons name="arrow-redo-outline" size={18} color={colors.heading} />
          <Text style={styles.actionText}>Forward</Text>
        </Pressable>
      </View>

      {showComments ? (
        <View>
          {commentsLoading && comments.length === 0 ? (
            <ActivityIndicator color={colors.blue} style={{ marginTop: 12 }} />
          ) : comments.length === 0 ? (
            <Text style={[styles.meta, { marginTop: 10 }]}>
              No comments yet — be the first to reply.
            </Text>
          ) : null}
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

