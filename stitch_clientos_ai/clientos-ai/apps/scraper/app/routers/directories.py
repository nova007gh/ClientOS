"""Business directory scraping router — Yellow Pages, Yelp, and other directories."""
from __future__ import annotations

import re
import json
import time
import urllib.parse
from fastapi import APIRouter
from bs4 import BeautifulSoup
from ..models import ScrapeRequest, BusinessResult, ScrapeResponse

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

SKIP_DOMAINS = [
    "wikipedia.org", "dictionary.cambridge.org", "merriam-webster.com",
    "youtube.com", "facebook.com", "instagram.com", "twitter.com", "x.com",
    "linkedin.com", "amazon.com", "pinterest.com", "reddit.com",
    "tiktok.com", "en.wiktionary.org", "medium.com", "quora.com", "tumblr.com",
    # Restaurant/business directories and aggregators
    "tripadvisor.com", "tripadvisor.co", "opentable.com", "yelp.com",
    "yellowpages.com", "foursquare.com", "zomato.com", "ubereats.com",
    "doordash.com", "grubhub.com", "seamless.com", "postmates.com",
    "deliveroo.com", "justeat.com", "foodpanda.com", "restaurantguru.com",
    "restaurantdirectory.com", "diningcity.com", "resy.com", "sevenrooms.com",
    # Business listing directories (Africa)
    "businesslist.com.ng", "businesslist.co.ke", "businesslist.co.za",
    "vymaps.com", "tuugo.co.za", "tuugo.ng", "cybo.com",
    "hotfrog.com", "hotfrog.co.za", "hotfrog.ng",
    # Review/booking sites
    "ranked.ng", "ranked.com", "reviewmeta.com", "trustpilot.com",
    # Map/travel sites
    "mapquest.com", "superpages.com", "manta.com", "here.com", "moovit.com",
    # Job sites
    "indeed.com", "glassdoor.com",
    # Other aggregators
    "angi.com", "hometriangle.com", "thumbtack.com",
    "healthgrades.com", "zocdoc.com", "dentalplans.com",
    "empower.com", "routard.com", "dasoertliche.de",
    "soundcloud.com", "flickr.com", "imgur.com",
    "moneysavingexpert.com", "onlinemictest.com", "oilprice.com",
    "evendo.com", "booking.com", "expedia.com", "hotels.com",
    "airbnb.com", "lonelyplanet.com", "foursquare.com",
    "zomato.com", "swiggy.com", "eatmunch.com",
    # Informational/medical/education sites
    "webmd.com", "britannica.com", "careerexplorer.com",
    "clevelandclinic.org", "nhs.uk", "mayoclinic.org",
    "medlineplus.gov", "healthline.com", "verywellhealth.com",
    "wikipedia.org", "wiktionary.org",
    # News sites
    "news.google.com", "bbc.com", "cnn.com", "reuters.com",
    # Travel/booking
    "tui.co.uk", "tui.com", "trip.com", "kayak.com",
    # Corporate/informational
    "jacobs.com", "google.com", "microsoft.com", "apple.com",
    # TV/media sites that Bing returns for name searches
    "dr.dk", "daserste.de", "ard.de", "zdf.de", "rtl.de",
    "thenationonlineng.net", "pulse.ng", "vanguardngr.com",
    "jacob-gmbh.de", "jacobs.com",
]


def _extract_emails(text: str) -> list[str]:
    """Extract email addresses from text."""
    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    # Filter out common false positives
    blocked = {"example.com", "sentry.io", "wixpress.com", "godaddy.com"}
    return [e for e in emails if e.split("@")[-1].lower() not in blocked]


def _extract_phones(text: str) -> list[str]:
    """Extract phone numbers from text."""
    # Match US/intl phone patterns — must have at least 7 digits and typical phone separators
    # Avoid matching dates (YYYY-MM-DD) and IDs
    phones = re.findall(
        r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,9}(?:\s?(?:ext|x)\.?\s?\d{1,5})?",
        text,
    )
    valid = []
    for p in phones:
        digits = re.sub(r"\D", "", p)
        # Must have 7-15 digits (valid phone range)
        if 7 <= len(digits) <= 15:
            # Skip if it looks like a date (4-digit year at start)
            if re.match(r"^\d{4}[-./]", p.strip()):
                continue
            valid.append(p.strip())
    return valid


def _extract_social_links(soup: BeautifulSoup) -> list[str]:
    """Extract social media links from a BeautifulSoup page."""
    social_patterns = [
        "facebook.com/", "twitter.com/", "x.com/",
        "instagram.com/", "linkedin.com/", "youtube.com/",
        "tiktok.com/", "wa.me/", "pinterest.com/",
    ]
    social = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if any(p in href.lower() for p in social_patterns):
            social.append(href)
    return list(set(social))[:8]


