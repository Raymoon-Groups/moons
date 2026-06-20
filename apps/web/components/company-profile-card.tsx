import Link from 'next/link';
import { JobCompanyHeader, PostedByLine } from '@/components/job-company-header';
import type { JobListing } from '@/lib/jobs';

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-1 text-sm text-moons-silver">{value}</p>
    </div>
  );
}

export function CompanyProfileCard({
  job,
  recruiterId,
}: {
  job: Pick<
    JobListing,
    | 'companyName'
    | 'postedByCompanyName'
    | 'companyLogoUrl'
    | 'industry'
    | 'companyType'
    | 'companyWebsite'
    | 'companySize'
    | 'companyLocation'
    | 'officeAddress'
    | 'companySummary'
  >;
  recruiterId?: string;
}) {
  const hasDetails =
    job.companySize ||
    job.companyLocation ||
    job.officeAddress ||
    job.companySummary;

  if (!hasDetails && !job.industry && !job.companyType) {
    return null;
  }

  const poster = job.postedByCompanyName?.trim();
  const hiringCompany = job.companyName.trim();
  const postedByOther =
    !!poster && poster.toLowerCase() !== hiringCompany.toLowerCase();

  return (
    <section className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm">
      <h2 className="text-base font-bold text-heading">
        {postedByOther ? 'About the employer' : 'About the company'}
      </h2>
      {postedByOther && (
        <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-moons-muted">
          This role is listed for{' '}
          <span className="font-semibold text-foreground">{hiringCompany}</span>. Profile below is
          the posting employer on MoonsJob.
        </p>
      )}
      <div className="mt-4">
        <JobCompanyHeader
          job={{
            ...job,
            companyName: postedByOther && poster ? poster : job.companyName,
          }}
          variant="employer"
          size="md"
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Detail label="Company size" value={job.companySize} />
        <Detail label="Head office city" value={job.companyLocation} />
        <div className="sm:col-span-2">
          <Detail label="Office address" value={job.officeAddress} />
        </div>
      </div>
      {job.companySummary && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {job.companySummary}
        </p>
      )}
      {recruiterId && (
        <Link
          href={`/companies/${recruiterId}`}
          className="mt-4 inline-block text-sm font-semibold text-moons-blue hover:underline"
        >
          View full company profile →
        </Link>
      )}
    </section>
  );
}
