import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EducationEntry, WorkExperienceEntry } from '@moons/shared';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function ActionNotch({
  pageBg,
  colors,
  isDark,
}: {
  pageBg: string;
  colors: { blue: string; heading: string; border: string; surface: string };
  isDark: boolean;
}) {
  return (
    <View style={[styles.actionNotch, { backgroundColor: pageBg }]}>
      <Pressable
        onPress={() => router.push('/profile/edit')}
        style={[styles.actionBtn, { backgroundColor: colors.blue }, theme.shadow.button]}
        accessibilityLabel="Add"
      >
        <Ionicons name="add" size={18} color="#fff" />
      </Pressable>
      <Pressable
        onPress={() => router.push('/profile/edit')}
        style={[
          styles.actionBtn,
          {
            backgroundColor: isDark ? colors.surface : '#fff',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          },
          theme.shadow.soft,
        ]}
        accessibilityLabel="Edit"
      >
        <Ionicons name="pencil" size={14} color={colors.heading} />
      </Pressable>
    </View>
  );
}

function MetaChip({
  icon,
  text,
  colors,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: { muted: string; foreground: string; surface: string; heading: string };
  isDark: boolean;
}) {
  return (
    <View style={[styles.metaChip, { backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.72)' }]}>
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={[styles.metaChipText, { color: isDark ? colors.foreground : '#3a4456' }, fontStyle('medium')]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

export function ProfileEducationCard({
  education,
  showActions = true,
}: {
  education?: EducationEntry | null;
  showActions?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const pageBg = isDark ? colors.background : '#F7FAFC';
  const cardBg = isDark ? colors.surfaceElevated : '#E6EAF8';

  const degreeLine = education
    ? [education.fieldOfStudy, education.degree].filter(Boolean).join(', ')
    : null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${colors.blue}16` }]}>
          <Ionicons name="school" size={16} color={colors.blue} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Education</Text>
      </View>
      <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
        {education ? (
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]} numberOfLines={2}>
              {education.institute}
            </Text>
            {degreeLine ? (
              <MetaChip icon="ribbon-outline" text={degreeLine} colors={colors} isDark={isDark} />
            ) : null}
            {education.year ? (
              <MetaChip icon="calendar-outline" text={education.year} colors={colors} isDark={isDark} />
            ) : null}
          </View>
        ) : (
          <Pressable onPress={() => router.push('/profile/edit')} style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : '#fff' }]}>
              <Ionicons name="add" size={20} color={colors.blue} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.heading }, fontStyle('bold')]}>
              Add education
            </Text>
            <Text style={[styles.empty, { color: colors.muted }, fontStyle('medium')]}>
              Share your degree and institute to strengthen your profile.
            </Text>
          </Pressable>
        )}
        {showActions ? <ActionNotch pageBg={pageBg} colors={colors} isDark={isDark} /> : null}
      </View>
    </View>
  );
}

export function ProfileWorkCard({
  work,
  showActions = true,
}: {
  work?: WorkExperienceEntry | null;
  showActions?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const pageBg = isDark ? colors.background : '#F7FAFC';
  const cardBg = isDark ? colors.surfaceElevated : '#E6EAF8';

  const duration = work
    ? [work.startDate, work.isCurrent ? 'Present' : work.endDate].filter(Boolean).join(' – ')
    : null;
  const detail = work?.description?.trim() || null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${colors.blue}16` }]}>
          <Ionicons name="briefcase" size={16} color={colors.blue} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Work experience</Text>
      </View>
      <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
        {work ? (
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]} numberOfLines={2}>
              {work.designation}
            </Text>
            <Text style={[styles.company, { color: colors.blue }, fontStyle('bold')]} numberOfLines={1}>
              {work.company}
            </Text>
            {detail ? (
              <Text style={[styles.detail, { color: isDark ? colors.foreground : '#3a4456' }, fontStyle('medium')]} numberOfLines={2}>
                {detail}
              </Text>
            ) : null}
            {duration ? (
              <MetaChip icon="time-outline" text={duration} colors={colors} isDark={isDark} />
            ) : null}
          </View>
        ) : (
          <Pressable onPress={() => router.push('/profile/edit')} style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : '#fff' }]}>
              <Ionicons name="add" size={20} color={colors.blue} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.heading }, fontStyle('bold')]}>
              Add work experience
            </Text>
            <Text style={[styles.empty, { color: colors.muted }, fontStyle('medium')]}>
              Highlight roles that show your impact and growth.
            </Text>
          </Pressable>
        )}
        {showActions ? <ActionNotch pageBg={pageBg} colors={colors} isDark={isDark} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
  },
  card: {
    borderRadius: 26,
    padding: 18,
    paddingRight: 100,
    minHeight: 120,
    overflow: 'hidden',
  },
  cardBody: {
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 23,
  },
  company: {
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detail: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaChipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyWrap: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionNotch: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    paddingLeft: 12,
    paddingBottom: 12,
    paddingTop: 8,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
