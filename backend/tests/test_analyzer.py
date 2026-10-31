import pytest
from app.services.analyzer import build_heuristic_analysis, validate_citations, process_sources
from app.models.schemas import (
    SourceRecord,
    SourceStatus,
    DateStatus,
    GapFinding,
    GapStatus,
    ConflictFinding,
    ConflictStatus,
    FreshnessWarning,
    FreshnessWarningType,
    PriorityLevel,
    AnalysisResult,
    VerificationTask,
    EvidenceReference,
)

def test_heuristic_analysis_with_sources():
    sources = [
        SourceRecord(
            id="S1",
            title="Admissions Criteria 2026",
            url="https://example.org/admissions",
            status=SourceStatus.RETRIEVED,
            date=None,
            date_status=DateStatus.UNDATED,
            excerpt="Applicants must submit transcripts.",
            full_text="Applicants must submit transcripts. Minimum GPA is 3.5. Selection is competitive."
        ),
        SourceRecord(
            id="S2",
            title="Archive Guidelines 2022",
            url="https://example.org/archive",
            status=SourceStatus.RETRIEVED,
            date="2022-04-10",
            date_status=DateStatus.DATED,
            excerpt="Archive rules from 2022.",
            full_text="Archive rules from 2022 cycle. Deadline was March 1st."
        )
    ]

    res = build_heuristic_analysis("What are the renewal and fee rules?", sources, "INV-TEST1")
    assert res.investigation_id == "INV-TEST1"
    assert len(res.sources) == 2
    assert len(res.freshness_warnings) == 2
    assert any("renewal" in g.question.lower() or "fee" in g.question.lower() for g in res.gaps)
    assert len(res.verification_checklist) > 0

