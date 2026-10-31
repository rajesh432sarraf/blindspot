import React, { useState } from 'react';
import { FileText, AlertTriangle, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface SummaryPanelProps {
  result: AnalysisResult;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ result }) => {
  const [showLimits, setShowLimits] = useState(false);

  return (
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D7D2C7] gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#171918]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171918]">
            Investigation Synthesis
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 bg-[#EAE5DA] border border-[#D7D2C7] text-[#171918]">
            ID: {result.investigation_id}
          </span>
          {result.is_insufficient_evidence ? (
            <span className="px-2 py-0.5 bg-[#F9EBEA] border border-[#D9534F] text-[#D9534F] font-semibold">
              Insufficient Evidence
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-[#E8F5E9] border border-[#4E8752] text-[#4E8752] font-semibold inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Evidence Audited
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-mono">
          <span className="text-[#625F57] uppercase tracking-wider">Research Question:</span>
          <p className="font-bold text-[#171918] text-sm mt-0.5">
            "{result.question}"
          </p>
        </div>

        <div className="p-4 bg-white border border-[#D7D2C7]">
          <span className="text-[11px] font-mono text-[#625F57] uppercase tracking-wider block mb-1">
            Evidence-Grounded Summary
          </span>
          <p className="text-xs font-mono text-[#171918] leading-relaxed">
            {result.summary}
          </p>
        </div>

        {result.limitations && result.limitations.length > 0 && (
          <div className="border border-[#D7D2C7] bg-[#EAE5DA]">
            <button
              type="button"
              onClick={() => setShowLimits(!showLimits)}
              className="w-full p-2.5 flex items-center justify-between text-xs font-mono text-[#625F57] hover:text-[#171918] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D6A64F]" />
                <span className="font-semibold">Methodological Constraints & Scope Limitations ({result.limitations.length})</span>
              </div>
              {showLimits ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showLimits && (
              <div className="p-3 border-t border-[#D7D2C7] bg-[#F3F0E8] text-[11px] font-mono text-[#625F57] space-y-1">
                {result.limitations.map((limit, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#D6A64F]">•</span>
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
