'use client';

import { Suspense } from 'react';
import { RecruiterCandidatesBrowse } from '@/components/recruiter/recruiter-candidates-browse';

export default function RecruiterCandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-moons-muted">
          Loading candidates…
        </div>
      }
    >
      <RecruiterCandidatesBrowse />
    </Suspense>
  );
}
