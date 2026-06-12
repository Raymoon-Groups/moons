'use client';

import { Suspense } from 'react';
import { JobsBrowsePage } from '@/components/jobs/jobs-browse-page';

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-moons-muted">Loading…</div>}>
      <JobsBrowsePage />
    </Suspense>
  );
}
