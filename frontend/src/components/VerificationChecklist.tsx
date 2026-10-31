import React, { useState } from 'react';
import { CheckSquare, ArrowUpRight, Check } from 'lucide-react';
import type { VerificationTask } from '../types';

interface VerificationChecklistProps {
  checklist: VerificationTask[];
}

export const VerificationChecklist: React.FC<VerificationChecklistProps> = ({ checklist }) => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#024950] pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#AFDDE5]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            PRIORITIZED VERIFICATION CHECKLIST ({checklist.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#AFDDE5]/80">
          {completedIds.size}/{checklist.length} verified
        </span>
      </div>

      <div className="p-3 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/90">
        <strong className="text-[#0FA4AF] uppercase tracking-wider mr-1">Principle:</strong> These actionable items are AI-assisted recommendations pointing to authoritative channels for confirming gaps and resolving potential discrepancies.
      </div>

      {checklist.length === 0 ? (
        <div className="p-6 bg-[#003135] border border-[#024950] text-xs font-mono text-[#AFDDE5]/70 text-center">
          No additional verification tasks generated.
        </div>
      ) : (
        <div className="space-y-4">
          {checklist.map((task) => {
            const isDone = completedIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`p-5 border transition-all duration-200 ${
                  isDone
                    ? 'bg-[#003135]/60 border-[#024950] opacity-60'
                    : 'bg-[#003135] border-[#024950] hover:border-[#0FA4AF]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCheck(task.id)}
                    className={`w-5 h-5 mt-0.5 border flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF] ${
                      isDone
                        ? 'bg-[#0FA4AF] border-[#0FA4AF] text-[#003135]'
                        : 'border-[#0FA4AF] bg-[#003135] hover:bg-[#024950]'
                    }`}
                    title={isDone ? "Mark unverified" : "Mark verified"}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3] animate-fade-in" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#024950] text-[#0FA4AF] text-xs font-mono font-bold border border-[#024950]">
                          {task.id}
                        </span>
                        <h4 className={`text-xs sm:text-sm font-mono font-bold transition-colors duration-200 ${isDone ? 'line-through text-[#AFDDE5]/50' : 'text-white'}`}>
                          {task.action}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex text-[9px] font-mono uppercase px-2 py-0.5 bg-[#003135] text-[#AFDDE5] border border-[#024950] font-bold">
                          AI Action
                        </span>
                        <span
                          className={`self-start sm:self-auto text-[10px] font-mono px-2.5 py-1 border uppercase font-bold ${
                            task.priority === 'high'
                              ? 'bg-[#E76F51] text-white border-[#E76F51]'
                              : task.priority === 'medium'
                              ? 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF]'
                              : 'bg-[#003135] text-[#AFDDE5]/70 border-[#024950]'
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-[#AFDDE5]/90 leading-relaxed">
                      <strong className="text-white font-bold mr-1">Rationale:</strong>
                      {task.why_it_matters}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-[#AFDDE5]/80">
                      {task.suggested_source_type && (
                        <div className="inline-flex items-center gap-1.5 text-white">
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#0FA4AF]" />
                          <span>Target: <strong className="text-[#0FA4AF]">{task.suggested_source_type}</strong></span>
                        </div>
                      )}

                      {task.related_finding_ids && task.related_finding_ids.length > 0 && (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-semibold text-[#AFDDE5]">Resolves Finding:</span>
                          {task.related_finding_ids.map((fid) => (
                            <span key={fid} className="px-1.5 py-0.5 bg-[#024950] text-white text-[10px] font-bold border border-[#0FA4AF]/50">
                              {fid}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
