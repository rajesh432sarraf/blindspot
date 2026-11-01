import React, { useState } from 'react';
import { UrlInputList } from './UrlInputList';
import { ArrowRight, AlertCircle, Info, Terminal } from 'lucide-react';
import type { AnalyzeRequest } from '../types';
import heroBg from '../assets/hero-bg.jpg';

interface ResearchFormProps {
  onSubmit: (request: AnalyzeRequest) => void;
  isLoading: boolean;
}

export const ResearchForm: React.FC<ResearchFormProps> = ({ onSubmit, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [urls, setUrls] = useState<string[]>(['', '']);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 5) {
      setFormError('Please enter a research question or click an Evaluation Benchmark above (Preset 1 or Preset 2).');
      return;
    }

    const validUrls = urls.map(u => u.trim()).filter(u => u.length > 0);
    if (validUrls.length === 0) {
      setFormError('Please provide at least one public source URL or click an Evaluation Benchmark above.');
      return;
    }

    // Basic URL validation & duplicate detection
    const seenNormalized = new Set<string>();
    for (const u of validUrls) {
      const lower = u.toLowerCase();
      if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('file:') || lower.startsWith('blob:')) {
        setFormError(`Blocked dangerous protocol in "${u}". Only public http:// and https:// URLs are permitted.`);
        return;
      }

      if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('169.254.169.254')) {
        setFormError(`Security restriction: Localhost, loopback, and cloud metadata addresses are blocked.`);
        return;
      }

      try {
        const parsed = new URL(u);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setFormError(`Invalid protocol in URL: "${u}". Only http:// and https:// are supported.`);
          return;
        }
      } catch {
        setFormError(`Invalid URL format: "${u}". Please provide a complete URL including http:// or https://.`);
        return;
      }

      const normalized = u.toLowerCase().replace(/\/+$/, '');
      if (seenNormalized.has(normalized)) {
        setFormError(`Duplicate URL entered: "${u}". Please submit distinct source URLs.`);
        return;
      }
      seenNormalized.add(normalized);
    }

    onSubmit({
      question: trimmedQuestion,
      urls: validUrls,
    });
  };

  const handleLoadGatesExample = () => {
    setQuestion('What are the eligibility criteria, application deadlines, and renewal requirements for the Gates Cambridge Scholarship?');
    setUrls([
      'https://www.gatescambridge.org/programme/the-scholarship/',
      'https://www.gatescambridge.org/apply/eligibility/',
      'https://www.gatescambridge.org/apply/timeline/'
    ]);
    setFormError(null);
  };

  const handleLoadNspExample = () => {
    setQuestion('What are the eligibility criteria, application deadline, and renewal requirements for the PM-USP Central Sector Scholarship Scheme?');
    setUrls([
      'https://scholarships.gov.in/',
      'https://www.education.gov.in/scholarships-education-loan-0',
      'https://www.education.gov.in/'
    ]);
    setFormError(null);
  };

  return (
    <div className="w-full flex flex-col bg-[#003135]">
      {/* 1. Cinematic Hero Visual Block (Direct Visual from Image 2) */}
      <div className="relative w-full h-[280px] sm:h-[400px] md:h-[480px] lg:h-[500px] overflow-hidden bg-[#003135]">
        {/* Background visual with crisp high-contrast styling */}
        <img
          src={heroBg}
          alt="Blindspot Forensic Evidence Expanse"
          className="absolute inset-0 w-full h-full object-cover object-center filter saturate-125 contrast-115 brightness-95"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />

        {/* Directional bottom-heavy gradient keeping top peaks luminous */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#003135] via-[#003135]/75 to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-full sm:w-1/2 bg-gradient-to-r from-[#003135]/90 via-[#003135]/40 to-transparent"></div>

        {/* Oversized typography directly over visual with razor-sharp contrast */}
        <div className="absolute bottom-5 sm:bottom-10 left-4 sm:left-10 right-4 z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            Find the gaps <span className="text-[#0FA4AF]">→</span>
            <br />
            behind the answers.
          </h1>
        </div>
      </div>

      {/* 2. Unified, Symmetrical Investigation Console (Seamlessly integrated with top border) */}
      <div id="investigation-console" className="border-t border-b border-[#024950] bg-[#024950]/40 p-4 sm:p-8 lg:p-10 space-y-5 sm:space-y-6 relative">
        {/* Real-time Scanning Indicator (Stops immediately on completion/failure) */}
        {isLoading && (
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#024950] overflow-hidden" role="progressbar" aria-label="Investigation in progress">
            <div className="absolute inset-y-0 w-1/3 bg-[#0FA4AF] animate-scan-line"></div>
          </div>
        )}

        {/* Symmetric Top Bar: Title on Left, Presets on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-[#024950] gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] font-black text-white">
              INVESTIGATION CONSOLE
            </h2>
          </div>

          {/* Dual Evaluation Benchmark Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-mono text-[#AFDDE5]/70 font-bold hidden md:inline">
              Sample Presets:
            </span>
            <button
              type="button"
              onClick={handleLoadGatesExample}
              disabled={isLoading}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold border border-[#0FA4AF]/50 bg-[#003135] text-[#AFDDE5] hover:bg-[#0FA4AF] hover:text-[#003135] hover:border-[#0FA4AF] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
              title="Load Gates Cambridge multi-source benchmark"
            >
              <Terminal className="w-3.5 h-3.5 text-[#0FA4AF] shrink-0" />
              <span className="truncate">Preset 1: Gates Cambridge</span>
            </button>
            <button
              type="button"
              onClick={handleLoadNspExample}
              disabled={isLoading}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold border border-[#E76F51]/70 bg-[#003135] text-[#AFDDE5] hover:bg-[#E76F51] hover:text-white hover:border-[#E76F51] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
              title="Load National Scholarship Portal benchmark"
            >
              <Terminal className="w-3.5 h-3.5 text-[#E76F51] shrink-0" />
              <span className="truncate">Preset 2: National Scholarship Portal</span>
            </button>
          </div>
        </div>

        {/* Symmetric 2-Column Form Body (50% Question | 50% URLs) */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column (50%): Research Question */}
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="research-question"
                  className="block text-xs font-mono font-black text-[#AFDDE5] uppercase tracking-wider"
                >
                  RESEARCH QUESTION / OBJECTIVE
                </label>
                <span className="text-[10px] font-mono text-[#0FA4AF] font-bold uppercase tracking-wider">
                  Any Custom Topic
                </span>
              </div>
              <textarea
                id="research-question"
                rows={6}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading}
                placeholder="Enter any research question or topic (e.g. policy guidelines, technical specifications, scientific consensus, or admission requirements across sources)..."
                className="w-full h-full min-h-[160px] p-4 bg-[#003135] text-xs sm:text-sm font-mono border border-[#024950] text-[#AFDDE5] placeholder-[#AFDDE5]/40 focus:outline-none focus:border-[#0FA4AF] focus:ring-1 focus:ring-[#0FA4AF] disabled:opacity-50 transition-colors"
                required
              />
            </div>

            {/* Right Column (50%): Source URLs */}
            <div className="flex flex-col h-full space-y-2">
              <UrlInputList
                urls={urls}
                onChange={setUrls}
                disabled={isLoading}
              />
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-[#E76F51]/30 border border-[#E76F51] text-xs font-mono text-white font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E76F51]" />
              <span>{formError}</span>
            </div>
          )}

          {/* Real-time Honest Loading Progress Indicator */}
          {isLoading && (
            <div className="w-full bg-[#003135] border border-[#0FA4AF]/40 p-3 text-xs font-mono text-[#AFDDE5] flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#0FA4AF] animate-pulse"></span>
                <span className="font-bold text-white uppercase tracking-wider">
                  Investigation in progress
                </span>
                <span className="text-[#AFDDE5]/70 hidden sm:inline">
                  — Auditing source URLs & verifying citations
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0FA4AF] font-bold shrink-0">
                ACTIVE AUDIT
              </span>
            </div>
          )}

          {/* Symmetrical Bottom Bar: Scope Caption on Left, Action Button on Right */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#024950]">
            <div className="text-xs font-mono text-[#AFDDE5]/80 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0FA4AF] shrink-0" />
              <span>
                <strong className="text-white">Scope:</strong> Identifies gaps, contradictions, and next verification steps directly from your reviewed sources.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#964734] hover:bg-[#aa4f39] border border-[#ba5942] active:scale-[0.99] text-white text-xs sm:text-sm font-mono font-black uppercase tracking-[0.2em] transition-all duration-150 shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>AUDITING SOURCES...</span>
                </>
              ) : (
                <>
                  <span>INVESTIGATE SOURCES</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