def _scrape_google_businesses(query: str, location: str, max_results: int = 50) -> list[BusinessResult]:
    """Search Google for businesses and extract contact info from results.
    Note: Google now requires JS rendering, so this may return limited results."""
    import requests

    results: list[BusinessResult] = []
    seen = set()

    search_q = f"{query} {location} business contact".strip()
    url = f"https://www.google.com/search?q={urllib.parse.quote(search_q)}&num=20&hl=en"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code != 200:
            return results

        soup = BeautifulSoup(resp.text, "lxml")

        # Google now uses various selectors — try multiple approaches
        # Approach 1: Traditional div.g
        result_divs = soup.find_all("div", class_="g")
        # Approach 2: New structure — div with data-ved attribute containing h3
        if not result_divs:
            result_divs = [div for div in soup.find_all("div") if div.find("h3") and div.find("a", href=True)]

        for div in result_divs:
            name_elem = div.find("h3")
            if not name_elem:
                continue
            name = name_elem.get_text(strip=True)
            if not name or name.lower() in seen:
                continue
            seen.add(name.lower())

            # Extract URL — Google wraps URLs in /url?q= redirects
            link = div.find("a", href=True)
            website = None
            if link and link["href"]:
                href = link["href"]
                if href.startswith("/url?q="):
                    website = href.split("/url?q=")[1].split("&")[0]
                elif href.startswith("http") and "google.com" not in href:
                    website = href

            # Extract snippet
            snippet_elem = div.find("span", class_=re.compile("aCOpRe|st", re.I)) or div.find("div", class_=re.compile("IsZvec|VwiC3b", re.I))
            snippet = snippet_elem.get_text(strip=True) if snippet_elem else None

            # Try to extract phone from snippet
            phone = None
            if snippet:
                phones = _extract_phones(snippet)
                if phones:
                    phone = phones[0]

            # Try to extract email from snippet
            email = None
            if snippet:
                emails = _extract_emails(snippet)
                if emails:
                    email = emails[0]

            # Skip non-business results
            if website and any(d in website for d in SKIP_DOMAINS):
                continue

            results.append(BusinessResult(
                name=name[:200],
                category=query,
                website=website,
                phone=phone,
                email=email,
                description=snippet[:300] if snippet else None,
                source="google",
                extra={"directory": "google", "search_query": search_q},
            ))

            if len(results) >= max_results:
                break

    except Exception:
        pass

    return results[:max_results]


def _scrape_bing_businesses(query: str, location: str, max_results: int = 50) -> list[BusinessResult]:
    """Search Bing for businesses and extract contact info."""
    import requests

    results: list[BusinessResult] = []
    seen = set()

    search_q = f"{query} {location} business contact phone".strip()
    url = f"https://www.bing.com/search?q={urllib.parse.quote(search_q)}&count=30"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code != 200:
            return results

        soup = BeautifulSoup(resp.text, "lxml")

        for li in soup.find_all("li", class_="b_algo"):
            a = li.find("a", href=True)
            if not a:
                continue

            title = a.get_text(strip=True)
            if not title or title.lower() in seen:
                continue
            seen.add(title.lower())

            # Bing wraps URLs in redirect links — extract the real URL from cite element
            cite = li.find("cite")
            website = None
            if cite:
                cite_text = cite.get_text(strip=True)
                # Cite text uses › as path separator, convert to /
                cite_text = cite_text.replace(" › ", "/").replace("›", "/")
                if cite_text.startswith("http"):
                    website = cite_text
                else:
                    website = "https://" + cite_text
            elif a["href"].startswith("http") and "bing.com" not in a["href"]:
                website = a["href"]

            snippet_elem = li.find("p")
            snippet = snippet_elem.get_text(strip=True) if snippet_elem else None

            # Extract phone from snippet
            phone = None
            if snippet:
                phones = _extract_phones(snippet)
                if phones:
                    phone = phones[0]

            # Extract email from snippet
            email = None
            if snippet:
                emails = _extract_emails(snippet)
                if emails:
                    email = emails[0]

            # Clean title — Bing sometimes prepends the display URL
            if title and "›" in title:
                parts = title.split("https://")
                if len(parts) > 1:
                    title = parts[-1].split("›")[-1].strip()
                else:
                    title = title.split("›")[-1].strip()
            if title and title.startswith("http"):
                title = title.split("›")[-1].strip() if "›" in title else title.split("/")[-1]

            # Skip non-business results — directories, aggregators, social media, etc.
            if website and any(d in website for d in SKIP_DOMAINS):
                continue

            # Also skip if the title looks like a domain name (no spaces, contains TLD)
            if title and "." in title and " " not in title:
                continue

            # Skip generic/informational titles (single word, or looks like a URL path)
            generic_titles = {"dentist", "dentistry", "restaurant", "restaurants", "hotel", "hotels",
                              "what-is-a-dentist", "find-a-dentist", "articles", "home", "about"}
            if title.lower().strip() in generic_titles:
                continue

            results.append(BusinessResult(
                name=title[:200],
                category=query,
                website=website,
                phone=phone,
                email=email,
                description=snippet[:300] if snippet else None,
                source="bing",
                extra={"directory": "bing"},
            ))

            if len(results) >= max_results:
                break

    except Exception:
        pass

    return results[:max_results]


