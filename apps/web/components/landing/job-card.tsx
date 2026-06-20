import Image from 'next/image';
import Link from 'next/link';

export function JobCard({
  job,
}: {
  job: {
    id: string;
    title: string;
    company: string;
    logo: string;
    experience: string;
    location: string;
    salary: string;
    skills: readonly string[];
    posted: string;
    type: string;
  };
}) {
  const tag = job.skills[0] ?? job.type;

  return (
    <article className="flex min-h-[220px] flex-col justify-between rounded-2xl bg-surface p-6 md:p-8">
      <div>
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-elevated p-1.5 md:h-14 md:w-14">
            <Image
              src={job.logo}
              alt={`${job.company} logo`}
              fill
              className="object-contain"
              sizes="56px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold leading-snug text-heading md:text-2xl">
              {job.title}{' '}
              <span className="text-base font-normal text-moons-muted md:text-lg">
                ({job.location} · {job.type})
              </span>
            </h3>
          </div>
        </div>

        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-moons-silver">
          <span className="h-2 w-2 rounded-full bg-moons-blue " />
          {tag}
        </span>

        <p className="mt-4 text-sm leading-relaxed text-moons-muted md:text-base">
          {job.company} · {job.experience} · {job.salary}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Link
          href={`/jobs/${job.id}`}
          className="rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
        >
          Apply Now
        </Link>
        <span className="text-xs text-moons-muted">{job.posted}</span>
      </div>
    </article>
  );
}
