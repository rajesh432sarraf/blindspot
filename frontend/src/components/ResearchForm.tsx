import React, { useState } from 'react';
import { UrlInputList } from './UrlInputList';
import { ArrowRight, AlertCircle, Info, Sparkles } from 'lucide-react';
import type { AnalyzeRequest } from '../types';

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
      setFormError('Please enter a research question or topic (at least 5 characters).');
      return;
    }

    const validUrls = urls.map(u => u.trim()).filter(u => u.length > 0);
    if (validUrls.length === 0) {
      setFormError('Please provide at least one public source URL to review.');
      return;
    }

    // Basic URL validation
    for (const u of validUrls) {
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
    }

    onSubmit({
      question: trimmedQuestion,
      urls: validUrls,
    });
  };

  const handleLoadExample = () => {
    setQuestion('What are the eligibility criteria, application deadlines, and renewal requirements for the Gates Cambridge Scholarship?');
    setUrls([
      'https://www.gatescambridge.org/programme/the-scholarship/',
      'https://www.gatescambridge.org/apply/eligibility/',
      'https://www.gatescambridge.org/apply/timeline/'
    ]);
    setFormError(null);
  };

  return (
    <div className="bg-[#F3F0E8] border border-[#D7D2C7] p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#D7D2C7] gap-2">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#171918]">
            New Investigation
          </h2>
          <p className="text-xs text-[#625F57] mt-0.5">
            Identify what the sources say, what they miss, and what needs verification.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadExample}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-[#D7D2C7] bg-[#EAE5DA] text-[#171918] hover:border-[#171918] transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3 text-[#D6A64F]" />
          <span>Load Example Query</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="research-question" className="block text-xs font-mono font-medium text-[#171918] uppercase tracking-wider mb-2">
            Research Question / Objective
          </label>
          <textarea
            id="research-question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. What are the current eligibility criteria, deadlines, and renewal policies across these sources?"
            className="w-full p-3 bg-white text-xs font-mono border border-[#D7D2C7] text-[#171918] placeholder-[#A6ADA6] focus:outline-none focus:border-[#171918] focus:ring-1 focus:ring-[#171918] disabled:bg-[#EAE5DA]"
            required
          />
        </div>

        <UrlInputList
          urls={urls}
          onChange={setUrls}
          disabled={isLoading}
        />

        <div className="p-3 bg-[#EAE5DA] border border-[#D7D2C7] text-xs font-mono text-[#625F57] flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#171918] mt-0.5" />
          <div>
            <strong className="text-[#171918]">Audit Scope:</strong> Analysis evaluates only content retrieved from the submitted URLs. "Not found in reviewed sources" indicates absence from the reviewed materials, not absolute non-existence.
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-[#F9EBEA] border border-[#D9534F] text-xs font-mono text-[#D9534F] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{formError}</div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#202321] active:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#171918] disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin"></span>
                <span>Retrieving & Auditing Sources...</span>
              </>
            ) : (
              <>
                <span>Analyze Sources</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

