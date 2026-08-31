'use client';

import Link from 'next/link';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminHomePage() {
  return (
    <AdminShell>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            href: '/admin/blogs',
            title: 'Blogs',
            desc: 'Create, edit, publish and delete blog posts.',
          },
          {
            href: '/admin/newsletter',
            title: 'Newsletter',
            desc: 'View emails collected from the website footer.',
          },
          {
            href: '/admin/announcements',
            title: 'Announcements',
            desc: 'Set the landing-page popup (shows for 5 seconds).',
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm transition hover:border-moons-blue/40"
          >
            <h2 className="text-lg font-bold text-foreground">{card.title}</h2>
            <p className="mt-2 text-sm text-moons-muted">{card.desc}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
