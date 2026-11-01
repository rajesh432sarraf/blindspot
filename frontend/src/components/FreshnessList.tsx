import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { FreshnessWarning } from '../types';

interface FreshnessListProps {
  warnings: FreshnessWarning[];
}

export const FreshnessList: React.FC<FreshnessListProps> = ({ warnings }) => {
  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-3.5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#024950] pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0FA4AF]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            FRESHNESS & DATE WARNINGS ({warnings.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#AFDDE5]/80">
          Source recency check
        </span>
      </div>

      {warnings.length === 0 ? (
        <div className="p-6 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/70 text-center">
          No stale date warnings triggered across reviewed sources. Note that a published timestamp does not guarantee ongoing currency; verify active guidelines with primary registries.
        </div>
      ) : (
        <div className="space-y-4">
          {warnings.map((w) => (
            <div key={w.id} className="p-3.5 sm:p-5 bg-[#003135] border border-[#024950] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-[#0FA4AF] text-[#003135] text-xs font-mono font-bold">
                    {w.id}
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-white">
                    Applies to Source {w.source_id}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-mono px-2.5 py-1 border font-bold ${
                    w.warning_type === 'stale_dated'
                      ? 'bg-[#E76F51]/20 text-[#E76F51] border-[#E76F51]'
                      : 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF]'
                  }`}
                >
                  {w.warning_type === 'stale_dated'
                    ? `Older Material (${w.date_found || 'Prior Year'})`
                    : w.warning_type === 'date_not_found'
                    ? 'Date Not Found'
                    : 'Currentness Unknown'}
                </span>
              </div>

              <div className="p-3 bg-[#024950]/40 border border-[#024950] text-xs font-mono text-[#AFDDE5] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#0FA4AF] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold uppercase tracking-wider mr-1">Rationale:</strong>
                  {w.rationale}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
