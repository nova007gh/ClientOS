"""Maps scraping router — uses Overpass/Nominatim APIs for map-based business discovery."""
from __future__ import annotations

import json
import urllib.parse
from fastapi import APIRouter
from ..models import ScrapeRequest, BusinessResult, ScrapeResponse

router = APIRouter()

OVERPASS_ENDPOINTS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
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
    "hospital": [{"amenity": ["hospital", "clinic"]}],
    "healthcare": [{"healthcare": ["hospital", "clinic", "doctor", "dentist", "pharmacy", "optometrist", "physiotherapist"]}],
    "church": [{"amenity": ["place_of_worship"]}],
    "place_of_worship": [{"amenity": ["place_of_worship"]}],
    "bank": [{"amenity": ["bank", "atm"]}],
    "insurance": [{"office": ["insurance"]}],
    "insurance_agent": [{"office": ["insurance"]}],
    "construction": [{"craft": ["carpenter", "electrician", "plumber", "roofer", "painter", "mason"]}, {"office": ["architect", "engineer"]}],
    "plumber": [{"craft": ["plumber"]}],
    "electrician": [{"craft": ["electrician"]}],
    "carpenter": [{"craft": ["carpenter"]}],
    "cleaning": [{"office": ["cleaning"]}],
    "logistics": [{"office": ["logistics", "moving_company"]}],
    "transport": [{"office": ["transport", "logistics"]}],
    "travel": [{"tourism": ["travel_agent", "hotel", "guest_house"]}],
    "printing": [{"shop": ["printing"]}],
    "catering": [{"amenity": ["restaurant", "cafe", "fast_food"]}],
    "event": [{"office": ["event_manager", "event_agency"]}],
    "consulting": [{"office": ["consulting"]}],
    "tax": [{"office": ["tax_advisor", "accountant"]}],
    "notary": [{"office": ["notary"]}],
    "barber": [{"shop": ["hairdresser"]}],
    "hairdresser": [{"shop": ["hairdresser"]}],
    "nail": [{"shop": ["nail"]}],
    "tattoo": [{"shop": ["tattoo"]}],
    "pet": [{"shop": ["pet"]}, {"amenity": ["veterinary"]}],
    "veterinary": [{"amenity": ["veterinary"]}],
    "funeral": [{"shop": ["funeral_directors"]}],
    "parking": [{"amenity": ["parking"]}],
    "fuel": [{"shop": ["fuel"]}, {"amenity": ["fuel"]}],
    "electric": [{"shop": ["electrical", "electronics"]}],
    "furniture": [{"shop": ["furniture"]}],
    "jewelry": [{"shop": ["jewelry"]}],
    "shoes": [{"shop": ["shoes"]}],
    "clothes": [{"shop": ["clothes"]}],
    "grocery": [{"shop": ["supermarket", "convenience", "grocery"]}],
    "supermarket": [{"shop": ["supermarket"]}],
    "convenience": [{"shop": ["convenience"]}],
    "hardware": [{"shop": ["hardware", "doityourself"]}],
    "garden": [{"shop": ["garden_centre", "florist"]}],
    "optician": [{"shop": ["optician"]}, {"healthcare": ["optometrist"]}],
    "massage": [{"shop": ["massage"]}],
    "tobacco": [{"shop": ["tobacco"]}],
    "coffee": [{"amenity": ["cafe"]}, {"shop": ["coffee"]}],
    "bar": [{"amenity": ["bar", "pub", "biergarten"]}],
    "pub": [{"amenity": ["pub", "bar"]}],
    "bakery": [{"shop": ["bakery"]}],
    "butcher": [{"shop": ["butcher"]}],
    "florist": [{"shop": ["florist"]}],
    "photographer": [{"craft": ["photographer"]}, {"shop": ["photo"]}],
    "repair": [{"shop": ["car_repair", "computer_repair", "mobile_phone_repair", "shoe_repair"]}],
    "computer": [{"shop": ["computer"]}],
    "mobile": [{"shop": ["mobile_phone"]}],
    "software": [{"office": ["it", "software"]}],
    "it": [{"office": ["it", "software", "telecommunication"]}],
    "telecom": [{"office": ["telecommunication"]}],
    "advertising": [{"office": ["advertising_agency"]}],
    "design": [{"office": ["graphic_design", "design"]}],
    "estate_agent": [{"office": ["estate_agent"]}],
    "real estate": [{"office": ["estate_agent"]}],
    "property": [{"office": ["estate_agent"]}],
    "security": [{"office": ["security"]}],
    "cleaning_service": [{"office": ["cleaning"]}],
    "laundry": [{"shop": ["laundry", "dry_cleaning"]}],
    "dry_cleaning": [{"shop": ["dry_cleaning"]}],
    "driving_school": [{"amenity": ["driving_school"]}],
    "childcare": [{"amenity": ["childcare", "kindergarten"]}],
    "kindergarten": [{"amenity": ["kindergarten"]}],
    "library": [{"amenity": ["library"]}],
    "museum": [{"tourism": ["museum", "artwork", "gallery"]}],
    "gallery": [{"tourism": ["gallery", "museum"]}],
    "arts": [{"tourism": ["gallery", "museum", "artwork"]}],
    "music": [{"shop": ["music"]}],
    "sport": [{"leisure": ["fitness_centre", "sports_centre", "stadium", "pitch", "swimming_pool"]}],
    "swimming": [{"leisure": ["swimming_pool"]}],
    "beauty": [{"shop": ["hairdresser", "beauty", "nail"]}],
    "spa": [{"leisure": ["spa"]}],
    "vet": [{"amenity": ["veterinary"]}],
}


