import React from 'react';
import { GitCompare, AlertTriangle, Quote } from 'lucide-react';
import type { ConflictFinding } from '../types';

interface ConflictListProps {
  conflicts: ConflictFinding[];
}

export const ConflictList: React.FC<ConflictListProps> = ({ conflicts }) => {
  return (
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#D7D2C7] pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[#171918]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171918]">
            Evidence Conflicts & Discrepancies ({conflicts.length})
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#625F57]">
          Contradictions with bilateral evidence
        </span>
      </div>

      <div className="p-2.5 bg-[#EAE5DA] border border-[#D7D2C7] text-[11px] font-mono text-[#625F57]">
        <strong>Principle:</strong> Discrepancies are flagged only when sources assert materially incompatible claims. Differences stemming from distinct dates or jurisdictions are labeled as discrepancies requiring context review.
      </div>

      {conflicts.length === 0 ? (
        <div className="p-4 bg-white border border-[#D7D2C7] text-xs font-mono text-[#625F57] text-center">
          No direct factual contradictions identified between the reviewed sources.
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map((conf) => (
            <div key={conf.id} className="p-4 bg-white border border-[#D7D2C7] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono font-bold">
                  {conf.id}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 border ${
                    conf.conflict_status === 'material_conflict'
                      ? 'bg-[#F9EBEA] text-[#D9534F] border-[#D9534F] font-semibold'
                      : 'bg-[#FEF9E7] text-[#171918] border-[#D6A64F]'
                  }`}
                >
                  {conf.conflict_status === 'material_conflict'
                    ? 'Material Conflict'
                    : 'Possible Discrepancy — Context Needs Checking'}
                </span>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Side A */}
                <div className="p-3 bg-[#F3F0E8] border border-[#D7D2C7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#171918] uppercase">
                      Claim from {conf.source_id_a}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#171918] text-[#F3F0E8] text-[10px] font-mono">
                      {conf.source_id_a}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-semibold text-[#171918]">
                    {conf.claim_a}
                  </p>
                  <div className="p-2 bg-white border border-[#D7D2C7] text-[11px] font-mono text-[#625F57] flex items-start gap-1.5">
                    <Quote className="w-3 h-3 text-[#D6A64F] shrink-0 mt-0.5" />
                    <span>"{conf.evidence_a}"</span>
                  </div>
                </div>

                {/* Side B */}
                <div className="p-3 bg-[#F3F0E8] border border-[#D7D2C7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#171918] uppercase">
                      Claim from {conf.source_id_b}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#171918] text-[#F3F0E8] text-[10px] font-mono">
                      {conf.source_id_b}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-semibold text-[#171918]">
                    {conf.claim_b}
                  </p>
                  <div className="p-2 bg-white border border-[#D7D2C7] text-[11px] font-mono text-[#625F57] flex items-start gap-1.5">
                    <Quote className="w-3 h-3 text-[#D6A64F] shrink-0 mt-0.5" />
                    <span>"{conf.evidence_b}"</span>
                  </div>
                </div>
              </div>

              {conf.context_note && (
                <div className="p-2.5 bg-[#FEF9E7] border border-[#D6A64F] text-xs font-mono text-[#171918] flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D6A64F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#171918]">Contextual Note: </strong>
                    {conf.context_note}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
