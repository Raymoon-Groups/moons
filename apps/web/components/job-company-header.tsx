import Link from 'next/link';
import { resolveAssetUrl } from '@/lib/assets';
import { getEmployerCompanyMeta, isPostedByOtherCompany, type JobListing } from '@/lib/jobs';

export function PostedByLine({
  job,
  className = '',
}: {
  job: Pick<JobListing, 'companyName' | 'postedByCompanyName' | 'recruiterId'>;
  className?: string;
}) {
  const poster = job.postedByCompanyName?.trim();
  if (!poster) return null;
  if (poster.toLowerCase() === job.companyName.trim().toLowerCase()) return null;

  return (
    <p className={`text-xs text-moons-muted ${className}`}>
      Posted by{' '}
      {job.recruiterId ? (
        <Link
          href={`/companies/${job.recruiterId}`}
          className="font-semibold text-moons-blue hover:underline"
        >
          {poster}
        </Link>
      ) : (
        <span className="font-semibold text-foreground">{poster}</span>
      )}
    </p>
  );
}

export function JobCompanyHeader({
  job,
  size = 'md',
  variant = 'hiring',
}: {
  job: Pick<
    JobListing,
    | 'companyName'
    | 'postedByCompanyName'
    | 'companyLogoUrl'
    | 'industry'
    | 'companyType'
    | 'companyWebsite'
  >;
  size?: 'sm' | 'md';
  /** hiring = client company on the listing; employer = recruiter profile on MoonsJob */
  variant?: 'hiring' | 'employer';
}) {
  const showRecruiterMeta = variant === 'employer' || !isPostedByOtherCompany(job);
  const logoSrc =
    showRecruiterMeta && job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;
  const logoSize = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';
  const meta = showRecruiterMeta ? getEmployerCompanyMeta(job) : '';
  const website = showRecruiterMeta ? job.companyWebsite : null;

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
          {website ? (
            <a
              href={website}
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
