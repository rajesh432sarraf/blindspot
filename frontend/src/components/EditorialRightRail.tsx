import React from 'react';
import type { AnalysisResult } from '../types';
import { useCountUp } from '../hooks/useCountUp';

interface EditorialRightRailProps {
  result: AnalysisResult | null;
  onNavigateSection?: (section: 'sources' | 'evidence' | 'gaps' | 'conflicts' | 'checklist', sourceId?: string) => void;
  onSelectTab?: (tab: 'all' | 'gaps' | 'conflicts' | 'freshness' | 'checklist') => void;
  orientation?: 'vertical' | 'horizontal';
}

export const EditorialRightRail: React.FC<EditorialRightRailProps> = ({
  result,
  onNavigateSection,
  onSelectTab,
  orientation = 'vertical',
}) => {
  const isHoriz = orientation === 'horizontal';
  const itemBaseClass = isHoriz
    ? 'min-w-[195px] sm:min-w-[220px] p-3 sm:p-3.5 flex flex-col justify-between shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.99]'
    : 'h-[20%] p-3.5 xl:p-4 flex flex-col justify-between cursor-pointer transition-all duration-150 active:scale-[0.99]';

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

  const handleSectionClick = (section: 'sources' | 'evidence' | 'gaps' | 'conflicts' | 'checklist', sourceId?: string) => {
    if (onNavigateSection) {
      onNavigateSection(section, sourceId);
    } else if (onSelectTab && (section === 'gaps' || section === 'conflicts' || section === 'checklist')) {
      onSelectTab(section);
    }
  };

  return (
    <aside
      className={`w-full select-none bg-[#003135] ${
        isHoriz
          ? 'flex overflow-x-auto no-scrollbar scroll-smooth divide-x divide-[#024950] border-t border-b border-[#024950]'
          : 'h-full flex flex-col border-l border-[#024950] divide-y divide-[#024950]'
      }`}
    >
      {/* Panel 1: Deep Teal #003135 (Sources) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('sources')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('sources')}
        className={`${itemBaseClass} bg-[#003135] text-[#AFDDE5] hover:bg-[#024950]/80 group relative animate-fade-rise delay-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]`}
        title="Click to view Source Evidence Rail"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#0FA4AF] uppercase font-black">
            01 // SOURCES
          </span>
          <span className="text-[9px] font-mono text-[#0FA4AF] font-bold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            {result ? 'View Webpages →' : 'Sources →'}
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

          {/* Quick Clickable Source Pills */}
          {result && result.sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t border-[#024950]">
              {result.sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick('sources', s.id);
                  }}
                  className="px-1.5 py-0.5 bg-[#024950] text-[#0FA4AF] hover:bg-[#0FA4AF] hover:text-[#003135] text-[10px] font-mono font-bold border border-[#0FA4AF]/30 transition-colors"
                  title={`Jump to ${s.id}: ${s.title || s.url}`}
                >
                  {s.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel 2: Teal #024950 (Evidence) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('evidence')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('evidence')}
        className={`${itemBaseClass} bg-[#024950] text-[#AFDDE5] hover:bg-[#035962] group relative animate-fade-rise delay-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#AFDDE5]`}
        title="Click to view Evidence Synthesis"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#AFDDE5] uppercase font-black">
            02 // EVIDENCE
          </span>
          <span className="text-[9px] font-mono text-[#AFDDE5] font-bold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            Synthesis →
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

      {/* Panel 3: Vibrant Luminous Coral #E76F51 (Gaps) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('gaps')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('gaps')}
        className={`${itemBaseClass} bg-[#E76F51] text-white hover:bg-[#eb7d61] group relative animate-fade-rise delay-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white`}
        title="Click to open Potential Information Gaps"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-white/90 uppercase font-black">
            03 // GAPS
          </span>
          <span className="text-[9px] font-mono text-white font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            Open Gaps →
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
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
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('conflicts')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('conflicts')}
        className={`${itemBaseClass} bg-[#AFDDE5] text-[#003135] hover:bg-[#c2eaf0] group relative animate-fade-rise delay-120 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#003135]`}
        title="Click to open Evidence Conflicts"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#003135] uppercase font-black">
            04 // CONFLICTS
          </span>
          <span className="text-[9px] font-mono text-[#003135] font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            Open Conflicts →
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-[#003135] tracking-tight leading-tight">
            {animatedConflicts !== null ? `${animatedConflicts} DETECTED` : 'BILATERAL'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#003135]/90 mt-1 leading-snug line-clamp-2 font-medium">
            {conflictsCount !== null
              ? 'Material contradictions with quoted evidence'
              : 'Contradiction vs contextual difference'}
          </p>
        </div>
      </div>

      {/* Panel 5: Vibrant Cyan #0FA4AF (Verification) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('checklist')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('checklist')}
        className={`${itemBaseClass} bg-[#0FA4AF] text-[#003135] hover:bg-[#12b9c6] group relative animate-fade-rise delay-160 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#003135]`}
        title="Click to open Verification Checklist"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#003135] uppercase font-black">
            05 // VERIFICATION
          </span>
          <span className="text-[9px] font-mono text-[#003135] font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            Open Checklist →
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-[#003135] tracking-tight leading-tight">
            {animatedVerify !== null ? `${animatedVerify} ACTIONS` : 'NEXT STEPS'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#003135]/90 mt-1 leading-snug line-clamp-2 font-medium">
            {verifyCount !== null
              ? 'Direct primary authority recommendations'
              : 'Official registries, portals & handbooks'}
          </p>
        </div>
      </div>
    </aside>
  );
};
