from app.api.router import get_health
from app.models.schemas import HealthResponse

def test_health_check_endpoint():
    result = get_health()
    assert isinstance(result, HealthResponse)
    assert result.status == "ok"
    assert result.service == "digital-dark-spot"
    assert result.version == "0.1.0"
    assert isinstance(result.gemini_configured, bool)
