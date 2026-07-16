'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SiteBottomNav } from '@/components/nav/site-bottom-nav';
import { ConnectionInvitesBanner } from '@/components/network/connection-invites-banner';

const AUTH_PATHS = ['/login', '/register', '/onboarding', '/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <ConnectionInvitesBanner />
      <main className="flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-28">
        {children}
      </main>
      <SiteFooter />
      <SiteBottomNav />
    </>
  );
}
