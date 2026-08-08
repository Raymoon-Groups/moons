import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  placeholder = 'Type here',
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
  const { colors, isDark } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const canSend = Boolean(value.trim() || attachment);
  const enabled = editable && !sending;

  const shellBg = isDark ? 'rgba(32, 42, 60, 0.95)' : '#eef2f7';
  const shellBorder = isDark ? 'rgba(90, 108, 140, 0.35)' : 'rgba(15,28,51,0.06)';
  const actionBg = isDark ? 'rgba(40, 52, 72, 0.98)' : colors.blue;

  function handleAttach() {
    if (!enabled) return;
    setPickerOpen(true);
  }

  return (
    <View style={styles.wrap}>
      {attachment ? (
        <View
          style={[
            styles.preview,
            {
              backgroundColor: isDark ? 'rgba(32, 42, 60, 0.95)' : `${colors.blue}10`,
              borderColor: isDark ? 'rgba(90, 108, 140, 0.35)' : `${colors.blue}28`,
            },
          ]}
        >
          <View style={[styles.previewIcon, { backgroundColor: `${colors.blue}22` }]}>
            <Ionicons name="document-attach" size={14} color={colors.blue} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.previewName, { color: colors.heading }, fontStyle('medium')]}
          >
            {attachment.name}
          </Text>
          <Pressable
            onPress={() => onAttachmentChange(null)}
            hitSlop={10}
            accessibilityLabel="Remove attachment"
          >
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <View
          style={[
            styles.inputShell,
            {
              borderColor: shellBorder,
              backgroundColor: shellBg,
              opacity: enabled ? 1 : 0.55,
            },
          ]}
        >
          <TextInput
            nativeID={inputId}
            value={value}
            onChangeText={onChange}
            onFocus={onFocus}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            editable={enabled}
            multiline
            textAlignVertical="center"
            style={[styles.input, { color: colors.heading }, fontStyle('regular')]}
          />
        </View>

        {canSend ? (
          <Pressable
            disabled={!enabled}
            onPress={onSubmit}
            style={[
              styles.actionBtn,
              {
                backgroundColor: enabled ? colors.blue : actionBg,
                opacity: enabled ? 1 : 0.55,
              },
            ]}
            accessibilityLabel="Send message"
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={17} color="#fff" style={styles.sendIcon} />
            )}
          </Pressable>
        ) : (
          <Pressable
            disabled={!enabled}
            onPress={handleAttach}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? actionBg : colors.blue,
                opacity: enabled ? 1 : 0.45,
              },
            ]}
            accessibilityLabel="Attach file"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        )}
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
    gap: 10,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { flex: 1, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputShell: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    justifyContent: 'center',
  },
  input: {
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15,
    lineHeight: 20,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginLeft: 2,
  },
});
