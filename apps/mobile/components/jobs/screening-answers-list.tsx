import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ScreeningQuestionType,
  type ScreeningAnswer,
  type ScreeningQuestion,
} from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function isYesNoValue(value: string) {
  const v = value.trim().toLowerCase();
  return v === 'yes' || v === 'no' || v === 'true' || v === 'false';
}

function YesNoBadge({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase();
  const isYes = normalized === 'yes' || normalized === 'true';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: theme.radius.full,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: isYes ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: isYes ? '#15803d' : '#b91c1c',
          ...fontStyle('semibold'),
        }}
      >
        {isYes ? 'Yes' : 'No'}
      </Text>
    </View>
  );
}

type PreparedAnswer = {
  answer: ScreeningAnswer;
  question?: ScreeningQuestion;
  label: string;
  isResume: boolean;
  href: string | null;
};

export function ScreeningAnswersList({
  questions,
  answers,
  style,
}: {
  questions?: ScreeningQuestion[] | null;
  answers?: ScreeningAnswer[] | null;
  style?: object;
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: 12 },
        resumeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: theme.radius.lg,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        resumeIcon: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.md,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
        resumeLabel: {
          fontSize: 11,
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          ...fontStyle('semibold'),
        },
        resumeName: {
          marginTop: 2,
          fontSize: 14,
          color: colors.heading,
          ...fontStyle('semibold'),
        },
        openLink: { fontSize: 12, color: colors.blue, ...fontStyle('semibold') },
        panel: {
          overflow: 'hidden',
          borderRadius: theme.radius.lg,
          backgroundColor: colors.surface,
        },
        panelHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        panelHeaderIcon: {
          width: 28,
          height: 28,
          borderRadius: theme.radius.md,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
        panelTitle: { fontSize: 14, color: colors.heading, ...fontStyle('semibold') },
        panelSubtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
        answerRow: {
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        answerIndex: {
          marginTop: 2,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
        answerIndexText: { fontSize: 11, color: colors.muted, ...fontStyle('semibold') },
        questionText: { fontSize: 12, color: colors.muted, lineHeight: 18 },
        answerText: { marginTop: 6, fontSize: 14, color: colors.foreground, lineHeight: 21 },
        choiceChip: {
          alignSelf: 'flex-start',
          marginTop: 6,
          borderRadius: theme.radius.md,
          backgroundColor: colors.surfaceElevated,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        choiceChipText: { fontSize: 14, color: colors.heading, ...fontStyle('semibold') },
      }),
    [colors],
  );

  if (!answers?.length) return null;

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));

  const prepared: PreparedAnswer[] = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    const isResume =
      question?.type === ScreeningQuestionType.RESUME ||
      answer.value.startsWith('/uploads/resumes/');
    return {
      answer,
      question,
      label: question?.prompt ?? (isResume ? 'Resume' : 'Answer'),
      isResume,
      href: isResume ? resolveAssetUrl(answer.value) : null,
    };
  });

  const resumeItems = prepared.filter((item) => item.isResume);
  const questionItems = prepared.filter((item) => !item.isResume);

  return (
    <View style={[styles.wrap, style]}>
      {resumeItems.map(({ answer, href, label }) => (
        <Pressable
          key={answer.questionId}
          disabled={!href}
          onPress={() => {
            if (href) void Linking.openURL(href);
          }}
          style={styles.resumeRow}
        >
          <View style={styles.resumeIcon}>
            <Ionicons name="document-text-outline" size={20} color={colors.muted} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.resumeLabel}>{label}</Text>
            <Text numberOfLines={1} style={styles.resumeName}>
              {answer.fileName || 'View resume'}
            </Text>
          </View>
          {href ? <Text style={styles.openLink}>Open</Text> : null}
        </Pressable>
      ))}

      {questionItems.length > 0 ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.muted} />
            </View>
            <View>
              <Text style={styles.panelTitle}>Screening answers</Text>
              <Text style={styles.panelSubtitle}>
                {questionItems.length} response{questionItems.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          {questionItems.map(({ answer, question, label }, index) => {
            const type = question?.type;
            const showYesNo =
              type === ScreeningQuestionType.YES_NO ||
              (type !== ScreeningQuestionType.TEXT &&
                type !== ScreeningQuestionType.SINGLE_CHOICE &&
                isYesNoValue(answer.value));
            const showChoiceChip =
              type === ScreeningQuestionType.SINGLE_CHOICE ||
              (type === undefined &&
                answer.value.length < 40 &&
                !answer.value.includes('\n') &&
                !showYesNo);

            const isLast = index === questionItems.length - 1;

            return (
              <View
                key={answer.questionId}
                style={[styles.answerRow, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={styles.answerIndex}>
                  <Text style={styles.answerIndexText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.questionText}>{label}</Text>
                  {showYesNo ? (
                    <YesNoBadge value={answer.value} />
                  ) : showChoiceChip ? (
                    <View style={styles.choiceChip}>
                      <Text style={styles.choiceChipText}>{answer.value}</Text>
                    </View>
                  ) : (
                    <Text style={styles.answerText}>{answer.value}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function CoverNoteBlock({
  note,
  style,
}: {
  note: string;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: theme.radius.lg,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          ...fontStyle('semibold'),
        }}
      >
        Cover note
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: colors.foreground,
          lineHeight: 21,
        }}
      >
        {note}
      </Text>
    </View>
  );
}
