import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Volume2,
  Square,
  Copy,
  Check,
  Sparkles,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { AnalysisResult } from '../types';

interface SummaryPanelProps {
  result: AnalysisResult;
}

interface InsightCard {
  id: number;
  text: string;
  category: string;
  type: 'metric' | 'gap' | 'protocol';
  badgeColor: string;
}

function parseSummaryToCards(summary: string): InsightCard[] {
  if (!summary) return [];

  // Split on sentence boundaries (period, question mark, exclamation followed by space or uppercase)
  const sentences = summary
    .replace(/([.?!])\s+(?=[A-Z0-9])/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length === 0) {
    return [
      {
        id: 1,
        text: summary,
        category: 'Evidence Synthesis',
        type: 'protocol',
        badgeColor: 'border-[#0FA4AF] text-[#0FA4AF] bg-[#0FA4AF]/10',
      },
    ];
  }

  return sentences.map((sentence, index) => {
    const isGap = /not found|omitted|gap|unanswered|missing|lacks|absent|unaddressed|no mention|truncated/i.test(
      sentence
    );
    const hasMetric = /\d+(\.\d+)?%?|\b(million|thousand|billion|percent|rate|stats|mortality|cases)\b/i.test(
      sentence
    );

    let type: 'metric' | 'gap' | 'protocol' = 'protocol';
    let category = 'Verified Clinical & Policy Findings';
    let badgeColor = 'border-[#0FA4AF] text-[#0FA4AF] bg-[#0FA4AF]/10';

    if (isGap) {
      type = 'gap';
      category = 'Information Void / Unaddressed Facet';
      badgeColor = 'border-[#E76F51] text-[#E76F51] bg-[#E76F51]/10';
    } else if (hasMetric) {
      type = 'metric';
      category = 'Quantitative Evidence & Statistics';
      badgeColor = 'border-[#AFDDE5] text-[#AFDDE5] bg-[#024950]/60';
    }

    return {
      id: index + 1,
      text: sentence,
      category,
      type,
      badgeColor,
    };
  });
}

