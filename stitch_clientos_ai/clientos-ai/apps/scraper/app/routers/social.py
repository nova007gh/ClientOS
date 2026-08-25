from __future__ import annotations

"""Social media scraping router — finds social profiles for businesses."""
import re
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter
from ..models import ScrapeRequest, BusinessResult, ScrapeResponse

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SOCIAL_PLATFORMS = {
    "facebook.com": "Facebook",
    "twitter.com": "Twitter",
    "x.com": "Twitter",
    "instagram.com": "Instagram",
    "linkedin.com": "LinkedIn",
    "youtube.com": "YouTube",
    "tiktok.com": "TikTok",
    "wa.me": "WhatsApp",
    "whatsapp.com": "WhatsApp",
    "pinterest.com": "Pinterest",
}


def identify_platform(url: str) -> str:
    """Identify social media platform from URL, matching domain boundaries."""
    import re
    for domain, platform in SOCIAL_PLATFORMS.items():
        # Match domain with word boundary to avoid x.com matching xnxx.com
        if re.search(r'(^|[/.])' + re.escape(domain), url):
            return platform
    return "Unknown"


@router.post("/search", response_model=ScrapeResponse)
async def search_social(req: ScrapeRequest):
    """Search for business social media profiles."""
    import asyncio
    query = req.query
    if req.location:
        query = f"{req.query} {req.location}"

    # Search via Bing for social profiles (concurrent per-platform searches)
    platforms = ["facebook", "instagram", "linkedin"]
    search_q = query.replace(" ", "+")

    async def _search_platform(client, label):
        """Search Bing for a single platform and return matching results."""
        platform_results = []
        try:
            bing_url = f"https://www.bing.com/search?q={search_q}+{label}"
            resp = await client.get(bing_url)
            soup = BeautifulSoup(resp.text, "lxml")

            for li in soup.find_all("li", class_="b_algo"):
                a = li.find("a", href=True)
                cite = li.find("cite")
                href = cite.text.strip() if cite else (a["href"] if a else "")
                if not href.startswith("http"):
                    continue

                identified = identify_platform(href)
                if identified == "Unknown":
                    continue

                title = a.get_text(strip=True) if a else href
                snippet_elem = li.find("p")
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else None

                platform_results.append(BusinessResult(
                    name=title[:200],
                    website=href,
                    description=snippet[:300] if snippet else None,
                    source="social",
                    extra={"platform": identified},
                ))
        except Exception:
            pass
        return platform_results

    seen_urls = set()
    results = []

    async with httpx.AsyncClient(timeout=10, headers=HEADERS, follow_redirects=True) as client:
        all_platform_results = await asyncio.gather(
            *[_search_platform(client, label) for label in platforms]
        )

    for platform_results in all_platform_results:
        for r in platform_results:
            if r.website not in seen_urls:
                seen_urls.add(r.website)
                results.append(r)

    return ScrapeResponse(
        results=results[: req.max_results or 30],
        total=len(results),
        query=req.query,
        location=req.location,
    )
