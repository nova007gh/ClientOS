from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from app.config import settings


@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    usage: dict[str, int]


class LLMProvider(ABC):
    @abstractmethod
    async def complete(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any,
    ) -> LLMResponse:
        ...

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        ...


class OpenAIProvider(LLMProvider):
    def __init__(self) -> None:
        from openai import AsyncOpenAI

        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def complete(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any,
    ) -> LLMResponse:
        response = await self.client.chat.completions.create(
            model=model or settings.default_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        return LLMResponse(
            content=response.choices[0].message.content or "",
            model=response.model,
            provider="openai",
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            },
        )

    async def embed(self, text: str) -> list[float]:
        response = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding


class AnthropicProvider(LLMProvider):
    def __init__(self) -> None:
        from anthropic import AsyncAnthropic

        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def complete(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any,
    ) -> LLMResponse:
        system_msg = ""
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg += msg["content"] + "\n"
            else:
                user_messages.append(msg)

        response = await self.client.messages.create(
            model=model or "claude-3-5-sonnet-20241022",
            system=system_msg.strip(),
            messages=user_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return LLMResponse(
            content=response.content[0].text,
            model=response.model,
            provider="anthropic",
            usage={
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            },
        )

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError("Anthropic does not provide embeddings")


_providers: dict[str, LLMProvider] = {}


def get_provider(name: str | None = None) -> LLMProvider:
    provider_name = name or settings.default_provider

    if provider_name not in _providers:
        if provider_name == "openai":
            _providers[provider_name] = OpenAIProvider()
        elif provider_name == "anthropic":
            _providers[provider_name] = AnthropicProvider()
        else:
            raise ValueError(f"Unknown provider: {provider_name}")

    return _providers[provider_name]
