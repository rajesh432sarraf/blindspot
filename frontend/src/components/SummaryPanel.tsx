import React, { useState } from 'react';
import { FileText, Copy, Check, ChevronDown, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface SummaryPanelProps {
  result: AnalysisResult;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ result }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  const handleCopyText = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(result.summary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const paragraphs = result.summary
    ? result.summary.split('\n').filter((p) => p.trim().length > 0)
    : [];

  return (
    <div className="bg-[#024950]/30 border border-[#024950] p-4 sm:p-6 lg:p-7 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#024950] gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0FA4AF]" />
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              STRUCTURED EVIDENCE SUMMARY
            </h2>
            <span className="text-[11px] font-mono text-[#AFDDE5]/70 block">
              Key information synthesized across reviewed sources
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result.evidence_fully_audited && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0FA4AF]/20 border border-[#0FA4AF] text-[#AFDDE5] text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0FA4AF]" />
              <span className="hidden md:inline">Evidence Grounded</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#003135] hover:bg-[#024950] border border-[#0FA4AF]/50 text-[#AFDDE5] hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Copy summary text"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0FA4AF]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synthesis Text: Clean, readable paragraphs */}
      <div className="space-y-3 font-sans text-sm sm:text-base leading-relaxed text-[#AFDDE5]">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, idx) => (
            <p key={idx} className="text-[#AFDDE5] leading-relaxed">
              {p}
            </p>
          ))
        ) : (
          <p className="text-[#AFDDE5]/70 font-mono text-xs">
            {result.summary || 'No summary available.'}
          </p>
        )}
      </div>

      {/* Methodological Scope Note (Subtle, not bloated) */}
      {result.limitations && result.limitations.length > 0 && (
        <div className="pt-3 border-t border-[#024950]">
          <button
            type="button"
            onClick={() => setShowLimits(!showLimits)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#AFDDE5]/70 hover:text-white transition-colors cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#0FA4AF]" />
            <span>Scope & Limitations ({result.limitations.length})</span>
            {showLimits ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {showLimits && (
            <ul className="mt-2 space-y-1 pl-5 list-disc text-xs font-mono text-[#AFDDE5]/80">
              {result.limitations.map((limit, i) => (
                <li key={i}>{limit}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
