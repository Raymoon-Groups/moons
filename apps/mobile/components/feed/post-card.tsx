import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { ConfirmModal } from '@/components/confirm-modal';
import { CommentOptionsSheet } from '@/components/feed/comment-options-sheet';
import { ForwardPostModal } from '@/components/feed/forward-post-modal';
import { InlineFeedVideo } from '@/components/feed/inline-feed-video';
import { MediaViewer } from '@/components/feed/media-viewer';
import { PostCommentsSheet } from '@/components/feed/post-comments-sheet';
import { PostOptionsSheet } from '@/components/feed/post-options-sheet';
import { SuccessModal } from '@/components/success-modal';
import { ViewableAvatar } from '@/components/profile/protected-avatar-viewer';
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
  hideComment,
  likePost,
  type LocalMediaFile,
  unhideComment,
  unlikePost,
  updatePost,
} from '@/lib/posts';
import { sharePostNative, sharePostWhatsApp } from '@/lib/post-share';
import { useTheme } from '@/lib/theme-context';

type SuccessState = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Remove post from feed after the user dismisses the success dialog. */
  removePost?: boolean;
};

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
  openCommentsOnMount = false,
  onChange,
  onRemove,
}: {
  post: FeedPost;
  isVisible?: boolean;
  /** When true (e.g. opened from a comment notification), open the comments sheet on mount. */
  openCommentsOnMount?: boolean;
  onChange: (next: FeedPost) => void;
  onRemove: (id: string) => void;
}) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const cardGutter = 16;
  const cardPad = 16;
  const mediaWidth = Math.max(0, width - cardGutter * 2 - cardPad * 2);
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<PostCommentItem[]>(post.recentComments ?? []);
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<LocalMediaFile | null>(null);
  const [commentsAutoOpened, setCommentsAutoOpened] = useState(false);
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(() => new Set());
  const [showForward, setShowForward] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [sharedViewerIndex, setSharedViewerIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.body);
  const [editSaving, setEditSaving] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [commentMenuTarget, setCommentMenuTarget] = useState<PostCommentItem | null>(null);
  const [confirm, setConfirm] = useState<
    | { type: 'delete-post' }
    | { type: 'delete-comment'; comment: PostCommentItem }
    | { type: 'report-comment'; comment: PostCommentItem }
    | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
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

  function openAuthorProfile(authorUserId: string) {
    if (user?.id && authorUserId === user.id) {
      router.push('/(tabs)/profile' as never);
      return;
    }
    router.push(`/network/${authorUserId}` as never);
  }
  const hairline = isDark ? colors.border : colors.borderSubtle;
  const mutedAction = colors.muted;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginHorizontal: cardGutter,
          marginBottom: 14,
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
        accent: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: colors.blue,
          opacity: 0.85,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingHorizontal: cardPad,
          paddingTop: 16,
          paddingBottom: 10,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: 48, height: 48, borderRadius: 16 },
        name: {
          color: colors.heading,
          ...fontStyle('bold'),
          fontSize: 15.5,
          letterSpacing: -0.2,
        },
        headline: {
          color: colors.muted,
          fontSize: 12.5,
          marginTop: 2,
          lineHeight: 17,
        },
        time: {
          color: colors.silver,
          fontSize: 11.5,
          marginTop: 3,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          marginTop: 3,
        },
        menuBtn: {
          width: 34,
          height: 34,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? colors.surface : colors.surface,
        },
        body: {
          color: colors.foreground,
          fontSize: 15,
          lineHeight: 22,
          paddingHorizontal: cardPad,
          paddingBottom: 12,
        },
        mediaWrap: {
          marginHorizontal: cardPad,
          marginBottom: 12,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: isDark ? colors.surface : colors.surfaceHover,
          borderWidth: 1,
          borderColor: hairline,
        },
        media: {
          width: mediaWidth,
          aspectRatio: 16 / 10,
          backgroundColor: isDark ? colors.surface : colors.surfaceHover,
        },
        mediaCarousel: { marginTop: 0 },
        mediaDotRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 5,
          paddingVertical: 10,
        },
        mediaDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
        },
        mediaDotActive: {
          backgroundColor: colors.blue,
          width: 16,
        },
        counts: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: cardPad,
          paddingBottom: 10,
        },
        countLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        countText: {
          color: mutedAction,
          fontSize: 12.5,
          ...fontStyle('medium'),
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: hairline,
          marginTop: 2,
          paddingVertical: 6,
          paddingHorizontal: 8,
          backgroundColor: isDark ? colors.surface : `${colors.blue}06`,
        },
        actionBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          borderRadius: 12,
        },
        actionBtnActive: {
          backgroundColor: isDark ? `${colors.blue}20` : `${colors.blue}12`,
        },
        actionText: {
          color: mutedAction,
          ...fontStyle('semibold'),
          fontSize: 13,
        },
        liked: { color: colors.blue },
        connect: {
          borderWidth: 1.5,
          borderColor: colors.blue,
          backgroundColor: isDark ? `${colors.blue}18` : `${colors.blue}10`,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        connectText: { color: colors.blue, fontSize: 12, ...fontStyle('bold') },
        authorActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        sharedBox: {
          marginHorizontal: cardPad,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: hairline,
          borderRadius: 14,
          padding: 12,
          backgroundColor: isDark ? colors.surface : colors.surface,
        },
        sharedAvatar: {
          width: 30,
          height: 30,
          borderRadius: 10,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        sharedAvatarImg: { width: 30, height: 30, borderRadius: 10 },
        commentsWrap: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: hairline,
          paddingHorizontal: 16,
          paddingBottom: 14,
          paddingTop: 4,
        },
        commentRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
        commentBox: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: hairline,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        input: {
          flex: 1,
          borderWidth: 1,
          borderColor: hairline,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 8,
          color: colors.heading,
          backgroundColor: colors.surface,
          fontSize: 14,
        },
        pad: { paddingHorizontal: cardPad },
      }),
    [cardGutter, cardPad, colors, hairline, isDark, mediaWidth, mutedAction],
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

  useEffect(() => {
    if (!openCommentsOnMount || commentsAutoOpened) return;
    setCommentsAutoOpened(true);
    setShowComments(true);
    setCommentsLoading(true);
    void fetchComments(post.id)
      .then((data) => setComments(data.items))
      .catch((err) =>
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not load comments'),
      )
      .finally(() => setCommentsLoading(false));
  }, [openCommentsOnMount, commentsAutoOpened, post.id]);

  function openCommentMenu(c: PostCommentItem) {
    setCommentMenuTarget(c);
  }

  const commentMenuOptions = useMemo(() => {
    if (!commentMenuTarget) return [];
    const c = commentMenuTarget;
    const isHidden = Boolean(c.isHidden);
    const options: {
      key: string;
      label: string;
      subtitle?: string;
      icon: keyof typeof Ionicons.glyphMap;
      destructive?: boolean;
      onPress: () => void;
    }[] = [];

    if (isMine) {
      options.push({
        key: 'hide',
        label: isHidden ? 'Unhide comment' : 'Hide comment',
        subtitle: isHidden
          ? 'Make this comment visible to everyone again'
          : 'Hide for everyone until you unhide it',
        icon: isHidden ? 'eye-outline' : 'eye-off-outline',
        onPress: () => {
          void (async () => {
            try {
              const next = isHidden
                ? await unhideComment(post.id, c.id)
                : await hideComment(post.id, c.id);
              setComments((prev) => prev.map((x) => (x.id === next.id ? next : x)));
              onChange({
                ...post,
                commentCount: Math.max(
                  0,
                  post.commentCount + (isHidden ? 1 : -1),
                ),
              });
              if (!isHidden) {
                setSuccess({
                  title: 'Comment hidden',
                  message: 'This comment is no longer visible to anyone except you.',
                  icon: 'eye-off-outline',
                });
              } else {
                setSuccess({
                  title: 'Comment unhidden',
                  message: 'This comment is visible to everyone again.',
                  icon: 'eye-outline',
                });
              }
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Could not update comment',
              );
            }
          })();
        },
      });
      options.push({
        key: 'delete',
        label: 'Delete comment',
        subtitle: 'Permanently remove this comment',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => setConfirm({ type: 'delete-comment', comment: c }),
      });
    } else if (c.isMine) {
      options.push({
        key: 'delete',
        label: 'Delete comment',
        subtitle: 'Permanently remove your comment',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => setConfirm({ type: 'delete-comment', comment: c }),
      });
    } else {
      options.push({
        key: 'report',
        label: 'Report comment',
        subtitle: 'Flag spam or inappropriate content',
        icon: 'flag-outline',
        destructive: true,
        onPress: () => setConfirm({ type: 'report-comment', comment: c }),
      });
    }
    return options;
  }, [commentMenuTarget, isMine, onChange, post]);

  async function handleConfirm() {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'delete-post') {
        await deletePost(post.id);
        setConfirm(null);
        setSuccess({
          title: 'Post deleted',
          message: 'Your post was deleted successfully.',
          icon: 'checkmark-circle-outline',
          removePost: true,
        });
      } else if (confirm.type === 'delete-comment') {
        const commentId = confirm.comment.id;
        const wasHidden = Boolean(confirm.comment.isHidden);
        await deleteComment(post.id, commentId);
        setComments((prev) => prev.filter((x) => x.id !== commentId));
        // Hidden comments already excluded from commentCount.
        onChange({
          ...post,
          commentCount: wasHidden
            ? post.commentCount
            : Math.max(0, post.commentCount - 1),
        });
        setConfirm(null);
        setSuccess({
          title: 'Comment deleted',
          message: 'The comment was removed successfully.',
          icon: 'checkmark-circle-outline',
        });
      } else if (confirm.type === 'report-comment') {
        const commentId = confirm.comment.id;
        setReportedCommentIds((prev) => {
          const next = new Set(prev);
          next.add(commentId);
          return next;
        });
        setConfirm(null);
        setSuccess({
          title: 'Report submitted',
          message: 'Thanks. We will review this comment shortly.',
          icon: 'shield-checkmark-outline',
        });
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConfirmLoading(false);
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
  const [carouselIndex, setCarouselIndex] = useState(0);

  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.header}>
        <ViewableAvatar uri={avatar} name={post.author.fullName}>
          <View style={styles.avatar}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={{ color: colors.blue, ...fontStyle('bold'), fontSize: 17 }}>
                {(post.author.fullName?.[0] || '?').toUpperCase()}
              </Text>
            )}
          </View>
        </ViewableAvatar>
        <Pressable
          onPress={() => openAuthorProfile(post.author.userId)}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Text style={styles.name} numberOfLines={1}>
            {post.author.fullName || 'MoonsJob member'}
          </Text>
          {post.author.headline ? (
            <Text style={styles.headline} numberOfLines={1}>
              {post.author.headline}
            </Text>
          ) : null}
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </Pressable>
        {showAuthorActions ? (
          <View style={styles.authorActions}>
            {canConnect ? (
              <Pressable
                style={styles.connect}
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    await sendConnectionRequest(post.author.userId, undefined, {
                      fullName: post.author.fullName,
                    });
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
              <View style={[styles.connect, { borderColor: colors.border }]}>
                <Text style={[styles.connectText, { color: colors.muted }]}>
                  {post.connectionDirection === 'received' ? 'Respond' : 'Pending'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Pressable
          style={styles.menuBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Post options"
          onPress={() => setShowOptions(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </Pressable>
      </View>

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.media.length > 0 ? (
        post.media.length === 1 ? (
          <View style={styles.mediaWrap}>
            {post.media[0].type === 'VIDEO' ? (
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
                  resizeMode="cover"
                />
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.mediaWrap}>
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={post.media}
              keyExtractor={(item) => item.id}
              style={styles.mediaCarousel}
              snapToInterval={mediaWidth}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const next = Math.round(e.nativeEvent.contentOffset.x / mediaWidth);
                setCarouselIndex(next);
              }}
              renderItem={({ item, index }) => {
                const uri = resolveAssetUrl(item.url);
                return (
                  <View style={{ width: mediaWidth }}>
                    {item.type === 'VIDEO' && uri ? (
                      <InlineFeedVideo
                        uri={uri}
                        playing={isVisible && viewerIndex === null && carouselIndex === index}
                        style={styles.media}
                        onPress={() => setViewerIndex(index)}
                      />
                    ) : (
                      <Pressable onPress={() => setViewerIndex(index)}>
                        <Image
                          source={{ uri: uri ?? undefined }}
                          style={styles.media}
                          resizeMode="cover"
                        />
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />
            <View style={styles.mediaDotRow}>
              {post.media.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.mediaDot, index === carouselIndex && styles.mediaDotActive]}
                />
              ))}
            </View>
          </View>
        )
      ) : null}

      {original ? (
        <Pressable
          style={styles.sharedBox}
          onPress={() => openAuthorProfile(original.author.userId)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.sharedAvatar}>
              {resolveAssetUrl(original.author.avatarUrl) ? (
                <Image
                  source={{ uri: resolveAssetUrl(original.author.avatarUrl) ?? undefined }}
                  style={styles.sharedAvatarImg}
                />
              ) : (
                <Text style={{ color: colors.blue, fontSize: 11, ...fontStyle('bold') }}>
                  {(original.author.fullName?.[0] || '?').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { fontSize: 13 }]} numberOfLines={1}>
                {original.author.fullName || 'MoonsJob member'}
              </Text>
              <Text style={styles.time}>Original · {timeAgo(original.createdAt)}</Text>
            </View>
          </View>
          {original.body ? (
            <Text
              style={[styles.body, { fontSize: 14, marginTop: 8, paddingHorizontal: 0, paddingBottom: 0 }]}
              numberOfLines={5}
            >
              {original.body}
            </Text>
          ) : null}
          {original.media.length > 0 ? (
            original.media[0].type === 'VIDEO' && resolveAssetUrl(original.media[0].url) ? (
              <InlineFeedVideo
                uri={resolveAssetUrl(original.media[0].url)!}
                playing={isVisible && sharedViewerIndex === null}
                style={[styles.media, { width: '100%', aspectRatio: 16 / 9, marginTop: 10, borderRadius: 10 }]}
                onPress={() => setSharedViewerIndex(0)}
              />
            ) : original.media[0].type !== 'VIDEO' ? (
              <Pressable onPress={() => setSharedViewerIndex(0)}>
                <Image
                  source={{ uri: resolveAssetUrl(original.media[0].url) ?? undefined }}
                  style={[styles.media, { width: '100%', aspectRatio: 16 / 9, marginTop: 10, borderRadius: 10 }]}
                  resizeMode="cover"
                />
              </Pressable>
            ) : null
          ) : null}
        </Pressable>
      ) : null}

      {post.likeCount > 0 || post.commentCount > 0 ? (
        <View style={styles.counts}>
          <View style={styles.countLeft}>
            {post.likeCount > 0 ? (
              <Text style={styles.countText}>
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </Text>
            ) : (
              <View />
            )}
          </View>
          {post.commentCount > 0 ? (
            <Pressable onPress={() => void toggleComments()} hitSlop={6}>
              <Text style={styles.countText}>
                {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <PostOptionsSheet
        visible={showOptions}
        isMine={isMine}
        onClose={() => setShowOptions(false)}
        onShare={() => {
          void sharePostNative(post).catch(() =>
            Alert.alert('Could not share', 'Try again in a moment.'),
          );
        }}
        onWhatsApp={() => {
          void sharePostWhatsApp(post).catch(() =>
            Alert.alert('WhatsApp', 'Could not open WhatsApp. Is it installed?'),
          );
        }}
        onSendToConnection={() => setShowForward(true)}
        onEdit={
          isMine
            ? () => {
                setEditText(post.body);
                setEditOpen(true);
              }
            : undefined
        }
        onDelete={isMine ? () => setConfirm({ type: 'delete-post' }) : undefined}
      />

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
                      setSuccess({
                        title: 'Post updated',
                        message: 'Your changes were saved successfully.',
                        icon: 'checkmark-circle-outline',
                      });
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
        <Pressable
          style={[styles.actionBtn, post.likedByMe && styles.actionBtnActive]}
          disabled={busy}
          onPress={() => void toggleLike()}
        >
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.likedByMe ? colors.blue : mutedAction}
          />
          <Text style={[styles.actionText, post.likedByMe && styles.liked]}>
            {post.likedByMe ? 'Liked' : 'Like'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, showComments && styles.actionBtnActive]}
          onPress={() => void toggleComments()}
          accessibilityRole="button"
          accessibilityState={{ expanded: showComments }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color={showComments ? colors.blue : mutedAction}
          />
          <Text style={[styles.actionText, showComments && styles.liked]}>Comment</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => setShowOptions(true)}>
          <Ionicons name="share-social-outline" size={18} color={mutedAction} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>

      {showComments ? (
        <PostCommentsSheet
          visible={showComments}
          authorName={post.author.fullName || 'MoonsJob member'}
          comments={comments.filter((c) => !reportedCommentIds.has(c.id))}
          loading={commentsLoading}
          busy={busy}
          commentText={commentText}
          commentFile={commentFile}
          onChangeText={setCommentText}
          onClose={() => {
            setShowComments(false);
            setCommentText('');
            setCommentFile(null);
          }}
          onSubmit={() => void submitComment()}
          onPickAttachment={pickCommentAttachment}
          onClearFile={() => setCommentFile(null)}
          onCommentMenu={openCommentMenu}
          onUnhideComment={
            isMine
              ? (commentId) => {
                  void (async () => {
                    try {
                      const next = await unhideComment(post.id, commentId);
                      setComments((prev) => prev.map((x) => (x.id === next.id ? next : x)));
                      onChange({ ...post, commentCount: post.commentCount + 1 });
                      setSuccess({
                        title: 'Comment unhidden',
                        message: 'This comment is visible to everyone again.',
                        icon: 'eye-outline',
                      });
                    } catch (err) {
                      Alert.alert(
                        'Error',
                        err instanceof Error ? err.message : 'Could not unhide comment',
                      );
                    }
                  })();
                }
              : undefined
          }
        />
      ) : null}

      {/* Stacked above comment sheet so confirm / success always sit on top */}
      <CommentOptionsSheet
        visible={!!commentMenuTarget && commentMenuOptions.length > 0}
        options={commentMenuOptions}
        onClose={() => setCommentMenuTarget(null)}
      />

      <ConfirmModal
        visible={!!confirm}
        loading={confirmLoading}
        onCancel={() => {
          if (confirmLoading) return;
          setConfirm(null);
        }}
        onConfirm={() => void handleConfirm()}
        title={
          confirm?.type === 'delete-post'
            ? 'Delete this post?'
            : confirm?.type === 'delete-comment'
              ? 'Delete this comment?'
              : confirm?.type === 'report-comment'
                ? 'Report this comment?'
                : 'Confirm'
        }
        message={
          confirm?.type === 'delete-post'
            ? 'This will permanently remove your post and its comments. This action cannot be undone.'
            : confirm?.type === 'delete-comment'
              ? 'This comment will be permanently removed. This action cannot be undone.'
              : confirm?.type === 'report-comment'
                ? 'We will review this comment for spam or inappropriate content. You can continue browsing while we look into it.'
                : ''
        }
        confirmLabel={
          confirm?.type === 'report-comment'
            ? 'Submit report'
            : confirm?.type === 'delete-post'
              ? 'Delete post'
              : 'Delete comment'
        }
        cancelLabel="Keep"
        destructive={confirm?.type !== 'report-comment'}
        icon={
          confirm?.type === 'report-comment'
            ? 'flag-outline'
            : confirm?.type === 'delete-post'
              ? 'document-text-outline'
              : 'chatbubble-ellipses-outline'
        }
      />

      <SuccessModal
        visible={!!success}
        onClose={() => {
          const shouldRemove = success?.removePost;
          setSuccess(null);
          if (shouldRemove) onRemove(post.id);
        }}
        title={success?.title ?? 'Success'}
        message={success?.message ?? ''}
        primaryLabel="Got it"
        variant="success"
        icon={success?.icon ?? 'checkmark'}
      />
    </View>
  );
}

