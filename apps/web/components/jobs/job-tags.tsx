import type { JobListing } from '@/lib/jobs';
import { formatJobExperience } from '@/lib/jobs';
import { formatEmploymentType, isRemoteJob } from '@/lib/job-formatters';

export function JobTags({ job, size = 'sm' }: { job: JobListing; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const remote = isRemoteJob(job);
  const experience = formatJobExperience(job);

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
      {experience ? (
        <span className={`rounded-md bg-emerald-100 font-medium text-emerald-800 ${pad}`}>
          {experience}
        </span>
      ) : (
        <span className={`rounded-md bg-surface font-medium text-moons-muted ${pad}`}>
          Any experience
        </span>
      )}
      {job.location?.trim() && (
        <span className={`rounded-md bg-violet-100 font-medium text-violet-800 ${pad}`}>
          {job.location.trim()}
        </span>
      )}
      {job.salaryRange?.trim() ? (
        <span className={`rounded-md bg-blue-100 font-medium text-blue-800 ${pad}`}>
          {job.salaryRange.trim()}
        </span>
      ) : (
        <span className={`rounded-md bg-surface font-medium text-moons-muted ${pad}`}>
          Salary not specified
        </span>
      )}
    </div>
  );
}
