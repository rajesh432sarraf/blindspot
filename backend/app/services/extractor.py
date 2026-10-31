import re
import json
from typing import Optional, Tuple, List, Dict, Any
from bs4 import BeautifulSoup
from app.models.schemas import SourceRecord, SourceStatus, DateStatus
from app.core.config import settings

MODIFIED_META_KEYS = [
    ("property", "article:modified_time"),
    ("property", "og:updated_time"),
    ("name", "article:modified_time"),
    ("name", "last-modified"),
    ("name", "dateModified"),
    ("itemprop", "dateModified"),
]

PUBLISHED_META_KEYS = [
    ("property", "article:published_time"),
    ("property", "og:published_time"),
    ("name", "article:published_time"),
    ("name", "publication_date"),
    ("name", "date"),
    ("name", "pubdate"),
    ("name", "dc.date.issued"),
    ("name", "dc.date"),
    ("name", "parsely-pub-date"),
    ("itemprop", "datePublished"),
]

def clean_date_str(raw: str) -> str:
    """Normalizes raw date strings into clean YYYY-MM-DD or readable prefix."""
    raw = raw.strip()
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", raw)
    if match:
        return match.group(1)
    return raw[:25]

def extract_dates(soup: BeautifulSoup) -> Tuple[Optional[str], DateStatus, Optional[str]]:
    """
    Extracts published/updated dates strictly from verified metadata, schema.org JSON-LD, or <time> tags.
    Prioritizes last-modified timestamps over original publish dates when available.
    Never infers dates from copyright notices or current-year footers.
    Returns (date_str, date_status, provenance).
    """
    # 1. Check JSON-LD script tags (handles root objects, lists, and schema.org @graph)
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            if not script.string:
                continue
            data = json.loads(script.string)
            items: List[Dict[str, Any]] = []
            if isinstance(data, dict):
                if "@graph" in data and isinstance(data["@graph"], list):
                    items.extend([x for x in data["@graph"] if isinstance(x, dict)])
                items.append(data)
            elif isinstance(data, list):
                items.extend([x for x in data if isinstance(x, dict)])

            # Prioritize dateModified
            for item in items:
                date_val = item.get("dateModified")
                if date_val and isinstance(date_val, str) and len(date_val.strip()) >= 4 and any(c.isdigit() for c in date_val):
                    return clean_date_str(date_val), DateStatus.DATED, "json-ld:dateModified"

            # Check datePublished
            for item in items:
                date_val = item.get("datePublished")
                if date_val and isinstance(date_val, str) and len(date_val.strip()) >= 4 and any(c.isdigit() for c in date_val):
                    return clean_date_str(date_val), DateStatus.DATED, "json-ld:datePublished"
        except Exception:
            continue

    # 2. Check meta tags for modified timestamps first
    for attr, key in MODIFIED_META_KEYS:
        tag = soup.find("meta", attrs={attr: re.compile(rf"^{re.escape(key)}$", re.IGNORECASE)})
        if tag and tag.get("content"):
            content = tag["content"].strip()
            if len(content) >= 4 and any(c.isdigit() for c in content):
                return clean_date_str(content), DateStatus.DATED, f"meta:{key}"

    # 3. Check meta tags for published timestamps
    for attr, key in PUBLISHED_META_KEYS:
        tag = soup.find("meta", attrs={attr: re.compile(rf"^{re.escape(key)}$", re.IGNORECASE)})
        if tag and tag.get("content"):
            content = tag["content"].strip()
            if len(content) >= 4 and any(c.isdigit() for c in content):
                return clean_date_str(content), DateStatus.DATED, f"meta:{key}"

    # 4. Check semantic <time> elements with datetime attribute
    time_tag = soup.find("time", attrs={"datetime": True})
    if time_tag and time_tag.get("datetime"):
        dt = time_tag["datetime"].strip()
        if len(dt) >= 4 and any(c.isdigit() for c in dt):
            return clean_date_str(dt), DateStatus.DATED, "semantic:<time> tag"

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

    # 4. Remove unneeded tags: script, style, nav, footer, header, noscript, svg, form, dialog, template
    for unwanted in soup.find_all(["script", "style", "nav", "footer", "header", "noscript", "svg", "form", "aside", "iframe", "dialog", "template"]):
        unwanted.decompose()

    # Remove accessibility skip-links and jump-to anchors
    for skip in soup.find_all("a", href=re.compile(r"^#")):
        if any(term in skip.get_text().lower() for term in ["skip to", "jump to", "skip navigation"]):
            skip.decompose()

    # 5. Extract readable text preserving paragraph/section structure
    text_content = soup.get_text(separator="\n", strip=True)
    # Collapse multiple inline spaces, then collapse excessive blank lines into clean double-newlines
    text_content = re.sub(r"[ \t]+", " ", text_content)
    text_content = re.sub(r"\n\s*\n+", "\n\n", text_content).strip()

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
