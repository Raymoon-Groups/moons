import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { LoadingScreen } from '@/components/loading-screen';
import { authFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { formatEmploymentType } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

export default function RecruiterJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { padding: theme.spacing.md, paddingBottom: 40 },
        status: { fontSize: 12, ...fontStyle('bold'), color: colors.blue },
        title: { marginTop: 6, fontSize: 22, ...fontStyle('extrabold'), color: colors.heading },
        meta: { marginTop: 8, fontSize: 14, color: colors.muted },
        salary: { marginTop: 8, fontSize: 14, color: colors.foreground, ...fontStyle('semibold') },
        description: { marginTop: 16, fontSize: 14, lineHeight: 22, color: colors.foreground },
        button: {
          marginTop: 24,
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingVertical: 14,
          alignItems: 'center',
        },
        buttonText: { color: '#fff', ...fontStyle('bold') },
        secondary: {
          marginTop: 10,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          alignItems: 'center',
          backgroundColor: colors.surface,
        },
        secondaryText: { color: colors.heading, ...fontStyle('semibold') },
        muted: { color: colors.muted },
      }),
    [colors],
  );

  useEffect(() => {
    if (!id) return;
    authFetch<JobListing>(`/jobs/mine/${id}`)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingScreen />;

  if (!job) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.muted}>Job not found.</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.status}>{job.status === 'PUBLISHED' ? 'Live' : job.status}</Text>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.meta}>
          {[job.companyName, job.location, formatEmploymentType(job.employmentType)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {job.salaryRange ? <Text style={styles.salary}>{job.salaryRange}</Text> : null}
        <Text style={styles.description}>{job.description}</Text>

        <Pressable style={styles.button} onPress={() => router.push(`/recruiter/jobs/${id}/applicants`)}>
          <Text style={styles.buttonText}>View applicants</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push(`/recruiter/jobs/${id}/edit`)}>
          <Text style={styles.secondaryText}>Edit job</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}