def test_citation_validation_filters_spurious_ids():
    valid_ids = {"S1", "S2"}
    conflict_bad = ConflictFinding(
        id="C1",
        claim_a="Valid claim",
        source_id_a="S1",
        evidence_a="excerpt a",
        claim_b="Invalid claim",
        source_id_b="S99", # Nonexistent ID
        evidence_b="excerpt b",
        conflict_status=ConflictStatus.MATERIAL_CONFLICT
    )
    res = AnalysisResult(
        investigation_id="INV-TEST2",
        question="Test",
        summary="Summary",
        sources=[],
        gaps=[],
        conflicts=[conflict_bad],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(res, valid_ids)
    assert len(validated.conflicts) == 0

def test_all_sources_failed_insufficient_evidence():
    sources = [
        SourceRecord(
            id="S1",
            title="Fetch Error",
            url="http://127.0.0.1/admin",
            status=SourceStatus.FAILED,
            error_message="SSRF violation"
        )
    ]
    res = build_heuristic_analysis("Question", sources, "INV-TEST3")
    assert res.is_insufficient_evidence is True
    assert len(res.gaps) == 0

# ============================================================================
# Phase 1 Acceptance Tests
# ============================================================================

def test_phase1_evidence_grounded_findings():
    """Acceptance Test 1: Verify findings reference only actually reviewed sources with real grounded evidence."""
    s1 = SourceRecord(
        id="S1",
        title="Source Alpha",
        url="https://alpha.example.org",
        status=SourceStatus.RETRIEVED,
        date="2026-01-10",
        date_status=DateStatus.DATED,
        full_text="Eligibility requires a minimum GPA of 3.8 and two recommendation letters."
    )
    s2 = SourceRecord(
        id="S2",
        title="Source Beta",
        url="https://beta.example.org",
        status=SourceStatus.RETRIEVED,
        date=None,
        date_status=DateStatus.UNDATED,
        full_text="Applicants must submit a statement of purpose. No aid is guaranteed for part-time study."
    )

    res = build_heuristic_analysis("What are the eligibility and renewal requirements?", [s1, s2], "INV-ACC1")

    # Checked source IDs in every gap must be valid
    valid_source_ids = {"S1", "S2"}
    for gap in res.gaps:
        assert len(gap.checked_source_ids) > 0
        for sid in gap.checked_source_ids:
            assert sid in valid_source_ids
            assert sid != "S99"

    # Verify that evidence references are validated against actual retrieved source text
    grounded_ev = EvidenceReference(
        source_id="S1",
        quote="minimum GPA of 3.8 and two recommendation letters"
    )
    fabricated_ev = EvidenceReference(
        source_id="S1",
        quote="guaranteed 100000 dollar cash bonus on entry" # completely ungrounded
    )
    test_gap = GapFinding(
        id="G1",
        question="What is the GPA requirement?",
        status=GapStatus.PARTIALLY_ADDRESSED,
        why_it_matters="Important for eligibility in the reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH,
        evidence=[grounded_ev, fabricated_ev]
    )
    dummy_res = AnalysisResult(
        investigation_id="INV-GROUND",
        question="Test",
        summary="Summary",
        sources=[s1, s2],
        gaps=[test_gap],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(dummy_res, valid_source_ids, sources=[s1, s2])
    # Grounded evidence is kept; fabricated evidence is pruned
    assert len(validated.gaps[0].evidence) == 1
    assert "GPA of 3.8" in validated.gaps[0].evidence[0].quote

    # Verify conflict grounding check
    grounded_conflict = ConflictFinding(
        id="C1",
        claim_a="Requires GPA 3.8",
        source_id_a="S1",
        evidence_a="requires a minimum GPA of 3.8",
        claim_b="No aid for part-time",
        source_id_b="S2",
        evidence_b="No aid is guaranteed for part-time study",
        conflict_status=ConflictStatus.POSSIBLE_DISCREPANCY
    )
    fabricated_conflict = ConflictFinding(
        id="C2",
        claim_a="Fake claim A",
        source_id_a="S1",
        evidence_a="completely non-existent phrase not in source alpha",
        claim_b="Claim B",
        source_id_b="S2",
        evidence_b="No aid is guaranteed for part-time study",
        conflict_status=ConflictStatus.MATERIAL_CONFLICT
    )
    dummy_res2 = AnalysisResult(
        investigation_id="INV-GROUND-C",
        question="Test",
        summary="Summary",
        sources=[s1, s2],
        gaps=[],
        conflicts=[grounded_conflict, fabricated_conflict],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated2 = validate_citations(dummy_res2, valid_source_ids, sources=[s1, s2])
    assert len(validated2.conflicts) == 1
    assert validated2.conflicts[0].id == "C1"

def test_phase1_missing_information_cautious_wording():
    """Acceptance Test 2: Verify gaps refer only to sources actually reviewed and use cautious scoping."""
    s1 = SourceRecord(
        id="S1",
        title="Guidelines Page",
        url="https://example.org/guidelines",
        status=SourceStatus.RETRIEVED,
        full_text="Initial applications are accepted in September."
    )
    res = build_heuristic_analysis("What are the renewal and appeal criteria?", [s1], "INV-ACC2")

    for gap in res.gaps:
        assert gap.status in (GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES, GapStatus.PARTIALLY_ADDRESSED)
        # Checked IDs must belong strictly to reviewed sources
        for sid in gap.checked_source_ids:
            assert sid == "S1"
        # Why it matters must scope the absence to reviewed materials, not claim universal non-existence
        wim = gap.why_it_matters.lower()
        assert "reviewed" in wim or "analyzed" in wim or "provided" in wim

def test_phase1_conflicts_require_material_incompatibility():
    """Acceptance Test 3: Ensure validate_citations rejects conflicts with identical source IDs or missing evidence."""
    valid_ids = {"S1", "S2"}

    # 1. Genuine bilateral conflict between two distinct sources with evidence
    valid_conflict = ConflictFinding(
        id="C1",
        claim_a="Full tuition is covered",
        source_id_a="S1",
        evidence_a="Covers 100% of university tuition fees.",
        claim_b="Only 50% tuition is covered",
        source_id_b="S2",
        evidence_b="Covers up to 50% tuition depending on department.",
        conflict_status=ConflictStatus.MATERIAL_CONFLICT,
        context_note="S1 is central portal; S2 is departmental handbook."
    )

    # 2. Invalid conflict: identical source IDs on both sides (not a multi-source conflict)
    same_source_conflict = ConflictFinding(
        id="C2",
        claim_a="Statement X",
        source_id_a="S1",
        evidence_a="Statement X text",
        claim_b="Statement Y",
        source_id_b="S1",
        evidence_b="Statement Y text",
        conflict_status=ConflictStatus.POSSIBLE_DISCREPANCY
    )

    # 3. Invalid conflict: missing evidence on one side
    missing_evidence_a_conflict = ConflictFinding(
        id="C3",
        claim_a="Claim without quote",
        source_id_a="S1",
        evidence_a="", # Empty quote
        claim_b="Claim with quote",
        source_id_b="S2",
        evidence_b="Valid quote from S2",
        conflict_status=ConflictStatus.MATERIAL_CONFLICT
    )

    # 4. Invalid conflict: missing evidence on the other side
    missing_evidence_b_conflict = ConflictFinding(
        id="C4",
        claim_a="Claim with quote",
        source_id_a="S1",
        evidence_a="Valid quote from S1",
        claim_b="Claim without quote",
        source_id_b="S2",
        evidence_b="   ", # Whitespace only quote
        conflict_status=ConflictStatus.MATERIAL_CONFLICT
    )

    dummy_res = AnalysisResult(
        investigation_id="INV-ACC3",
        question="Check conflict validation",
        summary="Summary",
        sources=[],
        gaps=[],
        conflicts=[
            valid_conflict,
            same_source_conflict,
            missing_evidence_a_conflict,
            missing_evidence_b_conflict
        ],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )

    sanitized = validate_citations(dummy_res, valid_ids)

    # validate_citations must reject C2, C3, and C4, keeping ONLY C1
    assert len(sanitized.conflicts) == 1
    assert sanitized.conflicts[0].id == "C1"
    assert sanitized.conflicts[0].source_id_a != sanitized.conflicts[0].source_id_b
    assert bool(sanitized.conflicts[0].evidence_a.strip())
    assert bool(sanitized.conflicts[0].evidence_b.strip())

def test_phase1_freshness_warnings_do_not_assert_old_is_false():
    """Acceptance Test 4: Ensure freshness warnings do not assert that old information is false or invalid."""
    s1 = SourceRecord(
        id="S1",
        title="Historical Guidelines",
        url="https://example.org/hist",
        status=SourceStatus.RETRIEVED,
        date="2021-03-01",
        date_status=DateStatus.DATED,
        full_text="Published in 2021."
    )
    res = build_heuristic_analysis("Check historical policy", [s1], "INV-ACC4")
    assert len(res.freshness_warnings) == 1
    w = res.freshness_warnings[0]
    assert w.warning_type == FreshnessWarningType.STALE_DATED
    assert w.source_id == "S1"

    # Rationale must caution currentness without declaring facts false or invalid
    rationale_lower = w.rationale.lower()
    assert "is false" not in rationale_lower
    assert "is incorrect" not in rationale_lower
    assert "is invalid" not in rationale_lower
    assert "is fake" not in rationale_lower

    # Also test that validate_citations sanitizes any LLM rationale asserting falsity
    llm_warning = FreshnessWarning(
        id="F2",
        source_id="S1",
        warning_type=FreshnessWarningType.STALE_DATED,
        date_found="2020",
        rationale="Source S1 is false because it is old."
    )
    test_res = AnalysisResult(
        investigation_id="INV-TEST-F",
        question="Test",
        summary="Summary",
        sources=[],
        gaps=[],
        conflicts=[],
        freshness_warnings=[llm_warning],
        verification_checklist=[],
        limitations=[]
    )
    sanitized = validate_citations(test_res, {"S1"})
    assert "is false" not in sanitized.freshness_warnings[0].rationale.lower()
    assert "warrants currentness verification" in sanitized.freshness_warnings[0].rationale

# ============================================================================
# Phase 2 Investigation Quality Tests
# ============================================================================

def test_is_grounded_in_text_empty_source_returns_false():
    """Verify that _is_grounded_in_text returns False when source text is missing or empty."""
    from app.services.analyzer import _is_grounded_in_text
    assert _is_grounded_in_text("Some quote", "") is False
    assert _is_grounded_in_text("Some quote", "   ") is False
    assert _is_grounded_in_text("Some quote", None) is False
    assert _is_grounded_in_text("", "Some valid source text") is False

def test_is_grounded_in_text_shingle_ratio():
    """Verify that hallucinated quotes with minor coincidental overlap are rejected."""
    from app.services.analyzer import _is_grounded_in_text
    source_text = "The Gates Cambridge scholarship provides full cost funding for postgraduate study at Cambridge."
    
    # Genuine grounded quote (high overlap)
    grounded_quote = "provides full cost funding for postgraduate study"
    assert _is_grounded_in_text(grounded_quote, source_text) is True
    
    # Fabricated quote with only 1 trivial 4-word overlap out of 16 words
    hallucinated_quote = "The Gates Cambridge scholarship will deposit one million dollars directly into student bank accounts for emergency spending."
    assert _is_grounded_in_text(hallucinated_quote, source_text) is False

def test_freshness_warning_syncs_with_actual_source_date():
    """Verify that validate_citations synchronizes warning date_found with actual source metadata."""
    s1 = SourceRecord(
        id="S1",
        title="Source Alpha",
        url="https://alpha.example.org",
        status=SourceStatus.RETRIEVED,
        date="2026-09-14",
        date_status=DateStatus.DATED,
        full_text="Some valid content."
    )
    s2 = SourceRecord(
        id="S2",
        title="Source Beta",
        url="https://beta.example.org",
        status=SourceStatus.RETRIEVED,
        date=None,
        date_status=DateStatus.UNDATED,
        full_text="Some other content."
    )
    # LLM hallucinates an arbitrary date for S1 and S2
    warning_hallucinated_s1 = FreshnessWarning(
        id="F1",
        source_id="S1",
        warning_type=FreshnessWarningType.STALE_DATED,
        date_found="1999-01-01",
        rationale="Appears old."
    )
    warning_hallucinated_s2 = FreshnessWarning(
        id="F2",
        source_id="S2",
        warning_type=FreshnessWarningType.STALE_DATED,
        date_found="2015-05-05",
        rationale="Appears old."
    )
    test_res = AnalysisResult(
        investigation_id="INV-TEST-SYNC",
        question="Test",
        summary="Summary",
        sources=[s1, s2],
        gaps=[],
        conflicts=[],
        freshness_warnings=[warning_hallucinated_s1, warning_hallucinated_s2],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(test_res, {"S1", "S2"}, sources=[s1, s2])
    # S1's date_found is corrected to real metadata "2026-09-14"
    assert validated.freshness_warnings[0].date_found == "2026-09-14"
    # S2's warning_type is corrected to DATE_NOT_FOUND because S2 is undated
    assert validated.freshness_warnings[1].warning_type == FreshnessWarningType.DATE_NOT_FOUND

def test_partial_source_failure_in_investigation_limitations():
    """Verify that partial source failures are recorded in limitations and cannot be cited in findings."""
    from app.services.analyzer import run_investigation
    from app.models.schemas import AnalyzeRequest
    from unittest.mock import patch

    # Mock process_sources to simulate 1 retrieved source and 1 failed source
    mock_sources = [
        SourceRecord(
            id="S1",
            title="Admissions 2026",
            url="https://example.org/admissions",
            status=SourceStatus.RETRIEVED,
            date="2026-01-01",
            date_status=DateStatus.DATED,
            full_text="Full cost funding covers all university tuition and stipend."
        ),
        SourceRecord(
            id="S2",
            title="Non-existent Page",
            url="https://example.org/notfound",
            status=SourceStatus.FAILED,
            date=None,
            date_status=DateStatus.UNKNOWN,
            error_message="HTTP 404: Not Found"
        )
    ]

    with patch("app.services.analyzer.process_sources", return_value=mock_sources):
        request = AnalyzeRequest(
            question="What is funded?",
            urls=["https://example.org/admissions", "https://example.org/notfound"]
        )
        res = run_investigation(request)

        assert res.is_insufficient_evidence is False
        assert len(res.sources) == 2
        # Check that limitation records the partial failure honestly
        assert any("Partial source coverage: 1 of 2 source(s) failed" in lim for lim in res.limitations)
        # Ensure no gap or checklist item cites S2
        for g in res.gaps:
            assert "S2" not in g.checked_source_ids
            for ev in g.evidence:
                assert ev.source_id != "S2"

# ============================================================================
# Phase 3 Investigation Intelligence & Result Quality Tests
# ============================================================================

def test_gap_status_three_tier_validation():
    """Verify that fully_addressed, partially_addressed, and not_found_in_reviewed_sources are valid statuses."""
    s1 = SourceRecord(
        id="S1",
        title="Source Alpha",
        url="https://alpha.example.org",
        status=SourceStatus.RETRIEVED,
        full_text="Tuition is fully funded for four years. Renewal requires maintaining 3.0 GPA."
    )
    gap_fully = GapFinding(
        id="G1",
        question="What is the tuition coverage?",
        status=GapStatus.FULLY_ADDRESSED,
        why_it_matters="Tuition amount is explicitly stated in reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.LOW,
        evidence=[EvidenceReference(source_id="S1", quote="Tuition is fully funded for four years")]
    )
    gap_partial = GapFinding(
        id="G2",
        question="What are the renewal rules?",
        status=GapStatus.PARTIALLY_ADDRESSED,
        why_it_matters="Only GPA mentioned, other continuation criteria missing in reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.MEDIUM,
        evidence=[EvidenceReference(source_id="S1", quote="Renewal requires maintaining 3.0 GPA")]
    )
    gap_missing = GapFinding(
        id="G3",
        question="What are the exact submission deadlines?",
        status=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES,
        why_it_matters="No deadlines mentioned in reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH,
        evidence=[]
    )
    res = AnalysisResult(
        investigation_id="INV-P3-1",
        question="Test",
        summary="Summary",
        sources=[s1],
        gaps=[gap_fully, gap_partial, gap_missing],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(res, {"S1"}, sources=[s1])
    assert validated.gaps[0].status == GapStatus.FULLY_ADDRESSED
    assert validated.gaps[1].status == GapStatus.PARTIALLY_ADDRESSED
    assert validated.gaps[2].status == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES

def test_partially_addressed_downgraded_if_no_grounded_evidence():
    """Verify that a partially addressed gap with ungrounded/missing quotes is downgraded to not_found_in_reviewed_sources."""
    s1 = SourceRecord(
        id="S1",
        title="Source Alpha",
        url="https://alpha.example.org",
        status=SourceStatus.RETRIEVED,
        full_text="Applications open in September each year."
    )
    # LLM hallucinates partially_addressed but gives a fake quote
    gap_fake_partial = GapFinding(
        id="G1",
        question="What are the renewal rules?",
        status=GapStatus.PARTIALLY_ADDRESSED,
        why_it_matters="Renewal rules partial in reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH,
        evidence=[EvidenceReference(source_id="S1", quote="requires ninety percent attendance and dean letter")]
    )
    res = AnalysisResult(
        investigation_id="INV-P3-2",
        question="Test",
        summary="Summary",
        sources=[s1],
        gaps=[gap_fake_partial],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(res, {"S1"}, sources=[s1])
    # The ungrounded quote was dropped, and since ev_list is empty, status downgraded
    assert len(validated.gaps[0].evidence) == 0
    assert validated.gaps[0].status == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES

def test_checklist_finding_id_traceability():
    """Verify that verification tasks strictly retain only valid finding IDs."""
    gap1 = GapFinding(
        id="G1",
        question="Question 1",
        status=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES,
        why_it_matters="Why 1 in reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH
    )
    task1 = VerificationTask(
        id="V1",
        action="Verify Question 1",
        priority=PriorityLevel.HIGH,
        why_it_matters="Why V1",
        related_finding_ids=["G1", "G99", "NON_EXISTENT_ID"],
        suggested_source_type="Official Portal"
    )
    res = AnalysisResult(
        investigation_id="INV-P3-3",
        question="Test",
        summary="Summary",
        sources=[],
        gaps=[gap1],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[task1],
        limitations=[]
    )
    validated = validate_citations(res, {"S1"})
    # G99 and NON_EXISTENT_ID must be pruned; G1 retained
    assert validated.verification_checklist[0].related_finding_ids == ["G1"]

def test_risk_weighted_prioritization_heuristic():
    """Verify that heuristic gap decomposition assigns risk-weighted priorities."""
    s1 = SourceRecord(
        id="S1",
        title="Minimal Page",
        url="https://example.org/minimal",
        status=SourceStatus.RETRIEVED,
        full_text="General overview of campus life."
    )
    res = build_heuristic_analysis("Overview", [s1], "INV-P3-4")
    gap_map = {g.question: g.priority for g in res.gaps}
    
    # Eligibility, deadlines, renewal must be HIGH priority
    for q, prio in gap_map.items():
        if "eligibility" in q.lower() or "renewal" in q.lower() or "deadlines" in q.lower():
            assert prio == PriorityLevel.HIGH
        elif "fee" in q.lower():
            assert prio == PriorityLevel.MEDIUM
        elif "appeal" in q.lower():
            assert prio == PriorityLevel.LOW

# ============================================================================
# Phase 4 Trust, Robustness & Hackathon Readiness Tests
# ============================================================================

def test_process_sources_url_deduplication():
    """Verify that duplicate and trailing-slash URLs are deduplicated into a single source record."""
    from unittest.mock import patch

    mock_html = "<html><head><title>Alpha Portal</title></head><body><p>Content for alpha.</p></body></html>"
    with patch("app.services.analyzer.fetch_url_content", return_value=(mock_html, "https://alpha.example.org", 200)):
        urls = [
            "https://alpha.example.org",
            "https://alpha.example.org/",
            "https://ALPHA.example.org",
            "https://beta.example.org"
        ]
        with patch("app.services.analyzer.fetch_url_content", side_effect=[
            (mock_html, "https://alpha.example.org", 200),
            (mock_html, "https://beta.example.org", 200)
        ]):
            sources = process_sources(urls)
            # Alpha duplicates must be collapsed into S1, Beta becomes S2
            assert len(sources) == 2
            assert sources[0].id == "S1"
            assert sources[0].url == "https://alpha.example.org"
            assert sources[1].id == "S2"
            assert sources[1].url == "https://beta.example.org"

def test_topic_aware_heuristic_fallback_tech():
    """Verify that heuristic gap synthesis adapts to technical/compliance topics without domain leakage."""
    s1 = SourceRecord(
        id="S1",
        title="Security Overview",
        url="https://sec.example.org",
        status=SourceStatus.RETRIEVED,
        full_text="System enforces encryption in transit."
    )
    res = build_heuristic_analysis("What are the security compliance rules and audit standards?", [s1], "INV-P4-TECH")
    gap_questions = [g.question.lower() for g in res.gaps]

    # Must contain compliance/statutory gaps
    assert any("compliance" in q or "audit" in q for q in gap_questions)
    # Must NOT hallucinate academic tuition or scholarship renewal questions
    assert not any("tuition" in q or "scholarship" in q or "fee" in q for q in gap_questions)

def test_empty_readable_page_handling():
    """Verify that a page with insufficient readable text (e.g. empty JS SPA) is marked FAILED and quarantined."""
    empty_html = "<html><head><title>SPA</title></head><body><div id='root'></div></body></html>"
    from app.services.extractor import extract_source_record
    record = extract_source_record("S1", empty_html, "https://spa.example.org", "https://spa.example.org")
    assert record.status == SourceStatus.FAILED
    assert "insufficient readable text" in record.error_message.lower()

# ============================================================================
# Status Accuracy & User Trust Tests
# ============================================================================

def test_evidence_fully_audited_true_when_all_checks_pass():
    """Verify evidence_fully_audited is True when all sources are retrieved and all citations are grounded."""
    s1 = SourceRecord(
        id="S1",
        title="Official Guidelines",
        url="https://example.gov.in/rules",
        status=SourceStatus.RETRIEVED,
        date="2026-02-01",
        date_status=DateStatus.DATED,
        full_text="Students must maintain satisfactory academic progress. Full attendance is mandatory for scholarship renewal."
    )
    gap1 = GapFinding(
        id="G1",
        question="What are the renewal requirements?",
        status=GapStatus.PARTIALLY_ADDRESSED,
        why_it_matters="Specific attendance rules are partially outlined in the reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH,
        evidence=[
            EvidenceReference(
                source_id="S1",
                quote="Full attendance is mandatory for scholarship renewal."
            )
        ]
    )
    res = AnalysisResult(
        investigation_id="INV-AUDIT-1",
        question="What are the rules?",
        summary="Audit summary.",
        sources=[s1],
        gaps=[gap1],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(res, {"S1"}, sources=[s1])
    assert validated.evidence_fully_audited is True

def test_evidence_fully_audited_false_when_source_fails():
    """Verify evidence_fully_audited is False when any source failed retrieval."""
    s1 = SourceRecord(
        id="S1",
        title="Working Source",
        url="https://example.gov.in/working",
        status=SourceStatus.RETRIEVED,
        full_text="Some valid content."
    )
    s2 = SourceRecord(
        id="S2",
        title="Failed Source",
        url="https://example.gov.in/broken",
        status=SourceStatus.FAILED,
        error_message="HTTP 404 Not Found"
    )
    res = AnalysisResult(
        investigation_id="INV-AUDIT-2",
        question="What are the rules?",
        summary="Partial audit summary.",
        sources=[s1, s2],
        gaps=[],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=["Source S2 failed retrieval."]
    )
    validated = validate_citations(res, {"S1"}, sources=[s1, s2])
    assert validated.evidence_fully_audited is False

def test_evidence_fully_audited_false_when_citation_ungrounded():
    """Verify evidence_fully_audited is False when an ungrounded citation quote is dropped."""
    s1 = SourceRecord(
        id="S1",
        title="Real Source",
        url="https://example.gov.in/rules",
        status=SourceStatus.RETRIEVED,
        full_text="Only standard application procedures apply."
    )
    gap1 = GapFinding(
        id="G1",
        question="What are the hidden penalties?",
        status=GapStatus.PARTIALLY_ADDRESSED,
        why_it_matters="Penalties matter in reviewed sources.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH,
        evidence=[
            EvidenceReference(
                source_id="S1",
                quote="Fabricated text claiming massive financial penalties that do not exist in source text."
            )
        ]
    )
    res = AnalysisResult(
        investigation_id="INV-AUDIT-3",
        question="What are the penalties?",
        summary="Audit summary.",
        sources=[s1],
        gaps=[gap1],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )
    validated = validate_citations(res, {"S1"}, sources=[s1])
    # The ungrounded quote must be pruned, and evidence_fully_audited must be False
    assert len(validated.gaps[0].evidence) == 0
    assert validated.evidence_fully_audited is False

def test_evidence_fully_audited_false_on_insufficient_evidence():
    """Verify evidence_fully_audited is False when is_insufficient_evidence is True."""
    res = AnalysisResult(
        investigation_id="INV-AUDIT-4",
        question="Unknown query",
        summary="No evidence available.",
        sources=[],
        gaps=[],
        conflicts=[],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=["No sources provided."],
        is_insufficient_evidence=True
    )
    validated = validate_citations(res, set())
    assert validated.evidence_fully_audited is False

def test_missing_renewal_requirements_described_only_as_not_found_in_reviewed_sources():
    """Verify that missing renewal requirements are strictly described as not found in the reviewed sources."""
    s1 = SourceRecord(
        id="S1",
        title="Initial Application Info",
        url="https://example.org/initial",
        status=SourceStatus.RETRIEVED,
        full_text="Fresh applicants must register online by October."
    )
    res = build_heuristic_analysis(
        "What are the eligibility and renewal requirements?",
        [s1],
        "INV-AUDIT-RENEWAL"
    )
    renewal_gaps = [g for g in res.gaps if "renewal" in g.question.lower()]
    assert len(renewal_gaps) >= 1
    for rgap in renewal_gaps:
        assert rgap.status == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES
        assert "not found in the reviewed sources" in rgap.why_it_matters.lower()

def test_publication_date_does_not_equate_to_information_being_current():
    """Verify that having a publication date does not guarantee currency and older dates trigger warnings."""
    s1 = SourceRecord(
        id="S1",
        title="Older Guidelines",
        url="https://example.org/old-policy",
        status=SourceStatus.RETRIEVED,
        date="2022-05-10",
        date_status=DateStatus.DATED,
        full_text="Scholarship stipend is 10,000 per month."
    )
    res = build_heuristic_analysis("What is the stipend?", [s1], "INV-AUDIT-FRESH")
    assert len(res.freshness_warnings) == 1
    warning = res.freshness_warnings[0]
    assert warning.warning_type == FreshnessWarningType.STALE_DATED
    assert warning.date_found == "2022-05-10"
    # Must flag for verification without claiming the past date is false
    assert "verification" in warning.rationale.lower()
    assert "false" not in warning.rationale.lower()

def test_grounded_excerpt_matching_verifies_source_text():
    """Verify that _is_grounded_in_text strictly validates excerpts against retrieved source content."""
    from app.services.analyzer import _is_grounded_in_text

    source_text = "The Gates Cambridge Scholarship covers the full cost of studying at Cambridge including tuition fees and maintenance allowance."
    
    # Exact and near-exact excerpts must pass
    assert _is_grounded_in_text("covers the full cost of studying at Cambridge", source_text) is True
    assert _is_grounded_in_text("tuition fees and maintenance allowance", source_text) is True

    # Hallucinated or altered excerpts must fail
    assert _is_grounded_in_text("covers only partial cost and requires private student loans", source_text) is False
    assert _is_grounded_in_text("all students receive free laptops and travel vouchers", source_text) is False
    assert _is_grounded_in_text("", source_text) is False
    assert _is_grounded_in_text("covers the full cost", None) is False

def test_normalization_helpers_prevent_deserialization_breakdowns():
    """Verify that normalization helpers handle variant LLM outputs without throwing validation errors."""
    from app.services.analyzer import (
        _normalize_priority,
        _normalize_gap_status,
        _normalize_conflict_status,
        _normalize_str_list
    )

    # Priority normalization
    assert _normalize_priority("High") == PriorityLevel.HIGH
    assert _normalize_priority("URGENT") == PriorityLevel.HIGH
    assert _normalize_priority("critical") == PriorityLevel.HIGH
    assert _normalize_priority("Medium") == PriorityLevel.MEDIUM
    assert _normalize_priority("low") == PriorityLevel.LOW
    assert _normalize_priority(None) == PriorityLevel.MEDIUM

    # Gap status normalization
    assert _normalize_gap_status("not_found") == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES
    assert _normalize_gap_status("missing") == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES
    assert _normalize_gap_status("partially-addressed") == GapStatus.PARTIALLY_ADDRESSED
    assert _normalize_gap_status("partial") == GapStatus.PARTIALLY_ADDRESSED
    assert _normalize_gap_status("fully_addressed") == GapStatus.FULLY_ADDRESSED
    assert _normalize_gap_status("complete") == GapStatus.FULLY_ADDRESSED

    # Conflict status normalization
    assert _normalize_conflict_status("material") == ConflictStatus.MATERIAL_CONFLICT
    assert _normalize_conflict_status("direct_conflict") == ConflictStatus.MATERIAL_CONFLICT
    assert _normalize_conflict_status("discrepancy") == ConflictStatus.POSSIBLE_DISCREPANCY
    assert _normalize_conflict_status("possible_discrepancy") == ConflictStatus.POSSIBLE_DISCREPANCY

    # String list normalization
    assert _normalize_str_list(["S1", "S2"]) == ["S1", "S2"]
    assert _normalize_str_list("S1") == ["S1"]
    assert _normalize_str_list("S1, S2") == ["S1", "S2"]
    assert _normalize_str_list(None) == []


