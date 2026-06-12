import type { JobListing } from '@/lib/jobs';
import { experienceLevelLabel, formatEmploymentType, isRemoteJob } from '@/lib/job-formatters';

export function JobTags({ job, size = 'sm' }: { job: JobListing; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const remote = isRemoteJob(job);

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`rounded-md bg-amber-100 font-medium text-amber-800 ${pad}`}>
        {formatEmploymentType(job.employmentType)}
      </span>
      {remote && (
        <span className={`rounded-md bg-sky-100 font-medium text-sky-700 ${pad}`}>
          Remote
        </span>
      )}
      <span className={`rounded-md bg-emerald-100 font-medium text-emerald-800 ${pad}`}>
        {experienceLevelLabel(job)}
      </span>
    </div>
  );
}
