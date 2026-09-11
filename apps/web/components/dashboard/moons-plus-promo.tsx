'use client';

type MoonsPlusAudience = 'candidate' | 'recruiter';

const COPY: Record<
  MoonsPlusAudience,
  { subtitle: string; chips: string[] }
> = {
  candidate: {
    subtitle: 'Premium tools to stand out to recruiters',
    chips: ['Boost profile', 'Smart tips', 'Fast apply'],
  },
  recruiter: {
    subtitle: 'Premium tools to hire faster and smarter',
    chips: ['Featured jobs', 'AI screen', 'Priority'],
  },
};

const BUBBLES = [
  { className: 'moons-plus-bubble b1', style: { left: '8%', top: '18%', width: 14, height: 14 } },
  { className: 'moons-plus-bubble b2', style: { left: '22%', top: '62%', width: 9, height: 9 } },
  { className: 'moons-plus-bubble b3', style: { left: '38%', top: '12%', width: 7, height: 7 } },
  { className: 'moons-plus-bubble b4', style: { left: '55%', top: '70%', width: 12, height: 12 } },
  { className: 'moons-plus-bubble b5', style: { left: '68%', top: '22%', width: 8, height: 8 } },
  { className: 'moons-plus-bubble b6', style: { left: '78%', top: '58%', width: 16, height: 16 } },
  { className: 'moons-plus-bubble b7', style: { left: '88%', top: '30%', width: 6, height: 6 } },
  { className: 'moons-plus-bubble b8', style: { left: '14%', top: '78%', width: 10, height: 10 } },
] as const;

/** Premium teaser card — richer floating motion for both dashboards. */
export function MoonsPlusPromo({ audience }: { audience: MoonsPlusAudience }) {
  const copy = COPY[audience];

  return (
    <div className="moons-plus-card relative overflow-hidden rounded-2xl border border-moons-blue/30 bg-gradient-to-br from-moons-blue/[0.07] via-surface-elevated to-moons-navy/[0.06]">
      {/* Ambient layers */}
      <div className="moons-plus-sheen pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div className="moons-plus-aurora pointer-events-none absolute inset-0 z-0" aria-hidden />
      <div
        className="moons-plus-orb pointer-events-none absolute -right-10 -top-10 z-0 h-44 w-44 rounded-full bg-moons-blue/20 blur-[2px]"
        aria-hidden
      />
      <div
        className="moons-plus-orb-slow pointer-events-none absolute -bottom-14 right-10 z-0 h-32 w-32 rounded-full bg-moons-navy/15 blur-[1px]"
        aria-hidden
      />
      <div
        className="moons-plus-orb-alt pointer-events-none absolute -left-8 bottom-0 z-0 h-24 w-24 rounded-full bg-moons-blue/12"
        aria-hidden
      />

      {/* Floating bubbles */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {BUBBLES.map((bubble) => (
          <span
            key={bubble.className}
            className={bubble.className}
            style={{
              left: bubble.style.left,
              top: bubble.style.top,
              width: bubble.style.width,
              height: bubble.style.height,
            }}
          />
        ))}
        <span className="moons-plus-sparkle s1" />
        <span className="moons-plus-sparkle s2" />
        <span className="moons-plus-sparkle s3" />
        <span className="moons-plus-ring r1" />
        <span className="moons-plus-ring r2" />
      </div>

      <div className="relative z-[2] flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="moons-plus-icon relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-moons-blue to-moons-navy text-lg font-black text-white shadow-lg shadow-moons-blue/35">
            <span className="moons-plus-icon-ring" aria-hidden />
            <span className="moons-plus-moon relative z-[1] inline-block" aria-hidden>
              ☽
            </span>
          </div>
          <div>
            <p className="moons-plus-title font-script text-2xl text-moons-blue">Moons Plus</p>
            <p className="text-sm text-moons-muted">{copy.subtitle}</p>
          </div>
        </div>
        <span className="moons-plus-badge inline-flex w-fit items-center gap-2 rounded-full border border-moons-blue/35 bg-moons-blue/12 px-4 py-2 text-sm font-semibold text-heading backdrop-blur-[2px]">
          <span className="moons-plus-dot h-1.5 w-1.5 rounded-full bg-moons-blue" aria-hidden />
          Coming soon
        </span>
      </div>

      <div className="relative z-[2] border-t border-moons-blue/15 bg-gradient-to-r from-moons-blue/[0.06] via-surface/50 to-transparent px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {copy.chips.map((chip, index) => (
            <span
              key={chip}
              className={`moons-plus-chip c${index + 1} inline-flex items-center rounded-full border border-moons-blue/20 bg-surface-elevated/80 px-2.5 py-1 text-[11px] font-semibold text-moons-blue shadow-sm`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
