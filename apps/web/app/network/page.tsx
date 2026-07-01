'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { NetworkPageContent } from '@/components/network/network-page-content';

function NetworkPageInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const initialTab = tab === 'recent' ? 'recent' : 'suggestions';

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
