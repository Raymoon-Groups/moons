import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';
import { FieldLabel } from '@/components/ui';
import { fontStyle } from '@/lib/font-style';
import { draftToHtml, getDescriptionPlainText, htmlToDraft } from '@/lib/rich-text';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type Selection = { start: number; end: number };

function wrapSelection(
  value: string,
  selection: Selection,
  before: string,
  after: string,
  placeholder = 'text',
) {
  const { start, end } = selection;
  const selected = value.slice(start, end) || placeholder;
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  const cursor = start + before.length + selected.length + after.length;
  return { next, selection: { start: cursor, end: cursor } };
}

function prefixLine(value: string, selection: Selection, prefix: string) {
  const { start } = selection;
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
  const cursor = start + prefix.length;
  return { next, selection: { start: cursor, end: cursor } };
}

/**
 * Job description editor with formatting toolbar.
 * Stores HTML (TipTap-compatible) while editing a markdown-lite draft.
 */
export function RichTextField({
  label = 'Description',
  value,
  onChange,
  placeholder = 'Describe the role, responsibilities, and requirements…',
  minLength = 20,
}: {
  label?: string;
  /** HTML description stored for the API */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minLength?: number;
}) {
  const { colors, isDark } = useTheme();
  const [draft, setDraft] = useState(() => htmlToDraft(value));
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });

  useEffect(() => {
    const incoming = htmlToDraft(value);
    // Only sync from parent when external value diverges (e.g. job loaded).
    if (draftToHtml(draft) !== value && incoming !== draft) {
      setDraft(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional external sync
  }, [value]);

  const plainLen = getDescriptionPlainText(value).length;
  const tooShort = plainLen > 0 && plainLen < minLength;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        toolbar: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 8,
          padding: 8,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surface : colors.surfaceHover,
        },
        toolBtn: {
          minWidth: 36,
          height: 34,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
        },
        toolLabel: {
          fontSize: 13,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        input: {
          minHeight: 160,
          textAlignVertical: 'top',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          lineHeight: 22,
          color: colors.foreground,
          marginBottom: 6,
          ...fontStyle('regular'),
        },
        hint: {
          fontSize: 12,
          color: colors.muted,
          marginBottom: 10,
          ...fontStyle('medium'),
        },
        warn: {
          fontSize: 12,
          color: '#D24D6B',
          marginBottom: 10,
          ...fontStyle('medium'),
        },
      }),
    [colors, isDark],
  );

  function commit(nextDraft: string, nextSelection?: Selection) {
    setDraft(nextDraft);
    if (nextSelection) setSelection(nextSelection);
    onChange(draftToHtml(nextDraft));
  }

  function onSelect(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    setSelection(e.nativeEvent.selection);
  }

  const tools: {
    key: string;
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }[] = [
    {
      key: 'bold',
      label: 'B',
      onPress: () => {
        const result = wrapSelection(draft, selection, '**', '**', 'bold');
        commit(result.next, result.selection);
      },
    },
    {
      key: 'italic',
      label: 'I',
      onPress: () => {
        const result = wrapSelection(draft, selection, '*', '*', 'italic');
        commit(result.next, result.selection);
      },
    },
    {
      key: 'h',
      label: 'H',
      onPress: () => {
        const result = prefixLine(draft, selection, '# ');
        commit(result.next, result.selection);
      },
    },
    {
      key: 'ul',
      icon: 'list-outline',
      onPress: () => {
        const result = prefixLine(draft, selection, '• ');
        commit(result.next, result.selection);
      },
    },
    {
      key: 'ol',
      label: '1.',
      onPress: () => {
        const result = prefixLine(draft, selection, '1. ');
        commit(result.next, result.selection);
      },
    },
    {
      key: 'quote',
      icon: 'chatbox-ellipses-outline',
      onPress: () => {
        const result = prefixLine(draft, selection, '> ');
        commit(result.next, result.selection);
      },
    },
  ];

  return (
    <View>
      <FieldLabel>{label} (min {minLength} chars)</FieldLabel>
      <View style={styles.toolbar}>
        {tools.map((tool) => (
          <Pressable
            key={tool.key}
            onPress={tool.onPress}
            style={({ pressed }) => [styles.toolBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={tool.key}
          >
            {tool.icon ? (
              <Ionicons name={tool.icon} size={16} color={colors.heading} />
            ) : (
              <Text
                style={[
                  styles.toolLabel,
                  tool.key === 'italic' && { fontStyle: 'italic' },
                ]}
              >
                {tool.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
      <TextInput
        value={draft}
        onChangeText={(text) => commit(text)}
        onSelectionChange={onSelect}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline
        style={styles.input}
        textAlignVertical="top"
      />
      {tooShort ? (
        <Text style={styles.warn}>
          Add at least {minLength - plainLen} more character{minLength - plainLen === 1 ? '' : 's'}.
        </Text>
      ) : (
        <Text style={styles.hint}>
          Use the toolbar for bold, headings, and lists. {plainLen} characters.
        </Text>
      )}
    </View>
  );
}
