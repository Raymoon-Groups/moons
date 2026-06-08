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
  return (
    <article className="group flex gap-3 border-b border-slate-100 bg-white px-4 py-3.5 transition last:border-b-0 hover:bg-[#f4f8ff]">
      <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded border border-slate-200">
        <Image src={job.logo} alt={job.company} fill className="object-cover" sizes="44px" />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/jobs/${job.id}`}
          className="text-[15px] font-semibold text-moons-navy hover:text-moons-blue hover:underline"
        >
          {job.title}
        </Link>
        <p className="text-sm text-slate-600">{job.company}</p>
        <p className="mt-1 text-xs text-moons-muted">
          {job.experience} · {job.location} · {job.salary}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {job.skills.map((s) => (
            <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end justify-between sm:flex">
        <span className="text-[11px] text-slate-400">{job.posted}</span>
        <Link
          href={`/jobs/${job.id}`}
          className="rounded border border-moons-blue px-3 py-1 text-xs font-bold text-moons-blue hover:bg-moons-blue hover:text-white"
        >
          Apply
        </Link>
      </div>
    </article>
  );
}