// Function to auto-highlight numbers, metrics, and key acronyms in sentence cards
function renderHighlightedText(text: string) {
  // Regex to highlight numbers with optional unit words (e.g. 10.7 million, 1.23 million, 2 in 5, 2024)
  const parts = text.split(
    /(\b\d+(?:\.\d+)?\s*(?:million|billion|thousand|deaths|cases|percent|%)?\b|\b2 in 5\b|\b202[4-9]\b|\b[A-Z]{2,}(?:\/[A-Z0-9]+)?\b)/g
  );

  return parts.map((part, i) => {
    if (!part) return null;
    const isSpecial =
      /^\d+(?:\.\d+)?\s*(?:million|billion|thousand|deaths|cases|percent|%)?$/i.test(part) ||
      /^2 in 5$/i.test(part) ||
      /^202[4-9]$/.test(part) ||
      /^[A-Z]{2,}(?:\/[A-Z0-9]+)?$/.test(part);

    if (isSpecial) {
      return (
        <span
          key={i}
          className="text-white font-bold px-1.5 py-0.5 bg-[#024950]/80 border border-[#0FA4AF]/40 rounded-xs mx-0.5 inline-block font-mono text-[11px] sm:text-xs tracking-tight shadow-xs"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ result }) => {
  const [showLimits, setShowLimits] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'text'>('cards');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const failedSources = result.sources.filter(s => s.status === 'failed');
  const cards = parseSummaryToCards(result.summary);

  const unaddressedGaps = result.gaps.filter(
    g => g.status === 'not_found_in_reviewed_sources'
  );
  const unaddressedCount = unaddressedGaps.length;
  // Calculate coverage percentage: if 0 gaps, 100%. Otherwise dynamic ratio
  const totalAspects = Math.max(1, cards.length + unaddressedCount);
  const coveragePct =
    unaddressedCount === 0
      ? 100
      : Math.max(25, Math.round(((totalAspects - unaddressedCount) / totalAspects) * 100));

  // Audio briefing controls using browser SpeechSynthesis
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = result.summary.replace(/\[S\d+\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleCopyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(result.summary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#024950]/40 border border-[#024950] p-5 sm:p-6 lg:p-7 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#024950] gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#0FA4AF]" />
          <div>
            <h2 className="text-sm sm:text-base font-mono font-black uppercase tracking-wider text-white">
              INVESTIGATION SYNTHESIS
            </h2>
            <span className="text-[10px] font-mono text-[#AFDDE5]/70 block">
              Multi-Source Evidence Extraction & Void Identification
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 bg-[#003135] border border-[#024950] text-[#AFDDE5]">
            ID: <strong className="text-white">{result.investigation_id}</strong>
          </span>

          {result.is_insufficient_evidence ? (
            <span className="px-2.5 py-1 bg-[#E76F51]/30 border border-[#E76F51] text-white font-bold">
              INSUFFICIENT EVIDENCE
            </span>
          ) : failedSources.length > 0 ? (
            <span className="px-2.5 py-1 bg-[#E76F51]/20 border border-[#E76F51] text-[#AFDDE5] font-semibold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E76F51]" />
              Partial Source Coverage ({result.sources.length - failedSources.length}/
              {result.sources.length})
            </span>
          ) : result.evidence_fully_audited ? (
            <span className="px-2.5 py-1 bg-[#0FA4AF]/20 border border-[#0FA4AF] text-[#AFDDE5] font-semibold inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(15,164,175,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0FA4AF]" />
              Evidence Fully Audited
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-[#024950] border border-[#0FA4AF] text-[#AFDDE5] font-semibold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#0FA4AF]" />
              Evidence Scoped to Reviewed Sources
            </span>
          )}
        </div>
      </div>

      {/* Audited Research Question with Scope Banner */}
      <div className="p-4 bg-[#003135] border border-[#024950] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#0FA4AF]"></div>
        <span className="text-[#0FA4AF] uppercase tracking-[0.15em] text-[11px] font-mono font-black block mb-1">
          Audited Research Question
        </span>
        <p className="font-bold text-white text-sm sm:text-base md:text-lg font-mono leading-snug">
          "{result.question}"
        </p>
      </div>

      {/* Interactive Topic Audit Coverage Meter (Visual Progress Animation) */}
      <div className="p-4 bg-[#003135] border border-[#024950] space-y-2.5 animate-fade-rise">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
          <span className="text-[#AFDDE5] uppercase font-bold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0FA4AF]" />
            Evidence Coverage & Resolution Meter
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#0FA4AF] font-black">
              {coveragePct}% RESOLVED
            </span>
            {unaddressedCount > 0 && (
              <span className="text-[11px] text-[#E76F51] font-bold">
                ({unaddressedCount} Unaddressed Void)
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Dual-Segment Progress Bar */}
        <div className="w-full h-2.5 bg-[#024950]/60 overflow-hidden flex border border-[#024950] relative">
          <div
            style={{ width: `${coveragePct}%` }}
            className="bg-gradient-to-r from-[#024950] via-[#0FA4AF] to-[#AFDDE5] h-full transition-all duration-700 ease-out"
          ></div>
          <div
            style={{ width: `${100 - coveragePct}%` }}
            className="bg-[#E76F51] h-full transition-all duration-700 ease-out animate-pulse"
            title={`${unaddressedCount} unaddressed question facet(s)`}
          ></div>
        </div>

        {/* 4 Quick Stat Micro-Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
          <div className="p-2 bg-[#024950]/50 border border-[#024950] flex items-center justify-between">
            <span className="text-[#AFDDE5]/70">Sources:</span>
            <span className="text-white font-bold">
              {result.sources.filter(s => s.status !== 'failed').length} Active
            </span>
          </div>

          <div className="p-2 bg-[#024950]/50 border border-[#024950] flex items-center justify-between">
            <span className="text-[#AFDDE5]/70">Density:</span>
            <span className="text-[#0FA4AF] font-bold">
              {result.sources
                .reduce((acc, s) => acc + (s.full_text?.length || 0), 0)
                .toLocaleString()}{' '}
              Chars
            </span>
          </div>

          <div className="p-2 bg-[#024950]/50 border border-[#024950] flex items-center justify-between">
            <span className="text-[#AFDDE5]/70">Gaps:</span>
            <span
              className={`font-bold ${
                unaddressedCount > 0 ? 'text-[#E76F51]' : 'text-white'
              }`}
            >
              {unaddressedCount} Identified
            </span>
          </div>

          <div className="p-2 bg-[#024950]/50 border border-[#024950] flex items-center justify-between">
            <span className="text-[#AFDDE5]/70">Conflicts:</span>
            <span className="text-white font-bold">
              {result.conflicts.length} Detected
            </span>
          </div>
        </div>
      </div>

      {/* Synthesis Toolbar: Audio Briefing + Scannable Cards View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#024950]">
        <div className="flex items-center gap-2">
          {/* View Switcher: Cards vs Full Narrative */}
          <div className="inline-flex p-0.5 bg-[#003135] border border-[#024950]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#0FA4AF] text-[#003135] shadow-xs'
                  : 'text-[#AFDDE5]/70 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Scannable Cards ({cards.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'text'
                  ? 'bg-[#0FA4AF] text-[#003135] shadow-xs'
                  : 'text-[#AFDDE5]/70 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Narrative</span>
            </button>
          </div>
        </div>

        {/* 🎧 Interactive Speech Reader Button with Animated Soundwave Equalizer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs font-mono font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
              isPlayingAudio
                ? 'bg-[#E76F51] text-white border-[#E76F51] shadow-[0_0_15px_rgba(231,111,81,0.5)]'
                : 'bg-[#003135] text-[#AFDDE5] border-[#0FA4AF]/50 hover:bg-[#0FA4AF] hover:text-[#003135] hover:border-[#0FA4AF]'
            }`}
            title="Play high-speed audio briefing using native speech synthesis"
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Briefing</span>
                {/* 4 Animated Equalizer Sound Bars */}
                <div className="flex items-end gap-0.5 h-3.5 ml-1">
                  <span className="w-0.5 bg-white animate-soundwave-1"></span>
                  <span className="w-0.5 bg-white animate-soundwave-2"></span>
                  <span className="w-0.5 bg-white animate-soundwave-3"></span>
                  <span className="w-0.5 bg-white animate-soundwave-4"></span>
                </div>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#0FA4AF]" />
                <span>Listen to Briefing (30s)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: SCANNABLE INTELLIGENCE CARDS (Default — Eliminates Wall of Text) */}
      {viewMode === 'cards' && (
        <div className="space-y-3 animate-fade-rise">
          <div className="text-[11px] font-mono text-[#AFDDE5]/70 flex items-center justify-between pb-1">
            <span>
              Key findings parsed into scannable cards with auto-detected metrics:
            </span>
            <span className="text-[#0FA4AF] font-bold">
              {cards.length} Key Takeaways
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                className={`p-4 bg-[#003135] border transition-all duration-200 group relative hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(2,73,80,0.4)] ${
                  card.type === 'gap'
                    ? 'border-l-4 border-l-[#E76F51] border-[#024950] bg-[#E76F51]/5 hover:border-l-[#E76F51] hover:border-[#E76F51]/60'
                    : card.type === 'metric'
                    ? 'border-l-4 border-l-[#0FA4AF] border-[#024950] hover:border-[#0FA4AF]'
                    : 'border-l-4 border-l-[#AFDDE5] border-[#024950] hover:border-[#AFDDE5]'
                } animate-fade-rise`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Card Header Bar */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {card.type === 'gap' ? (
                      <AlertCircle className="w-4 h-4 text-[#E76F51] shrink-0" />
                    ) : card.type === 'metric' ? (
                      <TrendingUp className="w-4 h-4 text-[#0FA4AF] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#AFDDE5] shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${card.badgeColor}`}
                    >
                      {card.category}
                    </span>
                    <span className="hidden sm:inline-flex text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[#024950] text-[#0FA4AF] border border-[#0FA4AF]/30 font-bold">
                      Sourced Fact
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-[#AFDDE5]/50 group-hover:text-[#0FA4AF] transition-colors">
                    #FINDING {String(card.id).padStart(2, '0')}
                  </span>
                </div>

                {/* Card Content with Auto-Highlighted Entities */}
                <p className="text-xs sm:text-sm font-mono text-[#AFDDE5] leading-relaxed pl-6">
                  {renderHighlightedText(card.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: FULL FORENSIC NARRATIVE (With Copy Button & Word Count) */}
      {viewMode === 'text' && (
        <div className="p-5 bg-[#003135] border border-[#024950] space-y-3 animate-fade-rise">
          <div className="flex items-center justify-between pb-2 border-b border-[#024950] text-xs font-mono text-[#AFDDE5]/70">
            <span className="text-[11px] uppercase tracking-wider text-[#0FA4AF] font-bold">
              Uninterrupted Evidence-Grounded Narrative
            </span>
            <div className="flex items-center gap-3">
              <span>{result.summary.split(/\s+/).length} words</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#024950] hover:bg-[#0FA4AF] hover:text-[#003135] text-white transition-colors cursor-pointer"
                title="Copy entire synthesis text"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-[#0FA4AF]" />
                    <span>Copied!</span>
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

          <p className="text-xs sm:text-sm font-mono text-[#AFDDE5] leading-relaxed whitespace-pre-line selection:bg-[#0FA4AF] selection:text-[#003135]">
            {result.summary}
          </p>
        </div>
      )}

      {/* Methodological Constraints Dropdown */}
      {result.limitations && result.limitations.length > 0 && (
        <div className="border border-[#024950] bg-[#003135]">
          <button
            type="button"
            onClick={() => setShowLimits(!showLimits)}
            className="w-full p-3 flex items-center justify-between text-xs font-mono text-[#AFDDE5]/80 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#0FA4AF]" />
              <span className="font-semibold uppercase tracking-wider">
                Methodological Constraints & Scope Limitations ({result.limitations.length})
              </span>
            </div>
            {showLimits ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          {showLimits && (
            <div className="p-4 border-t border-[#024950] bg-[#003135]/90 text-xs font-mono text-[#AFDDE5]/90 space-y-1.5 animate-fade-in">
              {result.limitations.map((limit, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#0FA4AF]">•</span>
                  <span>{limit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
