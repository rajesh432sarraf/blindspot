import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  BookOpen,
} from 'lucide-react';
import type { SourceRecord } from '../types';

interface SourceListProps {
  sources: SourceRecord[];
  highlightedSourceId?: string | null;
  onPreviewSource?: (source: SourceRecord) => void;
}

export const SourceList: React.FC<SourceListProps> = ({
  sources,
  highlightedSourceId,
  onPreviewSource,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const retrievedCount = sources.filter((s) => s.status === 'retrieved' || s.status === 'analyzed').length;
  const failedCount = sources.filter((s) => s.status === 'failed').length;

  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-3.5 sm:p-6 space-y-4">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#024950] pb-3 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            SOURCE EVIDENCE RAIL ({sources.length})
          </h2>
          <span className="text-xs font-mono text-[#AFDDE5]/80">
            {retrievedCount} retrieved • {failedCount} failed
          </span>
        </div>

        {/* Global Webpage Reader Button */}
        {sources.length > 0 && onPreviewSource && (
          <button
            type="button"
            onClick={() => {
              const firstValid = sources.find((s) => s.status !== 'failed') || sources[0];
              if (firstValid) onPreviewSource(firstValid);
            }}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 bg-[#0FA4AF] hover:bg-[#12b9c6] active:scale-95 text-[#003135] text-xs font-mono font-bold transition-all duration-150 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="Open interactive reader to inspect full webpage corpus"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Launch Webpage Reader</span>
          </button>
        )}
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 gap-3">
        {sources.map((s) => {
          const isExpanded =
            expandedId === s.id || (expandedId === null && highlightedSourceId === s.id);
          const isHighlighted = highlightedSourceId === s.id;
          const isSuccess = s.status === 'retrieved' || s.status === 'analyzed' || s.status === 'partial';

          return (
            <div
              key={s.id}
              id={`source-${s.id}`}
              className={`border transition-all duration-300 scroll-mt-24 ${
                isHighlighted
                  ? 'ring-2 ring-[#0FA4AF] ring-offset-2 ring-offset-[#003135] border-[#0FA4AF]'
                  : ''
              } ${
                s.status === 'failed'
                  ? 'border-[#964734] bg-[#964734]/15 hover:border-[#ba5942]'
                  : 'border-[#024950] bg-[#003135] hover:border-[#0FA4AF]/60'
              }`}
            >
              <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <span className="px-2 py-1 sm:px-2.5 bg-[#0FA4AF] text-[#003135] text-xs font-mono font-black shrink-0">
                      {s.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => onPreviewSource ? onPreviewSource(s) : toggleExpand(s.id)}
                        className="text-xs sm:text-sm font-bold font-mono text-white truncate cursor-pointer hover:text-[#0FA4AF] transition-colors"
                        title="Click to inspect this webpage"
                      >
                        {s.title || s.url}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-[#AFDDE5]/70 hover:text-white truncate underline inline-flex items-center gap-1 max-w-[200px] sm:max-w-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
                          title="Open original source in new browser tab"
                        >
                          <span className="truncate">{s.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-[#0FA4AF]" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
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

                    {/* Inspect Webpage Button (Modal View) */}
                    {onPreviewSource && (
                      <button
                        type="button"
                        onClick={() => onPreviewSource(s)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono bg-[#024950] hover:bg-[#0FA4AF] hover:text-[#003135] text-[#AFDDE5] border border-[#0FA4AF]/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
                        title="Open in Webpage Reader modal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Inspect</span>
                      </button>
                    )}

                    {/* Inline Expand Toggle */}
                    {isSuccess && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.id)}
                        className="p-1 border border-[#024950] bg-[#003135] text-[#AFDDE5] hover:border-[#0FA4AF] hover:text-white active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
                        title={isExpanded ? 'Collapse excerpt' : 'Expand excerpt'}
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
                    <span className="uppercase tracking-wider text-[#0FA4AF] font-bold">
                      Extracted Text Excerpt (Grounded Corpus):
                    </span>
                    {s.date_provenance && <span>Provenance: {s.date_provenance}</span>}
                  </div>
                  <pre className="p-3 bg-[#024950]/50 border border-[#024950] text-[11px] font-mono whitespace-pre-wrap break-all max-h-56 overflow-y-auto leading-relaxed text-[#AFDDE5]">
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
