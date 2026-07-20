export type NavIconName =
  | 'home'
  | 'jobs'
  | 'network'
  | 'messaging'
  | 'companies'
  | 'candidates'
  | 'employers';

export type NavLink = {
  label: string;
  href: string;
  icon: NavIconName;
  shortLabel?: string;
};

export const publicNavLinks: NavLink[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Jobs', href: '/jobs', icon: 'jobs' },
  { label: 'Companies', href: '/companies', icon: 'companies' },
  { label: 'For Employers', href: '/register?role=recruiter', icon: 'employers', shortLabel: 'Employers' },
];

export const jobseekerNavLinks: NavLink[] = [
  { label: 'Jobs', href: '/jobs', icon: 'jobs' },
  { label: 'Network', href: '/network', icon: 'network' },
  { label: 'Messaging', href: '/messages', icon: 'messaging', shortLabel: 'Messages' },
  { label: 'Companies', href: '/companies', icon: 'companies' },
];

export const recruiterNavLinks: NavLink[] = [
  { label: 'Jobs', href: '/recruiter/jobs', icon: 'jobs' },
  { label: 'Network', href: '/network', icon: 'network' },
  { label: 'Messaging', href: '/messages', icon: 'messaging', shortLabel: 'Messages' },
  { label: 'Candidates', href: '/recruiter/candidates', icon: 'candidates', shortLabel: 'Candidates' },
];

export function isNavActive(pathname: string, label: string) {
  switch (label) {
    case 'Home':
      return pathname === '/';
    case 'Jobs':
      return (
        pathname === '/jobs' ||
        pathname.startsWith('/jobs/') ||
        pathname.startsWith('/recruiter/jobs')
      );
    case 'Network':
      return pathname.startsWith('/network');
    case 'Messaging':
      return pathname.startsWith('/messages');
    case 'Candidates':
      return pathname.startsWith('/recruiter/candidates');
    case 'Companies':
      return pathname.startsWith('/companies');
    case 'For Employers':
      return pathname.startsWith('/recruiter');
    default:
      return false;
  }
}

export function navLinkShowDot(
  link: NavLink,
  indicators: { network: boolean; messages: boolean },
) {
  if (link.icon === 'network') return indicators.network;
  if (link.icon === 'messaging') return indicators.messages;
  return false;
}

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const base = `h-4 w-4 shrink-0 ${className ?? ''}`;

  switch (name) {
    case 'home':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M3.5 10.5 10 4.5l6.5 6M5 9.5V15a1 1 0 001 1h3v-3.5h2V16h3a1 1 0 001-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'jobs':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6.5 7V5.5A1.5 1.5 0 018 4h4a1.5 1.5 0 011.5 1.5V7M4.5 7h11v8.5a1.5 1.5 0 01-1.5 1.5h-8A1.5 1.5 0 014.5 15.5V7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'network':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="7" cy="6.5" r="2.25" />
          <path d="M2.5 16c0-2.2 2-3.75 4.5-3.75S11.5 13.8 11.5 16M13.5 7.25a2 2 0 100-4 2 2 0 000 4zM16.5 16c0-1.65-1.35-3-3-3" strokeLinecap="round" />
        </svg>
      );
    case 'messaging':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M3.5 5.5A2 2 0 015.5 3.5h9a2 2 0 012 2v6a2 2 0 01-2 2H8l-3.5 2.5V13.5h-1A2 2 0 013.5 11.5v-6z" strokeLinejoin="round" />
        </svg>
      );
    case 'companies':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M3.5 17V6.5l6.5-3.5 6.5 3.5V17M7.5 17v-3.5h5V17M8 9h.01M12 9h.01M8 12h.01M12 12h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'candidates':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="8.5" cy="6.5" r="2.25" />
          <path d="M3.5 16c0-2.5 2.25-4 5-4s5 1.5 5 4M14 8.5h3M15.5 7v3" strokeLinecap="round" />
        </svg>
      );
    case 'employers':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 17V8l6-3.5L16 8v9M7.5 17v-3h5v3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 10.5h4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
