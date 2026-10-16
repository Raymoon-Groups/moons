import Image from 'next/image';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.moonsjob.app';

export function PlayStoreSection() {
  return (
    <section className="px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl bg-[#07090f] dark:bg-black sm:rounded-[1.5rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(74,127,212,0.18),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-moons-blue/10 blur-3xl"
        />

        <div className="relative grid items-center gap-6 px-5 py-7 sm:px-8 sm:py-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-6 md:px-10 md:py-9">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-moons-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              Now on Google Play
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2.1rem]">
              Your next role,{' '}
              <span className="font-script text-3xl font-normal text-moons-blue sm:text-4xl md:text-[2.6rem]">
                pocket-ready
              </span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              Instant alerts when recruiters reply. One-tap apply. A career OS that
              moves as fast as you do — built for India&apos;s hustle.
            </p>

            <div className="mt-5">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moons-blue/50"
              >
                <Image
                  src="/badge-google-play.png"
                  alt="Get it on Google Play"
                  width={180}
                  height={54}
                  className="h-[48px] w-auto sm:h-[52px]"
                />
              </a>
            </div>
          </div>

          <div className="relative mx-auto flex h-[320px] w-full max-w-[260px] items-center justify-center sm:h-[360px] sm:max-w-[280px] md:h-[380px] md:max-w-[300px]">
            <div
              aria-hidden
              className="absolute inset-12 rounded-[2rem] bg-moons-blue/20 blur-2xl"
            />

            {/* Left card — tucked behind main phone */}
            <div
              aria-hidden
              className="absolute left-[4%] top-[12%] z-[1] flex h-[72%] w-[52%] -translate-x-[18%] -rotate-[18deg] flex-col overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#0c0c0c] shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)]"
            >
              <div className="relative h-[48%] shrink-0 overflow-hidden">
                <Image
                  src="/landing/candidtae-1.png"
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="160px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/20 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-1.5">
                <span className="text-[9px] font-bold text-white/90">Jobs near you</span>
                <span className="h-1.5 w-3/4 rounded-full bg-white/20" />
                <span className="h-1.5 w-1/2 rounded-full bg-white/10" />
                <div className="mt-auto rounded-md bg-moons-blue/40 px-1.5 py-1.5">
                  <span className="block text-center text-[8px] font-semibold text-white/90">
                    Apply
                  </span>
                </div>
              </div>
            </div>

            {/* Right card — tucked behind main phone */}
            <div
              aria-hidden
              className="absolute right-[4%] top-[14%] z-[1] flex h-[72%] w-[52%] translate-x-[18%] rotate-[16deg] flex-col overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#0c0c0c] shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)]"
            >
              <div className="relative h-[48%] shrink-0 overflow-hidden">
                <Image
                  src="/landing/recruiter-2.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="160px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/20 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-1.5">
                <span className="text-[9px] font-bold text-white/90">Hire talent</span>
                <span className="h-1.5 w-2/3 rounded-full bg-white/20" />
                <span className="h-1.5 w-1/2 rounded-full bg-white/10" />
                <div className="mt-auto flex gap-1">
                  <span className="h-6 flex-1 rounded-md bg-white/10" />
                  <span className="h-6 flex-1 rounded-md bg-emerald-500/35" />
                </div>
              </div>
            </div>

            {/* Back card — peek under the phone */}
            <div
              aria-hidden
              className="absolute left-1/2 top-[8%] z-0 flex h-[78%] w-[58%] -translate-x-1/2 scale-[0.92] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111] px-3 py-3 opacity-90 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.7)]"
            >
              <span className="mb-2 text-[8px] font-bold uppercase tracking-wider text-white/45">
                Messages
              </span>
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 shrink-0 rounded-full bg-moons-blue/40" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-1.5 w-14 rounded-full bg-white/25" />
                  <span className="block h-1 w-full rounded-full bg-white/10" />
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="h-6 w-6 shrink-0 rounded-full bg-emerald-400/30" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-1.5 w-12 rounded-full bg-white/20" />
                  <span className="block h-1 w-4/5 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="h-6 w-6 shrink-0 rounded-full bg-white/15" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-1.5 w-10 rounded-full bg-white/15" />
                  <span className="block h-1 w-3/5 rounded-full bg-white/10" />
                </div>
              </div>
            </div>

            <Image
              src="/phone_app.png"
              alt="MoonsJob Android app"
              width={480}
              height={960}
              className="relative z-10 h-auto w-full max-w-[180px] drop-shadow-[0_24px_40px_rgba(0,0,0,0.6)] sm:max-w-[200px] md:max-w-[210px]"
              sizes="(max-width:768px) 200px, 210px"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
