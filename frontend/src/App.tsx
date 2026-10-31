import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ResearchForm } from './components/ResearchForm';
import { SourceList } from './components/SourceList';
import { SummaryPanel } from './components/SummaryPanel';
import { GapList } from './components/GapList';
import { ConflictList } from './components/ConflictList';
import { FreshnessList } from './components/FreshnessList';
import { VerificationChecklist } from './components/VerificationChecklist';
import { ErrorState } from './components/ErrorState';
import { EditorialRightRail } from './components/EditorialRightRail';
import { checkHealth, analyzeSources } from './lib/api';
import {
  PlusCircle,
  Search,
  GitCompare,
  Clock,
  CheckSquare,
  Layers,
  Sparkles,
  Download,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { HealthResponse, AnalyzeRequest, AnalysisResult } from './types';

type ActiveTab = 'all' | 'gaps' | 'conflicts' | 'freshness' | 'checklist';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [lastRequest, setLastRequest] = useState<AnalyzeRequest | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setHealthError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHealthError(err.message || 'Backend unreachable');
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartAnalysis = async (request: AnalyzeRequest) => {
    setIsLoading(true);
    setAnalysisError(null);
    setLastRequest(request);

    try {
      const result = await analyzeSources(request);
      setAnalysisResult(result);
      setActiveTab('all');
      // Scroll smoothly to results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAnalysisError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastRequest) {
      handleStartAnalysis(lastRequest);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportMarkdown = () => {
    if (!analysisResult) return;

    const gapFound =
      analysisResult.gaps.find((g) => g.status === 'not_found_in_reviewed_sources')?.question ||
      analysisResult.gaps[0]?.question ||
      'None detected';

    const conflictSummary =
      analysisResult.conflicts.length > 0
        ? `${analysisResult.conflicts[0].claim_a} vs ${analysisResult.conflicts[0].claim_b}`
        : 'Zero material contradictions detected across reviewed sources.';

    const verifyFirst =
      analysisResult.verification_checklist[0]?.action ||
      'Confirm current guidelines with official registry.';

    const markdown = `# BLINDSPOT AUDIT REPORT: ${analysisResult.investigation_id}
**Research Question:** ${analysisResult.question}  
**Platform:** Blindspot - AI-Assisted Information Gap Detection (Shinchan Hackathon 2026)

---

## 1. Executive Verdict (At-a-Glance)
- ⚠️ **Potential Gap Identified:** ${gapFound}
- ⚖️ **Contradiction Audit:** ${conflictSummary}
- 📋 **Verify Next:** ${verifyFirst}

---

## 2. Evidence-Grounded Synthesis
${analysisResult.summary}

---

## 3. Potential Information Gaps (${analysisResult.gaps.length})
${analysisResult.gaps
  .map(
    (g, idx) => `### Gap ${idx + 1}: ${g.question}
- **Status:** ${g.status}
- **Priority:** ${g.priority.toUpperCase()}
- **Why this matters:** ${g.why_it_matters}
- **Sources reviewed:** ${g.checked_source_ids.join(', ')}
`
  )
  .join('\n')}

---

## 4. Evidence Conflicts & Discrepancies (${analysisResult.conflicts.length})
${
  analysisResult.conflicts.length === 0
    ? 'Zero material factual contradictions found between reviewed sources.'
    : analysisResult.conflicts
        .map(
          (c, idx) => `### Conflict ${idx + 1}: ${c.claim_a} vs ${c.claim_b}
- **Status:** ${c.conflict_status}
- **Source A (${c.source_id_a}) Evidence:** "${c.evidence_a}"
- **Source B (${c.source_id_b}) Evidence:** "${c.evidence_b}"
- **Contextual Note:** ${c.context_note || 'None'}
`
        )
        .join('\n')
}

---

## 5. Prioritized Verification Checklist (${analysisResult.verification_checklist.length})
${analysisResult.verification_checklist
  .map(
    (item, idx) =>
      `${idx + 1}. [ ] **[${item.priority.toUpperCase()}]** ${item.action}\n   *Target Authority:* ${item.suggested_source_type || 'Official Registry'}\n   *Rationale:* ${item.why_it_matters}`
  )
  .join('\n\n')}

---

## 6. Sources Reviewed (${analysisResult.sources.length})
${analysisResult.sources
  .map(
    (s) =>
      `- **[${s.id}]** [${s.title}](${s.url})  \n  Status: ${s.status} | Publish Date: ${s.date || 'Undated'}`
  )
  .join('\n')}

---
*Generated by Blindspot AI-Assisted Information Gap Detection Platform*
`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blindspot-audit-${analysisResult.investigation_id}.md`;
    link.click();
    URL.revokeObjectURL(url);

    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#003135] text-[#AFDDE5] flex flex-col font-sans selection:bg-[#0FA4AF] selection:text-[#003135]">
      {/* Top Header */}
      <Header health={health} healthError={healthError} />

      {/* Main Asymmetrical Split Composition (Directly inspired by Image 2) */}
      <div className="flex-1 w-full flex flex-col lg:flex-row">
        {/* Left Side (~78% width on desktop) */}
        <div className="w-full lg:w-[78%] flex flex-col min-h-screen border-r border-[#024950]">
          <main className="flex-1 w-full flex flex-col">
            {/* If no result active: Hero & Form View */}
            {!analysisResult && (
              <section aria-labelledby="investigation-form" className="w-full flex-1 flex flex-col">
                <ResearchForm onSubmit={handleStartAnalysis} isLoading={isLoading} />

                {/* Mobile / Tablet Horizontal Editorial Capability Rail */}
                <div className="lg:hidden w-full">
                  <EditorialRightRail
                    orientation="horizontal"
                    result={null}
                  />
                </div>

                {analysisError && (
                  <section aria-labelledby="error-section" className="p-6 sm:p-8 lg:p-10">
                    <ErrorState message={analysisError} onRetry={handleRetry} />
                  </section>
                )}

                {/* Symmetrical Core Architecture Grid (No redundant boxes) */}
                <section id="features" className="p-6 sm:p-8 lg:p-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-black text-[#0FA4AF] uppercase tracking-[0.2em]">
                      AUDIT ARCHITECTURE
                    </span>
                    <span className="w-8 h-px bg-[#0FA4AF]/50"></span>
                    <span className="text-xs font-mono text-[#AFDDE5]/70 uppercase">
                      Evidence Grounding & Verification
                    </span>
                  </div>

                  {/* Symmetrical 4-Column Grid: Uniform heights, identical padding, crisp 1px borders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-[#003135] border border-[#024950] flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-mono font-black text-[#E76F51]">01</span>
                          <Search className="w-4 h-4 text-[#E76F51]" />
                        </div>
                        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                          Gap Detection
                        </h4>
                        <p className="text-xs font-mono text-[#AFDDE5]/80 leading-relaxed">
                          Categorizes findings into Fully Addressed, Partially Addressed, and Not Found in Reviewed Sources with strict scoping.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-[#E76F51] font-bold uppercase tracking-wider pt-2 border-t border-[#024950]">
                        3-Tier Taxonomy
                      </div>
                    </div>

                    <div className="p-5 bg-[#003135] border border-[#024950] flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-mono font-black text-[#0FA4AF]">02</span>
                          <GitCompare className="w-4 h-4 text-[#0FA4AF]" />
                        </div>
                        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                          Conflict Proof
                        </h4>
                        <p className="text-xs font-mono text-[#AFDDE5]/80 leading-relaxed">
                          Requires non-empty verified quotes on both sides from distinct sources before confirming a material contradiction.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-[#0FA4AF] font-bold uppercase tracking-wider pt-2 border-t border-[#024950]">
                        Bilateral Grounding
                      </div>
                    </div>

                    <div className="p-5 bg-[#003135] border border-[#024950] flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-mono font-black text-[#AFDDE5]">03</span>
                          <Clock className="w-4 h-4 text-[#AFDDE5]" />
                        </div>
                        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                          Temporal Warnings
                        </h4>
                        <p className="text-xs font-mono text-[#AFDDE5]/80 leading-relaxed">
                          Monitors timestamps and flags stale documents without falsely claiming that older information is incorrect.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-[#AFDDE5] font-bold uppercase tracking-wider pt-2 border-t border-[#024950]">
                        Currentness Audit
                      </div>
                    </div>

                    <div className="p-5 bg-[#003135] border border-[#024950] flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-mono font-black text-[#0FA4AF]">04</span>
                          <CheckSquare className="w-4 h-4 text-[#0FA4AF]" />
                        </div>
                        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                          Action Checklist
                        </h4>
                        <p className="text-xs font-mono text-[#AFDDE5]/80 leading-relaxed">
                          Generates prioritized, concrete inquiries directly linked to primary registers to resolve uncertainties.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-[#0FA4AF] font-bold uppercase tracking-wider pt-2 border-t border-[#024950]">
                        Primary Registers
                      </div>
                    </div>
                  </div>
                </section>
              </section>
            )}

            {/* If Analysis Result is Active: Full Dashboard View with Staggered Entrance */}
            {analysisResult && (
              <section
                key={analysisResult.investigation_id}
                aria-labelledby="dashboard-section"
                className="w-full p-3.5 sm:p-6 lg:p-10 space-y-5 sm:space-y-8 animate-fade-rise"
              >
                {/* Active Report Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-[#024950] gap-3 sm:gap-4 animate-fade-rise delay-0">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#0FA4AF] font-bold">
                      Active Evidence Audit Report
                    </span>
                    <h2 className="text-base sm:text-lg font-mono font-black text-white">
                      {analysisResult.investigation_id}
                    </h2>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleExportMarkdown}
                      className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#003135] hover:bg-[#024950] border border-[#0FA4AF] text-[#0FA4AF] text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
                      title="Download full audit report as Markdown"
                    >
                      {exportCopied ? (
                        <>
                          <Check className="w-4 h-4 text-[#AFDDE5]" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export Report</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 bg-[#E76F51] hover:bg-[#ea7b5f] active:scale-[0.98] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E76F51]"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>New Investigation</span>
                    </button>
                  </div>
                </div>

                {/* Mobile / Tablet Live Counter Rail (Swipeable 5 Panels from Image 2) */}
                <div className="lg:hidden w-full overflow-hidden">
                  <EditorialRightRail
                    orientation="horizontal"
                    result={analysisResult}
                    onSelectTab={(tab) => setActiveTab(tab)}
                  />
                </div>

                {/* 🎯 Hackathon Executive Verdict (Section 3 Illustrative Output Match) */}
                <div className="bg-[#024950]/40 border border-[#024950] p-5 sm:p-6 space-y-4 animate-fade-rise">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#024950] gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0FA4AF]" />
                      <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-[0.2em] text-white">
                        Executive Audit Verdict (At-a-Glance)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 bg-[#003135] text-[#AFDDE5] border border-[#024950]">
                      Problem Statement Spec: 3-Second Briefing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono">
                    {/* 1. Potential Gap */}
                    <div className="p-4 bg-[#003135] border border-[#024950] border-l-4 border-l-[#E76F51] flex flex-col justify-between space-y-2.5 hover:border-[#0FA4AF]/60 transition-colors">
                      <div>
                        <span className="text-[11px] font-mono font-black text-[#E76F51] uppercase tracking-wider block mb-1">
                          ⚠️ Potential Gap Identified
                        </span>
                        <p className="text-white text-xs leading-snug line-clamp-3 font-medium">
                          {analysisResult.gaps.find(g => g.status === 'not_found_in_reviewed_sources')?.question ||
                           analysisResult.gaps[0]?.question ||
                           'No unaddressed information gaps detected across reviewed sources.'}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#AFDDE5]/70 block pt-1.5 border-t border-[#024950]">
                        Status: Not Found in Reviewed Sources
                      </span>
                    </div>

                    {/* 2. Possible Conflict */}
                    <div className="p-4 bg-[#003135] border border-[#024950] border-l-4 border-l-[#AFDDE5] flex flex-col justify-between space-y-2.5 hover:border-[#0FA4AF]/60 transition-colors">
                      <div>
                        <span className="text-[11px] font-mono font-black text-[#AFDDE5] uppercase tracking-wider block mb-1">
                          ⚖️ Contradiction Audit
                        </span>
                        <p className="text-white text-xs leading-snug line-clamp-3 font-medium">
                          {analysisResult.conflicts.length > 0
                            ? `${analysisResult.conflicts[0].claim_a} vs ${analysisResult.conflicts[0].claim_b}`
                            : 'Zero material factual contradictions found between reviewed sources.'}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#AFDDE5]/70 block pt-1.5 border-t border-[#024950]">
                        {analysisResult.conflicts.length > 0 ? 'Bilateral quotes cited' : 'Consensus across sources'}
                      </span>
                    </div>

                    {/* 3. Priority Action Checklist */}
                    <div className="p-4 bg-[#003135] border border-[#024950] border-l-4 border-l-[#0FA4AF] flex flex-col justify-between space-y-2.5 hover:border-[#0FA4AF]/60 transition-colors">
                      <div>
                        <span className="text-[11px] font-mono font-black text-[#0FA4AF] uppercase tracking-wider block mb-1">
                          📋 Verify Next
                        </span>
                        <p className="text-white text-xs leading-snug line-clamp-3 font-medium">
                          {analysisResult.verification_checklist[0]?.action ||
                           'Confirm current cycle guidelines on primary registry.'}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#AFDDE5]/70 block pt-1.5 border-t border-[#024950]">
                        Target: {analysisResult.verification_checklist[0]?.suggested_source_type || 'Official Portal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🛡️ Outcome 8 Epistemic Protocol: Explicitly Distinguishing Sourced Facts vs AI Gaps & Actions */}
                <div className="p-3.5 bg-[#003135] border border-[#024950] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono animate-fade-rise">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck className="w-4 h-4 text-[#0FA4AF] shrink-0" />
                    <span className="font-black uppercase tracking-wider text-xs">
                      Outcome 8 Protocol:
                    </span>
                    <span className="text-[#AFDDE5]/80 text-[11px] hidden sm:inline">
                      Clear visual separation of sourced factual extractions from AI-inferred voids & actions
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#024950] text-[#0FA4AF] border border-[#0FA4AF]/50 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[#0FA4AF]"></span>
                      Sourced Fact (Extracted)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#003135] text-[#E76F51] border border-[#E76F51]/60 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[#E76F51]"></span>
                      AI Gap Void (Unaddressed)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#003135] text-[#AFDDE5] border border-[#024950] font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[#AFDDE5]"></span>
                      AI Action (Checklist)
                    </span>
                  </div>
                </div>

                {/* Summary Panel */}
                <div className="animate-fade-rise delay-40">
                  <SummaryPanel result={analysisResult} />
                </div>

                {/* Sources Rail */}
                <div className="animate-fade-rise delay-80">
                  <SourceList sources={analysisResult.sources} />
                </div>

                {/* Findings Filter Tabs */}
                <div className="space-y-4 animate-fade-rise delay-120">
                  <div className="flex items-center gap-1.5 border-b border-[#024950] pb-2 text-xs font-mono overflow-x-auto no-scrollbar scroll-smooth py-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF] ${
                        activeTab === 'all'
                          ? 'bg-[#0FA4AF] text-[#003135] border-[#0FA4AF] font-black'
                          : 'bg-[#003135] text-[#AFDDE5] border-[#024950] hover:border-[#0FA4AF]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Audit Findings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('gaps')}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E76F51] ${
                        activeTab === 'gaps'
                          ? 'bg-[#E76F51] text-white border-[#E76F51] font-bold'
                          : 'bg-[#003135] text-[#AFDDE5] border-[#024950] hover:border-[#E76F51]'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Gaps ({analysisResult.gaps.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('conflicts')}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF] ${
                        activeTab === 'conflicts'
                          ? 'bg-[#0FA4AF] text-[#003135] border-[#0FA4AF] font-bold'
                          : 'bg-[#003135] text-[#AFDDE5] border-[#024950] hover:border-[#0FA4AF]'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Conflicts ({analysisResult.conflicts.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('freshness')}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF] ${
                        activeTab === 'freshness'
                          ? 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF] font-bold'
                          : 'bg-[#003135] text-[#AFDDE5] border-[#024950] hover:border-[#0FA4AF]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Freshness ({analysisResult.freshness_warnings.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('checklist')}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#AFDDE5] ${
                        activeTab === 'checklist'
                          ? 'bg-[#AFDDE5] text-[#003135] border-[#AFDDE5] font-black'
                          : 'bg-[#003135] text-[#AFDDE5] border-[#024950] hover:border-[#AFDDE5]'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Checklist ({analysisResult.verification_checklist.length})</span>
                    </button>
                  </div>

                  {/* Dynamic Findings Views */}
                  {(activeTab === 'all' || activeTab === 'gaps') && (
                    <GapList gaps={analysisResult.gaps} />
                  )}

                  {(activeTab === 'all' || activeTab === 'conflicts') && (
                    <ConflictList conflicts={analysisResult.conflicts} />
                  )}

                  {(activeTab === 'all' || activeTab === 'freshness') && (
                    <FreshnessList warnings={analysisResult.freshness_warnings} />
                  )}

                  {(activeTab === 'all' || activeTab === 'checklist') && (
                    <VerificationChecklist checklist={analysisResult.verification_checklist} />
                  )}
                </div>
              </section>
            )}
          </main>

          {/* Editorial Footer */}
          <footer className="border-t border-[#024950] bg-[#003135] py-6 px-6 sm:px-8 lg:px-10 mt-auto">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#AFDDE5]/70">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-wider">BLINDSPOT</span>
                <span>• Evidence-Grounded AI Analysis</span>
              </div>
            </div>
          </footer>
        </div>

        {/* Right Side (~22% width on desktop) — The 5 Stacked Editorial Color Panels from Image 2 */}
        <div className="hidden lg:block lg:w-[22%] sticky top-[65px] h-[calc(100vh-65px)] overflow-hidden bg-[#003135]">
          <EditorialRightRail
            result={analysisResult}
            onSelectTab={(tab) => {
              if (analysisResult) {
                setActiveTab(tab);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
