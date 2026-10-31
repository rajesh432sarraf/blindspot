from app.models.schemas import AnalyzeRequest, SourceStatus
from app.services.analyzer import run_investigation, process_sources
from app.services.fetcher import validate_url_security, SSRFSecurityError, fetch_url_content, FetchError

def test_failure_modes():
    print("=== SCENARIO 6.1: Invalid & Forbidden URLs ===")
    forbidden_urls = [
        "http://localhost:8000/api/health",
        "http://127.0.0.1/sensitive",
        "http://192.168.1.1/admin",
        "http://10.0.0.1/secret",
        "http://169.254.169.254/latest/meta-data/",
        "ftp://example.org/resource",
        "file:///C:/Windows/win.ini"
    ]
    for u in forbidden_urls:
        try:
            validate_url_security(u)
            assert False, f"URL {u} should have been blocked by SSRF protection!"
        except SSRFSecurityError as e:
            print(f"  [BLOCKED] {u} -> {e}")

    print("\n=== SCENARIO 6.2: Partial Source Failure ===")
    req_partial = AnalyzeRequest(
        question="What is the example domain policy?",
        urls=["https://example.org", "http://127.0.0.1:8000/blocked"]
    )
    res_partial = run_investigation(req_partial)
    assert len(res_partial.sources) == 2
    s1 = next(s for s in res_partial.sources if s.id == "S1")
    s2 = next(s for s in res_partial.sources if s.id == "S2")
    assert s1.status == SourceStatus.RETRIEVED
    assert s2.status == SourceStatus.FAILED
    assert "SSRF Security Violation" in s2.error_message
    print(f"  S1 status: {s1.status} (Title: {s1.title})")
    print(f"  S2 status: {s2.status} (Error: {s2.error_message})")
    # Verify findings do not cite S2
    for g in res_partial.gaps:
        assert "S2" not in g.checked_source_ids, f"Gap cited failed source S2: {g.checked_source_ids}"

    print("\n=== SCENARIO 6.3: All Sources Failed / Insufficient Evidence ===")
    req_all_fail = AnalyzeRequest(
        question="What are the secret intranet rules?",
        urls=["http://127.0.0.1:9999", "http://192.168.1.1:8080"]
    )
    res_all_fail = run_investigation(req_all_fail)
    assert res_all_fail.is_insufficient_evidence is True
    assert len(res_all_fail.gaps) == 0
    assert len(res_all_fail.conflicts) == 0
    assert "failed" in res_all_fail.summary.lower()
    print(f"  is_insufficient_evidence: {res_all_fail.is_insufficient_evidence}")
    print(f"  Summary: {res_all_fail.summary}")
    print(f"  Limitations: {res_all_fail.limitations}")

    print("\n=== SCENARIO 6.4: Graceful Degradation on LLM Error ===")
    from unittest.mock import patch
    with patch("app.services.analyzer.call_gemini_api", side_effect=RuntimeError("Simulated Gemini Quota Exceeded")):
        res_mock_error = run_investigation(req_partial)
        assert res_mock_error.investigation_id is not None
        assert len(res_mock_error.sources) == 2
        # Must have fallen back to heuristic analysis without throwing an unhandled exception
        assert any("Simulated Gemini Quota Exceeded" in lim for lim in res_mock_error.limitations)
        print("  Successfully handled LLM exception via fallback synthesis:")
        print(f"  Summary: {res_mock_error.summary}")
        print(f"  Limitations: {res_mock_error.limitations}")

    print("\nALL FAILURE MODE AND ERROR RECOVERY TESTS PASSED!")

if __name__ == "__main__":
    test_failure_modes()
