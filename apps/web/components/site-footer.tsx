'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { MoonsLogo } from '@/components/moons-logo';

const navigationLinks = [
  { label: 'Browse jobs', href: '/jobs' },
  { label: 'Companies', href: '/jobs' },
  { label: 'For employers', href: '/register?role=recruiter' },
  { label: 'Create profile', href: '/register' },
  { label: 'My applications', href: '/applications' },
] as const;

const companyLinks = [
  { label: 'About', href: '/jobs' },
  { label: 'Contact us', href: '/jobs' },
  { label: 'Terms & conditions', href: '/jobs' },
  { label: 'Privacy policy', href: '/jobs' },
  { label: 'Fraud alert', href: '/jobs' },
] as const;

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
] as const;

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  }

  return (
    <footer className="relative overflow-hidden bg-surface px-5 py-14 pb-28 sm:px-8 md:py-20 md:pb-36 lg:px-10">
      <p
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 -translate-x-1/2 translate-y-[28%] select-none whitespace-nowrap text-[clamp(9rem,34vw,19rem)] font-extrabold leading-none tracking-tight text-border"
      >
        moons
      </p>

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-4 md:gap-6 lg:grid-cols-[minmax(300px,2fr)_minmax(400px,3fr)]">
        {/* Left — brand card */}
        <div className="flex min-h-[420px] flex-col justify-between rounded-[28px] border border-moons-blue/25 bg-gradient-to-br from-[#4a7fd4] via-moons-blue to-[#3568b8] p-8 shadow-[0_8px_32px_rgba(74,127,212,0.2)] md:p-10">
          <div>
            <MoonsLogo variant="white" size="xl" />
            <p className="mt-8 max-w-xs text-lg font-medium leading-snug text-white/95">
              India&apos;s job portal — find work, hire talent, grow your career.
            </p>
          </div>

          <div className="mt-10">
            <p className="font-script text-3xl text-white">Stay in touch!</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white transition hover:bg-slate-900"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right — links & newsletter */}
        <div className="relative min-h-[420px] rounded-[28px] border border-border bg-surface-elevated p-8 shadow-sm md:p-10">
          <div
            aria-hidden
            className="absolute -right-3 -top-5 z-10 rotate-6 overflow-hidden rounded-2xl bg-surface-elevated p-2 shadow-[0_20px_40px_rgba(69,126,255,0.45)] md:-right-4 md:-top-6"
          >
            <MoonsLogo href="" variant="white" size="md" />
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="font-script text-2xl text-moons-muted">Navigation</h3>
              <ul className="mt-4 space-y-3">
                {navigationLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] font-medium text-heading transition hover:text-moons-blue"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-script text-2xl text-moons-muted">Company</h3>
              <ul className="mt-4 space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] font-medium text-heading transition hover:text-moons-blue"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="text-sm text-moons-muted">
              © {new Date().getFullYear()} Moons. All rights reserved.
            </p>

            <div className="w-full max-w-md lg:text-right">
              <p className="text-sm text-moons-muted">Jobs move fast.</p>
              <p className="text-lg font-bold text-heading">Stay ahead with Moons.</p>

              <form onSubmit={handleSubscribe} className="relative mt-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="w-full rounded-full border border-border bg-surface-elevated py-3.5 pl-5 pr-32 text-sm text-heading outline-none ring-moons-blue/30 placeholder:text-moons-muted focus:ring-2"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 rounded-full bg-moons-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
                  Subscribe
                </button>
              </form>

              {subscribed && (
                <p className="mt-2 text-xs font-medium text-moons-blue">
                  Thanks — you&apos;re on the list!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
