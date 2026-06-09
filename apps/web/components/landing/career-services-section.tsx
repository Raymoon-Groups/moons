import Image from 'next/image';
import Link from 'next/link';
import { careerServices } from '@/lib/landing-data';

function WaveTop() {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="block h-10 w-full md:h-16"
      aria-hidden
    >
      <path
        fill="#12151c"
        d="M0,40 C320,80 640,10 960,45 C1200,72 1320,55 1440,38 L1440,80 L0,80 Z"
      />
    </svg>
  );
}

function WaveBottom() {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="block h-10 w-full md:h-16"
      aria-hidden
    >
      <path
        fill="#f4f6f9"
        d="M0,28 C360,0 720,65 1080,32 C1260,18 1360,42 1440,55 L1440,80 L0,80 Z"
      />
    </svg>
  );
}

export function CareerServicesSection() {
  return (
    <div>
      <WaveTop />

      <section className="relative overflow-hidden bg-[#12151c] px-4 pb-20 pt-6 md:pb-28 md:pt-10">
        <div
          aria-hidden
          className="absolute -left-16 top-8 h-40 w-40 rounded-[40%] bg-moons-orange/90 blur-sm md:h-52 md:w-52"
        />
        <div
          aria-hidden
          className="absolute bottom-24 left-8 hidden h-24 w-24 rounded-full border-[6px] border-white/20 md:block"
        />
        <div
          aria-hidden
          className="absolute -right-10 bottom-32 h-48 w-48 rounded-full border-[14px] border-white/15 md:h-64 md:w-64"
        />
        <div
          aria-hidden
          className="absolute right-16 top-16 grid grid-cols-4 gap-2 opacity-20"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-moons-orange" />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xl font-medium text-white/90 md:text-2xl">
                Free tools to help you
              </p>
              <p className="mt-1 text-2xl font-bold text-white md:text-4xl">
                Explore{' '}
                <span className="text-moons-orange">Career Services</span>
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex w-fit items-center gap-3 rounded-full bg-moons-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-orange-dark"
            >
              All Services
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">
                →
              </span>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {careerServices.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl sm:aspect-[3/4]"
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="flex items-center gap-2 text-sm font-medium text-moons-orange">
                    <span className="inline-block h-0.5 w-5 bg-moons-orange" />
                    {service.category}
                  </p>
                  <h3 className="mt-3 text-xl font-bold leading-snug text-white md:text-2xl">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/75">{service.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WaveBottom />
    </div>
  );
}
