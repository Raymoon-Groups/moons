import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking as RNLinking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApplicationStatus, UserRole, type NetworkUserCard } from '@moons/shared';
import { CoverNoteBlock, ScreeningAnswersList } from '@/components/jobs/screening-answers-list';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import type { ConnectionUpdate } from '@/components/network/person-card';
import { SelectField } from '@/components/profile/select-field';
import { EmptyState } from '@/components/portal-ui';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { ApiError, authFetch } from '@/lib/api';
import { resolveAssetUrl, resolveAvatarUrl } from '@/lib/assets';
import {
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { fontStyle } from '@/lib/font-style';
import { fetchConversationWithUser } from '@/lib/messages';
import { useNavChromeScrollProps } from '@/lib/nav-chrome';
import { cancelConnection, searchProfessionals } from '@/lib/network';
import { OPEN_ON_MOONS_LABEL, showOpenOnMoonsToViewer } from '@/lib/open-on-moons';
import { openResumeFileOrAlert } from '@/lib/open-resume';
import {
  buildRecruiterCandidatesUrl,
  EXPERIENCE_BUCKETS,
  NOTICE_OPTIONS,
  type RecruiterCandidateRow,
} from '@/lib/recruiter-candidates';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useTabScreenPadding, useTabScreenTopPadding } from '@/lib/tab-screen-padding';
import type { JobListing } from '@/lib/types';

type TalentMode = 'discover' | 'applicants';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: ApplicationStatus.SUBMITTED },
  { label: 'Viewed', value: ApplicationStatus.VIEWED },
  { label: 'Shortlisted', value: ApplicationStatus.SHORTLISTED },
  { label: 'Rejected', value: ApplicationStatus.REJECTED },
];

function formatExperience(years: number | null | undefined) {
  if (years == null) return null;
  if (years === 0) return 'Fresher';
  return years === 1 ? '1 yr' : `${years} yrs`;
}

function formatAppliedDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function DiscoverCandidateCard({
  person,
  onUpdated,
}: {
  person: NetworkUserCard;
  onUpdated?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [local, setLocal] = useState(person);
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    setLocal(person);
  }, [person]);

  const avatar = resolveAvatarUrl(local.avatarUrl);
  const name = local.fullName?.trim() || 'Professional';
  const status = local.connectionStatus || 'NONE';
  const showOpenBadge = showOpenOnMoonsToViewer(
    local.openToWork,
    user?.role,
    user?.id === local.userId,
  );

  function apply(update: ConnectionUpdate) {
    setLocal((prev) => ({
      ...prev,
      connectionStatus: update.connectionStatus,
      connectionId: update.connectionId || null,
      connectionDirection: update.connectionDirection,
    }));
  }

  async function cancelPending() {
    if (!local.connectionId) return;
    setLoading(true);
    try {
      await cancelConnection(local.connectionId);
      apply({ connectionId: '', connectionStatus: 'NONE', connectionDirection: null });
      notifyConnectionsRefresh();
      onUpdated?.();
    } catch {
      // keep card
    } finally {
      setLoading(false);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          marginBottom: 14,
          overflow: 'hidden',
          ...theme.shadow.soft,
        },
        top: {
          flexDirection: 'row',
          gap: 12,
          padding: 16,
        },
        avatar: {
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: isDark ? colors.surface : '#EEF3FA',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: '100%', height: '100%' },
        main: { flex: 1, minWidth: 0 },
        name: { fontSize: 16, color: colors.heading, ...fontStyle('bold') },
        headline: {
          marginTop: 3,
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        metaRow: {
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        metaChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: isDark ? colors.surface : '#F3F5F8',
        },
        metaText: { fontSize: 11, color: colors.muted, ...fontStyle('semibold') },
        openChip: {
          backgroundColor: isDark ? 'rgba(110,160,239,0.16)' : '#E8F0FE',
        },
        openText: { color: colors.blue },
        footer: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          padding: 12,
          flexDirection: 'row',
          gap: 8,
        },
        btn: {
          flex: 1,
          height: 42,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surface : '#F7F9FC',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        btnPrimary: {
          backgroundColor: colors.blue,
          borderColor: colors.blue,
        },
        btnText: { fontSize: 13, color: colors.heading, ...fontStyle('semibold') },
        btnTextPrimary: { color: '#fff' },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/network/${local.userId}` as never)}
        style={styles.top}
      >
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 20, color: colors.blue, ...fontStyle('bold') }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.main}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.headline} numberOfLines={2}>
            {local.headline || local.currentCompany || 'Candidate'}
          </Text>
          <View style={styles.metaRow}>
            {local.location ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={12} color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {local.location}
                </Text>
              </View>
            ) : null}
            {local.currentCompany ? (
              <View style={styles.metaChip}>
                <Ionicons name="business-outline" size={12} color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {local.currentCompany}
                </Text>
              </View>
            ) : null}
            {showOpenBadge ? (
              <View style={[styles.metaChip, styles.openChip]}>
                <Ionicons name="briefcase" size={12} color={colors.blue} />
                <Text style={[styles.metaText, styles.openText]}>{OPEN_ON_MOONS_LABEL}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push(`/network/${local.userId}` as never)}
          style={styles.btn}
        >
          <Ionicons name="person-outline" size={15} color={colors.heading} />
          <Text style={styles.btnText}>Profile</Text>
        </Pressable>
        {loading ? (
          <View style={styles.btn}>
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : status === 'PENDING' && local.connectionDirection === 'sent' ? (
          <Pressable onPress={() => void cancelPending()} style={styles.btn}>
            <Text style={styles.btnText}>Pending</Text>
          </Pressable>
        ) : status === 'ACCEPTED' ? (
          <Pressable
            onPress={() => router.push(`/messages?with=${local.userId}` as never)}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={15} color="#fff" />
            <Text style={[styles.btnText, styles.btnTextPrimary]}>Message</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setShowInvite(true)} style={[styles.btn, styles.btnPrimary]}>
            <Ionicons name="person-add" size={15} color="#fff" />
            <Text style={[styles.btnText, styles.btnTextPrimary]}>Connect</Text>
          </Pressable>
        )}
      </View>

      <ConnectInviteModal
        visible={showInvite}
        userId={local.userId}
        fullName={name}
        onClose={() => setShowInvite(false)}
        onSent={(connectionId) => {
          apply({
            connectionId,
            connectionStatus: 'PENDING',
            connectionDirection: 'sent',
          });
          setShowInvite(false);
          onUpdated?.();
        }}
      />
    </View>
  );
}

function ApplicantCard({
  row,
  keyword,
  phoneRevealed,
  onRevealPhone,
  updating,
  messaging,
  onStatusChange,
  onMessage,
}: {
  row: RecruiterCandidateRow;
  keyword: string;
  phoneRevealed: boolean;
  onRevealPhone: () => void;
  updating: boolean;
  messaging: boolean;
  onStatusChange: (status: ApplicationStatus) => void;
  onMessage: () => void;
}) {
  const { colors, isDark } = useTheme();
  const profile = row.candidate.profile;
  const name = profile?.fullName ?? row.candidate.email;
  const avatar = resolveAssetUrl(profile?.avatarUrl);
  const skills = profile?.skills ?? [];
  const q = keyword.trim().toLowerCase();
  const experience = formatExperience(profile?.experienceYears);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          marginBottom: 14,
          overflow: 'hidden',
          ...theme.shadow.soft,
        },
        top: {
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
        },
        avatar: {
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: isDark ? colors.surface : '#EEF3FA',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: '100%', height: '100%' },
        topMain: { flex: 1, minWidth: 0 },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        },
        name: {
          flex: 1,
          fontSize: 16,
          lineHeight: 21,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        headline: {
          marginTop: 3,
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        metaRow: {
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        metaChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: isDark ? colors.surface : '#F3F5F8',
        },
        metaText: { fontSize: 11, color: colors.muted, ...fontStyle('semibold') },
        jobBand: {
          marginHorizontal: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: isDark ? 'rgba(110,160,239,0.12)' : '#F0F5FF',
        },
        jobText: { flex: 1, fontSize: 12, color: colors.blue, ...fontStyle('semibold') },
        skills: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          paddingHorizontal: 16,
          paddingBottom: 12,
        },
        skill: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: isDark ? colors.surface : '#F3F5F8',
        },
        skillMatch: {
          backgroundColor: isDark ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.22)',
        },
        skillText: { fontSize: 11, color: colors.muted, ...fontStyle('medium') },
        extras: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
        actions: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 8,
          flexDirection: 'row',
          gap: 8,
        },
        iconBtn: {
          flex: 1,
          minHeight: 44,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surface : '#F7F9FC',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          paddingVertical: 8,
        },
        iconBtnPrimary: {
          backgroundColor: colors.blue,
          borderColor: colors.blue,
        },
        iconBtnLabel: { fontSize: 10, color: colors.muted, ...fontStyle('semibold') },
        iconBtnLabelPrimary: { color: '#fff' },
        statusWrap: {
          paddingHorizontal: 16,
          paddingBottom: 14,
          paddingTop: 4,
        },
        updating: {
          marginTop: 6,
          fontSize: 12,
          color: colors.muted,
          ...fontStyle('medium'),
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/recruiter/candidates/${row.candidate.id}`)}
        style={styles.top}
      >
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 20, color: colors.blue, ...fontStyle('bold') }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.topMain}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <StatusBadge status={row.status} />
          </View>
          {profile?.headline ? (
            <Text style={styles.headline} numberOfLines={2}>
              {profile.headline}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {profile?.location ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={12} color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {profile.location}
                </Text>
              </View>
            ) : null}
            {experience ? (
              <View style={styles.metaChip}>
                <Ionicons name="briefcase-outline" size={12} color={colors.muted} />
                <Text style={styles.metaText}>{experience}</Text>
              </View>
            ) : null}
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={12} color={colors.muted} />
              <Text style={styles.metaText}>{formatAppliedDate(row.createdAt)}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.jobBand}>
        <Ionicons name="document-text-outline" size={15} color={colors.blue} />
        <Text style={styles.jobText} numberOfLines={1}>
          Applied for {row.job.title}
        </Text>
      </View>

      {skills.length > 0 ? (
        <View style={styles.skills}>
          {skills.slice(0, 5).map((skill) => {
            const match = Boolean(q && skill.toLowerCase().includes(q));
            return (
              <View key={skill} style={[styles.skill, match && styles.skillMatch]}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {(row.coverNote || (row.screeningAnswers?.length ?? 0) > 0) && (
        <View style={styles.extras}>
          {row.coverNote ? <CoverNoteBlock note={row.coverNote} /> : null}
          <ScreeningAnswersList answers={row.screeningAnswers} />
        </View>
      )}

      <View style={styles.actions}>
        {profile?.phone ? (
          <Pressable
            onPress={() =>
              phoneRevealed
                ? void RNLinking.openURL(`tel:${profile.phone}`)
                : onRevealPhone()
            }
            style={[styles.iconBtn, phoneRevealed && styles.iconBtnPrimary]}
          >
            <Ionicons
              name={phoneRevealed ? 'call' : 'call-outline'}
              size={16}
              color={phoneRevealed ? '#fff' : colors.heading}
            />
            <Text
              style={[styles.iconBtnLabel, phoneRevealed && styles.iconBtnLabelPrimary]}
              numberOfLines={1}
            >
              {phoneRevealed ? 'Call' : 'Phone'}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.iconBtn, { opacity: 0.45 }]}>
            <Ionicons name="call-outline" size={16} color={colors.muted} />
            <Text style={styles.iconBtnLabel}>No phone</Text>
          </View>
        )}

        <Pressable onPress={onMessage} disabled={messaging} style={styles.iconBtn}>
          {messaging ? (
            <ActivityIndicator size="small" color={colors.blue} />
          ) : (
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.heading} />
          )}
          <Text style={styles.iconBtnLabel}>Message</Text>
        </Pressable>

        {profile?.resumeUrl ? (
          <Pressable
            onPress={() => void openResumeFileOrAlert(profile.resumeUrl, profile.resumeFileName)}
            style={styles.iconBtn}
          >
            <Ionicons name="document-attach-outline" size={16} color={colors.heading} />
            <Text style={styles.iconBtnLabel}>CV</Text>
          </Pressable>
        ) : (
          <View style={[styles.iconBtn, { opacity: 0.45 }]}>
            <Ionicons name="document-attach-outline" size={16} color={colors.muted} />
            <Text style={styles.iconBtnLabel}>No CV</Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push(`/recruiter/candidates/${row.candidate.id}`)}
          style={[styles.iconBtn, styles.iconBtnPrimary]}
        >
          <Ionicons name="person-outline" size={16} color="#fff" />
          <Text style={[styles.iconBtnLabel, styles.iconBtnLabelPrimary]}>Profile</Text>
        </Pressable>
      </View>

      <View style={styles.statusWrap}>
        <SelectField
          label="Update status"
          value={row.status}
          options={STATUS_FILTERS.filter((s) => s.value !== 'all').map((s) => ({
            label: s.label,
            value: s.value,
          }))}
          onChange={(value) => onStatusChange(value as ApplicationStatus)}
        />
        {updating ? <Text style={styles.updating}>Updating status…</Text> : null}
      </View>
    </View>
  );
}

export function RecruiterCandidatesScreen({ showHeader = true }: { showHeader?: boolean }) {
  const { colors, isDark } = useTheme();
  const topPadding = useTabScreenTopPadding();
  const bottomPadding = useTabScreenPadding(28);
  const navScroll = useNavChromeScrollProps();

  const [mode, setMode] = useState<TalentMode>('discover');
  const [people, setPeople] = useState<NetworkUserCard[]>([]);
  const [applicants, setApplicants] = useState<RecruiterCandidateRow[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [locationQ, setLocationQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [noticeFilter, setNoticeFilter] = useState('');
  const [openToWorkOnly, setOpenToWorkOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [discoverTotal, setDiscoverTotal] = useState(0);

  const experienceBucket = EXPERIENCE_BUCKETS.find((b) => b.value === experienceFilter);

  const applicantStats = useMemo(() => {
    const submitted = applicants.filter((r) => r.status === ApplicationStatus.SUBMITTED).length;
    const shortlisted = applicants.filter((r) => r.status === ApplicationStatus.SHORTLISTED).length;
    return { total: applicants.length, submitted, shortlisted };
  }, [applicants]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (locationQ.trim()) count += 1;
    if (mode === 'discover' && openToWorkOnly) count += 1;
    if (mode === 'applicants') {
      if (jobFilter) count += 1;
      if (experienceFilter) count += 1;
      if (noticeFilter) count += 1;
    }
    return count;
  }, [locationQ, openToWorkOnly, mode, jobFilter, experienceFilter, noticeFilter]);

  const loadDiscover = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await searchProfessionals({
          role: UserRole.CANDIDATE,
          q: searchQ.trim() || '',
          location: locationQ.trim() || '',
          ...(openToWorkOnly ? { openToWork: true } : {}),
          page: 1,
          limit: 50,
        });
        setPeople(data.items);
        setDiscoverTotal(data.total);
      } catch {
        setPeople([]);
        setDiscoverTotal(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQ, locationQ, openToWorkOnly],
  );

  const loadApplicants = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const url = buildRecruiterCandidatesUrl({
          q: searchQ || undefined,
          location: locationQ || undefined,
          status: statusFilter !== 'all' ? (statusFilter as ApplicationStatus) : undefined,
          jobId: jobFilter || undefined,
          experienceMin: experienceBucket?.min,
          experienceMax: experienceBucket?.max,
          noticePeriod: noticeFilter || undefined,
        });
        const data = await authFetch<RecruiterCandidateRow[]>(url);
        setApplicants(data);
      } catch {
        setApplicants([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQ, locationQ, statusFilter, jobFilter, experienceBucket, noticeFilter],
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (mode === 'discover') await loadDiscover(isRefresh);
      else await loadApplicants(isRefresh);
    },
    [mode, loadDiscover, loadApplicants],
  );

  useEffect(() => {
    authFetch<JobListing[]>('/jobs/mine')
      .then(setJobs)
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplicants((prev) =>
        prev.map((r) => (r.id === applicationId ? { ...r, status } : r)),
      );
    } catch (err) {
      Alert.alert(
        'Could not update status',
        err instanceof ApiError ? err.message : 'Please try again.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function openMessage(userId: string) {
    setMessagingId(userId);
    try {
      const conv = await fetchConversationWithUser(userId);
      router.push(`/messages/${conv.id}` as never);
    } catch (err) {
      Alert.alert(
        'Could not open chat',
        err instanceof ApiError ? err.message : 'Connect with this candidate first, or try again.',
      );
    } finally {
      setMessagingId(null);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
        listContent: {
          paddingHorizontal: theme.spacing.md,
          paddingBottom: bottomPadding,
          paddingTop: topPadding,
        },
        hero: {
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 14,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(63,116,204,0.12)',
          ...theme.shadow.soft,
        },
        heroInner: { padding: 18 },
        eyebrowRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        },
        eyebrow: {
          fontSize: 11,
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          color: colors.blue,
          ...fontStyle('bold'),
        },
        heroBadge: {
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(110,160,239,0.16)' : 'rgba(63,116,204,0.12)',
        },
        title: {
          marginTop: 10,
          fontSize: 26,
          lineHeight: 32,
          color: colors.heading,
          ...fontStyle('extrabold'),
        },
        subtitle: {
          marginTop: 6,
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          ...fontStyle('regular'),
        },
        statsRow: {
          marginTop: 16,
          flexDirection: 'row',
          gap: 8,
        },
        statCard: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
        },
        statValue: {
          fontSize: 20,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        statLabel: {
          marginTop: 2,
          fontSize: 11,
          color: colors.muted,
          ...fontStyle('semibold'),
        },
        modeRow: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 12,
          padding: 4,
          borderRadius: 16,
          backgroundColor: isDark ? colors.surface : '#F3F5F8',
        },
        modeChip: {
          flex: 1,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        modeChipActive: {
          backgroundColor: colors.surfaceElevated,
          ...theme.shadow.soft,
        },
        modeText: { fontSize: 13, color: colors.muted, ...fontStyle('semibold') },
        modeTextActive: { color: colors.heading, ...fontStyle('bold') },
        searchBlock: { marginBottom: 10 },
        statusScroll: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 10,
        },
        statusChip: {
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surface : '#F7F9FC',
        },
        statusChipActive: {
          borderColor: colors.blue,
          backgroundColor: isDark ? 'rgba(110,160,239,0.18)' : '#E8F0FE',
        },
        statusChipText: {
          fontSize: 13,
          color: colors.muted,
          ...fontStyle('semibold'),
        },
        statusChipTextActive: { color: colors.blue },
        filtersToggle: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: isDark ? colors.surface : '#F3F5F8',
          borderWidth: 1,
          borderColor: colors.border,
        },
        filtersToggleText: {
          fontSize: 13,
          color: colors.heading,
          ...fontStyle('semibold'),
        },
        filterBadge: {
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          paddingHorizontal: 5,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.blue,
        },
        filterBadgeText: { color: '#fff', fontSize: 10, ...fontStyle('bold') },
        advanced: {
          marginBottom: 14,
          padding: 12,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surface : '#FAFBFC',
          gap: 4,
        },
        loadingText: { color: colors.muted, ...fontStyle('medium') },
      }),
    [bottomPadding, colors, isDark, topPadding],
  );

  const header = (
    <View>
      {showHeader ? (
        <View style={styles.hero}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(63,116,204,0.22)', 'rgba(15,28,51,0.35)', colors.surfaceElevated]
                : ['#dbe7fb', '#eef4fc', '#f7f9fc']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroInner}
          >
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>Recruiter workspace</Text>
              <View style={styles.heroBadge}>
                <Ionicons name="people" size={18} color={colors.blue} />
              </View>
            </View>
            <Text style={styles.title}>Talent</Text>
            <Text style={styles.subtitle}>
              Discover candidates across Moons, or manage people who applied to your jobs.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {mode === 'discover' ? discoverTotal : applicantStats.total}
                </Text>
                <Text style={styles.statLabel}>
                  {mode === 'discover' ? 'Candidates' : 'Applicants'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {mode === 'discover' ? people.length : applicantStats.submitted}
                </Text>
                <Text style={styles.statLabel}>
                  {mode === 'discover' ? 'Showing' : 'New'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {mode === 'discover'
                    ? people.filter((p) => p.openToWork).length
                    : applicantStats.shortlisted}
                </Text>
                <Text style={styles.statLabel}>
                  {mode === 'discover' ? 'Open' : 'Shortlisted'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      ) : null}

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setMode('discover')}
          style={[styles.modeChip, mode === 'discover' && styles.modeChipActive]}
        >
          <Text style={[styles.modeText, mode === 'discover' && styles.modeTextActive]}>
            Discover
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('applicants')}
          style={[styles.modeChip, mode === 'applicants' && styles.modeChipActive]}
        >
          <Text style={[styles.modeText, mode === 'applicants' && styles.modeTextActive]}>
            Applicants
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchBlock}>
        <SearchBar
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder={
            mode === 'discover'
              ? 'Search candidates by name, skills, or role…'
              : 'Search applicants…'
          }
        />
      </View>

      {mode === 'applicants' ? (
        <View style={styles.statusScroll}>
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setStatusFilter(item.value)}
                style={[styles.statusChip, active && styles.statusChipActive]}
              >
                <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.statusScroll}>
          <Pressable
            onPress={() => setOpenToWorkOnly((v) => !v)}
            style={[styles.statusChip, openToWorkOnly && styles.statusChipActive]}
          >
            <Text style={[styles.statusChipText, openToWorkOnly && styles.statusChipTextActive]}>
              {OPEN_ON_MOONS_LABEL}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => setFiltersOpen((v) => !v)} style={styles.filtersToggle}>
        <Ionicons name="options-outline" size={15} color={colors.heading} />
        <Text style={styles.filtersToggleText}>
          {filtersOpen ? 'Hide filters' : 'More filters'}
        </Text>
        {activeFilterCount > 0 ? (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
        <Ionicons
          name={filtersOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.muted}
        />
      </Pressable>

      {filtersOpen ? (
        <View style={styles.advanced}>
          <SearchBar value={locationQ} onChangeText={setLocationQ} placeholder="Filter by location…" />
          {mode === 'applicants' ? (
            <>
              <SelectField
                label="Job"
                value={jobFilter}
                options={[
                  { label: 'All jobs', value: '' },
                  ...jobs.map((j) => ({ label: j.title, value: j.id })),
                ]}
                onChange={setJobFilter}
                placeholder="All jobs"
              />
              <SelectField
                label="Experience"
                value={experienceFilter}
                options={EXPERIENCE_BUCKETS.map((b) => ({ label: b.label, value: b.value }))}
                onChange={setExperienceFilter}
              />
              <SelectField
                label="Notice period"
                value={noticeFilter}
                options={[
                  { label: 'Any', value: '' },
                  ...NOTICE_OPTIONS.map((n) => ({ label: n, value: n })),
                ]}
                onChange={setNoticeFilter}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (loading && (mode === 'discover' ? people.length === 0 : applicants.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.blue} />
        <Text style={styles.loadingText}>
          {mode === 'discover' ? 'Loading talent…' : 'Loading applicants…'}
        </Text>
      </View>
    );
  }

  if (mode === 'discover') {
    return (
      <FlatList
        data={people}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
        ListHeaderComponent={header}
        {...navScroll}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No candidates found"
            message="Try a different search, or clear filters to browse everyone."
          />
        }
        renderItem={({ item }) => (
          <DiscoverCandidateCard person={item} onUpdated={() => void load(true)} />
        )}
      />
    );
  }

  return (
    <FlatList
      data={applicants}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
      }
      ListHeaderComponent={header}
      {...navScroll}
      ListEmptyComponent={
        <EmptyState
          icon="people-outline"
          title="No applicants yet"
          message="People who apply to your jobs will show up here. Use Discover to browse talent now."
        />
      }
      renderItem={({ item }) => (
        <ApplicantCard
          row={item}
          keyword={searchQ}
          phoneRevealed={revealedPhones.has(item.candidate.id)}
          onRevealPhone={() =>
            setRevealedPhones((prev) => new Set(prev).add(item.candidate.id))
          }
          updating={updatingId === item.id}
          messaging={messagingId === item.candidate.id}
          onStatusChange={(status) => void updateStatus(item.id, status)}
          onMessage={() => void openMessage(item.candidate.id)}
        />
      )}
    />
  );
}
