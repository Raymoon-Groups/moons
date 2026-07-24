import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { EmploymentType } from '@moons/shared';
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
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setError('');
    setSaving(true);
    try {
      await authFetch(`/jobs/mine/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          companyName,
          description,
          location,
          salaryRange: salaryRange || undefined,
          employmentType,
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
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={handleSave} loading={saving} />
      </Card>
    </Screen>
  );
}

