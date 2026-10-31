import re
import json
from typing import Optional, Tuple
from bs4 import BeautifulSoup
from app.models.schemas import SourceRecord, SourceStatus, DateStatus
from app.core.config import settings

DATE_META_KEYS = [
    ("property", "article:published_time"),
    ("property", "article:modified_time"),
    ("name", "publication_date"),
    ("name", "date"),
    ("name", "pubdate"),
    ("name", "dc.date.issued"),
    ("name", "dc.date"),
    ("itemprop", "datePublished"),
    ("itemprop", "dateModified"),
]

def extract_dates(soup: BeautifulSoup) -> Tuple[Optional[str], DateStatus, Optional[str]]:
    """
    Extracts published/updated dates strictly from verified metadata or <time> tags.
    Never infers dates from copyright notices or current-year footers.
    Returns (date_str, date_status, provenance).
    """
    # 1. Check meta tags
    for attr, key in DATE_META_KEYS:
        tag = soup.find("meta", attrs={attr: re.compile(rf"^{re.escape(key)}$", re.IGNORECASE)})
        if tag and tag.get("content"):
            content = tag["content"].strip()
            if len(content) >= 4 and any(c.isdigit() for c in content):
                return content[:25], DateStatus.DATED, f"meta:{key}"

    # 2. Check JSON-LD script tags
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            if not script.string:
                continue
            data = json.loads(script.string)
            if isinstance(data, dict):
                date_val = data.get("datePublished") or data.get("dateModified")
                if date_val and isinstance(date_val, str) and len(date_val) >= 4:
                    return date_val.strip()[:25], DateStatus.DATED, "json-ld:schema.org"
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        date_val = item.get("datePublished") or item.get("dateModified")
                        if date_val and isinstance(date_val, str) and len(date_val) >= 4:
                            return date_val.strip()[:25], DateStatus.DATED, "json-ld:schema.org"
        except Exception:
            continue

    # 3. Check semantic <time> elements with datetime attribute
    time_tag = soup.find("time", attrs={"datetime": True})
    if time_tag and time_tag.get("datetime"):
        dt = time_tag["datetime"].strip()
        if len(dt) >= 4 and any(c.isdigit() for c in dt):
            return dt[:25], DateStatus.DATED, "semantic:<time> tag"

    # No reliable date found
    return None, DateStatus.UNDATED, None

def extract_source_record(source_id: str, raw_html: str, target_url: str, final_url: str) -> SourceRecord:
    """
    Parses raw HTML into a structured SourceRecord with title, clean readable text,
    verifiable dates, and status.
    """
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
    except Exception as e:
        return SourceRecord(
            id=source_id,
            title="HTML Parsing Error",
            url=final_url or target_url,
            status=SourceStatus.FAILED,
            date=None,
            date_status=DateStatus.UNKNOWN,
            error_message=f"Failed to parse HTML document: {e}"
        )

    # 1. Canonical URL
    canonical_tag = soup.find("link", rel=re.compile(r"canonical", re.I))
    effective_url = final_url or target_url
    if canonical_tag and canonical_tag.get("href"):
        cand_url = canonical_tag["href"].strip()
        if cand_url.startswith("http://") or cand_url.startswith("https://"):
            effective_url = cand_url

    # 2. Extract Title
    title = ""
    # Try <meta property="og:title">
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    if not title and soup.title and soup.title.string:
        title = soup.title.string.strip()
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)
    if not title:
        title = effective_url

    # 3. Extract dates strictly
    date_val, date_status, provenance = extract_dates(soup)

    # 4. Remove unneeded tags: script, style, nav, footer, header, noscript, svg, form
    for unwanted in soup.find_all(["script", "style", "nav", "footer", "header", "noscript", "svg", "form", "aside", "iframe"]):
        unwanted.decompose()

    # 5. Extract readable text
    text_content = soup.get_text(separator=" ", strip=True)
    # Collapse multiple whitespaces
    text_content = re.sub(r"\s+", " ", text_content).strip()

    if not text_content or len(text_content) < 40:
        return SourceRecord(
            id=source_id,
            title=title,
            url=effective_url,
            status=SourceStatus.FAILED,
            date=date_val,
            date_status=date_status,
            date_provenance=provenance,
            error_message="Insufficient readable text extracted from source page (may require JavaScript or login)."
        )

    is_truncated = len(text_content) > settings.MAX_TEXT_PER_SOURCE
    cleaned_text = text_content[:settings.MAX_TEXT_PER_SOURCE]
    excerpt = text_content[:280] + ("..." if len(text_content) > 280 else "")

    status = SourceStatus.PARTIAL if is_truncated else SourceStatus.RETRIEVED

    return SourceRecord(
        id=source_id,
        title=title,
        url=effective_url,
        status=status,
        date=date_val,
        date_status=date_status,
        date_provenance=provenance,
        excerpt=excerpt,
        full_text=cleaned_text,
        error_message=None
    )

