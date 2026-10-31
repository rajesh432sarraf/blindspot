import React from 'react';

interface BlindspotLogoProps {
  className?: string;
  height?: number;
}

export const BlindspotLogo: React.FC<BlindspotLogoProps> = ({ className = "h-7 w-auto", height = 28 }) => {
  return (
    <div className="flex items-center gap-3 group select-none">
      <svg
        viewBox="0 0 272 32"
        height={height}
        className={`fill-[#964734] transition-all group-hover:fill-[#ba543d] ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Blindspot"
        role="img"
      >
        <title>Blindspot</title>
        {/* B */}
        <path d="M 4 0 H 20 L 24 4 V 6 H 0 V 4 L 4 0 Z" />
        <path d="M 0 9 H 18 L 23 14 V 17 L 19 19 L 24 24 V 28 L 20 32 H 0 Z M 6 14 H 17 V 16 H 6 Z M 6 23 H 17 V 27 H 6 Z" fillRule="evenodd" />
        {/* L */}
        <path d="M 31 0 H 37 V 6 H 31 Z" />
        <path d="M 31 9 H 37 V 26 H 55 V 32 H 31 Z" />
        {/* I */}
        <path d="M 66 0 H 82 V 6 H 66 Z" />
        <path d="M 71 9 H 77 V 26 H 82 V 32 H 66 V 26 H 71 Z" />
        {/* N */}
        <path d="M 93 0 H 99 V 6 H 93 Z M 111 0 H 117 V 6 H 111 Z" />
        <path d="M 93 9 H 99 L 111 24 V 9 H 117 V 32 H 111 L 99 17 V 32 H 93 Z" />
        {/* D */}
        <path d="M 128 0 H 144 L 148 4 V 6 H 124 V 4 L 128 0 Z" />
        <path d="M 124 9 H 140 L 148 17 V 24 L 140 32 H 124 Z M 130 15 H 139 L 142 18 V 23 L 139 26 H 130 Z" fillRule="evenodd" />
        {/* S */}
        <path d="M 159 0 H 175 L 179 4 V 6 H 155 V 4 L 159 0 Z" />
        <path d="M 155 9 H 179 V 14 H 161 V 18 H 175 L 179 22 V 32 H 155 V 26 H 173 V 23 H 159 L 155 19 Z" />
        {/* P */}
        <path d="M 190 0 H 206 L 210 4 V 6 H 186 V 4 L 190 0 Z" />
        <path d="M 186 9 H 204 L 210 15 V 19 L 204 23 H 192 V 32 H 186 Z M 192 14 H 203 V 18 H 192 Z" fillRule="evenodd" />
        {/* O */}
        <path d="M 221 0 H 237 L 241 4 V 6 H 217 V 4 L 221 0 Z" />
        <path d="M 217 14 L 222 9 H 236 L 241 14 V 27 L 236 32 H 222 L 217 27 Z M 223 15 V 26 H 235 V 15 Z" fillRule="evenodd" />
        {/* T */}
        <path d="M 248 0 H 272 V 6 H 248 Z" />
        <path d="M 257 9 H 263 V 32 H 263 Z" />
      </svg>
    </div>
  );
};
