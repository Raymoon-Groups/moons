'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ConnectionInvitesBanner } from '@/components/network/connection-invites-banner';

const AUTH_PATHS = ['/login', '/register', '/onboarding', '/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (isAuthPage) {
    return (
      <>
        {children}
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <ConnectionInvitesBanner />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
