import Image from 'next/image';
import Link from 'next/link';
import { MoonsLogo } from '@/components/moons-logo';

const AUTH_BG_IMAGE =
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80&auto=format&fit=crop';

interface AuthSplitLayoutProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthSplitLayout({ title, subtitle, footer, children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex min-h-[280px] flex-1 flex-col justify-between overflow-hidden p-6 sm:p-8 lg:min-h-screen lg:p-10">
        <Image
          src={AUTH_BG_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#4a7fd4]/55 via-[#94a3b8]/40 to-[#e8f0fa]/70"
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <MoonsLogo size="xl" priority />
          <Link
            href="/"
            className="text-sm font-medium text-moons-silver/90 transition hover:text-white"
          >
            ← Back to Website
          </Link>
        </div>

        <div className="relative z-10 mt-auto max-w-lg pb-4 lg:pb-8">
          <h2 className="text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl">
            Find jobs faster. Apply smarter. Grow anywhere.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-moons-silver/80 sm:text-base">
            From your first application to your dream role — browse openings, build your
            profile, and connect with top recruiters across India.
          </p>
          <span
            className="mt-8 inline-block h-1 w-10 rounded-full bg-moons-blue/60"
            aria-hidden
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10 lg:min-h-screen lg:p-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-8 shadow-[0_8px_40px_rgba(26,39,68,0.08)] sm:p-10">
          <h1 className="text-2xl font-bold text-moons-navy sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-moons-muted sm:text-base">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-moons-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
}
