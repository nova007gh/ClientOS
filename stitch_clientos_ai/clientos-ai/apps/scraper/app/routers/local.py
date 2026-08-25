from __future__ import annotations

"""Local business scraping router — combines multiple sources for local business data."""
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter
from ..models import ScrapeRequest, BusinessResult, ScrapeResponse
from .maps import discover_on_map, match_tags, build_query, OVERPASS_ENDPOINTS

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


@router.post("/search", response_model=ScrapeResponse)
async def search_local(req: ScrapeRequest):
    """Comprehensive local business search combining maps + web sources."""
    all_results: list[BusinessResult] = []
    seen_names = set()

    # 1. Get map-based results from Overpass/Nominatim
    map_response = discover_on_map(req)
    for r in map_response.results:
        key = r.name.lower().strip()
        if key not in seen_names:
            seen_names.add(key)
            all_results.append(r)

    # 2. Search via Bing for local business listings (DuckDuckGo HTML returns 202 challenges)
    query = f"{req.query} {req.location or ''}".strip()
    async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
        try:
            bing_url = f"https://www.bing.com/search?q={query.replace(' ', '+')}+business"
            resp = await client.get(bing_url)
            soup = BeautifulSoup(resp.text, "lxml")

            for li in soup.find_all("li", class_="b_algo"):
                a = li.find("a", href=True)
                cite = li.find("cite")
                href = cite.text.strip() if cite else (a["href"] if a else "")
                if not href.startswith("http"):
                    continue

                title = a.get_text(strip=True)
                key = title.lower().strip()
                if key in seen_names:
                    continue
                seen_names.add(key)

                snippet_elem = li.find("p")
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else None

                all_results.append(BusinessResult(
                    name=title[:200],
                    website=href,
                    description=snippet[:300] if snippet else None,
                    source="web",
                ))

                if len(all_results) >= (req.max_results or 50):
                    break
        except Exception:
            pass

    return ScrapeResponse(
        results=all_results[: req.max_results or 50],
        total=len(all_results),
        query=req.query,
        location=req.location,
    )


@router.post("/deep", response_model=ScrapeResponse)
async def deep_search(req: ScrapeRequest):
    """Deep search: map results + website scraping for contact details."""
    # First get map results
    map_response = discover_on_map(req)
    results = map_response.results

    # Then scrape websites for each result that has a website
    async with httpx.AsyncClient(timeout=10, headers=HEADERS, follow_redirects=True) as client:
        for r in results[:20]:  # Limit to first 20 to avoid rate limits
            if not r.website:
                continue
            try:
                resp = await client.get(r.website)
                soup = BeautifulSoup(resp.text, "lxml")
                page_text = soup.get_text(separator=" ", strip=True)

                # Extract emails
                import re
                emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", page_text)
                if emails and not r.email:
                    r.email = emails[0]
                    if not r.extra:
                        r.extra = {}
                    r.extra["all_emails"] = list(set(emails))[:5]

                # Extract phones
                phones = re.findall(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}", page_text)
                valid_phones = [p.strip() for p in phones if len(p.strip()) >= 7]
                if valid_phones and not r.phone:
                    r.phone = valid_phones[0]

                # Extract social links
                social_patterns = [
                    "facebook.com", "twitter.com", "x.com", "instagram.com",
                    "linkedin.com", "youtube.com", "tiktok.com", "wa.me",
                ]
                social = []
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if any(p in href for p in social_patterns):
                        social.append(href)
                if social:
                    r.social_links = list(set(social))[:5]

                r.source = "deep"

            except Exception:
                continue

    return ScrapeResponse(
        results=results,
        total=len(results),
        query=req.query,
        location=req.location,
    )
