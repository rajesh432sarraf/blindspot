import uuid
import logging
from typing import List, Dict, Any, Set
from app.models.schemas import (
    AnalyzeRequest,
    AnalysisResult,
    SourceRecord,
    SourceStatus,
    DateStatus,
    GapFinding,
    GapStatus,
    ConflictFinding,
    ConflictStatus,
    FreshnessWarning,
    FreshnessWarningType,
    VerificationTask,
    PriorityLevel,
    EvidenceReference,
)
from app.services.fetcher import fetch_url_content, FetchError, SSRFSecurityError
from app.services.extractor import extract_source_record
from app.services.llm_gemini import call_gemini_api
from app.core.config import settings

logger = logging.getLogger("digital-dark-spot.analyzer")

def process_sources(urls: List[str]) -> List[SourceRecord]:
    """
    Fetches and extracts structured records for each requested URL.
    Maintains stable IDs (S1, S2...) and records honest errors.
    """
    records: List[SourceRecord] = []
    for idx, raw_url in enumerate(urls, start=1):
        source_id = f"S{idx}"
        try:
            html_text, final_url, status_code = fetch_url_content(raw_url)
            rec = extract_source_record(source_id, html_text, raw_url, final_url)
            records.append(rec)
        except SSRFSecurityError as e:
            records.append(SourceRecord(
                id=source_id,
                title="Security Blocked URL",
                url=raw_url,
                status=SourceStatus.FAILED,
                date_status=DateStatus.UNKNOWN,
                error_message=f"SSRF Security Violation: {e}"
            ))
        except FetchError as e:
            records.append(SourceRecord(
                id=source_id,
                title="Fetch Error",
                url=raw_url,
                status=SourceStatus.FAILED,
                date_status=DateStatus.UNKNOWN,
                error_message=str(e)
            ))
        except Exception as e:
            records.append(SourceRecord(
                id=source_id,
                title="Extraction Error",
                url=raw_url,
                status=SourceStatus.FAILED,
                date_status=DateStatus.UNKNOWN,
                error_message=f"Unexpected extraction failure: {e}"
            ))
    return records

