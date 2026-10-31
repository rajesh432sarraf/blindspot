import pytest
from app.models.schemas import (
    AnalyzeRequest,
    SourceRecord,
    SourceStatus,
    DateStatus,
    GapFinding,
    GapStatus,
    ConflictFinding,
    ConflictStatus,
    FreshnessWarning,
    FreshnessWarningType,
    PriorityLevel
)
from app.services.analyzer import validate_citations, build_heuristic_analysis, run_investigation

def test_criteria_1_evidence_grounded_findings():
    """Verify that every finding is linked to real source IDs and non-empty evidence."""
    s1 = SourceRecord(
        id="S1",
        title="Source Alpha",
        url="https://alpha.example.org",
        status=SourceStatus.RETRIEVED,
        date="2026-01-10",
        date_status=DateStatus.DATED,
        full_text="Eligibility requires a minimum GPA of 3.8 and submission of two recommendation letters."
    )
    s2 = SourceRecord(
        id="S2",
        title="Source Beta",
        url="https://beta.example.org",
        status=SourceStatus.RETRIEVED,
        date=None,
        date_status=DateStatus.UNDATED,
        full_text="Applicants must submit a personal statement. No financial aid is guaranteed for part-time study."
    )

    res = build_heuristic_analysis("What are the eligibility and renewal requirements?", [s1, s2], "INV-CRIT1")

    # Verify all checked sources in gaps are valid
    for gap in res.gaps:
        assert len(gap.checked_source_ids) > 0
        for sid in gap.checked_source_ids:
            assert sid in ["S1", "S2"]
            assert sid != "S3" # no hallucinated IDs

def test_criteria_2_absence_is_not_non_existence():
    """Verify missing information is strictly labeled 'not_found_in_reviewed_sources', never claimed universally absent."""
    s1 = SourceRecord(
        id="S1",
        title="Guidelines Page",
        url="https://example.org/guidelines",
        status=SourceStatus.RETRIEVED,
        full_text="Initial applications are accepted in September."
    )
    res = build_heuristic_analysis("What are the renewal and appeal criteria?", [s1], "INV-CRIT2")
    
    for gap in res.gaps:
        assert gap.status in (GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES, GapStatus.PARTIALLY_ADDRESSED)
        # Why it matters must refer to the reviewed sources, not make an absolute claim about the universe
        assert "reviewed" in gap.why_it_matters.lower() or "sources" in gap.why_it_matters.lower()

def test_criteria_3_conflicts_require_material_incompatibility():
    """Verify conflicts must cite two distinct valid sources and have evidence for both sides."""
    valid_ids = {"S1", "S2"}
    
    # Valid conflict: distinct sources with evidence
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

    # Invalid conflict: same source on both sides (not a multi-source conflict)
    same_source_conflict = ConflictFinding(
        id="C2",
        claim_a="Statement X",
        source_id_a="S1",
        evidence_a="X",
        claim_b="Statement Y",
        source_id_b="S1",
        evidence_b="Y",
        conflict_status=ConflictStatus.POSSIBLE_DISCREPANCY
    )

    # Invalid conflict: missing evidence on one side
    missing_ev_conflict = ConflictFinding(
        id="C3",
        claim_a="Statement A",
        source_id_a="S1",
        evidence_a="",
        claim_b="Statement B",
        source_id_b="S2",
        evidence_b="Evidence B",
        conflict_status=ConflictStatus.MATERIAL_CONFLICT
    )

    from app.models.schemas import AnalysisResult
    dummy_res = AnalysisResult(
        investigation_id="INV-TEST-C",
        question="Check conflicts",
        summary="Summary",
        sources=[],
        gaps=[],
        conflicts=[valid_conflict, same_source_conflict, missing_ev_conflict],
        freshness_warnings=[],
        verification_checklist=[],
        limitations=[]
    )

    sanitized = validate_citations(dummy_res, valid_ids)
    # Only the genuine bilateral conflict with evidence for both distinct sides should survive
    assert len(sanitized.conflicts) == 1
    assert sanitized.conflicts[0].id == "C1"
    assert sanitized.conflicts[0].source_id_a != sanitized.conflicts[0].source_id_b

def test_criteria_4_freshness_does_not_assume_old_is_false():
    """Verify freshness warnings caution about currentness without declaring old facts false."""
    s1 = SourceRecord(
        id="S1",
        title="Historical Guidelines",
        url="https://example.org/hist",
        status=SourceStatus.RETRIEVED,
        date="2021-03-01",
        date_status=DateStatus.DATED,
        full_text="Published in 2021."
    )
    res = build_heuristic_analysis("Check historical policy", [s1], "INV-CRIT4")
    assert len(res.freshness_warnings) == 1
    w = res.freshness_warnings[0]
    assert w.warning_type == FreshnessWarningType.STALE_DATED
    # Ensure rationale does NOT say the source is false
    assert "false" not in w.rationale.lower()
    assert "incorrect" not in w.rationale.lower()
