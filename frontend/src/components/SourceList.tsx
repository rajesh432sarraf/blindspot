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
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#D7D2C7] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#171918]"></span>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171918]">
            Source Evidence Rail ({sources.length})
          </h2>
        </div>
        <span className="text-xs font-mono text-[#625F57]">
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
              className={`border transition-colors ${
                s.status === 'failed'
                  ? 'border-[#D9534F] bg-[#F9EBEA]'
                  : 'border-[#D7D2C7] bg-[#EAE5DA]'
              }`}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="px-2 py-0.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono font-bold shrink-0">
                      {s.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold font-mono text-[#171918] truncate" title={s.title}>
                        {s.title || s.url}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-[#625F57] hover:text-[#171918] truncate underline inline-flex items-center gap-1 max-w-[280px] sm:max-w-md"
                          title="Open original source in new tab"
                        >
                          <span className="truncate">{s.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Pill */}
                    {s.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 bg-[#F2D7D5] text-[#D9534F] border border-[#D9534F]">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                      </span>
                    ) : s.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#FEF9E7] text-[#D6A64F] border border-[#D6A64F]">
                        Partial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#E8F5E9] text-[#4E8752] border border-[#4E8752]">
                        <CheckCircle2 className="w-3 h-3" />
                        Retrieved
                      </span>
                    )}

                    {/* Date Tag */}
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#E5DFD3] text-[#625F57] border border-[#D7D2C7]">
                      <Clock className="w-3 h-3 text-[#D6A64F]" />
                      {s.date ? s.date : s.date_status === 'undated' ? 'Date Not Found' : 'Date Unknown'}
                    </span>

                    {/* Expand Toggle */}
                    {isSuccess && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.id)}
                        className="p-1 border border-[#D7D2C7] bg-[#F3F0E8] text-[#171918] hover:bg-[#171918] hover:text-[#F3F0E8] transition-colors"
                        title={isExpanded ? "Collapse excerpt" : "Expand excerpt"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {s.error_message && (
                  <div className="mt-2 text-[11px] font-mono text-[#D9534F] bg-[#FADBD8] p-2 border border-[#D9534F]">
                    {s.error_message}
                  </div>
                )}
              </div>

              {/* Expanded Excerpt Drawer */}
              {isExpanded && s.full_text && (
                <div className="border-t border-[#D7D2C7] bg-[#F3F0E8] p-3 text-xs font-mono text-[#171918] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#625F57]">
                    <span>Extracted Text Excerpt (Untrusted Source Evidence):</span>
                    {s.date_provenance && <span>Provenance: {s.date_provenance}</span>}
                  </div>
                  <pre className="p-3 bg-white border border-[#D7D2C7] text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed text-[#171918]">
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