def build_heuristic_analysis(question: str, sources: List[SourceRecord], investigation_id: str) -> AnalysisResult:
    """
    Deterministic evidence synthesis when GEMINI_API_KEY is not configured or in local test mode.
    Analyzes only extracted text and metadata honestly without fabricating findings.
    """
    valid_sources = [s for s in sources if s.status != SourceStatus.FAILED]
    valid_ids = [s.id for s in valid_sources]

    if not valid_sources:
        return AnalysisResult(
            investigation_id=investigation_id,
            question=question,
            summary="None of the submitted source URLs could be retrieved. Security policies, network errors, or inaccessible content prevented source analysis.",
            sources=sources,
            gaps=[],
            conflicts=[],
            freshness_warnings=[],
            verification_checklist=[
                VerificationTask(
                    id="V1",
                    action="Check accessibility of provided URLs",
                    priority=PriorityLevel.HIGH,
                    why_it_matters="All provided URLs failed retrieval.",
                    related_finding_ids=[],
                    suggested_source_type="Direct web browser verification"
                )
            ],
            limitations=["All requested sources failed extraction."],
            is_insufficient_evidence=True
        )

    # 1. Freshness warnings from real metadata
    freshness_warnings: List[FreshnessWarning] = []
    for s in valid_sources:
        if s.date_status == DateStatus.UNDATED or not s.date:
            freshness_warnings.append(FreshnessWarning(
                id=f"F{len(freshness_warnings) + 1}",
                source_id=s.id,
                warning_type=FreshnessWarningType.DATE_NOT_FOUND,
                date_found=None,
                rationale=f"Source {s.id} ({s.title}) contains no reliable published or modified timestamp in its HTML metadata. Currentness cannot be verified."
            ))
        elif s.date and any(year in s.date for year in ["2020", "2021", "2022", "2023", "2024"]):
            freshness_warnings.append(FreshnessWarning(
                id=f"F{len(freshness_warnings) + 1}",
                source_id=s.id,
                warning_type=FreshnessWarningType.STALE_DATED,
                date_found=s.date,
                rationale=f"Source {s.id} is dated {s.date}. Prior-dated materials require verification to confirm terms remain current."
            ))

    # 2. Extract potential gaps based on common unaddressed research facets
    gaps: List[GapFinding] = []
    combined_text = " ".join([s.full_text or "" for s in valid_sources]).lower()
    
    # Check for typical informational gaps (always referencing reviewed materials)
    gap_candidates = [
        ("renewal", "What are the ongoing renewal criteria or continuation requirements?", "Reviewed sources mention initial guidelines but omit specific continuation/renewal criteria."),
        ("deadline", "What are the exact submission deadlines for international vs domestic applicants?", "Reviewed sources do not clarify distinct cohort submission deadlines."),
        ("fee", "Are there application, administrative, or hidden maintenance fees?", "Reviewed sources do not explicitly outline applicable fee waivers or cost breakdowns."),
        ("appeal", "What is the dispute or appeal process if an application is denied?", "No review or appeal mechanism is documented in the analyzed sources.")
    ]

    for term, q_text, why in gap_candidates:
        if term not in combined_text:
            gaps.append(GapFinding(
                id=f"G{len(gaps) + 1}",
                question=q_text,
                status=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES,
                why_it_matters=why,
                checked_source_ids=valid_ids,
                priority=PriorityLevel.MEDIUM if len(gaps) > 0 else PriorityLevel.HIGH,
                evidence=[]
            ))

    # 3. Verification checklist
    checklist: List[VerificationTask] = []
    if freshness_warnings:
        checklist.append(VerificationTask(
            id=f"V{len(checklist) + 1}",
            action="Cross-check terms against current academic year official announcements",
            priority=PriorityLevel.HIGH,
            why_it_matters="One or more sources are undated or refer to previous cycles.",
            related_finding_ids=[f.id for f in freshness_warnings],
            suggested_source_type="Official Program Portal"
        ))

    if gaps:
        for g in gaps[:3]:
            checklist.append(VerificationTask(
                id=f"V{len(checklist) + 1}",
                action=f"Consult primary authority regarding: {g.question}",
                priority=g.priority,
                why_it_matters=g.why_it_matters,
                related_finding_ids=[g.id],
                suggested_source_type="Direct Institutional Contact / Handbook"
            ))

    # 4. Summary
    source_titles = [f"{s.id} ({s.title})" for s in valid_sources]
    summary = (
        f"Audited {len(valid_sources)} source(s): {', '.join(source_titles)}. "
        f"The reviewed texts address baseline requirements but leave {len(gaps)} potential information gap(s) "
        f"and {len(freshness_warnings)} freshness caution(s). "
        "Review the checklist below for prioritized verification next steps."
    )

    limitations = [
        "Analysis based exclusively on retrieved HTML from submitted URLs.",
        "Dynamic client-rendered content (SPA/JavaScript) may be omitted if not present in initial HTML."
    ]
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        limitations.append("Running in baseline heuristic audit mode because GEMINI_API_KEY is not configured in backend/.env.")

    return AnalysisResult(
        investigation_id=investigation_id,
        question=question,
        summary=summary,
        sources=sources,
        gaps=gaps,
        conflicts=[],
        freshness_warnings=freshness_warnings,
        verification_checklist=checklist,
        limitations=limitations,
        is_insufficient_evidence=False
    )

