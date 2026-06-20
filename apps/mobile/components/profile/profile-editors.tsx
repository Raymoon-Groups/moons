import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@moons/shared';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FieldLabel, Input, SecondaryButton } from '@/components/ui';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function emptyEducation(): EducationEntry {
  return { degree: '', institute: '', fieldOfStudy: '', year: '' };
}

function emptyWorkExperience(): WorkExperienceEntry {
  return {
    company: '',
    designation: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  };
}

function emptyCertification(): CertificationEntry {
  return { name: '', issuer: '', year: '' };
}

function EntryCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          backgroundColor: colors.surface,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        },
        title: { fontSize: 14, color: colors.heading, ...fontStyle('bold') },
        remove: { fontSize: 12, color: colors.error, ...fontStyle('semibold') },
      }),
    [colors],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

export function EducationListEditor({
  value,
  onChange,
}: {
  value: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
}) {
  return (
    <View>
      {value.map((entry, index) => (
        <EntryCard
          key={index}
          title={`Education ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <FieldLabel>Degree</FieldLabel>
          <Input
            value={entry.degree}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, degree: text };
              onChange(next);
            }}
            placeholder="B.Tech, MBA…"
          />
          <FieldLabel>Institute</FieldLabel>
          <Input
            value={entry.institute}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, institute: text };
              onChange(next);
            }}
          />
          <FieldLabel>Field of study</FieldLabel>
          <Input
            value={entry.fieldOfStudy ?? ''}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, fieldOfStudy: text };
              onChange(next);
            }}
          />
          <FieldLabel>Year of passing</FieldLabel>
          <Input
            value={entry.year}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, year: text };
              onChange(next);
            }}
            placeholder="2022"
            keyboardType="number-pad"
          />
        </EntryCard>
      ))}
      {value.length < 10 ? (
        <SecondaryButton
          label="+ Add education"
          onPress={() => onChange([...value, emptyEducation()])}
        />
      ) : null}
    </View>
  );
}

export function WorkExperienceListEditor({
  value,
  onChange,
}: {
  value: WorkExperienceEntry[];
  onChange: (next: WorkExperienceEntry[]) => void;
}) {
  const { colors } = useTheme();
  const checkStyles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
        label: { fontSize: 14, color: colors.foreground, ...fontStyle('regular') },
      }),
    [colors],
  );

  return (
    <View>
      {value.map((entry, index) => (
        <EntryCard
          key={index}
          title={`Employment ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <FieldLabel>Company</FieldLabel>
          <Input
            value={entry.company}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, company: text };
              onChange(next);
            }}
          />
          <FieldLabel>Designation</FieldLabel>
          <Input
            value={entry.designation}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, designation: text };
              onChange(next);
            }}
          />
          <FieldLabel>Start date (YYYY-MM)</FieldLabel>
          <Input
            value={entry.startDate}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, startDate: text };
              onChange(next);
            }}
            placeholder="2020-01"
          />
          <FieldLabel>End date (YYYY-MM)</FieldLabel>
          <Input
            value={entry.endDate ?? ''}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, endDate: text || null };
              onChange(next);
            }}
            placeholder="2024-06"
            editable={!entry.isCurrent}
          />
          <Pressable
            style={checkStyles.row}
            onPress={() => {
              const next = [...value];
              next[index] = {
                ...entry,
                isCurrent: !entry.isCurrent,
                endDate: !entry.isCurrent ? null : entry.endDate,
              };
              onChange(next);
            }}
          >
            <IoniconsCheckbox checked={entry.isCurrent} />
            <Text style={checkStyles.label}>I currently work here</Text>
          </Pressable>
          <FieldLabel>Job description</FieldLabel>
          <Input
            value={entry.description ?? ''}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, description: text };
              onChange(next);
            }}
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            placeholder="Key responsibilities…"
          />
        </EntryCard>
      ))}
      {value.length < 15 ? (
        <SecondaryButton
          label="+ Add employment"
          onPress={() => onChange([...value, emptyWorkExperience()])}
        />
      ) : null}
    </View>
  );
}

function IoniconsCheckbox({ checked }: { checked: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: checked ? colors.blue : colors.border,
        backgroundColor: checked ? colors.blue : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
    </View>
  );
}

export function CertificationListEditor({
  value,
  onChange,
}: {
  value: CertificationEntry[];
  onChange: (next: CertificationEntry[]) => void;
}) {
  return (
    <View>
      {value.map((entry, index) => (
        <EntryCard
          key={index}
          title={`Certification ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <FieldLabel>Certification name</FieldLabel>
          <Input
            value={entry.name}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, name: text };
              onChange(next);
            }}
          />
          <FieldLabel>Issuing organization</FieldLabel>
          <Input
            value={entry.issuer ?? ''}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, issuer: text };
              onChange(next);
            }}
          />
          <FieldLabel>Year</FieldLabel>
          <Input
            value={entry.year ?? ''}
            onChangeText={(text) => {
              const next = [...value];
              next[index] = { ...entry, year: text };
              onChange(next);
            }}
            placeholder="2023"
            keyboardType="number-pad"
          />
        </EntryCard>
      ))}
      {value.length < 10 ? (
        <SecondaryButton
          label="+ Add certification"
          onPress={() => onChange([...value, emptyCertification()])}
        />
      ) : null}
    </View>
  );
}

export function TagListEditor({
  label,
  placeholder,
  value,
  onChange,
  max = 10,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.full,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginRight: 8,
          marginBottom: 8,
        },
        chipText: { fontSize: 13, color: colors.blue, ...fontStyle('medium') },
        chipRemove: { fontSize: 16, color: colors.muted, lineHeight: 18 },
        chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
      }),
    [colors],
  );

  function addTag(raw: string) {
    const trimmed = raw.trim().replace(/,$/, '');
    if (!trimmed || value.includes(trimmed) || value.length >= max) return;
    onChange([...value, trimmed]);
    setInput('');
  }

  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.chips}>
        {value.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
            <Pressable onPress={() => onChange(value.filter((t) => t !== tag))} hitSlop={8}>
              <Text style={styles.chipRemove}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      {value.length < max ? (
        <Input
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          onSubmitEditing={() => addTag(input)}
          blurOnSubmit={false}
          returnKeyType="done"
        />
      ) : null}
    </View>
  );
}

export function SkillsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <TagListEditor
      label="Key skills"
      placeholder="Type a skill and press done"
      value={value}
      onChange={onChange}
      max={20}
    />
  );
}
