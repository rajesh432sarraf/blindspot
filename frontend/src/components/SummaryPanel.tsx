import React, { useState } from 'react';
import { FileText, AlertTriangle, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface SummaryPanelProps {
  result: AnalysisResult;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ result }) => {
  const [showLimits, setShowLimits] = useState(false);
  const failedSources = result.sources.filter(s => s.status === 'failed');

  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#024950] gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0FA4AF]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            INVESTIGATION SYNTHESIS
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 bg-[#003135] border border-[#024950] text-[#AFDDE5]">
            ID: {result.investigation_id}
          </span>
          {result.is_insufficient_evidence ? (
            <span className="px-2.5 py-1 bg-[#964734]/30 border border-[#964734] text-white font-bold">
              INSUFFICIENT EVIDENCE
            </span>
          ) : failedSources.length > 0 ? (
            <span className="px-2.5 py-1 bg-[#964734]/20 border border-[#964734] text-[#AFDDE5] font-semibold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#964734]" />
              Partial Source Coverage ({result.sources.length - failedSources.length}/{result.sources.length})
            </span>
          ) : result.evidence_fully_audited ? (
            <span className="px-2.5 py-1 bg-[#0FA4AF]/20 border border-[#0FA4AF] text-[#AFDDE5] font-semibold inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0FA4AF]" />
              Evidence Fully Audited
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-[#024950] border border-[#0FA4AF] text-[#AFDDE5] font-semibold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#0FA4AF]" />
              Evidence Scoped to Reviewed Sources
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {failedSources.length > 0 && (
          <div className="p-4 bg-[#964734]/20 border border-[#964734] text-xs font-mono text-[#AFDDE5] flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#964734] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white uppercase tracking-wider text-xs block mb-1">
                Partial Source Coverage Notice
              </strong>
              <span>
                {failedSources.length} of {result.sources.length} submitted source(s) failed retrieval ({failedSources.map(s => s.id).join(', ')}). 
                Findings, gaps, and verification tasks reflect only the {result.sources.length - failedSources.length} successfully reviewed source(s).
              </span>
            </div>
          </div>
        )}

        <div className="text-xs font-mono">
          <span className="text-[#0FA4AF] uppercase tracking-wider text-[11px] font-bold">
            Audited Research Question:
          </span>
          <p className="font-bold text-white text-base mt-1 leading-snug">
            "{result.question}"
          </p>
        </div>

        {/* Coverage Metrics Breakdown */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
          <span className="px-2.5 py-1 bg-[#003135] border border-[#024950] text-[#AFDDE5]">
            <strong className="text-white">{result.sources.filter(s => s.status === 'retrieved' || s.status === 'partial').length}</strong> Reviewed Source(s)
          </span>
          <span className="px-2.5 py-1 bg-[#964734]/30 border border-[#964734] text-white">
            <strong>{result.gaps.filter(g => g.status === 'not_found_in_reviewed_sources').length}</strong> Unanswered Gap(s)
          </span>
          {result.gaps.some(g => g.status === 'partially_addressed') && (
            <span className="px-2.5 py-1 bg-[#024950] border border-[#0FA4AF] text-[#AFDDE5]">
              <strong className="text-white">{result.gaps.filter(g => g.status === 'partially_addressed').length}</strong> Partially Addressed
            </span>
          )}
          {result.gaps.some(g => g.status === 'fully_addressed') && (
            <span className="px-2.5 py-1 bg-[#0FA4AF]/20 border border-[#0FA4AF] text-white font-semibold">
              <strong>{result.gaps.filter(g => g.status === 'fully_addressed').length}</strong> Fully Addressed
            </span>
          )}
          <span className="px-2.5 py-1 bg-[#003135] border border-[#024950] text-[#AFDDE5]/80">
            <strong className="text-[#0FA4AF]">{result.verification_checklist.length}</strong> Verification Action(s)
          </span>
        </div>

        <div className="p-4 bg-[#003135] border border-[#024950]">
          <span className="text-[11px] font-mono text-[#0FA4AF] uppercase tracking-wider block mb-1.5 font-bold">
            Evidence-Grounded Synthesis
          </span>
          <p className="text-xs sm:text-sm font-mono text-[#AFDDE5] leading-relaxed">
            {result.summary}
          </p>
        </div>

        {result.limitations && result.limitations.length > 0 && (
          <div className="border border-[#024950] bg-[#003135]">
            <button
              type="button"
              onClick={() => setShowLimits(!showLimits)}
              className="w-full p-3 flex items-center justify-between text-xs font-mono text-[#AFDDE5]/80 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#0FA4AF]" />
                <span className="font-semibold uppercase tracking-wider">Methodological Constraints & Scope Limitations ({result.limitations.length})</span>
              </div>
              {showLimits ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showLimits && (
              <div className="p-4 border-t border-[#024950] bg-[#003135]/90 text-xs font-mono text-[#AFDDE5]/90 space-y-1.5">
                {result.limitations.map((limit, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#0FA4AF]">•</span>
                    <span>{limit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
