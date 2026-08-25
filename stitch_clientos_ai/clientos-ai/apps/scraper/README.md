# ClientOS Scraper Service

A FastAPI microservice for scraping web, maps, social media, and local businesses.

## Endpoints

- `GET /health` — Health check
- `POST /api/web/scrape` — Scrape websites for business info
- `POST /api/maps/discover` — Discover businesses on a map (Overpass API)
- `POST /api/social/search` — Search for social media profiles
- `POST /api/local/search` — Combined local business search
- `POST /api/local/deep` — Deep search: map results + website scraping for contact details

## Local Development

```bash
cd apps/scraper
pip install -r requirements.txt
python server.py
```

Runs on http://localhost:8000

## API Usage

```bash
# Discover restaurants in Accra
curl -X POST http://localhost:8000/api/maps/discover \
  -H "Content-Type: application/json" \
  -d '{"query": "restaurants", "location": "Accra, Ghana", "max_results": 20}'

# Deep search with contact details
curl -X POST http://localhost:8000/api/local/deep \
  -H "Content-Type: application/json" \
  -d '{"query": "dental clinics", "lat": 5.6037, "lon": -0.187, "radius": 5000}'
```