def _scrape_website_contacts(url: str, timeout: int = 10) -> dict:
    """Scrape a business website for contact information."""
    import requests

    contacts = {"emails": [], "phones": [], "social_links": []}

    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            return contacts

        soup = BeautifulSoup(resp.text, "lxml")
        page_text = soup.get_text(separator=" ", strip=True)

        contacts["emails"] = _extract_emails(page_text)[:5]
        contacts["phones"] = _extract_phones(page_text)[:5]
        contacts["social_links"] = _extract_social_links(soup)

        # Also check meta tags for contact info
        meta_email = soup.find("meta", attrs={"name": re.compile("email", re.I)})
        if meta_email and meta_email.get("content"):
            contacts["emails"].append(meta_email["content"])

        # Check for mailto links
        for a in soup.find_all("a", href=re.compile(r"^mailto:", re.I)):
            email = a["href"].replace("mailto:", "").split("?")[0].strip()
            if email and "@" in email and email not in contacts["emails"]:
                contacts["emails"].append(email)

        # Check for tel: links
        for a in soup.find_all("a", href=re.compile(r"^tel:", re.I)):
            phone = a["href"].replace("tel:", "").strip()
            if phone and phone not in contacts["phones"]:
                contacts["phones"].append(phone)

        contacts["emails"] = list(set(contacts["emails"]))[:5]
        contacts["phones"] = list(set(contacts["phones"]))[:5]

    except Exception:
        pass

    return contacts


@router.post("/yellowpages", response_model=ScrapeResponse)
def search_yellowpages(req: ScrapeRequest):
    """Search Google for businesses with contact details (YP replacement)."""
    location = req.location or "United States"
    results = _scrape_google_businesses(req.query, location, req.max_results or 50)
    return ScrapeResponse(results=results, total=len(results), query=req.query, location=location)


@router.post("/yelp", response_model=ScrapeResponse)
def search_yelp(req: ScrapeRequest):
    """Search Bing for businesses with contact details (Yelp replacement)."""
    location = req.location or "United States"
    results = _scrape_bing_businesses(req.query, location, req.max_results or 30)
    return ScrapeResponse(results=results, total=len(results), query=req.query, location=location)


@router.post("/all", response_model=ScrapeResponse)
def search_all_directories(req: ScrapeRequest):
    """Search Overpass + Bing + Google and merge results with contact enrichment.
    Overpass is primary (has structured contact data). Bing/Google used for enrichment."""
    location = req.location or "United States"
    max_results = req.max_results or 50

    all_results: list[BusinessResult] = []
    seen = set()

    # 1. Geocode location if lat/lon not provided, then use Overpass as primary source
    if req.lat is None or req.lon is None:
        if req.location:
            try:
                import requests as _req
                resp = _req.get(
                    f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(req.location)}&limit=1",
                    headers={"User-Agent": "ClientOS-Scraper/1.0"},
                    timeout=10,
                )
                data = resp.json()
                if data:
                    req.lat = float(data[0]["lat"])
                    req.lon = float(data[0]["lon"])
            except Exception:
                pass

    if req.lat is not None and req.lon is not None:
        try:
            from .maps import discover_on_map
            map_resp = discover_on_map(req)
            for r in map_resp.results:
                key = r.name.lower().strip()
                if key not in seen:
                    seen.add(key)
                    all_results.append(r)
        except Exception:
            pass

    # 2. Bing search (for additional coverage and websites)
    for r in _scrape_bing_businesses(req.query, location, max_results):
        key = r.name.lower().strip()
        if key not in seen:
            seen.add(key)
            all_results.append(r)

    # 3. Google search (may return limited results due to JS rendering)
    for r in _scrape_google_businesses(req.query, location, max_results):
        key = r.name.lower().strip()
        if key not in seen:
            seen.add(key)
            all_results.append(r)

    # Note: Enrichment via Bing search for unknown websites is unreliable
    # (often finds irrelevant sites like bbc.co.uk, nytimes.com for business names)
    # Users can use the dedicated /enrich endpoint for targeted enrichment

    return ScrapeResponse(
        results=all_results[:max_results],
        total=len(all_results),
        query=req.query,
        location=location,
    )


@router.post("/enrich", response_model=ScrapeResponse)
def enrich_with_contacts(req: ScrapeRequest):
    """Take existing results and enrich them by scraping their websites for contact info."""
    # First get base results from maps
    from .maps import discover_on_map
    base = discover_on_map(req)

    results = base.results[:20]  # Limit for performance

    for r in results:
        if not r.website:
            continue
        contacts = _scrape_website_contacts(r.website)
        if contacts["emails"] and not r.email:
            r.email = contacts["emails"][0]
            if not r.extra:
                r.extra = {}
            r.extra["all_emails"] = contacts["emails"]
        if contacts["phones"] and not r.phone:
            r.phone = contacts["phones"][0]
            if not r.extra:
                r.extra = {}
            r.extra["all_phones"] = contacts["phones"]
        if contacts["social_links"]:
            r.social_links = contacts["social_links"]
        r.source = "enriched"

    return ScrapeResponse(
        results=results,
        total=len(results),
        query=req.query,
        location=req.location,
    )
