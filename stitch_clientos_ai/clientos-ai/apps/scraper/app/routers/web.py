from __future__ import annotations

"""Web scraping router — scrapes websites for business information."""
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


def extract_emails(text: str) -> list[str]:
    return list(set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)))


def extract_phones(text: str) -> list[str]:
    phones = re.findall(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}", text)
    return [p.strip() for p in phones if len(p.strip()) >= 7]


def extract_social_links(soup: BeautifulSoup, base_url: str) -> list[str]:
    social_patterns = [
        "facebook.com", "twitter.com", "x.com", "instagram.com",
        "linkedin.com", "youtube.com", "tiktok.com", "wa.me", "whatsapp.com",
    ]
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if any(p in href for p in social_patterns):
            if href.startswith("/"):
                href = base_url.rstrip("/") + href
            links.append(href)
    return list(set(links))[:10]


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(req: ScrapeRequest):
    """Scrape a specific website URL for business information."""
    results: list[BusinessResult] = []

    # If query looks like a URL, scrape it directly
    url = req.query if req.query.startswith("http") else None

    if not url:
        # Use Bing to find relevant websites (DuckDuckGo HTML returns 202 challenges)
        async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
            search_q = req.query.replace(" ", "+")
            if req.location:
                search_q += f"+{req.location.replace(' ', '+')}"
            bing_url = f"https://www.bing.com/search?q={search_q}+business"
            try:
                resp = await client.get(bing_url)
                soup = BeautifulSoup(resp.text, "lxml")
                result_links = []
                for li in soup.find_all("li", class_="b_algo"):
                    a = li.find("a", href=True)
                    cite = li.find("cite")
                    # Prefer cite text (actual URL) over Bing redirect href
                    href = cite.text.strip() if cite else (a["href"] if a else "")
                    if href.startswith("http"):
                        result_links.append(href)
                urls_to_scrape = result_links[: min(req.max_results or 10, 10)]
            except Exception:
                urls_to_scrape = []
    else:
        urls_to_scrape = [url]

    # Scrape each URL
    async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
        for target_url in urls_to_scrape:
            try:
                resp = await client.get(target_url)
                soup = BeautifulSoup(resp.text, "lxml")

                # Extract business name
                name = (
                    soup.find("meta", property="og:site_name")
                    or soup.find("title")
                )
                name = name.get("content") if hasattr(name, "get") and name else (name.text.strip() if name and hasattr(name, "text") else target_url)
                if not name:
                    name = target_url.split("//")[-1].split("/")[0]

                # Extract description
                desc_meta = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
                description = desc_meta.get("content") if desc_meta else None

                # Extract emails and phones from page text
                page_text = soup.get_text(separator=" ", strip=True)
                emails = extract_emails(page_text)
                phones = extract_phones(page_text)

                # Extract social links
                social = extract_social_links(soup, target_url)

                # Extract address from common patterns
                address = None
                addr_elem = (
                    soup.find(class_=re.compile(r"address|location|contact", re.I))
                    or soup.find("address")
                )
                if addr_elem:
                    address = addr_elem.get_text(strip=True)[:300]

                results.append(BusinessResult(
                    name=name[:200] if isinstance(name, str) else str(name)[:200],
                    website=target_url,
                    email=emails[0] if emails else None,
                    phone=phones[0] if phones else None,
                    address=address,
                    description=description[:500] if description else None,
                    social_links=social if social else None,
                    source="web",
                    extra={"all_emails": emails, "all_phones": phones} if (emails or phones) else None,
                ))
            except Exception:
                continue

    return ScrapeResponse(results=results, total=len(results), query=req.query, location=req.location)
