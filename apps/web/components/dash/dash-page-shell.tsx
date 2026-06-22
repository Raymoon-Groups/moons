import Link from 'next/link';
import type { ReactNode } from 'react';

export function DashBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated px-3 py-1.5 text-sm font-medium text-moons-blue shadow-sm transition hover:border-moons-blue/30 hover:bg-surface-hover"
    >
      {children}
    </Link>
  );
}

export function DashPageLayout({
  backLink,
  children,
  sidebar,
  maxWidth = 'max-w-5xl',
  wide,
}: {
  backLink?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  maxWidth?: string;
  wide?: boolean;
}) {
  const gridClass = wide
    ? 'lg:grid-cols-[minmax(0,1fr)_300px]'
    : 'lg:grid-cols-[minmax(0,1fr)_288px]';

  return (
    <div className="dash-page">
      <div className={`mx-auto ${maxWidth} px-4 py-8 sm:px-6`}>
        {backLink}
        <div className={`mt-6 grid gap-6 lg:items-start ${sidebar ? gridClass : ''}`}>
          <div className="min-w-0 space-y-5">{children}</div>
          {sidebar ? <aside className="space-y-4 lg:sticky lg:top-24">{sidebar}</aside> : null}
        </div>
      </div>
    </div>
  );
}

export function DashPageHero({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  action,
  children,
}: {
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="dash-hero">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-moons-blue/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-moons-navy/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moons-blue ring-1 ring-moons-blue/20">
            {eyebrowIcon}
            {eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-heading md:text-3xl">{title}</h1>
          {subtitle ? (
            <div className="mt-2 max-w-xl text-sm leading-relaxed text-moons-muted">{subtitle}</div>
          ) : null}
          {children}
        </div>
        {action}
      </div>
    </section>
  );
}

export function DashContentCard({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dash-content-card ${className}`}>
      {title ? <h2 className="text-base font-bold text-heading">{title}</h2> : null}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

export function DashSidebarPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dash-sidebar-card">
      <h3 className="text-sm font-bold text-heading">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function DashQuickLinks({
  links,
}: {
  links: { href: string; label: string; primary?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className={
            link.primary
              ? 'rounded-xl bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md'
              : 'rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover'
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function DashTipsList({ title = 'Tips', items }: { title?: string; items: string[] }) {
  return (
    <div className="dash-tips-card">
      <h3 className="text-sm font-bold text-heading">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-moons-muted">
        {items.map((item, i) => (
          <li key={item} className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashLoadingPage({ message }: { message: string }) {
  return (
    <div className="dash-page flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-moons-blue/20 border-t-moons-blue" />
        <p className="mt-4 text-sm text-moons-muted">{message}</p>
      </div>
    </div>
  );
}

export function DashErrorCard({
  message,
  backHref,
  backLabel,
}: {
  message: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="dash-page min-h-[50vh] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-border/70 bg-surface-elevated p-8 text-center shadow-sm">
        <p className="text-sm text-red-600">{message}</p>
        <div className="mt-4 flex justify-center">
          <DashBackLink href={backHref}>{backLabel}</DashBackLink>
        </div>
      </div>
    </div>
  );
}

export function DashEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-moons-blue/35 bg-gradient-to-b from-moons-blue/[0.04] to-surface-elevated p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-moons-blue/10 ring-1 ring-moons-blue/20">
        {icon}
      </div>
      <p className="mt-5 text-base font-semibold text-heading">{title}</p>
      <p className="mt-2 text-sm text-moons-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function DashErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
      {message}
    </p>
  );
}

export function DashPrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-xl bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
