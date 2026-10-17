import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
  variant = 'light'
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Shield Emblem */}
      <svg
        viewBox="0 0 100 100"
        className={`${iconSizes[size]} shrink-0 drop-shadow-sm`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shield Outer Gradient */}
          <linearGradient id="shieldBorder" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E3A8A" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>

          {/* Shield Main Interior Blue Gradient */}
          <linearGradient id="shieldInterior" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Shield Right Half Shading (3D facet effect) */}
          <linearGradient id="shieldRightFacet" x1="50" y1="15" x2="90" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1D4ED8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Yellow Checkmark Gradient */}
          <linearGradient id="checkYellow" x1="25" y1="40" x2="70" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>

          {/* Green Bar Chart Gradient */}
          <linearGradient id="greenBars" x1="30" y1="65" x2="70" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Shield Outline */}
        <path
          d="M50 10 C68 15 82 22 88 28 C88 56 74 78 50 92 C26 78 12 56 12 28 C18 22 32 15 50 10 Z"
          fill="url(#shieldBorder)"
        />

        {/* Left Inner Shield */}
        <path
          d="M50 15 C36 19 23 25 18 30 C18 53 30 71 50 84 L50 15 Z"
          fill="url(#shieldInterior)"
        />

        {/* Right Inner Shield (Darker 3D facet) */}
        <path
          d="M50 15 L50 84 C70 71 82 53 82 30 C77 25 64 19 50 15 Z"
          fill="url(#shieldRightFacet)"
        />

        {/* 3 Rising Green Chart Bars at the bottom of shield */}
        <rect x="34" y="64" width="7" height="15" rx="2" fill="url(#greenBars)" />
        <rect x="46" y="55" width="7" height="24" rx="2" fill="url(#greenBars)" />
        <rect x="58" y="46" width="7" height="33" rx="2" fill="url(#greenBars)" />

        {/* Prominent Checkmark */}
        <path
          d="M28 48 L44 64 L75 32"
          stroke="url(#checkYellow)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Brand Text */}
      {!iconOnly && (
        <div className="flex items-center tracking-tight leading-none">
          <span
            className={`font-headline font-extrabold ${textSizes[size]} ${
              variant === 'dark' ? 'text-white' : 'text-[#04122e]'
            }`}
          >
            Instala
          </span>
          <span
            className={`font-headline font-extrabold ${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600`}
          >
            Saldo
          </span>
        </div>
      )}
    </div>
  );
};
