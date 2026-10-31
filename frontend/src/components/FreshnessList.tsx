import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { FreshnessWarning } from '../types';

interface FreshnessListProps {
  warnings: FreshnessWarning[];
}

export const FreshnessList: React.FC<FreshnessListProps> = ({ warnings }) => {
  return (
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#D7D2C7] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#171918]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171918]">
            Freshness & Date Warnings ({warnings.length})
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#625F57]">
          Currentness audit
        </span>
      </div>

      <div className="p-2.5 bg-[#EAE5DA] border border-[#D7D2C7] text-[11px] font-mono text-[#625F57]">
        <strong>Principle:</strong> Age does not equate to falsity. Older documents may accurately describe their historical context, but changes over time necessitate verifying current applicability.
      </div>

      {warnings.length === 0 ? (
        <div className="p-4 bg-white border border-[#D7D2C7] text-xs font-mono text-[#625F57] text-center">
          All reviewed sources have verified, up-to-date timestamps.
        </div>
      ) : (
        <div className="space-y-3">
          {warnings.map((w) => (
            <div key={w.id} className="p-4 bg-white border border-[#D7D2C7] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono font-bold">
                    {w.id}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#171918]">
                    Applies to Source {w.source_id}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-mono px-2 py-0.5 border ${
                    w.warning_type === 'stale_dated'
                      ? 'bg-[#FEF9E7] text-[#171918] border-[#D6A64F]'
                      : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7]'
                  }`}
                >
                  {w.warning_type === 'stale_dated'
                    ? `Older Material (${w.date_found || 'Prior Year'})`
                    : w.warning_type === 'date_not_found'
                    ? 'Date Not Found'
                    : 'Currentness Unknown'}
                </span>
              </div>

              <div className="p-2.5 bg-[#F3F0E8] border border-[#D7D2C7] text-xs font-mono text-[#171918] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D6A64F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#171918]">Rationale: </strong>
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
