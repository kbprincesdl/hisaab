import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label="Hisaab"
    className={className}
  >
    <rect width="64" height="64" rx="18" fill="currentColor" />
    <path
      d="M16 20h32M16 30h32M16 40h19"
      stroke="#FBF6EA"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="45" cy="44" r="7" fill="#E8751A" />
  </svg>
);

interface BrandLockupProps {
  shopName?: string;
  compact?: boolean;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({ shopName, compact = false }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    <BrandMark size={compact ? 34 : 40} className="shrink-0 text-hisaab" />
    <span className="min-w-0">
      <span className="block font-display text-[1.35rem] font-extrabold leading-none tracking-[-0.04em] text-ink">
        Hisaab
      </span>
      {shopName && !compact && (
        <span className="mt-1 hidden max-w-[18rem] truncate text-[11px] font-medium text-ink-muted lg:block">
          {shopName}
        </span>
      )}
    </span>
  </span>
);
