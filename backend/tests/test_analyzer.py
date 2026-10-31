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
