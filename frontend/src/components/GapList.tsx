import React from 'react';
import { Search, AlertCircle, Quote } from 'lucide-react';
import type { GapFinding } from '../types';

interface GapListProps {
  gaps: GapFinding[];
}

export const GapList: React.FC<GapListProps> = ({ gaps }) => {
  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#024950] pb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#964734]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            POTENTIAL INFORMATION GAPS ({gaps.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#AFDDE5]/80">
          Unanswered in reviewed sources
        </span>
      </div>

      <div className="p-3 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/90">
        <strong className="text-[#0FA4AF] uppercase tracking-wider mr-1">Principle:</strong> "Not found in reviewed sources" means the question is unaddressed by the submitted materials—not that the information does not exist on the wider internet.
      </div>

      {gaps.length === 0 ? (
        <div className="p-6 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/70 text-center">
          No evident information gaps identified across reviewed sources.
        </div>
      ) : (
        <div className="space-y-4">
          {gaps.map((gap) => (
            <div key={gap.id} className="p-5 bg-[#003135] border border-[#024950] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-[#964734] text-white text-xs font-mono font-bold">
                    {gap.id}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold font-mono text-white">
                    {gap.question}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 border ${
                      gap.status === 'not_found_in_reviewed_sources'
                        ? 'bg-[#964734]/30 text-white border-[#964734]'
                        : gap.status === 'fully_addressed'
                        ? 'bg-[#0FA4AF]/20 text-white border-[#0FA4AF] font-bold'
                        : 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF]'
                    }`}
                  >
                    {gap.status === 'not_found_in_reviewed_sources'
                      ? 'Not Found in Sources'
                      : gap.status === 'fully_addressed'
                      ? 'Fully Addressed'
                      : 'Partially Addressed'}
                  </span>

                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 border uppercase font-bold ${
                      gap.priority === 'high'
                        ? 'bg-[#964734] text-white border-[#964734]'
                        : gap.priority === 'medium'
                        ? 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF]'
                        : 'bg-[#003135] text-[#AFDDE5]/70 border-[#024950]'
                    }`}
                  >
                    {gap.priority} Priority
                  </span>
                </div>
              </div>

              <div className="text-xs font-mono text-[#AFDDE5] flex items-start gap-2.5 bg-[#024950]/50 p-3 border border-[#024950]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0FA4AF] mt-0.5" />
                <div>
                  <strong className="text-white font-bold uppercase tracking-wider mr-1">Why this matters:</strong>
                  {gap.why_it_matters}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#AFDDE5]/80">
                <span className="text-[#0FA4AF] font-bold">Sources reviewed:</span>
                <div className="flex items-center gap-1.5">
                  {gap.checked_source_ids.map((sid) => (
                    <a
                      key={sid}
                      href={`#source-${sid}`}
                      className="px-2 py-0.5 bg-[#024950] border border-[#024950] text-[#AFDDE5] hover:border-[#0FA4AF] hover:text-white transition-colors"
                      title={`Jump to source ${sid} in evidence rail`}
                    >
                      {sid}
                    </a>
                  ))}
                </div>
              </div>

              {gap.evidence && gap.evidence.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono text-[#0FA4AF] uppercase tracking-wider font-bold">
                    {gap.status === 'fully_addressed' ? 'Supporting Source Evidence:' : 'Grounded Source Mentions:'}
                  </span>
                  {gap.evidence.map((ev, idx) => (
                    <div key={idx} className="p-3 bg-[#024950]/40 border border-[#024950] text-xs font-mono text-[#AFDDE5] flex items-start gap-2.5">
                      <Quote className="w-3.5 h-3.5 text-[#0FA4AF] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={`#source-${ev.source_id}`}
                          className="font-bold text-[#0FA4AF] mr-1.5 hover:underline"
                          title={`Jump to source ${ev.source_id} in rail`}
                        >
                          [{ev.source_id}]
                        </a>
                        <span className="text-white">"{ev.quote}"</span>
                        {ev.source_url && (
                          <a
                            href={ev.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-[11px] text-[#0FA4AF] underline hover:text-white inline-block"
                          >
                            Source link
                          </a>
                        )}
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
