from __future__ import annotations

"""Shared models and types for the scraper service."""
from pydantic import BaseModel, Field
from typing import Optional


class ScrapeRequest(BaseModel):
    query: str = Field(..., description="Natural language search query")
    location: Optional[str] = Field(None, description="Location to search in")
    lat: Optional[float] = Field(None, description="Latitude")
    lon: Optional[float] = Field(None, description="Longitude")
    radius: Optional[int] = Field(5000, description="Search radius in meters")
    max_results: Optional[int] = Field(50, description="Maximum results to return")


class BusinessResult(BaseModel):
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    opening_hours: Optional[str] = None
    social_links: Optional[list[str]] = None
    description: Optional[str] = None
    source: Optional[str] = None
    extra: Optional[dict] = None


class ScrapeResponse(BaseModel):
    results: list[BusinessResult]
    total: int
    query: str
    location: Optional[str] = None
