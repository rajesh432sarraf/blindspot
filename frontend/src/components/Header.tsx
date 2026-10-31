import React from 'react';
import { BlindspotLogo } from './BlindspotLogo';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  healthError: string | null;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="border-b border-[#024950] bg-[#00272b] px-6 py-4 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand / Wordmark with subtle entrance */}
        <div className="flex items-center gap-4 animate-fade-rise delay-0">
          <a
            href="#"
            className="flex items-center group select-none transition-transform duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
            title="Blindspot Investigation Console"
          >
            <BlindspotLogo height={24} />
          </a>
        </div>

        {/* Minimal Editorial Navigation */}
        <nav className="flex items-center gap-6 text-xs font-mono tracking-[0.15em] uppercase text-[#AFDDE5] font-bold animate-fade-rise delay-40">
          <a
            href="#investigation-console"
            className="hover:text-white transition-all duration-150 py-1 border-b-2 border-transparent hover:border-[#0FA4AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
          >
            Console
          </a>
          <a
            href="#features"
            className="hover:text-white transition-all duration-150 py-1 border-b-2 border-transparent hover:border-[#0FA4AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
          >
            Architecture
          </a>
        </nav>
      </div>
    </header>
  );
};
