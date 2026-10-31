import React from 'react';
import { HelpCircle, Search, GitCompare, Clock, CheckSquare } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-8 sm:p-12 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#003135] border border-[#0FA4AF] text-[#0FA4AF]">
          <HelpCircle className="w-7 h-7 text-[#0FA4AF]" />
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
            Ready to Audit Information Sources
          </h3>
          <p className="text-xs sm:text-sm font-mono text-[#AFDDE5]/80 mt-2 leading-relaxed">
            Submit a research query along with public URLs above. Blindspot extracts source content and performs an evidence-grounded review across four distinct dimensions:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
          <div className="p-4 bg-[#003135] border border-[#024950]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Search className="w-4 h-4 text-[#964734]" />
              <span>Potential Gaps</span>
            </div>
            <p className="text-xs font-mono text-[#AFDDE5]/70 mt-1.5 leading-relaxed">
              Highlights crucial questions that your reviewed sources fail to answer or address only partially.
            </p>
          </div>

          <div className="p-4 bg-[#003135] border border-[#024950]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <GitCompare className="w-4 h-4 text-[#0FA4AF]" />
              <span>Evidence Conflicts</span>
            </div>
            <p className="text-xs font-mono text-[#AFDDE5]/70 mt-1.5 leading-relaxed">
              Isolates direct factual disagreements between sources with side-by-side excerpts.
            </p>
          </div>

          <div className="p-4 bg-[#003135] border border-[#024950]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Clock className="w-4 h-4 text-[#0FA4AF]" />
              <span>Freshness Warnings</span>
            </div>
            <p className="text-xs font-mono text-[#AFDDE5]/70 mt-1.5 leading-relaxed">
              Surfaces undated content and older materials whose currentness warrants scrutiny.
            </p>
          </div>

          <div className="p-4 bg-[#003135] border border-[#024950]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <CheckSquare className="w-4 h-4 text-[#AFDDE5]" />
              <span>Verification Checklist</span>
            </div>
            <p className="text-xs font-mono text-[#AFDDE5]/70 mt-1.5 leading-relaxed">
              Generates prioritized, concrete inquiries directed to primary authoritative registers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
