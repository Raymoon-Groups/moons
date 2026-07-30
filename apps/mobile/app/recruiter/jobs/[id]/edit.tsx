import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { EmploymentType, ScreeningQuestionType, type ScreeningQuestion } from '@moons/shared';
import {
  ScreeningQuestionsEditor,
  buildScreeningQuestions,
} from '@/components/recruiter/screening-questions-editor';
import { SelectField } from '@/components/profile/select-field';
import { LoadingScreen } from '@/components/loading-screen';
import { Card, ErrorText, FieldLabel, Input, PrimaryButton, Screen } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import { formatEmploymentType } from '@/lib/format';
import { stripHtml } from '@/lib/html-text';
import type { JobListing } from '@/lib/types';

const EMPLOYMENT_OPTIONS = [
  EmploymentType.FULL_TIME,
  EmploymentType.PART_TIME,
  EmploymentType.CONTRACT,
  EmploymentType.INTERNSHIP,
  EmploymentType.REMOTE,
].map((type) => ({ label: formatEmploymentType(type), value: type }));

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [employmentType, setEmploymentType] = useState(EmploymentType.FULL_TIME);
  const [askForCv, setAskForCv] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<ScreeningQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    authFetch<JobListing>(`/jobs/mine/${id}`)
      .then((job) => {
        setTitle(job.title);
        setCompanyName(job.companyName);
        setDescription(stripHtml(job.description));
        setLocation(job.location);
        setSalaryRange(job.salaryRange ?? '');
        setEmploymentType(job.employmentType as EmploymentType);

        const questions = job.screeningQuestions ?? [];
        const hasResume = questions.some((q) => q.type === ScreeningQuestionType.RESUME);
        setAskForCv(hasResume);
        setCustomQuestions(
          questions
            .filter((q) => q.type !== ScreeningQuestionType.RESUME)
            .map((q, index) => ({ ...q, sortOrder: index })),
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setError('');
    setSaving(true);
    try {
      await authFetch(`/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          companyName,
          description,
          location,
          salaryRange: salaryRange || undefined,
          employmentType,
          screeningQuestions: buildScreeningQuestions(askForCv, customQuestions),
        }),
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update job');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Screen>
      <Card>
        <FieldLabel>Job title</FieldLabel>
        <Input value={title} onChangeText={setTitle} />
        <FieldLabel>Company</FieldLabel>
        <Input value={companyName} onChangeText={setCompanyName} />
        <FieldLabel>Location</FieldLabel>
        <Input value={location} onChangeText={setLocation} />
        <FieldLabel>Salary range</FieldLabel>
        <Input value={salaryRange} onChangeText={setSalaryRange} />
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
        />

        <ScreeningQuestionsEditor
          askForCv={askForCv}
          onAskForCvChange={setAskForCv}
          questions={customQuestions}
          onChange={setCustomQuestions}
        />

        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={handleSave} loading={saving} />
      </Card>
    </Screen>
  );
}
