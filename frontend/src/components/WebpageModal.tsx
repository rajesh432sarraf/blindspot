import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Search,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { SourceRecord } from '../types';

interface WebpageModalProps {
  source: SourceRecord | null;
  allSources?: SourceRecord[];
  onClose: () => void;
  onSelectSource?: (source: SourceRecord) => void;
}

export const WebpageModal: React.FC<WebpageModalProps> = ({
  source,
  allSources = [],
  onClose,
  onSelectSource,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (source) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [source]);

  if (!source) return null;

  const currentIndex = allSources.findIndex((s) => s.id === source.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allSources.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectSource) {
      onSelectSource(allSources[currentIndex - 1]);
      setSearchTerm('');
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectSource) {
      onSelectSource(allSources[currentIndex + 1]);
      setSearchTerm('');
    }
  };

  const handleCopyText = async () => {
    if (!source.full_text) return;
    try {
      await navigator.clipboard.writeText(source.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const textContent = source.full_text || source.excerpt || '';
  const charCount = textContent.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="webpage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fade-rise"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#003135] border border-[#0FA4AF] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#024950] border-b border-[#0FA4AF]/40 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#0FA4AF] text-[#003135] text-xs font-mono font-black shrink-0">
              {source.id}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-mono tracking-wider text-[#AFDDE5] uppercase font-bold block">
                Audited Webpage Corpus
              </span>
              <h3
                id="webpage-modal-title"
                className="text-xs sm:text-sm md:text-base font-bold font-mono text-white truncate max-w-[280px] sm:max-w-md md:max-w-xl"
                title={source.title || source.url}
              >
                {source.title || source.url}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0FA4AF] hover:bg-[#12b9c6] text-[#003135] text-xs font-mono font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              title="Open live website in new tab"
            >
              <span className="hidden sm:inline">Open Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-1.5 border border-[#0FA4AF]/40 text-[#AFDDE5] hover:text-white hover:border-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata & Quick Navigation Bar */}
        <div className="p-2.5 sm:p-3 bg-[#003135] border-b border-[#024950] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-[#AFDDE5]/80">
            <span className="inline-flex items-center gap-1 text-[#0FA4AF]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {source.status === 'failed' ? 'FETCH FAILED' : 'VERIFIED GROUNDED'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#AFDDE5]/60" />
              {source.date || 'Undated / Undetected'}
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#AFDDE5]/60" />
              {charCount.toLocaleString()} chars
            </span>
          </div>

          {/* Prev / Next Webpage Navigation */}
          {allSources.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono border border-[#024950] bg-[#024950]/50 text-[#AFDDE5] hover:border-[#0FA4AF] disabled:opacity-40 disabled:hover:border-[#024950] transition-colors"
                title="View previous source webpage"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-[11px] font-mono text-[#AFDDE5]/60 px-1">
                {currentIndex + 1} / {allSources.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono border border-[#024950] bg-[#024950]/50 text-[#AFDDE5] hover:border-[#0FA4AF] disabled:opacity-40 disabled:hover:border-[#024950] transition-colors"
                title="View next source webpage"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Search & Actions Bar inside Webpage */}
        <div className="px-3 sm:px-4 py-2 bg-[#003135] border-b border-[#024950] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#AFDDE5]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in extracted webpage text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-[#024950]/40 border border-[#024950] focus:border-[#0FA4AF] text-xs font-mono text-white placeholder-[#AFDDE5]/40 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={!source.full_text}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono border border-[#024950] bg-[#024950] text-[#AFDDE5] hover:border-[#0FA4AF] hover:text-white transition-colors"
              title="Copy extracted corpus text"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#0FA4AF]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Webpage Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#00272b] text-[#AFDDE5] text-xs sm:text-sm font-mono leading-relaxed select-text">
          {source.status === 'failed' ? (
            <div className="p-4 bg-[#964734]/20 border border-[#964734] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <AlertTriangle className="w-4 h-4 text-[#E76F51]" />
                <span>Webpage Retrieval Failed</span>
              </div>
              <p className="text-xs text-[#AFDDE5]">
                {source.error_message || 'Could not fetch content from this URL due to SSRF restriction, timeout, or unreachable host.'}
              </p>
              <div className="pt-2">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#0FA4AF] hover:underline"
                >
                  <span>Verify URL directly in your browser</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : !textContent ? (
            <div className="text-center py-10 text-[#AFDDE5]/60 font-mono text-xs">
              No text corpus available for this source.
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words space-y-2 font-mono">
              {searchTerm.trim() ? (
                // Highlight search matches
                textContent.split(new RegExp(`(${searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')).map((chunk, i) =>
                  chunk.toLowerCase() === searchTerm.toLowerCase() ? (
                    <mark key={i} className="bg-[#0FA4AF] text-[#003135] px-1 font-bold">
                      {chunk}
                    </mark>
                  ) : (
                    <span key={i}>{chunk}</span>
                  )
                )
              ) : (
                textContent
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-[#024950] border-t border-[#024950] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[#AFDDE5]/70">
          <div className="truncate max-w-full sm:max-w-lg">
            <span className="text-white font-bold mr-1">URL:</span>
            <span className="text-[#AFDDE5]/80 underline">{source.url}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-[#003135] text-white hover:bg-[#003135]/80 border border-[#0FA4AF] text-xs font-mono font-bold transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
