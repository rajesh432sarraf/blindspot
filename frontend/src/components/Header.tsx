import React from 'react';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  healthError: string | null;
}

export const Header: React.FC<HeaderProps> = ({ health, healthError }) => {
  return (
    <header className="border-b border-[#D7D2C7] bg-[#F3F0E8] py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 bg-[#171918]"></span>
            <h1 className="text-xl font-bold tracking-tight text-[#171918] uppercase">
              Digital Dark Spot
            </h1>
            <span className="text-xs font-mono uppercase bg-[#E5DFD3] text-[#625F57] px-2 py-0.5 border border-[#D7D2C7]">
              v0.1.0 • Shinchan 2026
            </span>
          </div>
          <p className="text-xs text-[#625F57] mt-1 font-mono">
            Evidence-grounded information gap and conflict detection platform
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="text-[#625F57]">Backend API:</span>
          {health ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#D7D2C7] bg-[#EAE5DA] text-[#171918]">
              <span className="w-1.5 h-1.5 bg-[#4E8752] rounded-none"></span>
              Connected {health.gemini_configured ? '(AI Ready)' : '(Key Not Set)'}
            </span>
          ) : healthError ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#D9534F] bg-[#F9EBEA] text-[#D9534F]">
              <span className="w-1.5 h-1.5 bg-[#D9534F] rounded-none"></span>
              Offline
            </span>
          ) : (
            <span className="text-[#625F57]">Checking...</span>
          )}
        </div>
      </div>
    </header>
  );
};

