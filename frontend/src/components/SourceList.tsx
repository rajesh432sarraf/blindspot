import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { SourceRecord } from '../types';

interface SourceListProps {
  sources: SourceRecord[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#024950] pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            SOURCE EVIDENCE RAIL ({sources.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#AFDDE5]/80">
          {sources.filter(s => s.status === 'retrieved' || s.status === 'analyzed').length} retrieved • {sources.filter(s => s.status === 'failed').length} failed
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sources.map((s) => {
          const isExpanded = expandedId === s.id;
          const isSuccess = s.status === 'retrieved' || s.status === 'analyzed' || s.status === 'partial';

          return (
            <div
              key={s.id}
              id={`source-${s.id}`}
              className={`border transition-all duration-150 ${
                s.status === 'failed'
                  ? 'border-[#964734] bg-[#964734]/15 hover:border-[#ba5942]'
                  : 'border-[#024950] bg-[#003135] hover:border-[#0FA4AF]/60'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="px-2.5 py-1 bg-[#0FA4AF] text-[#003135] text-xs font-mono font-black shrink-0">
                      {s.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold font-mono text-white truncate" title={s.title}>
                        {s.title || s.url}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-[#AFDDE5]/70 hover:text-white truncate underline inline-flex items-center gap-1 max-w-[280px] sm:max-w-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
                          title="Open original source in new tab"
                        >
                          <span className="truncate">{s.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-[#0FA4AF]" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Pill */}
                    {s.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 bg-[#964734]/30 text-white border border-[#964734]">
                        <AlertCircle className="w-3 h-3 text-[#964734]" />
                        FAILED
                      </span>
                    ) : s.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#024950] text-[#AFDDE5] border border-[#0FA4AF]">
                        PARTIAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#0FA4AF]/20 text-[#AFDDE5] border border-[#0FA4AF]">
                        <CheckCircle2 className="w-3 h-3 text-[#0FA4AF]" />
                        RETRIEVED
                      </span>
                    )}

                    {/* Date Tag */}
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#024950] text-[#AFDDE5] border border-[#024950]">
                      <Clock className="w-3 h-3 text-[#0FA4AF]" />
                      {s.date ? s.date : s.date_status === 'undated' ? 'Date Not Found' : 'Date Unknown'}
                    </span>

                    {/* Expand Toggle */}
                    {isSuccess && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.id)}
                        className="p-1 border border-[#024950] bg-[#003135] text-[#AFDDE5] hover:border-[#0FA4AF] hover:text-white active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
                        title={isExpanded ? "Collapse excerpt" : "Expand excerpt"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#0FA4AF]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#AFDDE5]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {s.error_message && (
                  <div className="mt-3 text-xs font-mono text-[#AFDDE5] bg-[#964734]/20 p-2.5 border border-[#964734]">
                    <strong className="text-white font-bold mr-1">Error:</strong>
                    {s.error_message}
                  </div>
                )}
              </div>

              {/* Expanded Excerpt Drawer */}
              {isExpanded && s.full_text && (
                <div className="border-t border-[#024950] bg-[#003135]/90 p-4 text-xs font-mono text-[#AFDDE5] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#AFDDE5]/70">
                    <span className="uppercase tracking-wider text-[#0FA4AF] font-bold">Extracted Text Excerpt (Grounded Corpus):</span>
                    {s.date_provenance && <span>Provenance: {s.date_provenance}</span>}
                  </div>
                  <pre className="p-3 bg-[#024950]/50 border border-[#024950] text-[11px] font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed text-[#AFDDE5]">
                    {s.full_text}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
