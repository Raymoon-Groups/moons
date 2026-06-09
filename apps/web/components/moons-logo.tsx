import Image from 'next/image';
import Link from 'next/link';

export const MOONS_LOGO_SRC = '/moonsjob_logo.png';
export const MOONS_LOGO_WHITE_SRC = '/white_bg.png';

const LOGO_DIMENSIONS = {
  default: { src: MOONS_LOGO_SRC, width: 560, height: 238 },
  white: { src: MOONS_LOGO_WHITE_SRC, width: 560, height: 297 },
} as const;

/** Logo is wide; sizes set height — width follows via w-auto. */
const SIZE_CLASS = {
  sm: 'h-10 sm:h-11',
  md: 'h-12 sm:h-14',
  lg: 'h-14 sm:h-16',
  xl: 'h-16 sm:h-20',
} as const;

interface MoonsLogoProps {
  href?: string;
  size?: keyof typeof SIZE_CLASS;
  variant?: keyof typeof LOGO_DIMENSIONS;
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
  const { src, width, height } = LOGO_DIMENSIONS[variant];

  const image = (
    <Image
      src={src}
      alt="MoonsJob"
      width={width}
      height={height}
      priority={priority}
      className={`w-auto object-contain ${SIZE_CLASS[size]} ${className}`}
    />
  );

  if (!href || href === '') {
    return <span className="inline-flex shrink-0 items-center">{image}</span>;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {image}
    </Link>
  );
}
