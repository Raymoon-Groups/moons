'use client';

import { Suspense } from 'react';
import { AdminLoginForm } from './admin-login-form';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="li-page-bg flex min-h-screen items-center justify-center text-sm text-moons-muted">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
