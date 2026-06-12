'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function JobDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    const qs = new URLSearchParams(searchParams.toString());
    qs.set('job', id);
    router.replace(`/jobs?${qs.toString()}`);
  }, [id, router, searchParams]);

  return <div className="p-8 text-center text-sm text-moons-muted">Loading job…</div>;
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-moons-muted">Loading…</div>}>
      <JobDetailRedirect />
    </Suspense>
  );
}
