'use client';

import type { ReactNode } from 'react';
import { formatEmploymentType, isRemoteJob } from '@/lib/job-formatters';
import { formatExperienceRequiredDetail, type JobListing } from '@/lib/jobs';

export type JobDetailItem = {
  label: string;
  value: string;
};

export function getJobDetailItems(job: JobListing): JobDetailItem[] {
  const experience = formatExperienceRequiredDetail(job);
  const remote = isRemoteJob(job);
  const hybrid = /hybrid/i.test(job.location);

  return [
    { label: 'Location', value: job.location?.trim() || 'Not specified' },
    { label: 'Employment type', value: formatEmploymentType(job.employmentType) },
    { label: 'Experience required', value: experience ?? 'Not specified' },
    { label: 'Salary', value: job.salaryRange?.trim() || 'Not specified' },
    {
      label: 'Work mode',
      value: remote ? 'Remote' : hybrid ? 'Hybrid' : 'On-site',
    },
  ];
}

function DetailRow({ label, value }: JobDetailItem) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-[9.5rem] shrink-0 font-medium text-moons-muted">{label}</dt>
      <dd className="min-w-0 text-foreground">{value}</dd>
    </div>
  );
}

export function JobKeyDetailsGrid({ job }: { job: JobListing }) {
  const items = getJobDetailItems(job);

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <DetailRow key={item.label} {...item} />
      ))}
    </dl>
  );
}

export function JobKeyDetailsList({
  job,
  iconForLabel,
}: {
  job: JobListing;
  iconForLabel?: (label: string) => ReactNode;
}) {
  const items = getJobDetailItems(job);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2.5 text-sm text-foreground">
          {iconForLabel && (
            <span className="mt-0.5 shrink-0 text-moons-muted">{iconForLabel(item.label)}</span>
          )}
          <span>
            <span className="font-medium text-moons-navy">{item.label}:</span> {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function formatJobListMeta(job: JobListing): string {
  const parts: string[] = [];
  if (job.location?.trim()) parts.push(job.location.trim());
  if (job.salaryRange?.trim()) parts.push(job.salaryRange.trim());
  return parts.join(' · ');
}
