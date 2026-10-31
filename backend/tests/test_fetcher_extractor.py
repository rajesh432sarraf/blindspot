import pytest
from bs4 import BeautifulSoup
from app.services.fetcher import validate_url_security, SSRFSecurityError
from app.services.extractor import extract_dates, extract_source_record
from app.models.schemas import DateStatus, SourceStatus

def test_ssrf_blocking_localhost():
    with pytest.raises(SSRFSecurityError):
        validate_url_security("http://localhost/admin")

    with pytest.raises(SSRFSecurityError):
        validate_url_security("http://127.0.0.1:8000/api")

def test_ssrf_blocking_private_ip():
    with pytest.raises(SSRFSecurityError):
        validate_url_security("http://192.168.1.1/router")

    with pytest.raises(SSRFSecurityError):
        validate_url_security("http://10.0.0.1/internal")

def test_ssrf_blocking_cloud_metadata():
    with pytest.raises(SSRFSecurityError):
        validate_url_security("http://169.254.169.254/latest/meta-data/")

def test_ssrf_blocking_unsupported_protocol():
    with pytest.raises(SSRFSecurityError):
        validate_url_security("ftp://example.org/file.txt")

    with pytest.raises(SSRFSecurityError):
        validate_url_security("file:///etc/passwd")

def test_extract_dates_meta():
    html = """
    <html>
        <head>
            <meta property="article:published_time" content="2026-03-15T10:00:00Z" />
        </head>
        <body><p>Article body</p></body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    date_val, date_status, provenance = extract_dates(soup)
    assert date_status == DateStatus.DATED
    assert "2026-03-15" in date_val
    assert provenance == "meta:article:published_time"

def test_extract_dates_undated():
    html = """
    <html>
        <head><title>About Us</title></head>
        <body><p>Some content with Copyright 2026 in footer.</p></body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    date_val, date_status, provenance = extract_dates(soup)
    assert date_status == DateStatus.UNDATED
    assert date_val is None

def test_extract_source_record_clean_text():
    raw_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>University Scholarship Guidelines</title>
        <meta property="article:published_time" content="2026-02-01" />
        <script>var x = 123; function test(){}</script>
        <style>body { color: red; }</style>
    </head>
    <body>
        <nav><a href="/">Home</a></nav>
        <h1>Gates Cambridge Guidelines</h1>
        <p>Applicants must apply through the central university admissions portal.</p>
        <p>Deadlines depend on citizenship: US citizens must apply by October 2026.</p>
        <footer>© 2026 Cambridge Trust</footer>
    </body>
    </html>
    """
    record = extract_source_record("S1", raw_html, "https://example.org/guidelines", "https://example.org/guidelines")
    assert record.id == "S1"
    assert record.title == "University Scholarship Guidelines"
    assert record.status == SourceStatus.RETRIEVED
    assert record.date_status == DateStatus.DATED
    assert "2026-02-01" in record.date
    assert "Applicants must apply" in record.full_text
    # Ensure scripts and nav are stripped
    assert "var x = 123" not in record.full_text
    assert "Home" not in record.full_text
