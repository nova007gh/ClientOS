from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ClientOS AI Service"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8002

    # LLM Providers
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    default_provider: str = "openai"
    default_model: str = "gpt-4o-mini"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # API
    api_base_url: str = "http://localhost:3001/api"

    model_config = {"env_file": ".env", "env_prefix": "AI_"}


settings = Settings()
