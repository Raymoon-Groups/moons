import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PostCommentItem } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import type { LocalMediaFile } from '@/lib/posts';
import { useTheme } from '@/lib/theme-context';

/**
 * Full comment thread in a bottom sheet. The sheet lifts by keyboard height
 * so the composer always stays above the keys.
 */
export function PostCommentsSheet({
  visible,
  authorName,
  comments,
  loading,
  busy,
  commentText,
  commentFile,
  onChangeText,
  onClose,
  onSubmit,
  onPickAttachment,
  onClearFile,
  onCommentMenu,
  onUnhideComment,
}: {
  visible: boolean;
  authorName: string;
  comments: PostCommentItem[];
  loading: boolean;
  busy: boolean;
  commentText: string;
  commentFile: LocalMediaFile | null;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onPickAttachment: () => void;
  onClearFile: () => void;
  onCommentMenu: (comment: PostCommentItem) => void;
  onUnhideComment?: (commentId: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardState((state) => state.height);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<PostCommentItem>>(null);
  const hairline = isDark ? colors.border : 'rgba(15, 28, 51, 0.08)';
  const canSubmit = Boolean(commentText.trim() || commentFile) && !busy;
  const bottomPad = keyboardHeight > 0 ? 10 : Math.max(insets.bottom, 10);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible || comments.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [comments.length, visible]);

  useEffect(() => {
    if (keyboardHeight <= 0) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [keyboardHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close comments" />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: hairline,
              // Android: lift by keyboard height (iOS uses KeyboardAvoidingView padding)
              marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: isDark ? colors.border : '#D0D8E4' }]} />

          <View style={[styles.header, { borderBottomColor: hairline }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
                Comments
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                on {authorName}'s post
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeBtn, { backgroundColor: isDark ? colors.surface : '#F0F3F7' }]}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={colors.heading} />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              comments.length === 0 && styles.listEmptyGrow,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.muted} />
                  <Text
                    style={[
                      { color: colors.muted, marginTop: 10, textAlign: 'center' },
                      fontStyle('medium'),
                    ]}
                  >
                    No comments yet — be the first to reply.
                  </Text>
                </View>
              )
            }
            renderItem={({ item: c }) => {
              const isHidden = Boolean(c.isHidden);
              return (
                <View
                  style={[
                    styles.commentRow,
                    {
                      backgroundColor: isDark ? colors.surface : '#F5F7FA',
                      opacity: isHidden ? 0.72 : 1,
                      borderColor: isHidden
                        ? isDark
                          ? `${colors.muted}55`
                          : `${colors.muted}40`
                        : 'transparent',
                      borderWidth: isHidden ? 1 : 0,
                    },
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          { color: colors.heading, fontSize: 14, flexShrink: 1 },
                          fontStyle('bold'),
                        ]}
                        numberOfLines={1}
                      >
                        {c.author.fullName || 'Member'}
                      </Text>
                      {isHidden ? (
                        <View
                          style={[
                            styles.hiddenBadge,
                            {
                              backgroundColor: isDark ? `${colors.muted}28` : 'rgba(106,123,146,0.14)',
                            },
                          ]}
                        >
                          <Ionicons name="eye-off-outline" size={11} color={colors.muted} />
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: 11,
                              ...fontStyle('semibold'),
                            }}
                          >
                            Hidden
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {c.body.trim() &&
                    !(
                      c.attachmentUrl &&
                      c.attachmentMimeType?.startsWith('image/') &&
                      c.body.trim().startsWith('📎')
                    ) ? (
                      <Text
                        style={{
                          color: isHidden ? colors.muted : colors.heading,
                          marginTop: 4,
                          fontSize: 14,
                          lineHeight: 20,
                        }}
                      >
                        {c.body}
                      </Text>
                    ) : null}
                    {isHidden ? (
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 17 }}>
                        Hidden from everyone else. Only you (the post owner) can see this.
                      </Text>
                    ) : null}
                    {c.attachmentUrl ? (
                      c.attachmentMimeType?.startsWith('image/') ? (
                        <Image
                          source={{ uri: resolveAssetUrl(c.attachmentUrl) ?? undefined }}
                          style={[
                            styles.attachImg,
                            { backgroundColor: colors.surface, opacity: isHidden ? 0.55 : 1 },
                          ]}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: colors.blue,
                            fontSize: 12,
                            marginTop: 6,
                            ...fontStyle('semibold'),
                          }}
                        >
                          📎 {c.attachmentFileName || 'Attachment'}
                        </Text>
                      )
                    ) : null}
                    {isHidden && onUnhideComment ? (
                      <Pressable
                        onPress={() => onUnhideComment(c.id)}
                        style={[
                          styles.unhideBtn,
                          {
                            borderColor: colors.blue,
                            backgroundColor: isDark ? `${colors.blue}18` : `${colors.blue}10`,
                          },
                        ]}
                      >
                        <Ionicons name="eye-outline" size={14} color={colors.blue} />
                        <Text style={{ color: colors.blue, fontSize: 12, ...fontStyle('bold') }}>
                          Unhide comment
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Pressable hitSlop={8} onPress={() => onCommentMenu(c)} style={{ padding: 4 }}>
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              );
            }}
          />

          <View
            style={[
              styles.compose,
              {
                borderTopColor: hairline,
                backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                paddingBottom: bottomPad,
              },
            ]}
          >
            {commentFile ? (
              <View
                style={[styles.fileChip, { backgroundColor: isDark ? colors.surface : '#F0F3F7' }]}
              >
                <Ionicons name="attach" size={16} color={colors.blue} />
                <Text style={{ flex: 1, color: colors.heading, fontSize: 13 }} numberOfLines={1}>
                  {commentFile.name}
                </Text>
                <Pressable onPress={onClearFile} hitSlop={8}>
                  <Text style={{ color: colors.muted, fontSize: 12, ...fontStyle('semibold') }}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composeRow}>
              <Pressable onPress={onPickAttachment} hitSlop={8} style={styles.iconBtn}>
                <Ionicons name="attach" size={22} color={colors.blue} />
              </Pressable>
              <TextInput
                ref={inputRef}
                value={commentText}
                onChangeText={onChangeText}
                placeholder="Write a comment…"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={2000}
                style={[
                  styles.input,
                  {
                    color: colors.heading,
                    borderColor: hairline,
                    backgroundColor: isDark ? colors.surface : '#F3F6FA',
                  },
                ]}
              />
              <Pressable
                onPress={onSubmit}
                disabled={!canSubmit}
                style={[
                  styles.sendBtn,
                  { backgroundColor: colors.blue, opacity: canSubmit ? 1 : 0.45 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 38, 0.45)',
  },
  sheet: {
    maxHeight: '78%',
    minHeight: 360,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 360,
    minHeight: 160,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  listEmptyGrow: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 160,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  hiddenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  unhideBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  attachImg: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 8,
  },
  compose: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
