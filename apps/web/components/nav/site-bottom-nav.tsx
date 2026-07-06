'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';
import { useNavIndicators } from '@/lib/nav-indicators';
import {
  type NavLink,
  NavIcon,
  isNavActive,
  jobseekerNavLinks,
  navLinkShowDot,
  publicNavLinks,
  recruiterNavLinks,
} from '@/components/nav/nav-shared';

function BottomNavPill({
  link,
  active,
  showDot,
}: {
  link: NavLink;
  active: boolean;
  showDot?: boolean;
}) {
  const displayLabel = link.shortLabel ?? link.label;

  return (
    <Link
      href={link.href}
      title={link.label}
      className={`relative shrink-0 rounded-full px-4 py-3 text-[15px] font-semibold transition sm:px-6 sm:text-base ${
        active
          ? 'bg-moons-blue/12 text-moons-blue shadow-[inset_0_0_0_1px_rgba(74,127,212,0.18)]'
          : 'text-heading hover:bg-surface/60 hover:text-moons-blue'
      }`}
    >
      <span className="flex items-center gap-2 whitespace-nowrap">
        <NavIcon name={link.icon} className={`h-5 w-5 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} />
        <span>{displayLabel}</span>
      </span>
      {showDot && (
        <span
          className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-moons-blue ring-2 ring-surface-elevated"
          aria-hidden
        />
      )}
    </Link>
  );
}

function useFooterInView() {
  const pathname = usePathname();
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) {
      setFooterInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      {
        threshold: 0,
        rootMargin: '0px 0px -88px 0px',
      },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [pathname]);

  return footerInView;
}

export function SiteBottomNav() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const { indicators } = useNavIndicators();

  const links =
    ready && user?.role === UserRole.RECRUITER
      ? recruiterNavLinks
      : ready && user?.role === UserRole.CANDIDATE
        ? jobseekerNavLinks
        : publicNavLinks;

  const showDots = ready && Boolean(user);
  const footerInView = useFooterInView();

  return (
    <nav
      aria-label="Main navigation"
      aria-hidden={footerInView}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 transition-[transform,opacity] duration-300 ease-out ${
        footerInView ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div
        className={`flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-border/60 bg-surface-elevated/90 p-2 shadow-[0_8px_32px_rgba(26,39,68,0.12)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-surface-elevated/85 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] [&::-webkit-scrollbar]:hidden ${
          footerInView ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        {links.map((link) => (
          <BottomNavPill
            key={link.label}
            link={link}
            active={isNavActive(pathname, link.label)}
            showDot={showDots ? navLinkShowDot(link, indicators) : false}
          />
        ))}
      </div>
    </nav>
  );
}
