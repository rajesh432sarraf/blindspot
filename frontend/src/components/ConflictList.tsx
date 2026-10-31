import React from 'react';
import { GitCompare, AlertTriangle, Quote } from 'lucide-react';
import type { ConflictFinding } from '../types';

interface ConflictListProps {
  conflicts: ConflictFinding[];
}

export const ConflictList: React.FC<ConflictListProps> = ({ conflicts }) => {
  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#024950] pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[#0FA4AF]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            EVIDENCE CONFLICTS & DISCREPANCIES ({conflicts.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#AFDDE5]/80">
          Contradictions with bilateral evidence
        </span>
      </div>

      <div className="p-3 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/90">
        <strong className="text-[#0FA4AF] uppercase tracking-wider mr-1">Principle:</strong> Discrepancies are flagged only when sources assert materially incompatible claims. Differences stemming from distinct dates or jurisdictions are labeled as discrepancies requiring context review.
      </div>

      {conflicts.length === 0 ? (
        <div className="p-6 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/70 text-center">
          No direct factual contradictions identified between the reviewed sources.
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map((conf) => (
            <div key={conf.id} className="p-5 bg-[#003135] border border-[#024950] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#0FA4AF] text-[#003135] text-xs font-mono font-bold">
                    {conf.id}
                  </span>
                  <span className="hidden sm:inline-flex text-[9px] font-mono uppercase px-2 py-0.5 bg-[#003135] text-[#AFDDE5] border border-[#024950] font-bold">
                    Bilateral Source Comparison
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono px-2.5 py-1 border font-bold ${
                    conf.conflict_status === 'material_conflict'
                      ? 'bg-[#E76F51]/20 text-[#E76F51] border-[#E76F51]'
                      : 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF]'
                  }`}
                >
                  {conf.conflict_status === 'material_conflict'
                    ? 'Material Conflict'
                    : 'Possible Discrepancy — Context Needs Checking'}
                </span>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Side A */}
                <div className="p-4 bg-[#024950]/40 border border-[#024950] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#AFDDE5] uppercase tracking-wider">
                      Claim from {conf.source_id_a}
                    </span>
                    <a
                      href={`#source-${conf.source_id_a}`}
                      className="px-2 py-0.5 bg-[#003135] text-[#0FA4AF] text-xs font-mono border border-[#024950] hover:border-[#0FA4AF] transition-colors"
                      title={`Jump to source ${conf.source_id_a} in rail`}
                    >
                      {conf.source_id_a}
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm font-mono font-bold text-white">
                    {conf.claim_a}
                  </p>
                  <div className="p-3 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5] flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-[#0FA4AF] shrink-0 mt-0.5" />
                    <span>"{conf.evidence_a}"</span>
                  </div>
                </div>

                {/* Side B */}
                <div className="p-4 bg-[#024950]/40 border border-[#024950] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#AFDDE5] uppercase tracking-wider">
                      Claim from {conf.source_id_b}
                    </span>
                    <a
                      href={`#source-${conf.source_id_b}`}
                      className="px-2 py-0.5 bg-[#003135] text-[#0FA4AF] text-xs font-mono border border-[#024950] hover:border-[#0FA4AF] transition-colors"
                      title={`Jump to source ${conf.source_id_b} in rail`}
                    >
                      {conf.source_id_b}
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm font-mono font-bold text-white">
                    {conf.claim_b}
                  </p>
                  <div className="p-3 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5] flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-[#0FA4AF] shrink-0 mt-0.5" />
                    <span>"{conf.evidence_b}"</span>
                  </div>
                </div>
              </div>

              {conf.context_note && (
                <div className="p-3 bg-[#024950]/30 border border-[#0FA4AF] text-xs font-mono text-[#AFDDE5] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#0FA4AF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold uppercase tracking-wider mr-1">Contextual Note:</strong>
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
