import re
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

def _normalize_priority(raw: Any) -> PriorityLevel:
    if not raw:
        return PriorityLevel.MEDIUM
    val = str(raw).strip().lower()
    if val in ("high", "urgent", "critical", "severe", "p1", "highest"):
        return PriorityLevel.HIGH
    if val in ("low", "info", "minor", "p3", "lowest"):
        return PriorityLevel.LOW
    return PriorityLevel.MEDIUM

def _normalize_gap_status(raw: Any) -> GapStatus:
    if not raw:
        return GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES
    val = str(raw).strip().lower().replace("-", "_").replace(" ", "_")
    if "fully" in val or val in ("addressed", "found", "complete", "yes"):
        return GapStatus.FULLY_ADDRESSED
    if "partial" in val or "some" in val or "incomplete" in val:
        return GapStatus.PARTIALLY_ADDRESSED
    return GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES

def _normalize_conflict_status(raw: Any) -> ConflictStatus:
    if not raw:
        return ConflictStatus.POSSIBLE_DISCREPANCY
    val = str(raw).strip().lower().replace("-", "_").replace(" ", "_")
    if "material" in val or "direct" in val or "contradiction" in val or "incompatible" in val:
        return ConflictStatus.MATERIAL_CONFLICT
    return ConflictStatus.POSSIBLE_DISCREPANCY

def _normalize_str_list(raw: Any) -> List[str]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if str(item).strip()]
    if isinstance(raw, str):
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        return parts if parts else [raw.strip()]
    return [str(raw).strip()]

