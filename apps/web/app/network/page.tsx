'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { NetworkPageContent, type NetworkTabId } from '@/components/network/network-page-content';

const VALID_TABS = new Set<NetworkTabId>([
  'connections',
  'pending',
  'sent',
  'suggestions',
  'recent',
]);

function NetworkPageInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const initialTab =
    tab && VALID_TABS.has(tab as NetworkTabId) ? (tab as NetworkTabId) : 'connections';

  return <NetworkPageContent initialTab={initialTab} />;
}

export default function NetworkPage() {
  return (
    <Suspense
      fallback={
        <div className="li-page-bg flex min-h-[50vh] items-center justify-center text-sm text-moons-muted">
          Loading network…
        </div>
      }
    >
      <NetworkPageInner />
    </Suspense>
  );
}
