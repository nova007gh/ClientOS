"""CCTV camera discovery router — finds public cameras near a location."""
from __future__ import annotations

import httpx
from fastapi import APIRouter
from ..models import ScrapeRequest, BusinessResult, ScrapeResponse

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
}

# Public CCTV API endpoints
CCTV_SOURCES = {
    "caltrans": "https://cwwp2.ddot.dc.gov/api/getcameras",
    "tfl": "https://api.tfl.gov.uk/Place/Type/JamCam",
}


@router.post("/nearby", response_model=ScrapeResponse)
async def nearby_cameras(req: ScrapeRequest):
    """Find public CCTV cameras near a location using OpenStreetMap Overpass."""
    results: list[BusinessResult] = []

    if not req.lat or not req.lon:
        return ScrapeResponse(results=[], total=0, query=req.query, location=req.location)

    import requests as _req
    import json

    # Search for surveillance cameras via Overpass
    overpass_query = f"""
    [out:json][timeout:15];
    (
      node["surveillance:type"="camera"](around:{req.radius or 10000},{req.lat},{req.lon});
      node["man_made"="surveillance"](around:{req.radius or 10000},{req.lat},{req.lon});
    );
    out body 50;
    """

    try:
        resp = _req.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": overpass_query},
            headers=HEADERS,
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            for el in data.get("elements", []):
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("operator") or "CCTV Camera"
                results.append(BusinessResult(
                    name=name,
                    category="cctv",
                    lat=el.get("lat"),
                    lon=el.get("lon"),
                    source="cctv",
                    extra={
                        "surveillance": tags.get("surveillance:type", "camera"),
                        "operator": tags.get("operator"),
                        "camera:type": tags.get("camera:type"),
                        "camera:mount": tags.get("camera:mount"),
                    },
                ))
    except Exception:
        pass

    return ScrapeResponse(
        results=results[: req.max_results or 30],
        total=len(results),
        query=req.query,
        location=req.location,
    )
