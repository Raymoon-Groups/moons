import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ScreeningQuestionType,
  UserRole,
  type ScreeningAnswer,
  type ScreeningQuestion,
} from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { CompanyAvatar } from '@/components/company-avatar';
import { EmptyState } from '@/components/portal-ui';
import { SuccessModal } from '@/components/success-modal';
import { PrimaryButton, FieldLabel, Input, SecondaryButton } from '@/components/ui';
import { apiFetch, authFetch, authUpload } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import {
  formatEmploymentType,
  formatExperienceLevel,
  formatPostedAgo,
  formatPostedLabel,
} from '@/lib/format';
import { stripHtml } from '@/lib/html-text';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing, Profile } from '@/lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_PILL_TAB_BAR_HEIGHT } from '@/components/bottom-pill-tab-bar';

type Step = 'questions' | 'preview';

function formatExperienceYears(
  min?: number | null,
  max?: number | null,
): string | null {
  if (min == null && max == null) return null;
  if (min === 0 && (max == null || max === 0)) return 'Fresher';
  if (min != null && max != null && min !== max) return `${min}–${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  return `Up to ${max} yrs`;
}

/** Split a job post into description + responsibilities when headings exist. */
function splitJobSpec(raw: string | null | undefined): {
  description: string;
  responsibilities: string | null;
} {
  const text = stripHtml(raw);
  if (!text) return { description: '', responsibilities: null };

  const heading =
    /\n?\s*((key\s+)?responsibilities|what you.?ll do|your responsibilities|role responsibilities|duties\s*&?\s*responsibilities)\s*:?\s*\n+/i;
  const match = text.match(heading);
  if (match?.index != null && match.index > 20) {
    const description = text.slice(0, match.index).trim();
    const responsibilities = text.slice(match.index + match[0].length).trim();
    if (description && responsibilities) {
      return { description, responsibilities };
    }
  }

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2) {
    return {
      description: paragraphs.slice(0, -1).join('\n\n'),
      responsibilities: paragraphs[paragraphs.length - 1],
    };
  }

  return { description: text, responsibilities: null };
}

function bulletLines(text: string): string[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-\*\u2022]+/, '').trim())
    .filter(Boolean);
  if (lines.length >= 2) return lines;
  return text
    .split(/(?<=[.!?])\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 18);
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabScreenPadding(24);
  // Sticky apply sits above the floating tab pill.
  const applyBarPad = BOTTOM_PILL_TAB_BAR_HEIGHT + Math.max(insets.bottom, 10);
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [step, setStep] = useState<Step>('questions');
  const [coverNote, setCoverNote] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resumeMeta, setResumeMeta] = useState<{ url: string; fileName: string | null } | null>(
    null,
  );
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [showApplySuccess, setShowApplySuccess] = useState(false);

  const questions = useMemo(
    () => [...(job?.screeningQuestions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [job?.screeningQuestions],
  );

  const spec = useMemo(() => splitJobSpec(job?.description), [job?.description]);
  const logoUrl = resolveAssetUrl(job?.companyLogoUrl);

  const cardBg = isDark ? colors.surfaceElevated : '#E6F0EC';
  const softBlue = isDark ? colors.surfaceElevated : '#E8EEF6';
  const whiteCard = isDark ? colors.surfaceElevated : '#ffffff';
  const tagBg = isDark ? colors.surface : '#ffffff';
  const tagText = isDark ? colors.foreground : '#4a5568';
  const statBg = isDark ? colors.surface : '#ffffff';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        page: { flex: 1 },
        container: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: bottomPadding + applyBarPad + 24,
        },
        loadingText: { marginTop: 12, color: colors.muted, ...fontStyle('medium') },
        hero: {
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 18,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          marginBottom: theme.spacing.md,
        },
        heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
        heroMain: { flex: 1, minWidth: 0 },
        title: {
          fontSize: 20,
          lineHeight: 26,
          color: colors.heading,
          ...fontStyle('extrabold'),
        },
        companyPress: {
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
        },
        company: {
          fontSize: 14,
          color: colors.blue,
          ...fontStyle('semibold'),
        },
        locationRow: {
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        location: {
          flex: 1,
          fontSize: 13,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        tags: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 14,
        },
        tag: {
          backgroundColor: tagBg,
          borderRadius: theme.radius.full,
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        tagText: {
          fontSize: 12,
          color: tagText,
          ...fontStyle('semibold'),
        },
        statsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 16,
        },
        statCard: {
          flexGrow: 1,
          flexBasis: '30%',
          minWidth: '28%',
          borderRadius: 14,
          backgroundColor: statBg,
          paddingVertical: 12,
          paddingHorizontal: 10,
          gap: 4,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
        },
        statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        statLabel: {
          fontSize: 10,
          color: colors.muted,
          ...fontStyle('semibold'),
        },
        statValue: {
          fontSize: 13,
          color: colors.heading,
          lineHeight: 17,
          ...fontStyle('bold'),
        },
        salaryBand: {
          marginTop: 14,
          borderRadius: 16,
          backgroundColor: isDark ? `${colors.blue}18` : 'rgba(255,255,255,0.72)',
          paddingVertical: 12,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        },
        salaryLabel: {
          fontSize: 12,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        salaryValue: {
          flex: 1,
          textAlign: 'right',
          fontSize: 16,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        sectionCard: {
          backgroundColor: whiteCard,
          borderRadius: 22,
          padding: 18,
          marginBottom: theme.spacing.md,
          borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
        },
        sectionLabel: {
          fontSize: 12,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.muted,
          marginBottom: 10,
          ...fontStyle('bold'),
        },
        sectionTitle: {
          fontSize: 18,
          color: colors.heading,
          marginBottom: 12,
          ...fontStyle('extrabold'),
        },
        bodyText: {
          fontSize: 15,
          lineHeight: 24,
          color: isDark ? colors.foreground : '#3d4a5c',
          ...fontStyle('regular'),
        },
        bodyGap: { marginTop: 12 },
        bulletRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 10,
        },
        bulletDot: {
          width: 7,
          height: 7,
          borderRadius: 4,
          marginTop: 8,
          backgroundColor: colors.blue,
        },
        bulletText: {
          flex: 1,
          fontSize: 15,
          lineHeight: 23,
          color: isDark ? colors.foreground : '#3d4a5c',
          ...fontStyle('regular'),
        },
        highlightCard: {
          backgroundColor: softBlue,
          borderRadius: 22,
          padding: 16,
          marginBottom: theme.spacing.md,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        highlightTitle: {
          fontSize: 15,
          color: colors.heading,
          marginBottom: 12,
          ...fontStyle('bold'),
        },
        highlightRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        },
        highlightIcon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? colors.surface : '#ffffff',
        },
        highlightText: {
          flex: 1,
          fontSize: 14,
          color: colors.heading,
          ...fontStyle('semibold'),
        },
        applyBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: theme.spacing.md,
          paddingTop: 12,
          paddingBottom: applyBarPad,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
          ...theme.shadow.soft,
        },
        appliedBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: theme.radius.full,
          paddingVertical: 14,
          backgroundColor: isDark ? 'rgba(22,163,74,0.16)' : '#dcfce7',
        },
        appliedText: {
          color: isDark ? colors.success : '#15803d',
          fontSize: 15,
          ...fontStyle('bold'),
        },
        applyHint: {
          textAlign: 'center',
          fontSize: 13,
          color: colors.muted,
          marginBottom: 10,
          ...fontStyle('medium'),
        },
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        },
        sheet: {
          maxHeight: '92%',
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingBottom: 24,
        },
        sheetHeader: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        sheetTitle: { fontSize: 18, ...fontStyle('bold'), color: colors.heading },
        sheetSub: { marginTop: 4, fontSize: 13, color: colors.muted },
        steps: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
        stepPill: {
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        stepText: { fontSize: 11, ...fontStyle('bold') },
        sheetBody: { paddingHorizontal: theme.spacing.md, paddingTop: 14 },
        questionBlock: {
          marginBottom: 14,
          padding: 12,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        questionPrompt: {
          fontSize: 14,
          ...fontStyle('semibold'),
          color: colors.heading,
          marginBottom: 8,
        },
        coverInput: { minHeight: 88, textAlignVertical: 'top' },
        choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        choiceChip: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: colors.surfaceElevated,
        },
        choiceChipActive: { borderColor: colors.blue, backgroundColor: colors.blue },
        choiceText: { fontSize: 13, color: colors.heading, ...fontStyle('semibold') },
        choiceTextActive: { color: '#fff' },
        resumeReady: { fontSize: 12, color: '#15803d', marginBottom: 8 },
        previewCard: {
          marginBottom: 12,
          padding: 12,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        previewLabel: {
          fontSize: 10,
          ...fontStyle('bold'),
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        previewValue: { marginTop: 4, fontSize: 14, color: colors.foreground, lineHeight: 20 },
        sheetFooter: {
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: theme.spacing.md,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        footerBtn: { flex: 1 },
      }),
    [
      applyBarPad,
      bottomPadding,
      cardBg,
      colors,
      isDark,
      softBlue,
      statBg,
      tagBg,
      tagText,
      whiteCard,
    ],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: job?.title?.trim() || 'Job details',
      headerStyle: {
        backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
      },
    });
  }, [navigation, job?.title, colors.surfaceElevated, isDark]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<JobListing>(`/jobs/${id}`);
        setJob(data);
        if (user?.role === UserRole.CANDIDATE) {
          try {
            const check = await authFetch<{ applied: boolean }>(`/applications/check?jobId=${id}`);
            setApplied(check.applied);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.role]);

  async function openApply() {
    setStep('questions');
    setCoverNote('');
    setAnswers({});
    setResumeMeta(null);
    setApplyOpen(true);
    try {
      const me = await authFetch<Profile>('/profiles/me');
      setProfile(me);
      if (me.resumeUrl) {
        setResumeMeta({ url: me.resumeUrl, fileName: me.resumeFileName });
        const resumeAnswers: Record<string, string> = {};
        for (const q of job?.screeningQuestions ?? []) {
          if (q.type === ScreeningQuestionType.RESUME) {
            resumeAnswers[q.id] = me.resumeUrl;
          }
        }
        setAnswers(resumeAnswers);
      }
    } catch {
      // optional
    }
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function pickResume(question: ScreeningQuestion) {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/pdf',
      } as unknown as Blob);
      const saved = await authUpload<Profile>('/profiles/me/resume', formData);
      if (saved.resumeUrl) {
        setResumeMeta({ url: saved.resumeUrl, fileName: saved.resumeFileName });
        setAnswer(question.id, saved.resumeUrl);
        setProfile(saved);
      }
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setUploadingResume(false);
    }
  }

  function goToPreview() {
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        Alert.alert('Missing answer', `Please answer: ${q.prompt}`);
        return;
      }
    }
    setStep('preview');
  }

  async function handleSubmit() {
    if (!id || !job) return;
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        Alert.alert('Missing answer', `Please answer: ${q.prompt}`);
        setStep('questions');
        return;
      }
    }

    setSubmitting(true);
    try {
      const screeningAnswers: ScreeningAnswer[] = [];
      for (const q of questions) {
        const value = answers[q.id]?.trim() ?? '';
        if (!value) continue;
        screeningAnswers.push({
          questionId: q.id,
          value,
          fileName:
            q.type === ScreeningQuestionType.RESUME ? resumeMeta?.fileName ?? null : undefined,
        });
      }

      await authFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: id,
          coverNote: coverNote.trim() || undefined,
          screeningAnswers,
        }),
      });
      setApplied(true);
      setApplyOpen(false);
      setShowApplySuccess(true);
    } catch (err) {
      Alert.alert('Could not apply', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Loading job details…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!job) {
    return (
      <AppScreen>
        <View style={{ flex: 1, padding: theme.spacing.md, justifyContent: 'center' }}>
          <EmptyState
            icon="briefcase-outline"
            title="Job not found"
            message={error || 'This role may have been closed or removed.'}
          />
        </View>
      </AppScreen>
    );
  }

  const canApply = user?.role === UserRole.CANDIDATE;
  const questionCount = questions.length;
  const descriptionParagraphs = spec.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const experienceLabel = formatExperienceYears(job.minExperienceYears, job.maxExperienceYears);
  const experienceLevel = formatExperienceLevel(job.minExperienceYears, job.maxExperienceYears);
  const typeLabel = formatEmploymentType(job.employmentType);

  const tags = Array.from(
    new Set(
      [
        typeLabel,
        experienceLevel,
        experienceLabel,
        job.location?.split(',')[0]?.trim(),
        formatPostedAgo(job.createdAt),
      ].filter((t): t is string => Boolean(t?.trim())),
    ),
  );

  const salaryDisplay = job.salaryRange?.trim() || 'Salary not listed';
  const responsibilityItems = spec.responsibilities ? bulletLines(spec.responsibilities) : [];

  const highlights: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [];
  if (typeLabel) highlights.push({ icon: 'briefcase-outline', text: typeLabel });
  if (job.location?.trim()) {
    highlights.push({ icon: 'location-outline', text: job.location.trim() });
  }
  if (experienceLabel) highlights.push({ icon: 'school-outline', text: experienceLabel });
  if (job.createdAt) {
    highlights.push({ icon: 'time-outline', text: formatPostedLabel(job.createdAt) });
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        style={[styles.page, { backgroundColor: isDark ? colors.background : '#ffffff' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <CompanyAvatar name={job.companyName} size={60} imageUrl={logoUrl} />
            <View style={styles.heroMain}>
              <Text style={styles.title}>{job.title}</Text>
              {job.recruiterId ? (
                <Pressable
                  onPress={() => router.push(`/companies/${job.recruiterId}` as never)}
                  style={styles.companyPress}
                  hitSlop={6}
                >
                  <Text style={styles.company} numberOfLines={1}>
                    {job.companyName}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.blue} />
                </Pressable>
              ) : (
                <Text style={[styles.company, { color: colors.heading, marginTop: 6 }]}>
                  {job.companyName}
                </Text>
              )}
              {job.location ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={colors.muted} />
                  <Text style={styles.location} numberOfLines={2}>
                    {job.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {tags.length > 0 ? (
            <View style={styles.tags}>
              {tags.map((tag, index) => (
                <View key={`${index}-${tag}`} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.salaryBand}>
            <Text style={styles.salaryLabel}>Compensation</Text>
            <Text style={styles.salaryValue} numberOfLines={1}>
              {salaryDisplay}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Ionicons name="briefcase-outline" size={14} color={colors.blue} />
                <Text style={styles.statLabel}>Type</Text>
              </View>
              <Text style={styles.statValue} numberOfLines={2}>
                {typeLabel}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Ionicons name="school-outline" size={14} color={colors.blue} />
                <Text style={styles.statLabel}>Experience</Text>
              </View>
              <Text style={styles.statValue} numberOfLines={2}>
                {experienceLabel || experienceLevel || 'Not specified'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Ionicons name="time-outline" size={14} color={colors.blue} />
                <Text style={styles.statLabel}>Posted</Text>
              </View>
              <Text style={styles.statValue} numberOfLines={2}>
                {formatPostedAgo(job.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {highlights.length > 0 ? (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>Role snapshot</Text>
            {highlights.map((item, index) => (
              <View key={`${index}-${item.text}`} style={styles.highlightRow}>
                <View style={styles.highlightIcon}>
                  <Ionicons name={item.icon} size={16} color={colors.blue} />
                </View>
                <Text style={styles.highlightText}>{item.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {descriptionParagraphs.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Overview</Text>
            <Text style={styles.sectionTitle}>Job description</Text>
            {descriptionParagraphs.map((paragraph, index) => (
              <Text
                key={`desc-${index}`}
                style={[styles.bodyText, index > 0 ? styles.bodyGap : null]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        ) : null}

        {responsibilityItems.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Role</Text>
            <Text style={styles.sectionTitle}>Responsibilities</Text>
            {responsibilityItems.map((item, index) => (
              <View key={`resp-${index}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {job.recruiterId ? (
          <Pressable
            onPress={() => router.push(`/companies/${job.recruiterId}` as never)}
            style={({ pressed }) => [
              styles.sectionCard,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.94 : 1,
              },
            ]}
          >
            <CompanyAvatar name={job.companyName} size={48} imageUrl={logoUrl} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>About employer</Text>
              <Text style={[styles.sectionTitle, { marginBottom: 0, fontSize: 16 }]} numberOfLines={1}>
                {job.companyName}
              </Text>
              <Text style={[styles.bodyText, { marginTop: 4, fontSize: 13 }]} numberOfLines={1}>
                View company profile & open roles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.blue} />
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.applyBar}>
        {canApply ? (
          applied ? (
            <View style={styles.appliedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={isDark ? colors.success : '#15803d'} />
              <Text style={styles.appliedText}>Application submitted</Text>
            </View>
          ) : (
            <>
              {questionCount > 0 ? (
                <Text style={styles.applyHint}>
                  Includes {questionCount} screening question{questionCount === 1 ? '' : 's'}
                </Text>
              ) : null}
              <PrimaryButton label="Apply now" onPress={() => void openApply()} />
            </>
          )
        ) : (
          <>
            <Text style={styles.applyHint}>
              {user
                ? 'Only jobseeker accounts can apply for this role.'
                : 'Sign in as a jobseeker to apply for this role.'}
            </Text>
            {!user ? (
              <PrimaryButton label="Sign in to apply" onPress={() => router.push('/login' as never)} />
            ) : null}
          </>
        )}
      </View>

      <Modal visible={applyOpen} animationType="slide" transparent onRequestClose={() => setApplyOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => !submitting && setApplyOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Apply for this job</Text>
              <Text style={styles.sheetSub}>
                {job.title} · {job.companyName}
              </Text>
              <View style={styles.steps}>
                <View
                  style={[
                    styles.stepPill,
                    { backgroundColor: step === 'questions' ? colors.blue : colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepText,
                      { color: step === 'questions' ? '#fff' : colors.muted },
                    ]}
                  >
                    1. Questions
                  </Text>
                </View>
                <View
                  style={[
                    styles.stepPill,
                    { backgroundColor: step === 'preview' ? colors.blue : colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepText,
                      { color: step === 'preview' ? '#fff' : colors.muted },
                    ]}
                  >
                    2. Preview
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.sheetBody} contentContainerStyle={{ paddingBottom: 16 }}>
              {step === 'questions' ? (
                <>
                  {questions.map((question, index) => (
                    <View key={question.id} style={styles.questionBlock}>
                      <Text style={styles.questionPrompt}>
                        Q{index + 1}. {question.prompt}
                        {question.required ? ' *' : ''}
                      </Text>

                      {question.type === ScreeningQuestionType.TEXT ? (
                        <Input
                          value={answers[question.id] ?? ''}
                          onChangeText={(text) => setAnswer(question.id, text)}
                          placeholder="Your answer"
                          multiline
                          style={styles.coverInput}
                        />
                      ) : null}

                      {question.type === ScreeningQuestionType.YES_NO ? (
                        <View style={styles.choiceRow}>
                          {['Yes', 'No'].map((option) => {
                            const active = answers[question.id] === option;
                            return (
                              <Pressable
                                key={option}
                                onPress={() => setAnswer(question.id, option)}
                                style={[styles.choiceChip, active && styles.choiceChipActive]}
                              >
                                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                                  {option}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}

                      {question.type === ScreeningQuestionType.SINGLE_CHOICE ? (
                        <View style={styles.choiceRow}>
                          {(question.options ?? []).map((option) => {
                            const active = answers[question.id] === option;
                            return (
                              <Pressable
                                key={option}
                                onPress={() => setAnswer(question.id, option)}
                                style={[styles.choiceChip, active && styles.choiceChipActive]}
                              >
                                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                                  {option}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}

                      {question.type === ScreeningQuestionType.RESUME ? (
                        <View>
                          {resumeMeta?.url ? (
                            <Text style={styles.resumeReady}>
                              Ready: {resumeMeta.fileName || 'Resume on file'}
                            </Text>
                          ) : null}
                          <PrimaryButton
                            label={
                              uploadingResume
                                ? 'Uploading…'
                                : resumeMeta?.url
                                  ? 'Replace resume'
                                  : 'Upload resume'
                            }
                            onPress={() => void pickResume(question)}
                            loading={uploadingResume}
                            disabled={uploadingResume}
                          />
                        </View>
                      ) : null}
                    </View>
                  ))}

                  <FieldLabel>Cover note (optional)</FieldLabel>
                  <Input
                    value={coverNote}
                    onChangeText={setCoverNote}
                    placeholder="Tell the recruiter why you're a great fit…"
                    multiline
                    style={styles.coverInput}
                  />
                </>
              ) : (
                <>
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Applying as</Text>
                    <Text style={styles.previewValue}>
                      {profile?.fullName?.trim() || profile?.email || 'Your profile'}
                    </Text>
                  </View>
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Job</Text>
                    <Text style={styles.previewValue}>
                      {job.title}
                      {'\n'}
                      {job.companyName}
                    </Text>
                  </View>
                  {questions.map((question) => (
                    <View key={question.id} style={styles.previewCard}>
                      <Text style={styles.previewLabel}>{question.prompt}</Text>
                      <Text style={styles.previewValue}>
                        {question.type === ScreeningQuestionType.RESUME
                          ? resumeMeta?.fileName || answers[question.id] || '—'
                          : answers[question.id]?.trim() || '—'}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Cover note</Text>
                    <Text style={styles.previewValue}>{coverNote.trim() || 'No cover note added'}</Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.sheetFooter}>
              {step === 'questions' ? (
                <>
                  <View style={styles.footerBtn}>
                    <SecondaryButton label="Cancel" onPress={() => setApplyOpen(false)} />
                  </View>
                  <View style={styles.footerBtn}>
                    <PrimaryButton
                      label="Review →"
                      onPress={goToPreview}
                      disabled={uploadingResume}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.footerBtn}>
                    <SecondaryButton
                      label="← Edit"
                      onPress={() => setStep('questions')}
                      disabled={submitting}
                    />
                  </View>
                  <View style={styles.footerBtn}>
                    <PrimaryButton
                      label={submitting ? 'Submitting…' : 'Submit'}
                      onPress={() => void handleSubmit()}
                      loading={submitting}
                      disabled={submitting || uploadingResume}
                    />
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <SuccessModal
        visible={showApplySuccess}
        onClose={() => setShowApplySuccess(false)}
        title="Application submitted"
        message={
          job
            ? `Your application for ${job.title} at ${job.companyName} was submitted successfully.`
            : 'Your application was submitted successfully.'
        }
        primaryLabel="Got it"
        secondaryLabel="My applications"
        onSecondary={() => router.push('/(tabs)/applications')}
        variant="success"
        icon="briefcase-outline"
      />
    </AppScreen>
  );
}
