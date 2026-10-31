from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl

class SourceStatus(str, Enum):
    RETRIEVED = "retrieved"
    FAILED = "failed"
    PARTIAL = "partial"
    ANALYZED = "analyzed"
    SKIPPED = "skipped"

class DateStatus(str, Enum):
    DATED = "dated"
    UNDATED = "undated"
    UNKNOWN = "unknown"

class GapStatus(str, Enum):
    NOT_FOUND_IN_REVIEWED_SOURCES = "not_found_in_reviewed_sources"
    PARTIALLY_ADDRESSED = "partially_addressed"
    FULLY_ADDRESSED = "fully_addressed"

class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ConflictStatus(str, Enum):
    MATERIAL_CONFLICT = "material_conflict"
    POSSIBLE_DISCREPANCY = "possible_discrepancy"

class FreshnessWarningType(str, Enum):
    STALE_DATED = "stale_dated"
    DATE_NOT_FOUND = "date_not_found"
    CURRENTNESS_UNKNOWN = "currentness_unknown"

class AnalyzeRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000, description="The research question or topic")
    urls: List[str] = Field(..., min_length=1, max_length=10, description="List of public source URLs to analyze")

class SourceRecord(BaseModel):
    id: str = Field(..., description="Stable source identifier, e.g. S1, S2")
    title: str = Field(..., description="Page or document title")
    url: str = Field(..., description="Source URL")
    status: SourceStatus = Field(default=SourceStatus.RETRIEVED, description="Retrieval and extraction status")
    date: Optional[str] = Field(default=None, description="Published or last updated date if verified")
    date_status: DateStatus = Field(default=DateStatus.UNKNOWN, description="Status of date determination")
    date_provenance: Optional[str] = Field(default=None, description="Where the date was extracted from")
    excerpt: Optional[str] = Field(default=None, description="Representative excerpt of extracted text")
    full_text: Optional[str] = Field(default=None, description="Cleaned readable text used for analysis")
    error_message: Optional[str] = Field(default=None, description="Error details if fetch or extraction failed")

class EvidenceReference(BaseModel):
    source_id: str = Field(..., description="ID of the cited source (e.g. S1)")
    quote: str = Field(..., description="Direct or closely paraphrased excerpt from the source")
    source_title: Optional[str] = Field(default=None, description="Title of the cited source")
    source_url: Optional[str] = Field(default=None, description="URL of the cited source")

class GapFinding(BaseModel):
    id: str = Field(..., description="Unique gap identifier, e.g. G1")
    question: str = Field(..., description="Specific question not answered or partially answered by sources")
    status: GapStatus = Field(default=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES)
    why_it_matters: str = Field(..., description="Explanation of why this gap is significant for the user's research")
    checked_source_ids: List[str] = Field(default_factory=list, description="List of source IDs reviewed for this question")
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM)
    evidence: List[EvidenceReference] = Field(default_factory=list, description="Partial evidence if partially addressed")

class ConflictFinding(BaseModel):
    id: str = Field(..., description="Unique conflict identifier, e.g. C1")
    claim_a: str = Field(..., description="First claim made by source A")
    source_id_a: str = Field(..., description="ID of source A")
    evidence_a: str = Field(..., description="Supporting excerpt from source A")
    claim_b: str = Field(..., description="Contradicting or differing claim made by source B")
    source_id_b: str = Field(..., description="ID of source B")
    evidence_b: str = Field(..., description="Supporting excerpt from source B")
    conflict_status: ConflictStatus = Field(default=ConflictStatus.POSSIBLE_DISCREPANCY)
    context_note: Optional[str] = Field(default=None, description="Potential reason for difference (e.g. differing dates, scope)")

class FreshnessWarning(BaseModel):
    id: str = Field(..., description="Unique freshness warning identifier, e.g. F1")
    source_id: str = Field(..., description="ID of the source this warning applies to")
    warning_type: FreshnessWarningType = Field(...)
    date_found: Optional[str] = Field(default=None, description="Date found if stale_dated")
    rationale: str = Field(..., description="Why currentness is in question or why date was not found")

class VerificationTask(BaseModel):
    id: str = Field(..., description="Unique verification task identifier, e.g. V1")
    action: str = Field(..., description="Concrete verification action for the researcher")
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM)
    why_it_matters: str = Field(..., description="Reasoning behind this check")
    related_finding_ids: List[str] = Field(default_factory=list, description="IDs of gaps, conflicts, or freshness warnings related to this check")
    suggested_source_type: Optional[str] = Field(default=None, description="Recommended category of authority or page to verify against")

class AnalysisResult(BaseModel):
    investigation_id: str = Field(..., description="Unique identifier for this analysis run")
    question: str = Field(..., description="The user's original research question")
    summary: str = Field(..., description="Evidence-grounded synthesis of what reviewed sources establish")
    sources: List[SourceRecord] = Field(default_factory=list, description="All submitted sources and their retrieval state")
    gaps: List[GapFinding] = Field(default_factory=list, description="Information gaps and unanswered questions")
    conflicts: List[ConflictFinding] = Field(default_factory=list, description="Evidence-backed conflicts or discrepancies")
    freshness_warnings: List[FreshnessWarning] = Field(default_factory=list, description="Freshness and date warnings")
    verification_checklist: List[VerificationTask] = Field(default_factory=list, description="Prioritized next verification actions")
    limitations: List[str] = Field(default_factory=list, description="Methodological limitations or source constraints")
    is_insufficient_evidence: bool = Field(default=False, description="True if available sources are inadequate to answer the question")
    evidence_fully_audited: bool = Field(default=False, description="True only when all sources were retrieved and every citation and evidence integrity check passed")

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "blindspot"
    version: str = "0.1.0"
    gemini_configured: bool = False

