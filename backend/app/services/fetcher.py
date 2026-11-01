import ipaddress
import socket
from urllib.parse import urlparse, urljoin
import httpx
from typing import Tuple, Optional
from app.core.config import settings

class SSRFSecurityError(Exception):
    """Raised when a URL resolves to a private, loopback, or forbidden IP address."""
    pass

class FetchError(Exception):
    """Raised when fetching a URL fails due to network, size, timeout, or HTTP error."""
    pass

FORBIDDEN_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "169.254.169.254",
    "instance-data",
}

def validate_url_security(url_str: str) -> Tuple[str, str]:
    """
    Validates protocol, host, and resolves DNS to ensure the destination IP
    is public and not private/loopback/link-local/cloud metadata.
    Returns (normalized_url, hostname).
    """
    try:
        parsed = urlparse(url_str.strip())
    except Exception as e:
        raise SSRFSecurityError(f"Malformed URL: {e}")

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        raise SSRFSecurityError(f"Unsupported protocol '{scheme}'. Only http and https are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityError("URL must include a valid hostname.")

    hostname_lower = hostname.lower()
    if hostname_lower in FORBIDDEN_HOSTNAMES:
        raise SSRFSecurityError(f"Access to hostname '{hostname}' is blocked for security reasons.")

    # Check if the hostname itself is an IP literal
    try:
        ip = ipaddress.ip_address(hostname_lower)
        _check_ip_safety(ip)
        return url_str, hostname
    except ValueError:
        # Not an IP literal, resolve via DNS
        pass

    # Resolve all A/AAAA records
    try:
        addr_infos = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as e:
        raise FetchError(f"DNS resolution failed for '{hostname}': {e}")
    except Exception as e:
        raise FetchError(f"DNS lookup error for '{hostname}': {e}")

    if not addr_infos:
        raise FetchError(f"No IP addresses resolved for '{hostname}'.")

    for family, _, _, _, sockaddr in addr_infos:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
            _check_ip_safety(ip)
        except SSRFSecurityError:
            raise
        except Exception as e:
            raise SSRFSecurityError(f"Invalid resolved IP '{ip_str}' for host '{hostname}': {e}")

    return url_str, hostname

def _check_ip_safety(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    if ip.is_loopback:
        raise SSRFSecurityError(f"Blocked loopback IP address: {ip}")
    if ip.is_private:
        raise SSRFSecurityError(f"Blocked private IP address: {ip}")
    if ip.is_link_local:
        raise SSRFSecurityError(f"Blocked link-local / cloud metadata IP address: {ip}")
    if ip.is_reserved:
        raise SSRFSecurityError(f"Blocked reserved IP address: {ip}")
    if ip.is_multicast:
        raise SSRFSecurityError(f"Blocked multicast IP address: {ip}")
    if ip.is_unspecified:
        raise SSRFSecurityError(f"Blocked unspecified IP address: {ip}")
    # Extra check for cloud metadata
    if str(ip) == "169.254.169.254":
        raise SSRFSecurityError("Blocked cloud metadata endpoint.")

def fetch_url_content(url_str: str, max_redirects: int = 4) -> Tuple[str, str, int]:
    """
    Safely fetches the content of a public URL with SSRF protection,
    redirect validation, byte limits, and timeouts.
    Returns (html_content, final_url, status_code).
    """
    current_url, _ = validate_url_security(url_str)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }

    redirect_count = 0
    client_timeout = httpx.Timeout(settings.REQUEST_TIMEOUT_SECONDS, connect=5.0)

    with httpx.Client(timeout=client_timeout, follow_redirects=False) as client:
        while redirect_count <= max_redirects:
            try:
                response = client.get(current_url, headers=headers)
            except httpx.TimeoutException:
                raise FetchError(f"Request timed out after {settings.REQUEST_TIMEOUT_SECONDS}s.")
            except httpx.RequestError as e:
                raise FetchError(f"Network request error: {e}")

            # Check for redirect status codes
            if response.status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("location")
                if not location:
                    raise FetchError("Redirect response received without Location header.")
                
                # Resolve relative redirect RFC-compliantly
                location = urljoin(current_url, location)

                # Revalidate destination for SSRF safety
                current_url, _ = validate_url_security(location)
                redirect_count += 1
                continue

            # Check status code
            if response.status_code >= 400:
                raise FetchError(f"HTTP {response.status_code}: {response.reason_phrase or 'Request failed'}")

            # Validate Content-Type
            content_type = response.headers.get("content-type", "").lower()
            if content_type and not any(allowed in content_type for allowed in ["text/html", "text/plain", "application/xhtml+xml", "text/xml"]):
                raise FetchError(f"Unsupported content type '{content_type}'. Only HTML or plain text is accepted.")

            # Validate Content-Length if present
            content_length = response.headers.get("content-length")
            if content_length:
                try:
                    if int(content_length) > settings.MAX_CONTENT_BYTES:
                        raise FetchError(f"Page size ({content_length} bytes) exceeds limit of {settings.MAX_CONTENT_BYTES} bytes.")
                except ValueError:
                    pass

            # Enforce body size limit
            body_bytes = response.content
            if len(body_bytes) > settings.MAX_CONTENT_BYTES:
                raise FetchError(f"Downloaded content ({len(body_bytes)} bytes) exceeds limit of {settings.MAX_CONTENT_BYTES} bytes.")

            try:
                text_content = response.text
            except Exception:
                text_content = body_bytes.decode("utf-8", errors="replace")

            return text_content, current_url, response.status_code

        raise FetchError(f"Exceeded maximum redirect limit ({max_redirects}).")

