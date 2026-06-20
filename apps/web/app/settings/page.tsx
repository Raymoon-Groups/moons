'use client';

import Link from 'next/link';
import { SettingsShell } from '@/components/settings/settings-shell';

export default function SettingsPage() {
  return (
    <SettingsShell title="Settings" subtitle="Manage your account and security.">
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/settings/security"
          className="group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-moons-blue hover:shadow-md"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 opacity-80 blur-2xl" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                Account
              </p>
              <h2 className="mt-2 text-lg font-bold text-heading">Security</h2>
              <p className="mt-1 text-sm text-moons-muted">
                Password, Google sign-in, and account access.
              </p>
            </div>
            <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-heading transition group-hover:border-moons-blue">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V7l8-4z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.7 1.7L15 9.9" />
              </svg>
            </span>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-moons-blue">
            Open security
            <span className="transition group-hover:translate-x-0.5">→</span>
          </p>
        </Link>

        <Link
          href="/profile"
          className="group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-moons-blue hover:shadow-md"
        >
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 opacity-90 blur-2xl" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                Profile
              </p>
              <h2 className="mt-2 text-lg font-bold text-heading">Edit profile</h2>
              <p className="mt-1 text-sm text-moons-muted">
                Update your jobseeker or employer profile.
              </p>
            </div>
            <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-heading transition group-hover:border-moons-blue">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 21a6 6 0 0112 0" />
              </svg>
            </span>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-moons-blue">
            Open profile
            <span className="transition group-hover:translate-x-0.5">→</span>
          </p>
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
        <h3 className="text-sm font-bold text-heading">Quick tips</h3>
        <ul className="mt-4 grid gap-3 text-sm text-moons-muted sm:grid-cols-2">
          <li className="rounded-xl border border-border bg-surface/40 px-4 py-3">
            Keep your password unique and use at least 8 characters.
          </li>
          <li className="rounded-xl border border-border bg-surface/40 px-4 py-3">
            Link Google sign-in for faster access across devices.
          </li>
        </ul>
      </section>
    </SettingsShell>
  );
}
