import { router, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { EmploymentType, type ScreeningQuestion } from '@moons/shared';
import {
  ScreeningQuestionsEditor,
  buildScreeningQuestions,
} from '@/components/recruiter/screening-questions-editor';
import { SelectField } from '@/components/profile/select-field';
import { RichTextField } from '@/components/rich-text-field';
import { LoadingScreen } from '@/components/loading-screen';
import { Card, ErrorText, FieldLabel, Input, PrimaryButton, Screen } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import {
  EXPERIENCE_SELECT_OPTIONS,
  experienceValueToJobYears,
} from '@/lib/experience-options';
import { formatEmploymentType } from '@/lib/format';
import { isDescriptionValid } from '@/lib/rich-text';
import type { JobListing, Profile } from '@/lib/types';

const EMPLOYMENT_OPTIONS = [
  EmploymentType.FULL_TIME,
  EmploymentType.PART_TIME,
  EmploymentType.CONTRACT,
  EmploymentType.INTERNSHIP,
  EmploymentType.REMOTE,
].map((type) => ({ label: formatEmploymentType(type), value: type }));

export default function NewJobScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [employmentType, setEmploymentType] = useState(EmploymentType.FULL_TIME);
  const [experienceBand, setExperienceBand] = useState('');
  const [askForCv, setAskForCv] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<ScreeningQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Post a job' });
  }, [navigation]);

  useEffect(() => {
    authFetch<Profile>('/profiles/me')
      .then((profile) => {
        setCompanyName(profile.currentCompany ?? '');
        setLocation(profile.location ?? '');
      })
      .catch(() => undefined)
      .finally(() => setProfileLoading(false));
  }, []);

  async function handleSubmit() {
    setError('');
    if (title.trim().length < 3) {
      setError('Job title must be at least 3 characters.');
      return;
    }
    if (companyName.trim().length < 2) {
      setError('Company name is required.');
      return;
    }
    if (!location.trim()) {
      setError('Location is required.');
      return;
    }
    if (!isDescriptionValid(description, 20)) {
      setError('Job description must be at least 20 characters.');
      return;
    }
    setLoading(true);
    const exp = experienceValueToJobYears(experienceBand);
    try {
      const job = await authFetch<JobListing>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          companyName: companyName.trim(),
          description,
          location: location.trim(),
          employmentType,
          salaryRange: salaryRange || undefined,
          ...(exp.minExperienceYears != null
            ? {
                minExperienceYears: exp.minExperienceYears,
                maxExperienceYears: exp.maxExperienceYears,
              }
            : {}),
          screeningQuestions: buildScreeningQuestions(askForCv, customQuestions),
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
        <SelectField
          label="Experience required"
          value={experienceBand}
          options={EXPERIENCE_SELECT_OPTIONS}
          onChange={setExperienceBand}
          placeholder="Not specified"
        />
        <RichTextField value={description} onChange={setDescription} />

        <ScreeningQuestionsEditor
          askForCv={askForCv}
          onAskForCvChange={setAskForCv}
          questions={customQuestions}
          onChange={setCustomQuestions}
        />

        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton label={loading ? 'Posting…' : 'Publish job'} onPress={handleSubmit} loading={loading} />
      </Card>
    </Screen>
  );
}