def match_tags(query: str) -> list[dict]:
    """Match a natural language query to OSM tag filters."""
    q_lower = query.lower()
    for keyword, tags in QUERY_TAG_MAP.items():
        if keyword in q_lower:
            return tags
    # Default: search for common business types
    return [{"amenity": None}, {"shop": None}]


def build_query(tags: list[dict], lat: float, lon: float, radius: int) -> str:
    """Build an Overpass QL query that fetches nodes with names."""
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
    """Discover businesses on a map using Overpass API (primary) + Nominatim (fallback)."""
    if req.lat is None or req.lon is None:
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

    import requests as _req
    import subprocess
    results: list[BusinessResult] = []
    seen = set()

    # 1. Try Overpass first — it has phone, email, website, social media tags
    # Use curl subprocess since requests gets 406 from Overpass servers
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            proc = subprocess.run(
                ["curl", "-s", "--max-time", "30", "--connect-timeout", "10",
                 "-X", "POST", "--data-urlencode", f"data={query}", endpoint],
                capture_output=True, text=True, timeout=35,
            )
            output = proc.stdout
            if not output or output.startswith("<!DOCTYPE") or output.startswith("<?xml"):
                continue

            try:
                data = json.loads(output)
            except json.JSONDecodeError:
                continue

            for el in data.get("elements", []):
                t = el.get("tags", {})
                name = t.get("name") or t.get("name:en") or t.get("brand")
                if not name:
                    continue

                lat_val = el.get("lat") or el.get("center", {}).get("lat")
                lon_val = el.get("lon") or el.get("center", {}).get("lon")
                if lat_val is None or lon_val is None:
                    continue

                dedupe = f"{name.lower()}|{lat_val:.4f}|{lon_val:.4f}"
                if dedupe in seen:
                    continue
                seen.add(dedupe)

                addr_parts = [t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:city"), t.get("addr:postcode")]
                address = " ".join(p for p in addr_parts if p) or None

                results.append(BusinessResult(
                    name=name,
                    category=t.get("amenity") or t.get("shop") or t.get("office") or t.get("tourism") or t.get("craft") or t.get("healthcare") or "business",
                    address=address,
                    phone=t.get("phone") or t.get("contact:phone") or t.get("contact:mobile"),
                    website=t.get("website") or t.get("contact:website") or t.get("url"),
                    email=t.get("email") or t.get("contact:email"),
                    lat=lat_val, lon=lon_val,
                    opening_hours=t.get("opening_hours"),
                    description=t.get("description") or t.get("description:en"),
                    source="overpass",
                    extra={
                        "fax": t.get("fax") or t.get("contact:fax"),
                        "mobile": t.get("contact:mobile"),
                        "facebook": t.get("contact:facebook"),
                        "twitter": t.get("contact:twitter"),
                        "instagram": t.get("contact:instagram"),
                        "linkedin": t.get("contact:linkedin"),
                        "youtube": t.get("contact:youtube"),
                        "wikidata": t.get("wikidata"),
                        "brand": t.get("brand"),
                        "operator": t.get("operator"),
                        "wheelchair": t.get("wheelchair"),
                        "internet_access": t.get("internet_access"),
                    },
                ))

            if results:
                break

        except Exception:
            continue

    # 2. If Overpass returned nothing, fall back to Nominatim
    if not results:
        try:
            search_q = f"{req.query} near {req.lat},{req.lon}"
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
                    name = item.get("display_name", "").split(",")[0]
                    if not name or name.lower() in seen:
                        continue
                    seen.add(name.lower())
                    results.append(BusinessResult(
                        name=name,
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

    return ScrapeResponse(results=results[:req.max_results or 50], total=len(results), query=req.query, location=req.location)


def build_bbox_query(tags: list[dict], south: float, west: float, north: float, east: float) -> str:
    """Build an Overpass QL query for a bounding box area."""
    filters = []
    for tag_group in tags:
        for key, values in tag_group.items():
            if values is None:
                filters.append(f'node["{key}"]["name"]({south},{west},{north},{east});')
            else:
                for v in values:
                    filters.append(f'node["{key}"="{v}"]["name"]({south},{west},{north},{east});')

    timeout = 60
    return f"[out:json][timeout:{timeout}];({''.join(filters)});out body 500;"


@router.post("/area", response_model=ScrapeResponse)
def search_area(req: ScrapeRequest):
    """Search for all businesses within a bounding box area (for map-drawn area search)."""
    if req.bbox_south is None or req.bbox_west is None or req.bbox_north is None or req.bbox_east is None:
        return ScrapeResponse(results=[], total=0, query=req.query, location=req.location)

    tags = match_tags(req.query)
    query = build_bbox_query(tags, req.bbox_south, req.bbox_west, req.bbox_north, req.bbox_east)

    import subprocess
    results: list[BusinessResult] = []
    seen = set()

    for endpoint in OVERPASS_ENDPOINTS:
        try:
            proc = subprocess.run(
                ["curl", "-s", "--max-time", "45", "--connect-timeout", "10",
                 "-X", "POST", "--data-urlencode", f"data={query}", endpoint],
                capture_output=True, text=True, timeout=50,
            )
            output = proc.stdout
            if not output or output.startswith("<!DOCTYPE") or output.startswith("<?xml"):
                continue

            try:
                data = json.loads(output)
            except json.JSONDecodeError:
                continue

            for el in data.get("elements", []):
                t = el.get("tags", {})
                name = t.get("name") or t.get("name:en") or t.get("brand")
                if not name:
                    continue

                lat_val = el.get("lat")
                lon_val = el.get("lon")
                if lat_val is None or lon_val is None:
                    continue

                dedupe = f"{name.lower()}|{lat_val:.4f}|{lon_val:.4f}"
                if dedupe in seen:
                    continue
                seen.add(dedupe)

                addr_parts = [t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:city"), t.get("addr:postcode")]
                address = " ".join(p for p in addr_parts if p) or None

                results.append(BusinessResult(
                    name=name,
                    category=t.get("amenity") or t.get("shop") or t.get("office") or t.get("tourism") or t.get("craft") or t.get("healthcare") or "business",
                    address=address,
                    phone=t.get("phone") or t.get("contact:phone") or t.get("contact:mobile"),
                    website=t.get("website") or t.get("contact:website") or t.get("url"),
                    email=t.get("email") or t.get("contact:email"),
                    lat=lat_val, lon=lon_val,
                    opening_hours=t.get("opening_hours"),
                    description=t.get("description") or t.get("description:en"),
                    source="overpass_area",
                    extra={
                        "fax": t.get("fax") or t.get("contact:fax"),
                        "facebook": t.get("contact:facebook"),
                        "twitter": t.get("contact:twitter"),
                        "instagram": t.get("contact:instagram"),
                        "linkedin": t.get("contact:linkedin"),
                        "brand": t.get("brand"),
                        "operator": t.get("operator"),
                    },
                ))

            if results:
                break

        except Exception:
            continue

    return ScrapeResponse(results=results[:req.max_results or 500], total=len(results), query=req.query, location=req.location)
