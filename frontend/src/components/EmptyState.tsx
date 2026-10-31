import React from 'react';
import { HelpCircle, Search, GitCompare, Clock, CheckSquare } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-8 text-center">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EAE5DA] border border-[#D7D2C7] text-[#171918]">
          <HelpCircle className="w-6 h-6 text-[#171918]" />
        </div>

        <h3 className="text-base font-bold font-mono text-[#171918] uppercase tracking-wide">
          Ready to Audit Information Sources
        </h3>

        <p className="text-xs font-mono text-[#625F57] leading-relaxed">
          Submit a research query along with two or more public URLs above. Digital Dark Spot extracts source content and performs an evidence-grounded review across four distinct dimensions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
          <div className="p-3 bg-[#EAE5DA] border border-[#D7D2C7]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#171918]">
              <Search className="w-3.5 h-3.5 text-[#D6A64F]" />
              <span>Potential Gaps</span>
            </div>
            <p className="text-[11px] font-mono text-[#625F57] mt-1">
              Highlights crucial questions that your reviewed sources fail to answer or address only partially.
            </p>
          </div>

          <div className="p-3 bg-[#EAE5DA] border border-[#D7D2C7]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#171918]">
              <GitCompare className="w-3.5 h-3.5 text-[#D6A64F]" />
              <span>Evidence Conflicts</span>
            </div>
            <p className="text-[11px] font-mono text-[#625F57] mt-1">
              Isolates direct factual disagreements between sources with side-by-side excerpts.
            </p>
          </div>

          <div className="p-3 bg-[#EAE5DA] border border-[#D7D2C7]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#171918]">
              <Clock className="w-3.5 h-3.5 text-[#D6A64F]" />
              <span>Freshness Warnings</span>
            </div>
            <p className="text-[11px] font-mono text-[#625F57] mt-1">
              Surfaces undated content and older materials whose currentness warrants scrutiny.
            </p>
          </div>

          <div className="p-3 bg-[#EAE5DA] border border-[#D7D2C7]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#171918]">
              <CheckSquare className="w-3.5 h-3.5 text-[#D6A64F]" />
              <span>Verification Checklist</span>
            </div>
            <p className="text-[11px] font-mono text-[#625F57] mt-1">
              Generates prioritized, actionable tasks pointing you toward authoritative verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

