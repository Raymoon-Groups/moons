import Link from 'next/link';
import type { ReactNode } from 'react';

export function StaticPageShell({
  eyebrow,
  title,
  subtitle,
  updated,
  heroIcon,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updated?: string;
  heroIcon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="li-page-bg">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-[28px] border border-moons-blue/25 bg-gradient-to-br from-[#4a7fd4] via-moons-blue to-[#3568b8] p-8 shadow-[0_18px_48px_rgba(74,127,212,0.28)] md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-moons-navy/25 blur-3xl"
          />

          {heroIcon ? (
            <div
              aria-hidden
              className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 text-white/15 md:block [&>svg]:h-40 [&>svg]:w-40"
            >
              {heroIcon}
            </div>
          ) : null}

          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur-sm">
              {heroIcon ? <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{heroIcon}</span> : null}
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white md:text-[2.6rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
                {subtitle}
              </p>
            ) : null}
            {updated ? (
              <p className="mt-5 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/20">
                Last updated: {updated}
              </p>
            ) : null}
          </div>
        </header>

        {/* Content */}
        <div className="mt-6 space-y-4 md:mt-8">{children}</div>

        {/* CTA */}
        <div className="mt-10 overflow-hidden rounded-[28px] border border-border bg-surface-elevated p-8 text-center shadow-sm md:p-10">
          <p className="text-lg font-bold text-heading md:text-xl">Ready to take the next step?</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-moons-muted">
            Explore thousands of opportunities or reach out to our team — we&apos;re here to help.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="rounded-full bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-moons-blue-dark hover:shadow-md"
            >
              Browse jobs
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-heading transition hover:-translate-y-0.5 hover:border-moons-blue/40 hover:bg-surface-hover"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaticSection({
  heading,
  icon,
  children,
}: {
  heading?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="group rounded-3xl border border-border bg-surface-elevated p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-moons-blue/25 hover:shadow-[0_12px_32px_rgba(74,127,212,0.1)] md:p-8">
      {heading ? (
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-moons-blue/10 text-moons-blue ring-1 ring-moons-blue/20 transition group-hover:bg-moons-blue/15 [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </span>
          ) : null}
          <h2 className="text-lg font-bold text-heading">{heading}</h2>
        </div>
      ) : null}
      <div
        className={`space-y-3 text-[15px] leading-relaxed text-moons-muted [&_a]:font-semibold [&_a]:text-moons-blue [&_li]:marker:text-moons-blue [&_ul]:space-y-2 [&_ul]:pl-1 ${
          heading ? 'mt-4' : ''
        }`}
      >
        {children}
      </div>
    </section>
  );
}