def process_sources(urls: List[str]) -> List[SourceRecord]:
    """
    Fetches and extracts structured records for each requested URL.
    Deduplicates normalized URLs while maintaining stable IDs (S1, S2...) and preserving order.
    Records honest errors for failed sources.
    """
    seen_normalized: Set[str] = set()
    unique_urls: List[str] = []
    for raw in urls:
        clean = raw.strip()
        if not clean:
            continue
        norm_key = clean.lower().rstrip("/")
        if norm_key not in seen_normalized:
            seen_normalized.add(norm_key)
            unique_urls.append(clean)

    records: List[SourceRecord] = []
    for idx, raw_url in enumerate(unique_urls, start=1):
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
    
    # Check for typical informational gaps with topic-aware candidates and risk-weighted priority
    q_lower = question.lower()
    is_tech_policy = any(k in q_lower for k in ["security", "compliance", "privacy", "software", "api", "health", "clinical", "regulatory", "code", "system"])
    is_admission_scholarship = any(k in q_lower for k in ["scholarship", "eligibility", "admission", "tuition", "degree", "grant", "fellowship", "scheme", "renewal", "university"])

    if is_tech_policy:
        gap_candidates = [
            ("compliance", "What specific compliance standards, audits, or statutory frameworks govern this policy?", "Reviewed sources do not document specific regulatory or compliance audit standards.", PriorityLevel.HIGH),
            ("version", "What specific release version, effective date, or jurisdiction applies?", "Reviewed sources omit versioning or jurisdictional parameters.", PriorityLevel.HIGH),
            ("exception", "What are the operational exception or incident handling protocols?", "No exemption or escalation protocols are documented in reviewed sources.", PriorityLevel.MEDIUM),
            ("contact", "Who is the designated compliance officer or authoritative oversight entity?", "No administrative contact or oversight channel is documented in reviewed sources.", PriorityLevel.LOW)
        ]
    elif is_admission_scholarship:
        gap_candidates = [
            ("eligibility", "What are the precise baseline eligibility thresholds or disqualifying criteria?", "Reviewed sources do not document baseline eligibility parameters.", PriorityLevel.HIGH),
            ("renewal", "What are the ongoing renewal criteria or continuation requirements?", "Specific continuation and renewal requirements were not found in the reviewed sources.", PriorityLevel.HIGH),
            ("deadline", "What are the exact submission deadlines for international vs domestic applicants?", "Reviewed sources do not clarify distinct cohort submission deadlines.", PriorityLevel.HIGH),
            ("fee", "Are there application, administrative, or hidden maintenance fees?", "Reviewed sources do not explicitly outline applicable fee waivers or cost breakdowns.", PriorityLevel.MEDIUM),
            ("appeal", "What is the dispute or appeal process if an application is denied?", "No review or appeal mechanism is documented in the analyzed sources.", PriorityLevel.LOW)
        ]
    else:
        gap_candidates = [
            ("methodology", "What primary empirical evidence, methodology, or source dataset supports these claims?", "Reviewed sources omit specific methodology or data collection parameters.", PriorityLevel.HIGH),
            ("timeline", "What is the authoritative implementation timeline or effective date range?", "Reviewed sources do not establish an authoritative effective timeline.", PriorityLevel.HIGH),
            ("scope", "What are the explicit operational limitations, scope boundaries, or exclusions?", "Operational scope boundaries are not comprehensively delineated in reviewed sources.", PriorityLevel.MEDIUM),
            ("authority", "What primary authority or governing institution oversees this information?", "Authoritative oversight channels are omitted in the reviewed materials.", PriorityLevel.LOW)
        ]

    for term, q_text, why, prio in gap_candidates:
        if term not in combined_text:
            gaps.append(GapFinding(
                id=f"G{len(gaps) + 1}",
                question=q_text,
                status=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES,
                why_it_matters=why,
                checked_source_ids=valid_ids,
                priority=prio,
                evidence=[]
            ))

    # 3. Verification checklist
    checklist: List[VerificationTask] = []
    if freshness_warnings:
        action_text = "Cross-check terms against current academic year official announcements" if is_admission_scholarship else "Cross-check claims against current primary announcements or documentation"
        source_type_text = "Official Program Portal" if is_admission_scholarship else "Primary Source Documentation"
        checklist.append(VerificationTask(
            id=f"V{len(checklist) + 1}",
            action=action_text,
            priority=PriorityLevel.HIGH,
            why_it_matters="One or more sources are undated or refer to previous cycles.",
            related_finding_ids=[f.id for f in freshness_warnings],
            suggested_source_type=source_type_text
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

    res = AnalysisResult(
        investigation_id=investigation_id,
        question=question,
        summary=summary,
        sources=sources,
        gaps=gaps,
        conflicts=[],
        freshness_warnings=freshness_warnings,
        verification_checklist=checklist,
        limitations=limitations,
        is_insufficient_evidence=False,
        evidence_fully_audited=False
    )
    return validate_citations(res, set(valid_ids), sources=sources)

def _is_grounded_in_text(quote: str, source_text: Optional[str]) -> bool:
    """Verifies that a cited evidence excerpt is genuinely grounded in retrieved source text."""
    if not quote or not quote.strip():
        return False
    if not source_text or not source_text.strip():
        return False

    clean_quote = re.sub(r"[^\w\s]", "", quote).strip().lower()
    clean_source = re.sub(r"[^\w\s]", "", source_text).strip().lower()
    if not clean_quote or not clean_source:
        return False

    # Exact cleaned substring match
    if clean_quote in clean_source:
        return True

    # Check 4-word consecutive sequence
    words = clean_quote.split()
    if len(words) <= 3:
        return clean_quote in clean_source

    total_shingles = len(words) - 3
    matched_shingles = 0
    for i in range(total_shingles):
        shingle = " ".join(words[i:i+4])
        if shingle in clean_source:
            matched_shingles += 1

    return (matched_shingles / total_shingles) >= 0.5

def validate_citations(
    result: AnalysisResult,
    valid_source_ids: Set[str],
    sources: Optional[List[SourceRecord]] = None
) -> AnalysisResult:
    """
    Validates that every cited source ID in findings actually exists in the retrieved sources.
    Filters out spurious or invalid source references, ensures bilateral evidence on conflicts,
    verifies text grounding against retrieved source content, enforces cautious gap scoping,
    and ensures freshness warnings do not assert falsity.
    Sets evidence_fully_audited to True only when all submitted sources succeeded and all
    citations and integrity checks have passed without any dropped or ungrounded evidence.
    """
    sources_map: Dict[str, SourceRecord] = {}
    all_sources = sources if sources is not None else result.sources
    failed_sources = [s for s in all_sources if s.status == SourceStatus.FAILED]

    if sources:
        sources_map = {s.id: s for s in sources if s.status != SourceStatus.FAILED}
    elif result.sources:
        sources_map = {s.id: s for s in result.sources if s.status != SourceStatus.FAILED}

    integrity_check_failed = False
    if failed_sources or not valid_source_ids or result.is_insufficient_evidence:
        integrity_check_failed = True

    # 1. Validate gaps: refer only to sources actually reviewed and use cautious scoping
    sanitized_gaps: List[GapFinding] = []
    for gap in result.gaps:
        invalid_ids = [sid for sid in gap.checked_source_ids if sid not in valid_source_ids]
        if invalid_ids:
            integrity_check_failed = True

        checked_ids = [sid for sid in gap.checked_source_ids if sid in valid_source_ids]
        if not checked_ids:
            checked_ids = list(valid_source_ids)

        ev_list: List[EvidenceReference] = []
        for ev in gap.evidence:
            if ev.source_id not in valid_source_ids:
                integrity_check_failed = True
                continue

            # If sources available, verify grounding and populate metadata
            if sources_map and ev.source_id in sources_map:
                src = sources_map[ev.source_id]
                if not _is_grounded_in_text(ev.quote, src.full_text):
                    logger.warning("Dropping ungrounded gap evidence quote for source %s", ev.source_id)
                    integrity_check_failed = True
                    continue
                if not ev.source_title:
                    ev.source_title = src.title
                if not ev.source_url:
                    ev.source_url = src.url
            ev_list.append(ev)

        gap.checked_source_ids = checked_ids
        gap.evidence = ev_list

        # If claimed to be partially or fully addressed but zero grounded quotes exist, downgrade to not_found_in_reviewed_sources
        if gap.status in (GapStatus.PARTIALLY_ADDRESSED, GapStatus.FULLY_ADDRESSED) and not ev_list:
            integrity_check_failed = True
            gap.status = GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES

        # Ensure missing renewal requirements are described only as not found in the reviewed sources
        if "renewal" in gap.question.lower() or "continuation" in gap.question.lower():
            if gap.status == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES:
                if "not found in" not in gap.why_it_matters.lower() or "reviewed sources" not in gap.why_it_matters.lower():
                    gap.why_it_matters = "Specific continuation and renewal requirements were not found in the reviewed sources."

        # Ensure why_it_matters uses cautious wording scoping absence to reviewed sources
        wim_lower = gap.why_it_matters.lower()
        if not ("reviewed" in wim_lower or "analyzed" in wim_lower or "provided" in wim_lower):
            gap.why_it_matters = f"{gap.why_it_matters.rstrip('.')} in the reviewed sources."

        sanitized_gaps.append(gap)
    result.gaps = sanitized_gaps

    # 2. Validate conflicts: must cite two distinct valid sources, have bilateral evidence, and be grounded
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
        is_grounded = True
        if sources_map:
            src_a = sources_map.get(conf.source_id_a)
            src_b = sources_map.get(conf.source_id_b)
            if not src_a or not src_a.full_text or not _is_grounded_in_text(conf.evidence_a, src_a.full_text):
                is_grounded = False
            if not src_b or not src_b.full_text or not _is_grounded_in_text(conf.evidence_b, src_b.full_text):
                is_grounded = False

        if is_valid_sources and has_bilateral_evidence and is_grounded:
            sanitized_conflicts.append(conf)
        else:
            integrity_check_failed = True
            logger.warning(
                "Dropping invalid conflict: source_a=%s, source_b=%s, has_evidence=%s, is_grounded=%s",
                conf.source_id_a, conf.source_id_b, has_bilateral_evidence, is_grounded
            )
    result.conflicts = sanitized_conflicts

    # 3. Validate freshness warnings: must reference valid sources, sync dates with real metadata, and never assert that old info is false
    sanitized_warnings: List[FreshnessWarning] = []
    for w in result.freshness_warnings:
        if w.source_id not in valid_source_ids:
            integrity_check_failed = True
            continue

        if sources_map and w.source_id in sources_map:
            src = sources_map[w.source_id]
            if src.date:
                w.date_found = src.date
                if w.warning_type == FreshnessWarningType.DATE_NOT_FOUND:
                    w.warning_type = FreshnessWarningType.STALE_DATED
            else:
                w.date_found = None
                w.warning_type = FreshnessWarningType.DATE_NOT_FOUND
        cleaned_rationale = w.rationale
        for bad_phrase in ["is false", "are false", "is incorrect", "are incorrect", "is invalid", "is fake"]:
            if bad_phrase in cleaned_rationale.lower():
                cleaned_rationale = re.sub(
                    re.escape(bad_phrase),
                    "may be outdated and warrants currentness verification",
                    cleaned_rationale,
                    flags=re.IGNORECASE
                )
        w.rationale = cleaned_rationale
        sanitized_warnings.append(w)
    result.freshness_warnings = sanitized_warnings

    # 4. Validate verification checklist: prune non-existent finding IDs to preserve bidirectional linking
    valid_finding_ids = {g.id for g in result.gaps} | {c.id for c in result.conflicts} | {w.id for w in result.freshness_warnings}
    for task in result.verification_checklist:
        pruned_fids = [fid for fid in task.related_finding_ids if fid not in valid_finding_ids]
        if pruned_fids:
            integrity_check_failed = True
        task.related_finding_ids = [fid for fid in task.related_finding_ids if fid in valid_finding_ids]

    # 5. Set evidence_fully_audited: True ONLY when all sources retrieved and every citation & evidence integrity check passed
    result.evidence_fully_audited = bool(
        not integrity_check_failed
        and not result.is_insufficient_evidence
        and len(all_sources) > 0
        and len(failed_sources) == 0
    )

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
            # Parse into Pydantic models with resilient normalization
            raw_gaps = llm_output.get("gaps", [])
            gaps_data = []
            for idx, g in enumerate(raw_gaps, start=1):
                if not isinstance(g, dict):
                    continue
                gid = str(g.get("id") or f"G{idx}").strip()
                question_text = str(g.get("question") or f"Inquiry Facet {idx}").strip()
                status_val = _normalize_gap_status(g.get("status"))
                prio_val = _normalize_priority(g.get("priority"))
                checked_ids = _normalize_str_list(g.get("checked_source_ids")) or list(valid_source_ids)
                why_text = str(g.get("why_it_matters") or "Required for comprehensive evaluation in reviewed sources.").strip()

                ev_data: List[EvidenceReference] = []
                raw_ev = g.get("evidence", [])
                if isinstance(raw_ev, list):
                    fallback_sid = checked_ids[0] if checked_ids else "S1"
                    for ev in raw_ev:
                        if isinstance(ev, str) and ev.strip():
                            ev_data.append(EvidenceReference(source_id=fallback_sid, quote=ev.strip()))
                        elif isinstance(ev, dict):
                            sid = str(ev.get("source_id") or fallback_sid).strip()
                            quote_str = str(ev.get("quote") or "").strip()
                            if quote_str:
                                ev_data.append(EvidenceReference(
                                    source_id=sid,
                                    quote=quote_str,
                                    source_title=ev.get("source_title"),
                                    source_url=ev.get("source_url")
                                ))
                gaps_data.append(GapFinding(
                    id=gid,
                    question=question_text,
                    status=status_val,
                    why_it_matters=why_text,
                    checked_source_ids=checked_ids,
                    priority=prio_val,
                    evidence=ev_data
                ))

            # Parse freshness warnings with resilient enum mapping
            raw_freshness = llm_output.get("freshness_warnings", [])
            freshness_data = []
            for idx, f in enumerate(raw_freshness, start=1):
                if not isinstance(f, dict):
                    continue
                fid = str(f.get("id") or f"F{idx}").strip()
                sid = str(f.get("source_id") or "S1").strip()
                wt = str(f.get("warning_type") or "").strip().lower()
                if "not_found" in wt or "missing" in wt or "undated" in wt or "unknown" in wt:
                    warning_type = FreshnessWarningType.DATE_NOT_FOUND
                elif "stale" in wt or "old" in wt or "prior" in wt or "date" in wt:
                    warning_type = FreshnessWarningType.STALE_DATED
                else:
                    warning_type = FreshnessWarningType.CURRENTNESS_UNKNOWN

                date_found = f.get("date_found")
                rationale_str = str(f.get("rationale") or f"Source {sid} requires verification to confirm currentness.").strip()
                freshness_data.append(FreshnessWarning(
                    id=fid,
                    source_id=sid,
                    warning_type=warning_type,
                    date_found=str(date_found) if date_found else None,
                    rationale=rationale_str
                ))

            raw_conflicts = llm_output.get("conflicts", [])
            conflicts_data = []
            for idx, c in enumerate(raw_conflicts, start=1):
                if not isinstance(c, dict):
                    continue
                cid = str(c.get("id") or f"C{idx}").strip()
                claim_a = str(c.get("claim_a") or "").strip()
                sid_a = str(c.get("source_id_a") or "S1").strip()
                ev_a = str(c.get("evidence_a") or "").strip()
                claim_b = str(c.get("claim_b") or "").strip()
                sid_b = str(c.get("source_id_b") or "S2").strip()
                ev_b = str(c.get("evidence_b") or "").strip()
                conf_status = _normalize_conflict_status(c.get("conflict_status"))
                ctx_note = str(c.get("context_note") or "").strip()
                if claim_a and claim_b:
                    conflicts_data.append(ConflictFinding(
                        id=cid,
                        claim_a=claim_a,
                        source_id_a=sid_a,
                        evidence_a=ev_a,
                        claim_b=claim_b,
                        source_id_b=sid_b,
                        evidence_b=ev_b,
                        conflict_status=conf_status,
                        context_note=ctx_note
                    ))

            raw_checklist = llm_output.get("verification_checklist", [])
            checklist_data = []
            for idx, v in enumerate(raw_checklist, start=1):
                if not isinstance(v, dict):
                    continue
                vid = str(v.get("id") or f"V{idx}").strip()
                action_str = str(v.get("action") or "").strip()
                if not action_str:
                    continue
                v_prio = _normalize_priority(v.get("priority"))
                wim_str = str(v.get("why_it_matters") or "Essential verification step.").strip()
                rel_fids = _normalize_str_list(v.get("related_finding_ids"))
                sugg_type = str(v.get("suggested_source_type") or "Official Primary Source").strip()
                checklist_data.append(VerificationTask(
                    id=vid,
                    action=action_str,
                    priority=v_prio,
                    why_it_matters=wim_str,
                    related_finding_ids=rel_fids,
                    suggested_source_type=sugg_type
                ))

            limitations_data = _normalize_str_list(llm_output.get("limitations", []))
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
            final_result = validate_citations(result, valid_source_ids, sources=sources)
            failed_sources = [s for s in sources if s.status == SourceStatus.FAILED]
            if failed_sources:
                fail_note = f"Partial source coverage: {len(failed_sources)} of {len(sources)} source(s) failed retrieval ({', '.join([s.id for s in failed_sources])}) and could not be analyzed."
                if fail_note not in final_result.limitations:
                    final_result.limitations.insert(0, fail_note)
            return final_result
        except Exception as e:
            logger.error("Gemini API call failed (%s). Falling back to heuristic evidence audit.", e)
            res = build_heuristic_analysis(request.question, sources, investigation_id)
            res.limitations.append(f"Gemini API call encountered an error: {e}. Fallback evidence synthesis provided.")
            final_res = validate_citations(res, valid_source_ids, sources=sources)
            failed_sources = [s for s in sources if s.status == SourceStatus.FAILED]
            if failed_sources:
                fail_note = f"Partial source coverage: {len(failed_sources)} of {len(sources)} source(s) failed retrieval ({', '.join([s.id for s in failed_sources])}) and could not be analyzed."
                if fail_note not in final_res.limitations:
                    final_res.limitations.insert(0, fail_note)
            return final_res

    # Heuristic audit when GEMINI_API_KEY is not configured
    res = build_heuristic_analysis(request.question, sources, investigation_id)
    final_res = validate_citations(res, valid_source_ids, sources=sources)
    failed_sources = [s for s in sources if s.status == SourceStatus.FAILED]
    if failed_sources:
        fail_note = f"Partial source coverage: {len(failed_sources)} of {len(sources)} source(s) failed retrieval ({', '.join([s.id for s in failed_sources])}) and could not be analyzed."
        if fail_note not in final_res.limitations:
            final_res.limitations.insert(0, fail_note)
    return final_res

