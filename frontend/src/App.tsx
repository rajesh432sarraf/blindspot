import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ResearchForm } from './components/ResearchForm';
import { SourceList } from './components/SourceList';
import { SummaryPanel } from './components/SummaryPanel';
import { GapList } from './components/GapList';
import { ConflictList } from './components/ConflictList';
import { FreshnessList } from './components/FreshnessList';
import { VerificationChecklist } from './components/VerificationChecklist';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { checkHealth, analyzeSources } from './lib/api';
import { PlusCircle, Search, GitCompare, Clock, CheckSquare, Layers } from 'lucide-react';
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
  };

  return (
    <div className="min-h-screen bg-[#F3F0E8] text-[#171918] flex flex-col font-sans">
      <Header health={health} healthError={healthError} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {!analysisResult && (
          <section aria-labelledby="form-section">
            <ResearchForm onSubmit={handleStartAnalysis} isLoading={isLoading} />
          </section>
        )}

        {analysisError && (
          <section aria-labelledby="error-section">
            <ErrorState message={analysisError} onRetry={handleRetry} />
          </section>
        )}

        {analysisResult && (
          <section aria-labelledby="dashboard-section" className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D7D2C7] gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#625F57]">
                  Active Audit Report
                </span>
                <h2 className="text-base font-mono font-bold text-[#171918]">
                  {analysisResult.investigation_id}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono uppercase tracking-wider hover:bg-[#202321] transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Start New Investigation</span>
              </button>
            </div>

            {/* Summary Panel */}
            <SummaryPanel result={analysisResult} />

            {/* Sources Rail */}
            <SourceList sources={analysisResult.sources} />

            {/* Analysis Findings Tabs */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#D7D2C7] pb-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors ${
                    activeTab === 'all'
                      ? 'bg-[#171918] text-[#F3F0E8] border-[#171918] font-bold'
                      : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7] hover:text-[#171918]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Audit Findings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gaps')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors ${
                    activeTab === 'gaps'
                      ? 'bg-[#171918] text-[#F3F0E8] border-[#171918] font-bold'
                      : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7] hover:text-[#171918]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Gaps ({analysisResult.gaps.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('conflicts')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors ${
                    activeTab === 'conflicts'
                      ? 'bg-[#171918] text-[#F3F0E8] border-[#171918] font-bold'
                      : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7] hover:text-[#171918]'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Conflicts ({analysisResult.conflicts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('freshness')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors ${
                    activeTab === 'freshness'
                      ? 'bg-[#171918] text-[#F3F0E8] border-[#171918] font-bold'
                      : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7] hover:text-[#171918]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Freshness ({analysisResult.freshness_warnings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('checklist')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors ${
                    activeTab === 'checklist'
                      ? 'bg-[#171918] text-[#F3F0E8] border-[#171918] font-bold'
                      : 'bg-[#EAE5DA] text-[#625F57] border-[#D7D2C7] hover:text-[#171918]'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Checklist ({analysisResult.verification_checklist.length})</span>
                </button>
              </div>

              {/* Sections */}
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

        {!analysisResult && !analysisError && <EmptyState />}
      </main>

      <footer className="border-t border-[#D7D2C7] bg-[#EAE5DA] py-4 px-6 text-center text-xs font-mono text-[#625F57]">
        <p>Digital Dark Spot • Shinchan Online Hackathon 2026 • Evidence-only analysis</p>
      </footer>
    </div>
  );
}

export default App;
