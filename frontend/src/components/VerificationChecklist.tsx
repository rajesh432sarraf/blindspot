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
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#D7D2C7] pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#171918]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171918]">
            Prioritized Verification Checklist ({checklist.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#625F57]">
          {completedIds.size}/{checklist.length} verified
        </span>
      </div>

      <div className="p-2.5 bg-[#EAE5DA] border border-[#D7D2C7] text-[11px] font-mono text-[#625F57]">
        <strong>Principle:</strong> These actionable items are AI-assisted recommendations pointing to authoritative channels for confirming gaps and resolving potential discrepancies.
      </div>

      {checklist.length === 0 ? (
        <div className="p-4 bg-white border border-[#D7D2C7] text-xs font-mono text-[#625F57] text-center">
          No additional verification tasks generated.
        </div>
      ) : (
        <div className="space-y-3">
          {checklist.map((task) => {
            const isDone = completedIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`p-4 border transition-colors ${
                  isDone
                    ? 'bg-[#EAE5DA] border-[#D7D2C7] opacity-75'
                    : 'bg-white border-[#D7D2C7]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCheck(task.id)}
                    className={`w-5 h-5 mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-[#171918] border-[#171918] text-[#F3F0E8]'
                        : 'border-[#171918] bg-white hover:bg-[#EAE5DA]'
                    }`}
                    title={isDone ? "Mark unverified" : "Mark verified"}
                  >
                    {isDone && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 bg-[#171918] text-[#F3F0E8] text-[10px] font-mono">
                          {task.id}
                        </span>
                        <h4 className={`text-xs font-mono font-bold ${isDone ? 'line-through text-[#625F57]' : 'text-[#171918]'}`}>
                          {task.action}
                        </h4>
                      </div>

                      <span
                        className={`self-start sm:self-auto text-[10px] font-mono px-2 py-0.5 border uppercase ${
                          task.priority === 'high'
                            ? 'bg-[#F9EBEA] text-[#D9534F] border-[#D9534F]'
                            : task.priority === 'medium'
                            ? 'bg-[#FEF9E7] text-[#D6A64F] border-[#D6A64F]'
                            : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7]'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    <p className="text-xs font-mono text-[#625F57] leading-relaxed">
                      <strong className="text-[#171918]">Rationale: </strong>
                      {task.why_it_matters}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#625F57]">
                      {task.suggested_source_type && (
                        <div className="inline-flex items-center gap-1 text-[#171918]">
                          <ArrowUpRight className="w-3 h-3 text-[#D6A64F]" />
                          <span>Check: <strong>{task.suggested_source_type}</strong></span>
                        </div>
                      )}

                      {task.related_finding_ids && task.related_finding_ids.length > 0 && (
                        <div className="inline-flex items-center gap-1">
                          <span>Related findings:</span>
                          {task.related_finding_ids.map((fid) => (
                            <span key={fid} className="px-1 py-0.2 bg-[#EAE5DA] border border-[#D7D2C7] text-[#171918]">
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

