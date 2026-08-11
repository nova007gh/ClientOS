import json
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.providers import get_provider
from app.schemas import (
    AuditRequest,
    CompletionRequest,
    EmailDraftRequest,
    LeadScoreRequest,
)
from app.prompts import (
    AUDIT_SYSTEM,
    AUDIT_USER,
    EMAIL_DRAFT_SYSTEM,
    EMAIL_DRAFT_USER,
    LEAD_SCORING_SYSTEM,
    LEAD_SCORING_USER,
)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}


@app.post("/v1/completion")
async def completion(req: CompletionRequest) -> dict[str, Any]:
    provider = get_provider(req.provider)
    response = await provider.complete(
        messages=[m.model_dump() for m in req.messages],
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
    )
    return {
        "content": response.content,
        "model": response.model,
        "provider": response.provider,
        "usage": response.usage,
    }


@app.post("/v1/lead-score")
async def lead_score(req: LeadScoreRequest) -> dict[str, Any]:
    provider = get_provider()
    user_prompt = LEAD_SCORING_USER.format(
        company_name=req.company_name,
        industry=req.industry or "Unknown",
        website=req.website or "None",
        city=req.city or "Unknown",
        country=req.country or "Unknown",
        rating=req.rating or "N/A",
        review_count=req.review_count or 0,
        has_website=req.has_website,
        services=", ".join(req.services) if req.services else "General digital services",
    )

    response = await provider.complete(
        messages=[
            {"role": "system", "content": LEAD_SCORING_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    try:
        result = json.loads(response.content)
    except json.JSONDecodeError:
        result = {
            "score": 50,
            "reasoning": response.content,
            "recommendations": [],
            "priority": "medium",
        }

    return {**result, "usage": response.usage}


@app.post("/v1/email-draft")
async def email_draft(req: EmailDraftRequest) -> dict[str, Any]:
    provider = get_provider()
    user_prompt = EMAIL_DRAFT_USER.format(
        prospect_name=req.prospect_name,
        prospect_industry=req.prospect_industry or "Unknown",
        prospect_website=req.prospect_website or "None",
        service_name=req.service_name,
        service_description=req.service_description or "",
        tone=req.tone,
        language=req.language,
    )

    response = await provider.complete(
        messages=[
            {"role": "system", "content": EMAIL_DRAFT_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=500,
    )

    return {
        "email_body": response.content,
        "usage": response.usage,
    }


@app.post("/v1/audit")
async def audit(req: AuditRequest) -> dict[str, Any]:
    provider = get_provider()
    user_prompt = AUDIT_USER.format(
        url=req.url,
        industry=req.industry or "Unknown",
        services=", ".join(req.services) if req.services else "General digital services",
    )

    response = await provider.complete(
        messages=[
            {"role": "system", "content": AUDIT_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=3000,
    )

    try:
        result = json.loads(response.content)
    except json.JSONDecodeError:
        result = {
            "overall_score": 50,
            "findings": [],
            "summary": response.content,
            "opportunities": [],
        }

    return {**result, "usage": response.usage}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
