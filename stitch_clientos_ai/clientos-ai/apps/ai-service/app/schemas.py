from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class CompletionRequest(BaseModel):
    messages: list[ChatMessage]
    provider: str | None = None
    model: str | None = None
    temperature: float = 0.7
    max_tokens: int = 2000


class LeadScoreRequest(BaseModel):
    company_name: str
    industry: str | None = None
    website: str | None = None
    city: str | None = None
    country: str | None = None
    rating: float | None = None
    review_count: int | None = None
    has_website: bool = False
    services: list[str] = []


class EmailDraftRequest(BaseModel):
    prospect_name: str
    prospect_industry: str | None = None
    prospect_website: str | None = None
    service_name: str
    service_description: str | None = None
    tone: str = "professional"
    language: str = "english"


class AuditRequest(BaseModel):
    url: str
    industry: str | None = None
    services: list[str] = []
