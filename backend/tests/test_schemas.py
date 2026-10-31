import pytest
from pydantic import ValidationError
from app.models.schemas import (
    AnalyzeRequest,
    SourceRecord,
    SourceStatus,
    DateStatus,
    GapFinding,
    GapStatus,
    PriorityLevel,
    ConflictFinding,
    ConflictStatus,
    FreshnessWarning,
    FreshnessWarningType,
    VerificationTask,
    AnalysisResult,
)

def test_analyze_request_validation():
    # Valid request
    req = AnalyzeRequest(
        question="What are the scholarship requirements?",
        urls=["https://example.org/scholarship", "https://example.org/rules"]
    )
    assert req.question == "What are the scholarship requirements?"
    assert len(req.urls) == 2

    # Invalid empty question
    with pytest.raises(ValidationError):
        AnalyzeRequest(question="a", urls=["https://example.org"])

    # Invalid empty urls
    with pytest.raises(ValidationError):
        AnalyzeRequest(question="Valid question here?", urls=[])

def test_analysis_result_schema():
    source1 = SourceRecord(
        id="S1",
        title="Official Portal",
        url="https://example.org/portal",
        status=SourceStatus.ANALYZED,
        date="2026-01-15",
        date_status=DateStatus.DATED,
        excerpt="Deadline is March 1."
    )

    gap1 = GapFinding(
        id="G1",
        question="What is the renewal GPA requirement?",
        status=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES,
        why_it_matters="Students need to know criteria for maintaining the award.",
        checked_source_ids=["S1"],
        priority=PriorityLevel.HIGH
    )

    conflict1 = ConflictFinding(
        id="C1",
        claim_a="Deadline is March 1",
        source_id_a="S1",
        evidence_a="Deadline is March 1.",
        claim_b="Applications close April 15",
        source_id_b="S2",
        evidence_b="Applications close April 15 annually.",
        conflict_status=ConflictStatus.POSSIBLE_DISCREPANCY,
        context_note="S1 might refer to 2026 cycle while S2 might refer to international applicants"
    )

    freshness1 = FreshnessWarning(
        id="F1",
        source_id="S1",
        warning_type=FreshnessWarningType.STALE_DATED,
        date_found="2023-05-10",
        rationale="Source appears to date from 2023 cycle"
    )

    task1 = VerificationTask(
        id="V1",
        action="Verify 2026 renewal GPA threshold with financial aid office",
        priority=PriorityLevel.HIGH,
        why_it_matters="Renewal rules were not found in reviewed sources",
        related_finding_ids=["G1"],
        suggested_source_type="Official Financial Aid Office Handbook"
    )

    res = AnalysisResult(
        investigation_id="inv-123",
        question="Scholarship eligibility details",
        summary="Sources discuss initial deadlines but omit renewal conditions.",
        sources=[source1],
        gaps=[gap1],
        conflicts=[conflict1],
        freshness_warnings=[freshness1],
        verification_checklist=[task1],
        limitations=["Only 1 source was successfully reviewed."],
        is_insufficient_evidence=False
    )

    assert res.investigation_id == "inv-123"
    assert len(res.sources) == 1
    assert res.gaps[0].status == GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES

