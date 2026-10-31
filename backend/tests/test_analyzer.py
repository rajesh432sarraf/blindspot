from app.services.analyzer import build_heuristic_analysis, validate_citations, process_sources
from app.models.schemas import SourceRecord, SourceStatus, DateStatus, ConflictFinding, ConflictStatus, PriorityLevel, AnalysisResult

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
    # Should identify S1 as undated and S2 as stale-dated
    assert len(res.freshness_warnings) == 2
    # Should identify renewal or fee gap
    assert any("renewal" in g.question.lower() or "fee" in g.question.lower() for g in res.gaps)
    # Verification checklist generated
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
    # Bad conflict referencing S99 must be removed
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

