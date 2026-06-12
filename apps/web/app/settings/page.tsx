'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-moons-blue hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-moons-navy">Settings</h1>
      <p className="mt-1 text-sm text-moons-muted">Manage your account and security</p>

      <div className="mt-6 space-y-3">
        <Link
          href="/settings/security"
          className="block rounded-lg border border-border bg-surface-elevated p-5 shadow-sm hover:border-moons-blue"
        >
          <p className="font-semibold text-moons-navy">Security</p>
          <p className="mt-1 text-sm text-moons-muted">
            Password, Google sign-in, and account access
          </p>
        </Link>
        <Link
          href="/profile"
          className="block rounded-lg border border-border bg-surface-elevated p-5 shadow-sm hover:border-moons-blue"
        >
          <p className="font-semibold text-moons-navy">Profile</p>
          <p className="mt-1 text-sm text-moons-muted">
            Update your jobseeker or employer profile
          </p>
        </Link>
      </div>
    </div>
  );
}
