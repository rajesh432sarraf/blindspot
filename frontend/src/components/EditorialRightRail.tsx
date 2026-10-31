import React from 'react';
import type { AnalysisResult } from '../types';
import { useCountUp } from '../hooks/useCountUp';

interface EditorialRightRailProps {
  result: AnalysisResult | null;
  onSelectTab?: (tab: 'all' | 'gaps' | 'conflicts' | 'freshness' | 'checklist') => void;
}

export const EditorialRightRail: React.FC<EditorialRightRailProps> = ({ result, onSelectTab }) => {
  const totalCount = result ? result.sources.length : 0;
  const sourcesCount = result ? result.sources.filter(s => s.status !== 'failed').length : null;
  const failedCount = result ? result.sources.filter(s => s.status === 'failed').length : 0;
  const charsCount = result
    ? result.sources.reduce((acc, s) => acc + (s.full_text?.length || 0), 0)
    : null;
  const gapsCount = result ? result.gaps.length : null;
  const conflictsCount = result ? result.conflicts.length : null;
  const verifyCount = result ? result.verification_checklist.length : null;

  // Single-run count animations on investigation completion; no continuous loop, respects reduced-motion
  const animatedSources = useCountUp(sourcesCount, result?.investigation_id);
  const animatedChars = useCountUp(charsCount, result?.investigation_id);
  const animatedGaps = useCountUp(gapsCount, result?.investigation_id);
  const animatedConflicts = useCountUp(conflictsCount, result?.investigation_id);
  const animatedVerify = useCountUp(verifyCount, result?.investigation_id);

  return (
    <aside className="w-full h-full flex flex-col border-l border-[#024950] divide-y divide-[#024950] select-none bg-[#003135]">
      {/* Panel 1: Deep Teal #003135 (Sources) */}
      <div
        className="h-[20%] p-3.5 xl:p-4 bg-[#003135] text-[#AFDDE5] flex flex-col justify-between transition-colors duration-150 hover:bg-[#00272b] group relative animate-fade-rise delay-0"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#0FA4AF] uppercase font-black">
            01 // SOURCES
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight">
            {animatedSources !== null ? `${animatedSources}/${totalCount} RETRIEVED` : 'PUBLIC WEB'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/80 mt-1 leading-snug line-clamp-2">
            {sourcesCount !== null
              ? failedCount > 0
                ? `${sourcesCount}/${totalCount} retrieved (${failedCount} failed)`
                : `${sourcesCount}/${totalCount} sources retrieved (0 failed)`
              : 'Up to 10 distinct URLs with SSRF protection'}
          </p>
        </div>
      </div>

      {/* Panel 2: Teal #024950 (Evidence) */}
      <div
        className="h-[20%] p-3.5 xl:p-4 bg-[#024950] text-[#AFDDE5] flex flex-col justify-between transition-colors duration-150 hover:bg-[#035962] group relative animate-fade-rise delay-40"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#AFDDE5] uppercase font-black">
            02 // EVIDENCE
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight">
            {animatedChars !== null ? `${animatedChars.toLocaleString()} CHARS` : 'GROUNDED'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/90 mt-1 leading-snug line-clamp-2">
            {charsCount !== null
              ? 'Consecutive shingle density verified'
              : 'Extracted text & verifiable timestamps'}
          </p>
        </div>
      </div>

      {/* Panel 3: Rust #964734 (Gaps) */}
      <div
        role={onSelectTab ? 'button' : undefined}
        tabIndex={onSelectTab ? 0 : undefined}
        onKeyDown={(e) => {
          if (onSelectTab && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelectTab('gaps');
          }
        }}
        onClick={() => onSelectTab && onSelectTab('gaps')}
        className={`h-[20%] p-3.5 xl:p-4 bg-[#964734] text-white flex flex-col justify-between transition-all duration-150 group relative animate-fade-rise delay-80 ${
          onSelectTab
            ? 'cursor-pointer hover:bg-[#a84f3a] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white'
            : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#AFDDE5] uppercase font-black">
            03 // GAPS
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {animatedGaps !== null ? `${animatedGaps} IDENTIFIED` : '3-TIER AUDIT'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-white/95 mt-1 leading-snug line-clamp-2">
            {gapsCount !== null
              ? 'Absence scoped strictly to reviewed sources'
              : 'Addressed vs partial vs unaddressed'}
          </p>
        </div>
      </div>

      {/* Panel 4: Pale Cyan #AFDDE5 (Conflicts) */}
      <div
        role={onSelectTab ? 'button' : undefined}
        tabIndex={onSelectTab ? 0 : undefined}
        onKeyDown={(e) => {
          if (onSelectTab && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelectTab('conflicts');
          }
        }}
        onClick={() => onSelectTab && onSelectTab('conflicts')}
        className={`h-[20%] p-3.5 xl:p-4 bg-[#AFDDE5] text-[#001c1f] flex flex-col justify-between transition-all duration-150 group relative animate-fade-rise delay-120 ${
          onSelectTab
            ? 'cursor-pointer hover:bg-[#c2eaf0] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#001c1f]'
            : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#001c1f] uppercase font-black">
            04 // CONFLICTS
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-[#001c1f] tracking-tight leading-tight">
            {animatedConflicts !== null ? `${animatedConflicts} DETECTED` : 'BILATERAL'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#001c1f]/90 mt-1 leading-snug line-clamp-2 font-medium">
            {conflictsCount !== null
              ? 'Material contradictions with quoted evidence'
              : 'Contradiction vs contextual difference'}
          </p>
        </div>
      </div>

      {/* Panel 5: Vibrant Cyan #0FA4AF (Verification) */}
      <div
        role={onSelectTab ? 'button' : undefined}
        tabIndex={onSelectTab ? 0 : undefined}
        onKeyDown={(e) => {
          if (onSelectTab && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelectTab('checklist');
          }
        }}
        onClick={() => onSelectTab && onSelectTab('checklist')}
        className={`h-[20%] p-3.5 xl:p-4 bg-[#0FA4AF] text-[#001c1f] flex flex-col justify-between transition-all duration-150 group relative animate-fade-rise delay-160 ${
          onSelectTab
            ? 'cursor-pointer hover:bg-[#12b9c6] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#001c1f]'
            : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#001c1f] uppercase font-black">
            05 // VERIFICATION
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-[#001c1f] tracking-tight leading-tight">
            {animatedVerify !== null ? `${animatedVerify} ACTIONS` : 'NEXT STEPS'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#001c1f]/90 mt-1 leading-snug line-clamp-2 font-medium">
            {verifyCount !== null
              ? 'Direct primary authority recommendations'
              : 'Official registries, portals & handbooks'}
          </p>
        </div>
      </div>
    </aside>
  );
};
