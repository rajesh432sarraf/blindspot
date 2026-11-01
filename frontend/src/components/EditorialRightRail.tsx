import React from 'react';
import {
  Globe,
  Database,
  AlertTriangle,
  GitCompare,
  ListChecks,
  ArrowUpRight,
} from 'lucide-react';
import type { AnalysisResult } from '../types';
import { useCountUp } from '../hooks/useCountUp';

interface EditorialRightRailProps {
  result: AnalysisResult | null;
  onNavigateSection?: (
    section: 'sources' | 'evidence' | 'gaps' | 'conflicts' | 'checklist',
    sourceId?: string
  ) => void;
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
    ? 'min-w-[210px] sm:min-w-[240px] p-3 sm:p-4 flex flex-col justify-between shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.99] border-r border-[#024950]'
    : 'h-[20%] p-3.5 xl:p-4 flex flex-col justify-between cursor-pointer transition-all duration-150 active:scale-[0.99] border-b border-[#024950]';

  const totalCount = result ? result.sources.length : 0;
  const sourcesCount = result ? result.sources.filter((s) => s.status !== 'failed').length : null;
  const failedCount = result ? result.sources.filter((s) => s.status === 'failed').length : 0;
  const charsCount = result
    ? result.sources.reduce((acc, s) => acc + (s.full_text?.length || 0), 0)
    : null;
  const gapsCount = result ? result.gaps.length : null;
  const conflictsCount = result ? result.conflicts.length : null;
  const verifyCount = result ? result.verification_checklist.length : null;

  // Single-run count animations on investigation completion
  const animatedSources = useCountUp(sourcesCount, result?.investigation_id);
  const animatedChars = useCountUp(charsCount, result?.investigation_id);
  const animatedGaps = useCountUp(gapsCount, result?.investigation_id);
  const animatedConflicts = useCountUp(conflictsCount, result?.investigation_id);
  const animatedVerify = useCountUp(verifyCount, result?.investigation_id);

  const handleSectionClick = (
    section: 'sources' | 'evidence' | 'gaps' | 'conflicts' | 'checklist',
    sourceId?: string
  ) => {
    if (onNavigateSection) {
      onNavigateSection(section, sourceId);
    } else if (
      onSelectTab &&
      (section === 'gaps' || section === 'conflicts' || section === 'checklist')
    ) {
      onSelectTab(section);
    }
  };

