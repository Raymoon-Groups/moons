import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AttachmentPickerModal } from '@/components/messages/attachment-picker-modal';
import type { MessageAttachment } from '@/lib/messages';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function MessageComposeField({
  value,
  onChange,
  attachment,
  onAttachmentChange,
  onSubmit,
  sending,
  editable = true,
  placeholder = 'Write a message…',
  inputId,
  onFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  attachment: MessageAttachment | null;
  onAttachmentChange: (file: MessageAttachment | null) => void;
  onSubmit: () => void;
  sending?: boolean;
  editable?: boolean;
  placeholder?: string;
  inputId?: string;
  onFocus?: () => void;
}) {
  const { colors } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const canSend = Boolean(value.trim() || attachment);

  function handleAttach() {
    if (!editable || sending) return;
    setPickerOpen(true);
  }

  return (
    <View style={styles.wrap}>
      {attachment ? (
        <View style={[styles.preview, { backgroundColor: `${colors.blue}12`, borderColor: `${colors.blue}33` }]}>
          <Ionicons name="attach" size={16} color={colors.blue} />
          <Text numberOfLines={1} style={[styles.previewName, { color: colors.heading }, fontStyle('medium')]}>
            {attachment.name}
          </Text>
          <Pressable onPress={() => onAttachmentChange(null)} hitSlop={8}>
            <Text style={[{ color: colors.muted, fontSize: 12 }, fontStyle('semibold')]}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          disabled={!editable || sending}
          onPress={handleAttach}
          style={[
            styles.attachBtn,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: editable && !sending ? 1 : 0.45,
            },
          ]}
          accessibilityLabel="Attach file"
        >
          <Ionicons name="attach" size={20} color={colors.muted} />
        </Pressable>

        <TextInput
          nativeID={inputId}
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          editable={editable && !sending}
          multiline
          textAlignVertical="center"
          style={[
            styles.input,
            { color: colors.heading, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />

        <Pressable
          disabled={!editable || sending || !canSend}
          onPress={onSubmit}
          style={[
            styles.sendBtn,
            {
              backgroundColor: colors.blue,
              opacity: editable && canSend && !sending ? 1 : 0.45,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>

      <AttachmentPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={onAttachmentChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewName: { flex: 1, fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
