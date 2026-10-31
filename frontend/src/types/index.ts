export type SourceStatus = 'retrieved' | 'failed' | 'partial' | 'analyzed' | 'skipped';

export type DateStatus = 'dated' | 'undated' | 'unknown';

export type GapStatus = 'not_found_in_reviewed_sources' | 'partially_addressed';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type ConflictStatus = 'material_conflict' | 'possible_discrepancy';

export type FreshnessWarningType = 'stale_dated' | 'date_not_found' | 'currentness_unknown';

export interface AnalyzeRequest {
  question: string;
  urls: string[];
}

export interface SourceRecord {
  id: string;
  title: string;
  url: string;
  status: SourceStatus;
  date?: string | null;
  date_status: DateStatus;
  date_provenance?: string | null;
  excerpt?: string | null;
  full_text?: string | null;
  error_message?: string | null;
}

export interface EvidenceReference {
  source_id: string;
  quote: string;
  source_title?: string | null;
  source_url?: string | null;
}

export interface GapFinding {
  id: string;
  question: string;
  status: GapStatus;
  why_it_matters: string;
  checked_source_ids: string[];
  priority: PriorityLevel;
  evidence: EvidenceReference[];
}

export interface ConflictFinding {
  id: string;
  claim_a: string;
  source_id_a: string;
  evidence_a: string;
  claim_b: string;
  source_id_b: string;
  evidence_b: string;
  conflict_status: ConflictStatus;
  context_note?: string | null;
}

export interface FreshnessWarning {
  id: string;
  source_id: string;
  warning_type: FreshnessWarningType;
  date_found?: string | null;
  rationale: string;
}

export interface VerificationTask {
  id: string;
  action: string;
  priority: PriorityLevel;
  why_it_matters: string;
  related_finding_ids: string[];
  suggested_source_type?: string | null;
}

export interface AnalysisResult {
  investigation_id: string;
  question: string;
  summary: string;
  sources: SourceRecord[];
  gaps: GapFinding[];
  conflicts: ConflictFinding[];
  freshness_warnings: FreshnessWarning[];
  verification_checklist: VerificationTask[];
  limitations: string[];
  is_insufficient_evidence: boolean;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  gemini_configured: boolean;
}

