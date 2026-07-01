import Image from 'next/image';
import Link from 'next/link';

export const MOONS_LOGO_SRC = '/moonsjob_logo.png';
/** Logo artwork on a white plate — used in dark header for contrast */
export const MOONS_LOGO_ON_WHITE_SRC = '/white_bg.png';

const LOGO_DIMENSIONS = {
  default: { src: MOONS_LOGO_SRC, width: 560, height: 238 },
  onWhite: { src: MOONS_LOGO_ON_WHITE_SRC, width: 560, height: 297 },
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
  const sizeClass = `${SIZE_CLASS[size]} ${className}`;
  const onWhiteVariant = variant === 'white' || variant === 'onWhite';
  const onWhite = LOGO_DIMENSIONS.onWhite;

  const onWhiteLogo = (
    <span className="inline-flex shrink-0 items-center rounded-xl bg-[#ffffff] px-2.5 py-1 shadow-sm ring-1 ring-black/5">
      <Image
        src={onWhite.src}
        alt="MoonsJob"
        width={onWhite.width}
        height={onWhite.height}
        priority={priority}
        className={`w-auto object-contain ${sizeClass}`}
      />
    </span>
  );

  const defaultLogo = (
    <span className="inline-flex shrink-0 items-center overflow-hidden rounded-xl leading-none">
      <Image
        src={LOGO_DIMENSIONS.default.src}
        alt="MoonsJob"
        width={LOGO_DIMENSIONS.default.width}
        height={LOGO_DIMENSIONS.default.height}
        priority={priority}
        className={`w-auto object-contain ${sizeClass}`}
      />
    </span>
  );

  const image = onWhiteVariant ? (
    onWhiteLogo
  ) : (
    <>
      <span className="dark:hidden">{defaultLogo}</span>
      <span className="hidden dark:inline-flex">{onWhiteLogo}</span>
    </>
  );

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
