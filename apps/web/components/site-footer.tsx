import Link from 'next/link';

const links = {
  'Jobs by category': [
    'IT jobs', 'Sales jobs', 'Finance jobs', 'HR jobs', 'Engineering jobs',
  ],
  'Jobs by city': [
    'Jobs in Bangalore', 'Jobs in Mumbai', 'Jobs in Delhi', 'Jobs in Hyderabad',
  ],
  'For employers': [
    'Post a job', 'Employer login', 'Recruitment solutions',
  ],
  'Jobseekers': [
    'Create profile', 'Job alerts', 'Browse all jobs', 'Register free',
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-moons-navy">
                {title}
              </h3>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="/jobs"
                      className="text-xs text-moons-muted hover:text-moons-blue hover:underline"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold text-moons-navy">moons</span>
            <span className="rounded bg-moons-blue px-1 py-0.5 text-[9px] font-bold text-white">
              JOBS
            </span>
          </Link>
          <p className="text-[11px] text-moons-muted">
            © {new Date().getFullYear()} Moons. All rights reserved. · Privacy · Terms · Fraud alert
          </p>
        </div>
      </div>
    </footer>
  );
}
