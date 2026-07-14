import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EmploymentType, ScreeningQuestionType, type ScreeningQuestion } from '@moons/shared';
import { SelectField } from '@/components/profile/select-field';
import { LoadingScreen } from '@/components/loading-screen';
import { Card, ErrorText, FieldLabel, Input, PrimaryButton, Screen } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import { formatEmploymentType } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import type { JobListing, Profile } from '@/lib/types';

const EMPLOYMENT_OPTIONS = [
  EmploymentType.FULL_TIME,
  EmploymentType.PART_TIME,
  EmploymentType.CONTRACT,
  EmploymentType.INTERNSHIP,
  EmploymentType.REMOTE,
].map((type) => ({ label: formatEmploymentType(type), value: type }));

function newQuestionId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function NewJobScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [employmentType, setEmploymentType] = useState(EmploymentType.FULL_TIME);
  const [askForCv, setAskForCv] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customQuestions, setCustomQuestions] = useState<ScreeningQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch<Profile>('/profiles/me')
      .then((profile) => {
        setCompanyName(profile.currentCompany ?? '');
        setLocation(profile.location ?? '');
      })
      .catch(() => undefined)
      .finally(() => setProfileLoading(false));
  }, []);

  function addTextQuestion() {
    const prompt = customPrompt.trim();
    if (prompt.length < 3) return;
    if (customQuestions.length + (askForCv ? 1 : 0) >= 10) return;
    setCustomQuestions((prev) => [
      ...prev,
      {
        id: newQuestionId(),
        prompt,
        type: ScreeningQuestionType.TEXT,
        required: true,
        sortOrder: prev.length,
      },
    ]);
    setCustomPrompt('');
  }

  function buildScreeningQuestions(): ScreeningQuestion[] {
    const list: ScreeningQuestion[] = [];
    if (askForCv) {
      list.push({
        id: newQuestionId(),
        prompt: 'Upload your latest CV / resume',
        type: ScreeningQuestionType.RESUME,
        required: true,
        sortOrder: 0,
      });
    }
    customQuestions.forEach((q, index) => {
      list.push({ ...q, sortOrder: list.length + index });
    });
    return list.map((q, index) => ({ ...q, sortOrder: index }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const job = await authFetch<JobListing>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          companyName,
          description,
          location,
          employmentType,
          salaryRange: salaryRange || undefined,
          screeningQuestions: buildScreeningQuestions(),
        }),
      });
      router.replace(`/recruiter/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading) {
    return <LoadingScreen />;
  }

  return (
    <Screen>
      <Card>
        <FieldLabel>Job title</FieldLabel>
        <Input value={title} onChangeText={setTitle} placeholder="e.g. Software Engineer" />
        <FieldLabel>Company</FieldLabel>
        <Input value={companyName} onChangeText={setCompanyName} />
        <FieldLabel>Location</FieldLabel>
        <Input value={location} onChangeText={setLocation} />
        <FieldLabel>Salary range (optional)</FieldLabel>
        <Input value={salaryRange} onChangeText={setSalaryRange} placeholder="₹8–12 LPA" />
        <SelectField
          label="Employment type"
          value={employmentType}
          options={EMPLOYMENT_OPTIONS}
          onChange={(value) => setEmploymentType(value as EmploymentType)}
        />
        <FieldLabel>Description</FieldLabel>
        <Input
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 120, textAlignVertical: 'top' }}
          placeholder="Role responsibilities, requirements…"
        />

        <FieldLabel>Application questions</FieldLabel>
        <Pressable
          onPress={() => setAskForCv((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            paddingVertical: 8,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: askForCv ? colors.blue : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {askForCv ? <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text> : null}
          </View>
          <Text style={{ color: colors.foreground, flex: 1 }}>
            Ask candidates to upload their latest CV
          </Text>
        </Pressable>

        {customQuestions.map((q) => (
          <View
            key={q.id}
            style={{
              marginBottom: 8,
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.heading, marginBottom: 6 }}>{q.prompt}</Text>
            <Pressable onPress={() => setCustomQuestions((prev) => prev.filter((x) => x.id !== q.id))}>
              <Text style={{ color: colors.error, fontSize: 12 }}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <Input
          value={customPrompt}
          onChangeText={setCustomPrompt}
          placeholder="Add a custom question…"
        />
        <PrimaryButton label="Add question" onPress={addTextQuestion} />

        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton label={loading ? 'Posting…' : 'Publish job'} onPress={handleSubmit} loading={loading} />
      </Card>
    </Screen>
  );
}
