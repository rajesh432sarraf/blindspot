import pytest
from app.models.schemas import (
    AnalysisResult,
    SourceRecord,
    SourceStatus,
    GapFinding,
    GapStatus,
    PriorityLevel,
    ConflictFinding,
    ConflictStatus,
    VerificationTask,
)
from app.services.pdf_generator import build_pdf_report
from app.api.router import export_pdf_endpoint

@pytest.fixture
def sample_analysis_result():
    return AnalysisResult(
        investigation_id="INV-A1B2C3D4",
        question="What are the scholarship criteria and renewal terms for the Gates Cambridge program?",
        summary=(
            "The Gates Cambridge Scholarship offers full funding for postgraduate study. "
            "Selection criteria focus on academic excellence, leadership capacity, and social commitment. "
            "However, renewal terms across multi-year doctorates are not fully covered in reviewed sources."
        ),
        sources=[
            SourceRecord(
                id="S1",
                title="Gates Cambridge Overview",
                url="https://www.gatescambridge.org/programme/the-scholarship/",
                status=SourceStatus.RETRIEVED,
                date="2026-09-14",
                full_text="Sample scholarship text content for testing." * 10,
            ),
            SourceRecord(
                id="S2",
                title="Cambridge University Funding Directory",
                url="https://www.cam.ac.uk/funding",
                status=SourceStatus.RETRIEVED,
                date="2026-08-01",
                full_text="University funding directory details." * 5,
            ),
        ],
        gaps=[
            GapFinding(
                id="G1",
                question="What specific criteria must be met to renew funding in year 2 and year 3?",
                status=GapStatus.NOT_FOUND_IN_REVIEWED_SOURCES,
                why_it_matters="Crucial for ongoing financial planning of doctoral students.",
                checked_source_ids=["S1", "S2"],
                priority=PriorityLevel.HIGH,
            )
        ],
        conflicts=[
            ConflictFinding(
                id="C1",
                claim_a="Stipend rate is 20,000 GBP per annum",
                source_id_a="S1",
                evidence_a="Stipend rate of 20,000 GBP per year is provided",
                claim_b="Stipend rate is 19,500 GBP per annum",
                source_id_b="S2",
                evidence_b="Stipend for doctoral scholars is 19,500 GBP",
                conflict_status=ConflictStatus.POSSIBLE_DISCREPANCY,
                context_note="Likely represents differing academic years.",
            )
        ],
        freshness_warnings=[],
        verification_checklist=[
            VerificationTask(
                id="V1",
                action="Check Student Registry handbook for current doctoral continuation requirements.",
                priority=PriorityLevel.HIGH,
                why_it_matters="Ensure renewal compliance.",
                suggested_source_type="Cambridge Student Registry Official Portal",
            )
        ],
        limitations=["Scope bounded by the 2 submitted URLs."],
        evidence_fully_audited=True,
    )

def test_build_pdf_report_generates_valid_pdf(sample_analysis_result):
    pdf_bytes = build_pdf_report(sample_analysis_result)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF-")

def test_export_pdf_endpoint_returns_response(sample_analysis_result):
    response = export_pdf_endpoint(sample_analysis_result)
    assert response.status_code == 200
    assert response.media_type == "application/pdf"
    assert "blindspot-audit-INV-A1B2C3D4.pdf" in response.headers["Content-Disposition"]
    assert response.body.startswith(b"%PDF-")
