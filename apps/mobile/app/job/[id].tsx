import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { UserRole } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { CompanyAvatar } from '@/components/company-avatar';
import { Chip } from '@/components/status-badge';
import { PrimaryButton } from '@/components/ui';
import { apiFetch, authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { formatEmploymentType, formatPostedAgo } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

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
        title: { marginTop: 14, fontSize: 24, ...fontStyle('extrabold'), color: colors.heading, lineHeight: 30 },
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
        sectionTitle: { fontSize: 16, ...fontStyle('extrabold'), color: colors.heading, marginBottom: 10 },
        description: { fontSize: 15, lineHeight: 24, color: colors.foreground },
        hint: { textAlign: 'center', color: colors.muted, fontSize: 14 },
        error: { color: colors.error, textAlign: 'center' },
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

  async function handleApply() {
    if (!id || !user) return;
    setApplying(true);
    try {
      await authFetch('/applications', { method: 'POST', body: JSON.stringify({ jobId: id }) });
      setApplied(true);
      Alert.alert('Applied', 'Your application was submitted successfully.');
    } catch (err) {
      Alert.alert('Could not apply', err instanceof Error ? err.message : 'Try again');
    } finally {
      setApplying(false);
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
          <PrimaryButton
            label={applied ? 'Already applied' : applying ? 'Applying…' : 'Apply now'}
            onPress={handleApply}
            loading={applying}
            disabled={applied}
          />
        ) : (
          <Text style={styles.hint}>Sign in as a jobseeker to apply for this role.</Text>
        )}
      </ScrollView>
    </AppScreen>
  );
}
