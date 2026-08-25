"""Maps scraping router — uses Overpass/Nominatim APIs for map-based business discovery."""
from __future__ import annotations

import json
import urllib.parse
from fastapi import APIRouter
from ..models import ScrapeRequest, BusinessResult, ScrapeResponse

router = APIRouter()

OVERPASS_ENDPOINTS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]

# Map natural language queries to OSM tags
QUERY_TAG_MAP = {
    "restaurant": [{"amenity": ["restaurant", "fast_food", "cafe", "bar", "pub"]}],
    "food": [{"amenity": ["restaurant", "fast_food", "cafe", "bar", "pub"]}],
    "hotel": [{"tourism": ["hotel", "guest_house", "hostel", "motel"]}],
    "dentist": [{"amenity": ["dentist"]}],
    "dental": [{"amenity": ["dentist"]}],
    "clinic": [{"amenity": ["clinic", "doctors", "hospital"]}],
    "medical": [{"amenity": ["clinic", "doctors", "hospital", "pharmacy"]}],
    "doctor": [{"amenity": ["doctors", "clinic"]}],
    "pharmacy": [{"amenity": ["pharmacy"]}],
    "lawyer": [{"office": ["lawyer", "notary"]}],
    "law": [{"office": ["lawyer", "notary"]}],
    "real estate": [{"office": ["estate_agent"]}],
    "salon": [{"shop": ["hairdresser", "beauty"]}],
    "beauty": [{"shop": ["hairdresser", "beauty", "nail"]}],
    "spa": [{"leisure": ["spa"]}],
    "gym": [{"leisure": ["fitness_centre", "sports_centre"]}],
    "fitness": [{"leisure": ["fitness_centre", "sports_centre"]}],
    "auto": [{"shop": ["car_repair", "car"]}],
    "car": [{"shop": ["car_repair", "car"]}],
    "shop": [{"shop": ["clothes", "shoes", "jewelry", "electronics", "furniture", "books", "gift", "sports"]}],
    "retail": [{"shop": ["clothes", "shoes", "jewelry", "electronics", "furniture", "books", "gift", "sports"]}],
    "accountant": [{"office": ["accountant"]}],
    "finance": [{"office": ["accountant", "financial_advisor"]}],
    "architect": [{"office": ["architect"]}],
    "marketing": [{"office": ["advertising_agency", "marketing"]}],
    "tech": [{"office": ["it", "software", "telecommunication"]}, {"shop": ["computer", "mobile_phone"]}],
    "school": [{"amenity": ["school", "college", "university"]}],
    "education": [{"amenity": ["school", "college", "university", "training", "language_school"]}],
    "vet": [{"amenity": ["veterinary"]}],
    "bakery": [{"shop": ["bakery"]}],
    "florist": [{"shop": ["florist"]}],
    "photography": [{"shop": ["photo"]}, {"craft": ["photographer"]}],
}


def match_tags(query: str) -> list[dict]:
    """Match a natural language query to OSM tag filters."""
    q_lower = query.lower()
    for keyword, tags in QUERY_TAG_MAP.items():
        if keyword in q_lower:
            return tags
    # Default: search for any named business
    return [{"shop": None}, {"amenity": None}, {"office": None}, {"tourism": None}]


def build_query(tags: list[dict], lat: float, lon: float, radius: int) -> str:
    """Build an Overpass QL query."""
    filters = []
    for tag_group in tags:
        for key, values in tag_group.items():
            if values is None:
                filters.append(f'node["{key}"]["name"](around:{radius},{lat},{lon});')
            else:
                for v in values:
                    filters.append(f'node["{key}"="{v}"]["name"](around:{radius},{lat},{lon});')

    timeout = 60 if radius >= 25000 else 40 if radius >= 10000 else 25
    return f"[out:json][timeout:{timeout}];({''.join(filters)});out body 300;"