def validate_citations(result: AnalysisResult, valid_source_ids: Set[str]) -> AnalysisResult:
    """
    Validates that every cited source ID in findings actually exists in the retrieved sources.
    Filters out spurious or invalid source references.
    """
    # Validate gaps
    sanitized_gaps: List[GapFinding] = []
    for gap in result.gaps:
        checked_ids = [sid for sid in gap.checked_source_ids if sid in valid_source_ids]
        if not checked_ids:
            checked_ids = list(valid_source_ids)
        ev_list = [ev for ev in gap.evidence if ev.source_id in valid_source_ids]
        gap.checked_source_ids = checked_ids
        gap.evidence = ev_list
        sanitized_gaps.append(gap)
    result.gaps = sanitized_gaps

    # Validate conflicts: must cite two distinct valid sources and have evidence for both sides
    sanitized_conflicts: List[ConflictFinding] = []
    for conf in result.conflicts:
        is_valid_sources = (
            conf.source_id_a in valid_source_ids and
            conf.source_id_b in valid_source_ids and
            conf.source_id_a != conf.source_id_b
        )
        has_bilateral_evidence = bool(
            conf.evidence_a and conf.evidence_a.strip() and
            conf.evidence_b and conf.evidence_b.strip()
        )
        if is_valid_sources and has_bilateral_evidence:
            sanitized_conflicts.append(conf)
        else:
            logger.warning(
                "Dropping invalid conflict: source_a=%s, source_b=%s, has_evidence=%s",
                conf.source_id_a, conf.source_id_b, has_bilateral_evidence
            )
    result.conflicts = sanitized_conflicts

    # Validate freshness warnings
    sanitized_warnings: List[FreshnessWarning] = []
    for w in result.freshness_warnings:
        if w.source_id in valid_source_ids:
            sanitized_warnings.append(w)
    result.freshness_warnings = sanitized_warnings

    return result

def run_investigation(request: AnalyzeRequest) -> AnalysisResult:
    """
    Executes an end-to-end investigation:
    1. Collects and extracts sources.
    2. Calls Gemini API for structured evidence audit if configured; otherwise runs heuristic audit.
    3. Validates all citations and returns validated AnalysisResult.
    """
    investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    sources = process_sources(request.urls)
    valid_source_ids = {s.id for s in sources if s.status != SourceStatus.FAILED}

    # If no valid sources could be retrieved
    if not valid_source_ids:
        return AnalysisResult(
            investigation_id=investigation_id,
            question=request.question,
            summary="All submitted source URLs failed retrieval. No evidence could be collected for analysis.",
            sources=sources,
            gaps=[],
            conflicts=[],
            freshness_warnings=[],
            verification_checklist=[
                VerificationTask(
                    id="V1",
                    action="Verify URL correctness and accessibility",
                    priority=PriorityLevel.HIGH,
                    why_it_matters="All provided source addresses were unreachable or blocked.",
                    related_finding_ids=[],
                    suggested_source_type="Direct web browser check"
                )
            ],
            limitations=["Zero sources could be successfully fetched."],
            is_insufficient_evidence=True
        )

    # Attempt Gemini API if key is present
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "your_gemini_api_key_here":
        try:
            llm_output = call_gemini_api(request.question, sources)
            # Parse into Pydantic models
            gaps_data = [GapFinding(**g) for g in llm_output.get("gaps", [])]
            conflicts_data = [ConflictFinding(**c) for c in llm_output.get("conflicts", [])]
            freshness_data = [FreshnessWarning(**f) for f in llm_output.get("freshness_warnings", [])]
            checklist_data = [VerificationTask(**v) for v in llm_output.get("verification_checklist", [])]
            limitations_data = llm_output.get("limitations", [])
            limitations_data.append("Analyzed with Google Gemini LLM on retrieved source evidence only.")

            result = AnalysisResult(
                investigation_id=investigation_id,
                question=request.question,
                summary=llm_output.get("summary", "Evidence synthesis generated."),
                sources=sources,
                gaps=gaps_data,
                conflicts=conflicts_data,
                freshness_warnings=freshness_data,
                verification_checklist=checklist_data,
                limitations=limitations_data,
                is_insufficient_evidence=llm_output.get("is_insufficient_evidence", False)
            )
            return validate_citations(result, valid_source_ids)
        except Exception as e:
            logger.error("Gemini API call failed (%s). Falling back to heuristic evidence audit.", e)
            res = build_heuristic_analysis(request.question, sources, investigation_id)
            res.limitations.append(f"Gemini API call encountered an error: {e}. Fallback evidence synthesis provided.")
            return validate_citations(res, valid_source_ids)

    # Heuristic audit when GEMINI_API_KEY is not configured
    res = build_heuristic_analysis(request.question, sources, investigation_id)
    return validate_citations(res, valid_source_ids)

