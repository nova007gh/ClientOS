# ClientOS AI Service — FastAPI LLM provider abstraction
# Build context is this directory:
#   docker build -t ghcr.io/<owner>/clientos-ai-service apps/ai-service

FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir .

ENV AI_HOST=0.0.0.0 \
    AI_PORT=8002

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
