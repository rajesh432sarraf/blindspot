from fastapi import APIRouter, HTTPException, Response
from app.models.schemas import HealthResponse, AnalyzeRequest, AnalysisResult
from app.core.config import settings
from app.services.analyzer import run_investigation
from app.services.pdf_generator import build_pdf_report

api_router = APIRouter(prefix="/api")

@api_router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="ok",
        service="blindspot",
        version="0.1.0",
        gemini_configured=bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "your_gemini_api_key_here")
    )

@api_router.post("/analyze", response_model=AnalysisResult)
def analyze_sources_endpoint(request: AnalyzeRequest):
    if not request.question or len(request.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="Research question must be at least 3 characters long.")
    if not request.urls or len(request.urls) == 0:
        raise HTTPException(status_code=400, detail="At least one source URL is required.")
    if len(request.urls) > settings.MAX_SOURCES:
        raise HTTPException(status_code=400, detail=f"Maximum allowed sources is {settings.MAX_SOURCES}.")

    return run_investigation(request)

@api_router.post("/export-pdf")
def export_pdf_endpoint(result: AnalysisResult):
    """Generate and return a publication-ready PDF audit report."""
    try:
        pdf_bytes = build_pdf_report(result)
        filename = f"blindspot-audit-{result.investigation_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