@router.post("/discover", response_model=ScrapeResponse)
def discover_on_map(req: ScrapeRequest):
    """Discover businesses on a map using Overpass API."""
    if req.lat is None or req.lon is None:
        # Try geocoding the location
        if req.location:
            try:
                import requests as _req
                resp = _req.get(
                    f"https://nominatim.openstreetmap.org/search?format=json&q={req.location}&limit=1",
                    headers={"User-Agent": "ClientOS-Scraper/1.0"},
                    timeout=10,
                )
                data = resp.json()
                if data:
                    req.lat = float(data[0]["lat"])
                    req.lon = float(data[0]["lon"])
            except Exception:
                pass

    if req.lat is None or req.lon is None:
        return ScrapeResponse(results=[], total=0, query=req.query, location=req.location)

    tags = match_tags(req.query)
    query = build_query(tags, req.lat, req.lon, req.radius or 5000)

    # Use Nominatim (primary) + Overpass (fallback) for business discovery
    def _fetch_overpass(endpoint: str, query_str: str):
        """Synchronous Overpass fetch using requests."""
        import requests as _req
        try:
            resp = _req.post(
                endpoint,
                data={"data": query_str},
                timeout=20,
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Accept": "*/*",
                },
            )
            if resp.status_code != 200:
                return None
            ct = resp.headers.get("content-type", "")
            if "json" not in ct and not resp.text.strip().startswith("{"):
                return None
            return resp.json()
        except Exception:
            return None

    def _nominatim_search(search_query: str, lat: float, lon: float, radius: int, overpass_query: str = ""):
        """Search for businesses using Nominatim (more reliable than Overpass)."""
        import requests as _req
        results = []
        try:
            # Search with category + location
            search_q = f"{search_query} near {lat},{lon}"
            resp = _req.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": search_q,
                    "format": "json",
                    "limit": 50,
                    "addressdetails": 1,
                },
                headers={"User-Agent": "ClientOS-Scraper/1.0"},
                timeout=15,
            )
            if resp.status_code == 200:
                for item in resp.json():
                    results.append(BusinessResult(
                        name=item.get("display_name", "").split(",")[0],
                        category=item.get("class") or item.get("type") or "business",
                        address=item.get("display_name"),
                        lat=float(item["lat"]) if item.get("lat") else None,
                        lon=float(item["lon"]) if item.get("lon") else None,
                        source="nominatim",
                        extra={
                            "osm_id": item.get("osm_id"),
                            "osm_type": item.get("osm_type"),
                            "type": item.get("type"),
                            "class": item.get("class"),
                        },
                    ))
        except Exception:
            pass

        # Also try Overpass as a secondary source
        if not results:
            for endpoint in OVERPASS_ENDPOINTS:
                data = _fetch_overpass(endpoint, overpass_query)
                if data:
                    for el in data.get("elements", []):
                        t = el.get("tags", {})
                        name = t.get("name") or t.get("name:en") or t.get("brand")
                        if not name:
                            continue
                        lat_val = el.get("lat") or el.get("center", {}).get("lat")
                        lon_val = el.get("lon") or el.get("center", {}).get("lon")
                        if lat_val is None or lon_val is None:
                            continue
                        addr_parts = [t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:city"), t.get("addr:postcode")]
                        address = " ".join(p for p in addr_parts if p) or None
                        results.append(BusinessResult(
                            name=name,
                            category=t.get("amenity") or t.get("shop") or t.get("office") or t.get("tourism") or "business",
                            address=address,
                            phone=t.get("phone") or t.get("contact:phone"),
                            website=t.get("website") or t.get("contact:website"),
                            email=t.get("email") or t.get("contact:email"),
                            lat=lat_val, lon=lon_val,
                            opening_hours=t.get("opening_hours"),
                            description=t.get("description") or t.get("description:en"),
                            source="overpass",
                        ))
                    if results:
                        break

        return results

    results = _nominatim_search(req.query, req.lat, req.lon, req.radius or 5000, query)
    return ScrapeResponse(results=results[:req.max_results or 50], total=len(results), query=req.query, location=req.location)
