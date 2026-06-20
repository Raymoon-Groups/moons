'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import indiaMap from '@svg-maps/india';
import { popularLocations } from '@/lib/landing-data';

type CityPin = (typeof popularLocations)[number];
type IndiaState = (typeof indiaMap.locations)[number];

const MAP_VIEWBOX = indiaMap.viewBox; // "0 0 612 696"

function CityMarker({
  city,
  active,
  onEnter,
  onLeave,
}: {
  city: CityPin;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const router = useRouter();
  const href = `/jobs?location=${encodeURIComponent(city.locationQuery)}`;

  function goToJobs() {
    router.push(href);
  }

  return (
    <g
      className="cursor-pointer"
      role="link"
      tabIndex={0}
      aria-label={`${city.city} — ${city.jobs} jobs`}
      onClick={goToJobs}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToJobs();
        }
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <circle
        cx={city.mapX}
        cy={city.mapY}
        r={active ? 18 : 14}
        fill="rgba(255, 117, 85, 0.25)"
        stroke="#ff7555"
        strokeWidth={active ? 3 : 2}
        className="transition-all duration-200"
      />
      <circle
        cx={city.mapX}
        cy={city.mapY}
        r={active ? 7 : 5.5}
        fill="#ff7555"
        className="transition-all duration-200"
      />
      {active && (
        <g pointerEvents="none">
          <rect
            x={city.mapX - 68}
            y={city.mapY - 52}
            width={136}
            height={40}
            rx={8}
            fill="#091e42"
          />
          <text
            x={city.mapX}
            y={city.mapY - 34}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={12}
            fontWeight={700}
          >
            {city.city}
          </text>
          <text
            x={city.mapX}
            y={city.mapY - 20}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={10}
          >
            {city.jobs} jobs
          </text>
        </g>
      )}
    </g>
  );
}

export function IndiaJobsMap() {
  const [activeCity, setActiveCity] = useState<string | null>(null);

  return (
    <div className="mt-6">
      <div className="india-map-card overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface to-surface-elevated p-4 shadow-sm md:p-8">
        <svg
          viewBox={MAP_VIEWBOX}
          className="mx-auto h-auto w-full max-w-xl"
          role="img"
          aria-label="Map of India with job hotspots"
        >
          <g>
            {indiaMap.locations.map((state: IndiaState) => (
              <path
                key={state.id}
                d={state.path}
                fill="#e8f0fe"
                stroke="#93c5fd"
                strokeWidth={0.8}
                className="india-map-state transition-colors duration-200 hover:fill-blue-100"
              />
            ))}
          </g>
          {popularLocations.map((city) => (
            <CityMarker
              key={city.city}
              city={city}
              active={activeCity === city.city}
              onEnter={() => setActiveCity(city.city)}
              onLeave={() => setActiveCity(null)}
            />
          ))}
        </svg>
        <p className="mt-3 text-center text-xs text-moons-muted">
          Click a city pin to browse jobs in that location
        </p>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {popularLocations.map((city) => (
          <Link
            key={city.city}
            href={`/jobs?location=${encodeURIComponent(city.locationQuery)}`}
            className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-xs font-semibold text-moons-silver transition hover:border-moons-blue hover:text-moons-blue"
          >
            {city.city}
            <span className="ml-1.5 font-normal text-moons-muted">{city.jobs}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
