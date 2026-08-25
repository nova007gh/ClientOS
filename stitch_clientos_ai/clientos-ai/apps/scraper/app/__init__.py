from __future__ import annotations

"""
ClientOS Scraper Service
A FastAPI microservice for scraping web, maps, social media, and local businesses.
"""
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from .routers import web, maps, social, local

app = FastAPI(
    title="ClientOS Scraper API",
    description="Scraping service for web, maps, social media, and local businesses",
    version="1.0.0",
)

# CORS
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str


@app.get("/health")
async def health():
    return HealthResponse(status="ok", service="clientos-scraper")


# Include routers
app.include_router(web.router, prefix="/api/web", tags=["web"])
app.include_router(maps.router, prefix="/api/maps", tags=["maps"])
app.include_router(social.router, prefix="/api/social", tags=["social"])
app.include_router(local.router, prefix="/api/local", tags=["local"])
