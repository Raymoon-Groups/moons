import Image from 'next/image';
import Link from 'next/link';
import { MoonsLogo } from '@/components/moons-logo';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="relative flex min-h-[200px] flex-1 flex-col justify-between overflow-hidden p-4 sm:min-h-[280px] sm:p-8 lg:min-h-dvh lg:p-10">
        <Image
          src={AUTH_BG_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1a2744]/70 via-[#1a2744]/35 to-[#1a2744]/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <MoonsLogo size="lg" priority variant="onWhite" />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs font-medium text-white/90 drop-shadow-sm transition hover:text-white sm:text-sm"
            >
              <span className="sm:hidden">← Home</span>
              <span className="hidden sm:inline">← Back to Website</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-auto hidden max-w-lg pb-4 sm:block lg:pb-8">
          <h2 className="text-2xl font-bold leading-snug text-white drop-shadow-lg sm:text-3xl lg:text-4xl">
            Find jobs faster. Apply smarter. Grow anywhere.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/90 drop-shadow-md sm:text-base">
            From your first application to your dream role — browse openings, build your
            profile, and connect with top recruiters across India.
          </p>
          <span
            className="mt-8 inline-block h-1 w-10 rounded-full bg-moons-blue/60"
            aria-hidden
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-4 sm:p-10 lg:min-h-dvh lg:p-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-5 shadow-[0_8px_40px_rgba(26,39,68,0.08)] sm:rounded-3xl sm:p-10">
          <h1 className="text-xl font-bold text-heading sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-moons-muted sm:text-base">{subtitle}</p>
          <div className="mt-6 sm:mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-moons-muted sm:mt-8">{footer}</div>
        </div>
      </div>
    </div>
  );
}
