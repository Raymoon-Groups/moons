import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { Chip } from '@/components/status-badge';
import { PrimaryButton, FieldLabel, Input, SecondaryButton } from '@/components/ui';
import { apiFetch, authFetch, authUpload } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { formatEmploymentType, formatPostedAgo } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing, Profile } from '@/lib/types';

type Step = 'questions' | 'preview';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
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

  const questions = useMemo(
    () => [...(job?.screeningQuestions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [job?.screeningQuestions],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        container: { padding: theme.spacing.md, paddingBottom: 40 },
        hero: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          ...theme.shadow.card,
        },
        title: {
          marginTop: 14,
          fontSize: 24,
          ...fontStyle('extrabold'),
          color: colors.heading,
          lineHeight: 30,
        },
        company: { marginTop: 6, fontSize: 16, ...fontStyle('semibold'), color: colors.foreground },
        meta: { marginTop: 10, fontSize: 13, color: colors.muted, lineHeight: 20 },
        section: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        },
        sectionTitle: {
          fontSize: 16,
          ...fontStyle('extrabold'),
          color: colors.heading,
          marginBottom: 10,
        },
        description: { fontSize: 15, lineHeight: 24, color: colors.foreground },
        hint: { marginTop: 8, color: colors.muted, fontSize: 13 },
        error: { color: colors.error, textAlign: 'center' },
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
        errorBox: { marginTop: 10, color: colors.error, fontSize: 13 },
      }),
    [colors],
  );

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
      if (q.required && !(answers[q.id]?.trim())) {
        Alert.alert('Missing answer', `Please answer: ${q.prompt}`);
        return;
      }
    }
    setStep('preview');
  }

  async function handleSubmit() {
    if (!id || !job) return;
    for (const q of questions) {
      if (q.required && !(answers[q.id]?.trim())) {
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
      Alert.alert('Applied', 'Your application was submitted successfully.');
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
        </View>
      </AppScreen>
    );
  }

  if (!job) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.error}>{error || 'Job not found'}</Text>
        </View>
      </AppScreen>
    );
  }

  const canApply = user?.role === UserRole.CANDIDATE;
  const questionCount = questions.length;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <CompanyAvatar name={job.companyName} size={56} />
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.companyName}</Text>
          <Chip label={formatEmploymentType(job.employmentType)} />
          <Text style={styles.meta}>
            {[job.location, job.salaryRange, formatPostedAgo(job.createdAt)].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the role</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {canApply ? (
          applied ? (
            <Text style={styles.hint}>You have already applied to this job.</Text>
          ) : (
            <>
              <PrimaryButton label="Apply now" onPress={() => void openApply()} />
              {questionCount > 0 ? (
                <Text style={styles.hint}>
                  This employer asks {questionCount} question{questionCount === 1 ? '' : 's'} after
                  you click Apply.
                </Text>
              ) : null}
            </>
          )
        ) : (
          <Text style={styles.hint}>Sign in as a jobseeker to apply for this role.</Text>
        )}
      </ScrollView>

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
    </AppScreen>
  );
}
