import React from 'react';
import { Search, AlertCircle, Quote } from 'lucide-react';
import type { GapFinding } from '../types';

interface GapListProps {
  gaps: GapFinding[];
}

export const GapList: React.FC<GapListProps> = ({ gaps }) => {
  return (
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#D7D2C7] pb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#171918]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171918]">
            Potential Information Gaps ({gaps.length})
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#625F57]">
          Unanswered in reviewed sources
        </span>
      </div>

      <div className="p-2.5 bg-[#EAE5DA] border border-[#D7D2C7] text-[11px] font-mono text-[#625F57]">
        <strong>Principle:</strong> "Not found in reviewed sources" means the question is unaddressed by the submitted materials—not that the information does not exist on the wider internet.
      </div>

      {gaps.length === 0 ? (
        <div className="p-4 bg-white border border-[#D7D2C7] text-xs font-mono text-[#625F57] text-center">
          No evident information gaps identified across reviewed sources.
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => (
            <div key={gap.id} className="p-4 bg-white border border-[#D7D2C7] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono font-bold">
                    {gap.id}
                  </span>
                  <h3 className="text-xs font-bold font-mono text-[#171918]">
                    {gap.question}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 border ${
                      gap.status === 'not_found_in_reviewed_sources'
                        ? 'bg-[#FEF9E7] text-[#171918] border-[#D6A64F]'
                        : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7]'
                    }`}
                  >
                    {gap.status === 'not_found_in_reviewed_sources' ? 'Not Found in Sources' : 'Partially Addressed'}
                  </span>

                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 border uppercase ${
                      gap.priority === 'high'
                        ? 'bg-[#F9EBEA] text-[#D9534F] border-[#D9534F]'
                        : gap.priority === 'medium'
                        ? 'bg-[#FEF9E7] text-[#D6A64F] border-[#D6A64F]'
                        : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7]'
                    }`}
                  >
                    {gap.priority} Priority
                  </span>
                </div>
              </div>

              <div className="text-xs font-mono text-[#625F57] flex items-start gap-2 bg-[#F3F0E8] p-2.5 border border-[#D7D2C7]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D6A64F] mt-0.5" />
                <div>
                  <strong className="text-[#171918]">Why this matters: </strong>
                  {gap.why_it_matters}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-[#625F57]">
                <span>Sources reviewed for this question:</span>
                <div className="flex items-center gap-1">
                  {gap.checked_source_ids.map((sid) => (
                    <span key={sid} className="px-1.5 py-0.5 bg-[#EAE5DA] border border-[#D7D2C7] text-[#171918]">
                      {sid}
                    </span>
                  ))}
                </div>
              </div>

              {gap.evidence && gap.evidence.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono text-[#625F57] uppercase tracking-wider">
                    Partial Sourced Mentions:
                  </span>
                  {gap.evidence.map((ev, idx) => (
                    <div key={idx} className="p-2 bg-[#F3F0E8] border border-[#D7D2C7] text-xs font-mono text-[#171918] flex items-start gap-2">
                      <Quote className="w-3 h-3 text-[#D6A64F] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#171918] mr-1">[{ev.source_id}]</span>
                        "{ev.quote}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

