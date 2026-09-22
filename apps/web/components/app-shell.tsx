'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SiteBottomNav } from '@/components/nav/site-bottom-nav';
import { ConnectionInvitesBanner } from '@/components/network/connection-invites-banner';
import { AppToaster } from '@/components/ui/app-toaster';

const AUTH_PATHS = ['/login', '/register', '/onboarding', '/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');

  const toastStack = (
    <div className="pointer-events-none fixed right-3 top-[5.75rem] z-50 flex w-[min(100vw-1.5rem,22rem)] flex-col gap-3 sm:right-4 sm:top-24 lg:right-[max(1rem,calc((100vw-80rem)/2+1rem))]">
      {!isAuthPage && !isAdminPage ? <ConnectionInvitesBanner /> : null}
      <AppToaster />
    </div>
  );

  if (isAuthPage || isAdminPage) {
    return (
      <>
        {toastStack}
        {children}
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      {toastStack}
      <main className="flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-28">
        {children}
      </main>
      <SiteFooter />
      <SiteBottomNav />
    </>
  );
}