  return (
    <aside
      className={`w-full select-none bg-[#00272b] ${
        isHoriz
          ? 'flex overflow-x-auto no-scrollbar scroll-smooth border-t border-b border-[#024950]'
          : 'h-full flex flex-col border-l border-[#024950]'
      }`}
    >
      {/* 1. SOURCES */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('sources')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('sources')}
        className={`${itemBaseClass} bg-[#00272b] hover:bg-[#003135] group border-l-4 border-l-[#0FA4AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]`}
        title="Inspect Ingested Source Repositories"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#0FA4AF]" />
            <span className="text-[11px] font-mono tracking-wider text-white uppercase font-bold">
              SOURCES
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#AFDDE5]/60 group-hover:text-[#0FA4AF] flex items-center gap-0.5 transition-colors">
            <span>{result ? 'View' : 'Explore'}</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight">
            {animatedSources !== null ? `${animatedSources} SOURCES` : 'SOURCE MATERIAL'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/80 mt-1 leading-snug line-clamp-2">
            {sourcesCount !== null
              ? failedCount > 0
                ? `${sourcesCount} of ${totalCount} sources verified (${failedCount} failed)`
                : `${sourcesCount} of ${totalCount} sources verified`
              : 'Add custom URLs or choose a preset to review'}
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
                  className="px-1.5 py-0.5 bg-[#003135] text-[#0FA4AF] hover:bg-[#0FA4AF] hover:text-[#003135] text-[10px] font-mono font-bold border border-[#0FA4AF]/30 transition-colors"
                  title={`Inspect source ${s.id}`}
                >
                  {s.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. STRUCTURED SUMMARY */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('evidence')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('evidence')}
        className={`${itemBaseClass} bg-[#00272b] hover:bg-[#003135] group border-l-4 border-l-[#2A9D8F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2A9D8F]`}
        title="Inspect Grounded Evidence Summary"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span className="text-[11px] font-mono tracking-wider text-white uppercase font-bold">
              SUMMARY
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#AFDDE5]/60 group-hover:text-[#2A9D8F] flex items-center gap-0.5 transition-colors">
            <span>Synthesis</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight">
            {animatedChars !== null ? `${animatedChars.toLocaleString()} CHARS` : 'KEY SUMMARY'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/80 mt-1 leading-snug line-clamp-2">
            {charsCount !== null
              ? 'Structured synthesis of verified facts'
              : 'Synthesizes key information across sources'}
          </p>
        </div>
      </div>

      {/* 3. GAPS */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('gaps')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('gaps')}
        className={`${itemBaseClass} bg-[#00272b] hover:bg-[#003135] group border-l-4 border-l-[#E76F51] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E76F51]`}
        title="Inspect Information Gaps"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E76F51]" />
            <span className="text-[11px] font-mono tracking-wider text-white uppercase font-bold">
              GAPS
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#AFDDE5]/60 group-hover:text-[#E76F51] flex items-center gap-0.5 transition-colors">
            <span>Audit</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-[#E76F51] tracking-tight leading-tight">
            {animatedGaps !== null ? `${animatedGaps} GAPS FOUND` : 'INFORMATION GAPS'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/80 mt-1 leading-snug line-clamp-2">
            {gapsCount !== null
              ? 'Unanswered questions in reviewed sources'
              : 'Finds missing criteria and questions'}
          </p>
        </div>
      </div>

      {/* 4. CONFLICTS */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('conflicts')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('conflicts')}
        className={`${itemBaseClass} bg-[#00272b] hover:bg-[#003135] group border-l-4 border-l-[#AFDDE5] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#AFDDE5]`}
        title="Inspect Contradictions & Discrepancies"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-[#AFDDE5]" />
            <span className="text-[11px] font-mono tracking-wider text-white uppercase font-bold">
              CONFLICTS
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#AFDDE5]/60 group-hover:text-[#AFDDE5] flex items-center gap-0.5 transition-colors">
            <span>Diff</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight">
            {animatedConflicts !== null ? `${animatedConflicts} CONFLICTS` : 'CONTRADICTIONS'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/80 mt-1 leading-snug line-clamp-2">
            {conflictsCount !== null
              ? 'Conflicting claims with cited quotes'
              : 'Flags contradicting claims between sources'}
          </p>
        </div>
      </div>

      {/* 5. VERIFY NEXT */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSectionClick('checklist')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSectionClick('checklist')}
        className={`${itemBaseClass} bg-[#00272b] hover:bg-[#003135] group border-l-4 border-l-[#0FA4AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]`}
        title="Inspect Verification Checklist"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-[#0FA4AF]" />
            <span className="text-[11px] font-mono tracking-wider text-white uppercase font-bold">
              NEXT STEPS
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#AFDDE5]/60 group-hover:text-[#0FA4AF] flex items-center gap-0.5 transition-colors">
            <span>Checklist</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <div className="my-auto py-1">
          <div className="text-base sm:text-lg xl:text-xl font-mono font-black text-white tracking-tight leading-tight">
            {animatedVerify !== null ? `${animatedVerify} ACTIONS` : 'VERIFY NEXT'}
          </div>
          <p className="text-[10px] xl:text-[11px] font-mono text-[#AFDDE5]/80 mt-1 leading-snug line-clamp-2">
            {verifyCount !== null
              ? 'Prioritized items to verify with official sources'
              : 'Action checklist of items to verify next'}
          </p>
        </div>
      </div>
    </aside>
  );
};
