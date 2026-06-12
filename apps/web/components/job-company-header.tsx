import { resolveAssetUrl } from '@/lib/assets';
import type { JobListing } from '@/lib/jobs';

export function JobCompanyHeader({
  job,
  size = 'md',
}: {
  job: Pick<
    JobListing,
    'companyName' | 'companyLogoUrl' | 'industry' | 'companyType' | 'companyWebsite'
  >;
  size?: 'sm' | 'md';
}) {
  const logoSrc = job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;
  const logoSize = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';
  const meta = [job.industry, job.companyType].filter(Boolean).join(' · ');

  return (
    <div className="flex items-start gap-3">
      <div
        className={`${logoSize} shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated`}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={`${job.companyName} logo`}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-sm font-bold text-moons-muted">
            {job.companyName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <p className={`font-semibold text-moons-silver ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>
          {job.companyWebsite ? (
            <a
              href={job.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-moons-blue hover:underline"
            >
              {job.companyName}
            </a>
          ) : (
            job.companyName
          )}
        </p>
        {meta && <p className="text-xs text-moons-muted">{meta}</p>}
      </div>
    </div>
  );
}
