import type { JobListing } from '@/lib/jobs';
import { formatJobExperience } from '@/lib/jobs';
import { formatEmploymentType, isRemoteJob } from '@/lib/job-formatters';

const tagBase = 'rounded-md font-medium ring-1';

const tagStyles = {
  amber: `${tagBase} bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-200`,
  sky: `${tagBase} bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300`,
  emerald: `${tagBase} bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-300`,
  violet: `${tagBase} bg-violet-500/10 text-violet-800 ring-violet-500/20 dark:text-violet-300`,
  blue: `${tagBase} bg-moons-blue/10 text-moons-blue ring-moons-blue/20`,
  muted: `${tagBase} bg-surface text-moons-muted ring-border/80`,
};

export function JobTags({ job, size = 'sm' }: { job: JobListing; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const remote = isRemoteJob(job);
  const experience = formatJobExperience(job);

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`${tagStyles.amber} ${pad}`}>
        {formatEmploymentType(job.employmentType)}
      </span>
      {remote && (
        <span className={`${tagStyles.sky} ${pad}`}>
          Remote
        </span>
      )}
      {experience ? (
        <span className={`${tagStyles.emerald} ${pad}`}>
          {experience}
        </span>
      ) : (
        <span className={`${tagStyles.muted} ${pad}`}>
          Any experience
        </span>
      )}
      {job.location?.trim() && (
        <span className={`${tagStyles.violet} ${pad}`}>
          {job.location.trim()}
        </span>
      )}
      {job.salaryRange?.trim() ? (
        <span className={`${tagStyles.blue} ${pad}`}>
          {job.salaryRange.trim()}
        </span>
      ) : (
        <span className={`${tagStyles.muted} ${pad}`}>
          Salary not specified
        </span>
      )}
    </div>
  );
}
