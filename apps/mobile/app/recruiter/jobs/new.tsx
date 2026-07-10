import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { EmploymentType } from '@moons/shared';
import { SelectField } from '@/components/profile/select-field';
import { LoadingScreen } from '@/components/loading-screen';
import { Card, ErrorText, FieldLabel, Input, PrimaryButton, Screen } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import { formatEmploymentType } from '@/lib/format';
import type { JobListing, Profile } from '@/lib/types';

const EMPLOYMENT_OPTIONS = [
  EmploymentType.FULL_TIME,
  EmploymentType.PART_TIME,
  EmploymentType.CONTRACT,
  EmploymentType.INTERNSHIP,
  EmploymentType.REMOTE,
].map((type) => ({ label: formatEmploymentType(type), value: type }));

export default function NewJobScreen() {
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [employmentType, setEmploymentType] = useState(EmploymentType.FULL_TIME);
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
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton label={loading ? 'Posting…' : 'Publish job'} onPress={handleSubmit} loading={loading} />
      </Card>
    </Screen>
  );
}

