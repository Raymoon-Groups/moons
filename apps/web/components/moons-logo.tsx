'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const MOONS_LOGO_SRC = '/moonsjob_logo.png';
/** White logo for dark theme — same layout/size as light logo */
export const MOONS_LOGO_WHITE_SRC = '/moonsjob_logo_dark.png';
/** Logo on a white plate — footer / forced-contrast only */
export const MOONS_LOGO_ON_WHITE_SRC = '/white_bg.png';

const LOGO_DIMENSIONS = {
  default: { src: MOONS_LOGO_SRC, width: 560, height: 238 },
  white: { src: MOONS_LOGO_WHITE_SRC, width: 499, height: 185 },
  onWhite: { src: MOONS_LOGO_ON_WHITE_SRC, width: 560, height: 297 },
} as const;

/** Shared height for light + dark so size/position stay identical. */
const SIZE_CLASS = {
  xs: 'h-9',
  sm: 'h-10 sm:h-11',
  md: 'h-12 sm:h-14',
  lg: 'h-11 sm:h-14 md:h-16',
  xl: 'h-14 sm:h-16 md:h-20',
} as const;

/** Keep the logo float the same width as the light logo at each size. */
const SIZE_WIDTH_CLASS = {
  xs: 'w-[5.25rem]',
  sm: 'w-[6rem] sm:w-[6.5rem]',
  md: 'w-[7rem] sm:w-[8.25rem]',
  lg: 'w-[6.5rem] sm:w-[8.25rem] md:w-[9.5rem]',
  xl: 'w-[8.25rem] sm:w-[9.5rem] md:w-[11.75rem]',
} as const;

interface MoonsLogoProps {
  href?: string;
  size?: keyof typeof SIZE_CLASS;
  /** @deprecated Use `onWhite` — kept as alias for footer branding */
  variant?: 'default' | 'white' | 'onWhite';
  className?: string;
  priority?: boolean;
}

export function MoonsLogo({
  href = '/',
  size = 'md',
  variant = 'default',
  className = '',
  priority = false,
}: MoonsLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onWhiteVariant = variant === 'white' || variant === 'onWhite';
  const isDark = mounted && resolvedTheme === 'dark';
  const light = LOGO_DIMENSIONS.default;
  const dark = LOGO_DIMENSIONS.white;
  const onWhite = LOGO_DIMENSIONS.onWhite;
  const active = isDark ? dark : light;

  const onWhiteLogo = (
    <span className="inline-flex shrink-0 items-center rounded-xl bg-[#ffffff] px-2.5 py-1 shadow-sm ring-1 ring-black/5">
      <Image
        src={onWhite.src}
        alt="MoonsJob"
        width={onWhite.width}
        height={onWhite.height}
        priority={priority}
        className={`w-auto object-contain ${SIZE_CLASS[size]} ${className}`}
      />
    </span>
  );

  const themeLogo = (
    <span
      className={`relative inline-block shrink-0 overflow-visible leading-none ${SIZE_CLASS[size]} ${SIZE_WIDTH_CLASS[size]} ${className}`}
    >
      <Image
        src={active.src}
        alt="MoonsJob"
        width={active.width}
        height={active.height}
        priority={priority}
        unoptimized
        className="!h-full !w-full object-contain object-left"
      />
    </span>
  );

  const image = onWhiteVariant ? onWhiteLogo : themeLogo;
  const wrapperClassName = 'inline-flex shrink-0 items-center';

  if (!href || href === '') {
    return <span className={wrapperClassName}>{image}</span>;
  }

  return (
    <Link href={href} className={wrapperClassName}>
      {image}
    </Link>
  );
}
