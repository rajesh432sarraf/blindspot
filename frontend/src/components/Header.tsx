import React from 'react';
import { BlindspotLogo } from './BlindspotLogo';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  healthError: string | null;
}

export const Header: React.FC<HeaderProps> = ({ health, healthError }) => {
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

        {/* Minimal Editorial Navigation & System Status */}
        <div className="flex items-center gap-6 animate-fade-rise delay-40">
          <nav className="flex items-center gap-6 text-xs font-mono tracking-[0.15em] uppercase text-[#AFDDE5] font-bold">
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

          {/* Honest Backend Status Pill */}
          <div className="hidden sm:flex items-center">
            {healthError ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#964734]/20 border border-[#964734] text-[#AFDDE5]"
                title="FastAPI backend not detected at :8000. Run run.bat to start."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#964734]"></span>
                <span>BACKEND OFFLINE</span>
              </span>
            ) : health ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#0FA4AF]/15 border border-[#0FA4AF]/40 text-[#AFDDE5]"
                title={`Backend API active on :8000 (${health.gemini_configured ? 'Gemini configured' : 'Heuristic mode'})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0FA4AF] animate-pulse"></span>
                <span>SYS // ACTIVE</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#001c1f] border border-[#024950] text-[#AFDDE5]/60"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#AFDDE5]/40"></span>
                <span>CONNECTING</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
