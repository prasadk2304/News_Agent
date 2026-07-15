# Smart News Tracker — FastAPI Backend Build Prompt
## Paste this entire prompt into a new Claude chat

---

## CONTEXT

I am building a **Smart News Tracker** — a FastAPI backend that accepts a user's
search query (topic, keywords, news type), fetches real articles using Exa and
Firecrawl MCPs, runs NLP analysis on them, stores everything in SQLite, and
exposes clean REST endpoints for a frontend to consume.

I have already connected:
- **Exa MCP** (`web_search_exa`, `web_fetch_exa`) — semantic web search + full
  article content fetching
- **Firecrawl MCP** — deep scraping of specific URLs with JS rendering support

---

## TECH STACK — use exactly these, no alternatives

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
pydantic-settings==2.3.0
sqlalchemy==2.0.30          # sync, not async — keep it simple
aiosqlite==0.20.0
httpx==0.27.0               # for calling Exa + Firecrawl REST APIs
python-dotenv==1.0.1
textblob==0.18.0            # sentiment analysis
spacy==3.7.4                # NER — use en_core_web_sm model
sumy==0.11.0                # extractive summarization
scikit-learn==1.5.0         # TF-IDF keyword extraction
pandas==2.2.2               # analytics queries
python-multipart==0.0.9     # form data support
fastapi-cors                # CORS for frontend
loguru==0.7.2               # logging
apscheduler==3.10.4         # background crawl jobs
```

---

## PROJECT STRUCTURE — generate every file

```
news_tracker/
├── requirements.txt
├── .env.example
├── main.py                      ← FastAPI app entry point
│
├── config/
│   └── settings.py              ← pydantic BaseSettings
│
├── database/
│   ├── __init__.py
│   ├── connection.py            ← SQLAlchemy engine + session
│   └── models.py                ← all ORM models
│
├── services/
│   ├── __init__.py
│   ├── exa_service.py           ← Exa API calls
│   ├── firecrawl_service.py     ← Firecrawl API calls
│   ├── nlp_service.py           ← sentiment, NER, keywords, summary
│   └── crawler_service.py       ← orchestrates exa + firecrawl + nlp
│
├── api/
│   ├── __init__.py
│   ├── schemas.py               ← Pydantic request/response models
│   └── routers/
│       ├── __init__.py
│       ├── search.py            ← POST /search — main search endpoint
│       ├── articles.py          ← GET /articles, GET /articles/{id}
│       ├── analytics.py         ← GET /analytics/stats, trends, etc.
│       └── reports.py           ← GET /reports/generate
│
└── utils/
    ├── __init__.py
    └── helpers.py               ← time formatting, text cleaning utils
```

---

## FILE SPECIFICATIONS — implement every function completely

### `config/settings.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart News Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./news_tracker.db"

    # Exa API
    EXA_API_KEY: str
    EXA_BASE_URL: str = "https://api.exa.ai"

    # Firecrawl API
    FIRECRAWL_API_KEY: str
    FIRECRAWL_BASE_URL: str = "https://api.firecrawl.dev"

    # NLP
    SPACY_MODEL: str = "en_core_web_sm"

    # Crawl limits
    MAX_RESULTS_PER_SEARCH: int = 15
    MAX_FULL_FETCH_PER_SEARCH: int = 10
    REQUEST_TIMEOUT: int = 30

    # Categories
    NEWS_CATEGORIES: list[str] = [
        "Technology", "AI & Machine Learning", "Business & Finance",
        "Science", "Health & Medicine", "Politics & World Affairs",
        "Sports", "Entertainment", "Environment", "Cybersecurity", "Other"
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

---

### `database/models.py`

Define these SQLAlchemy models:

**Article**:
- `id` — Integer primary key autoincrement
- `title` — String(500) not null
- `url` — String(2000) unique not null, indexed
- `source` — String(200) — domain extracted from URL
- `author` — String(300) nullable
- `published_at` — DateTime nullable
- `scraped_at` — DateTime default utcnow, indexed
- `content` — Text nullable — full article text
- `summary` — Text nullable — 3-sentence extractive summary
- `category` — String(100) indexed
- `sentiment_score` — Float nullable — range -1.0 to 1.0
- `sentiment_label` — String(20) nullable — "positive"/"negative"/"neutral"
- `keywords` — String(500) nullable — comma-separated top keywords
- `entities_json` — Text nullable — JSON string of {persons, orgs, places}
- `search_query` — String(500) indexed — what query found this article
- `news_type` — String(100) indexed — e.g. "technology", "breaking", "analysis"
- `word_count` — Integer nullable
- `fetch_source` — String(20) default "exa" — "exa" or "firecrawl"

**SearchHistory**:
- `id` — Integer primary key
- `query` — String(500) not null
- `news_type` — String(100)
- `results_count` — Integer default 0
- `searched_at` — DateTime default utcnow, indexed
- `status` — String(20) default "pending" — "pending"/"completed"/"failed"
- `error_message` — Text nullable

**Report**:
- `id` — Integer primary key
- `title` — String(300)
- `content_markdown` — Text — full report in markdown
- `query` — String(500)
- `news_type` — String(100)
- `articles_count` — Integer
- `generated_at` — DateTime default utcnow
- `date_range_start` — DateTime nullable
- `date_range_end` — DateTime nullable

Include `to_dict()` method on all models returning clean serializable dicts.
Include `__repr__` on all models.

---

### `database/connection.py`

- Create SQLAlchemy engine from `settings.DATABASE_URL`
- `SessionLocal` = sessionmaker
- `Base` = declarative_base()
- `get_db()` — generator dependency that yields session and closes it
- `create_tables()` — calls `Base.metadata.create_all(engine)`
- On startup, call `create_tables()` and run:
  ```python
  import nltk
  nltk.download('punkt', quiet=True)
  nltk.download('punkt_tab', quiet=True)
  nltk.download('stopwords', quiet=True)
  ```

---

### `services/exa_service.py`

**Class `ExaService`**:

```
EXA_SEARCH_URL = "https://api.exa.ai/search"
EXA_CONTENTS_URL = "https://api.exa.ai/contents"
```

**`async search_news(query: str, news_type: str, num_results: int = 15) -> list[dict]`**:
- Build semantic query: combine query + news_type context
  e.g. if news_type="breaking": query = f"breaking news {query} latest today"
  if news_type="analysis": query = f"in-depth analysis {query} expert opinion"
  if news_type="technology": query = f"technology news {query}"
  default: query as-is
- POST to `https://api.exa.ai/search` with headers:
  `{"x-api-key": settings.EXA_API_KEY, "Content-Type": "application/json"}`
- Body:
  ```json
  {
    "query": "<built_query>",
    "numResults": num_results,
    "type": "auto",
    "contents": {
      "text": {"maxCharacters": 3000},
      "highlights": {"numSentences": 3, "highlightsPerUrl": 2}
    }
  }
  ```
- Parse response `results` array, each into dict:
  `{title, url, published_date, author, text, highlights, score}`
- Return list of dicts, handle httpx errors with loguru logging

**`async fetch_full_content(urls: list[str]) -> dict[str, str]`**:
- POST to `https://api.exa.ai/contents`
- Body: `{"ids": urls, "text": {"maxCharacters": 8000}}`
- Return dict of `url → full_text`

**`async search_and_fetch(query: str, news_type: str, num_results: int = 10) -> list[dict]`**:
- Call `search_news()` to get results
- Take top `settings.MAX_FULL_FETCH_PER_SEARCH` URLs
- Call `fetch_full_content()` on those URLs
- Merge full content back into search results
- Return enriched list

---

### `services/firecrawl_service.py`

**Class `FirecrawlService`**:

**`async scrape_url(url: str) -> dict`**:
- POST to `https://api.firecrawl.dev/v1/scrape`
- Headers: `{"Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}"}`
- Body:
  ```json
  {
    "url": "<url>",
    "formats": ["markdown", "metadata"],
    "onlyMainContent": true,
    "timeout": 30000
  }
  ```
- Return `{content: markdown_text, title, description, url, published_date}`
- Handle errors gracefully, return empty dict on failure

**`async scrape_multiple(urls: list[str]) -> list[dict]`**:
- Call `scrape_url()` concurrently using `asyncio.gather()` with semaphore(3)
- Return list of results, skip failed ones

**`async crawl_site(url: str, limit: int = 5) -> list[dict]`**:
- POST to `https://api.firecrawl.dev/v1/crawl`
- Used for crawling a whole news site section
- Poll status URL until complete (max 60s)
- Return list of scraped pages

---

### `services/nlp_service.py`

**Class `NLPService`**:

Load on `__init__`:
- `self.nlp = spacy.load("en_core_web_sm")`
- `self.sia = SentimentIntensityAnalyzer()` from vaderSentiment

**`get_sentiment(text: str) -> dict`**:
- Run VADER on first 1000 chars of text
- Return `{score: compound, label: "positive"/"negative"/"neutral", positive: pos, negative: neg, neutral: neu}`
- Label logic: score > 0.05 → "positive", < -0.05 → "negative", else "neutral"

**`extract_entities(text: str) -> dict`**:
- Run spaCy NER on first 1500 chars
- Return:
  ```python
  {
    "persons": list of unique PERSON entity strings,
    "organizations": list of unique ORG entity strings,
    "locations": list of unique GPE+LOC entity strings,
    "dates": list of DATE entity strings
  }
  ```

**`extract_keywords(text: str, top_n: int = 8) -> list[str]`**:
- TF-IDF on single document using sklearn `TfidfVectorizer`
- `stop_words='english'`, `max_features=50`, `ngram_range=(1,2)`
- Return top_n terms by TF-IDF score
- Fallback: if text too short, split and return most frequent non-stopwords

**`summarize(text: str, sentences: int = 3) -> str`**:
- Use sumy `LsaSummarizer` with `PlaintextParser`
- Return top `sentences` sentences joined
- Fallback: return first 3 sentences from `sent_tokenize(text)`

**`classify_category(title: str, content: str) -> str`**:
- Keyword matching on title + first 200 chars of content (lowercase)
- Rules:
  - "Technology": ["software", "app", "code", "github", "startup", "api", "cloud"]
  - "AI & Machine Learning": ["ai", "artificial intelligence", "machine learning", "llm", "gpt", "neural", "deep learning", "model"]
  - "Business & Finance": ["market", "stock", "economy", "revenue", "investment", "startup", "funding", "ipo", "acquisition"]
  - "Science": ["research", "study", "scientists", "discovery", "nasa", "space", "quantum", "biology"]
  - "Health & Medicine": ["health", "medical", "hospital", "vaccine", "drug", "treatment", "disease", "clinical"]
  - "Politics & World Affairs": ["government", "president", "election", "congress", "policy", "diplomat", "minister", "senate"]
  - "Cybersecurity": ["hack", "breach", "malware", "ransomware", "vulnerability", "security", "phishing", "cyber"]
  - "Environment": ["climate", "carbon", "renewable", "emission", "environment", "pollution", "solar", "wind energy"]
  - "Sports": ["football", "basketball", "soccer", "cricket", "olympic", "championship", "athlete", "match", "score"]
  - "Entertainment": ["movie", "music", "celebrity", "streaming", "netflix", "spotify", "film", "award"]
- Return first matching category, default "Other"

**`process_article(article: dict) -> dict`**:
- Takes raw article dict with `{title, url, content, ...}`
- Runs all NLP functions on content
- Returns article dict merged with:
  `{summary, sentiment_score, sentiment_label, keywords: comma-joined str, entities_json: json.dumps(entities), category, word_count}`

---

### `services/crawler_service.py`

**Class `CrawlerService`**:

Dependencies injected: `ExaService`, `FirecrawlService`, `NLPService`, DB session

**`async run_search(query: str, news_type: str, num_results: int = 10, use_firecrawl: bool = False) -> SearchResult`**:

Full pipeline:
1. Create `SearchHistory` record in DB with status="pending"
2. Call `exa_service.search_and_fetch(query, news_type, num_results)`
3. If `use_firecrawl=True` for any failed/short Exa results:
   - Pass those URLs to `firecrawl_service.scrape_multiple()`
   - Merge firecrawl content into results
4. For each article result:
   a. Check DB: `SELECT id FROM articles WHERE url = ?` — skip if exists
   b. Run `nlp_service.process_article(article)`
   c. Extract domain from URL as `source`
   d. Create `Article` ORM object and insert
5. Update `SearchHistory` record: status="completed", results_count=N
6. Return `SearchResult` dataclass:
   ```python
   @dataclass
   class SearchResult:
       search_id: int
       query: str
       news_type: str
       articles_found: int
       articles_new: int
       articles: list[dict]
       duration_seconds: float
   ```

**`async get_analytics(days: int = 7) -> dict`**:
- Query DB for articles in last N days
- Return:
  ```python
  {
    total_articles: int,
    by_category: {category: count},
    by_source: {source: count},
    by_date: {date_str: count},
    avg_sentiment: float,
    sentiment_distribution: {positive: N, negative: N, neutral: N},
    top_keywords: [{"keyword": str, "count": int}],  # top 20
    top_entities: {persons: [], orgs: [], places: []},
    recent_searches: [SearchHistory.to_dict()],
  }
  ```

---

### `api/schemas.py`

Define all Pydantic v2 models:

**Request models**:
```python
class SearchRequest(BaseModel):
    query: str                          # e.g. "artificial intelligence"
    news_type: str = "general"          # "general","breaking","analysis","technology","science","business"
    num_results: int = 10               # 1-50
    use_firecrawl: bool = False         # enable deep scraping fallback
    
    @field_validator('num_results')
    def clamp_results(cls, v): return max(1, min(50, v))

class ReportRequest(BaseModel):
    query: str
    news_type: str = "general"
    days_back: int = 1                  # look back N days in DB
    include_summary: bool = True
    include_entities: bool = True
    include_sentiment: bool = True
```

**Response models**:
```python
class ArticleResponse(BaseModel):
    id: int
    title: str
    url: str
    source: str
    author: str | None
    published_at: str | None
    scraped_at: str
    summary: str | None
    category: str | None
    sentiment_score: float | None
    sentiment_label: str | None
    keywords: list[str]                 # split from comma-separated
    entities: dict                      # parsed from entities_json
    word_count: int | None
    fetch_source: str
    search_query: str | None
    news_type: str | None

class SearchResponse(BaseModel):
    search_id: int
    query: str
    news_type: str
    articles_found: int
    articles_new: int
    duration_seconds: float
    articles: list[ArticleResponse]

class ArticleListResponse(BaseModel):
    total: int
    page: int
    limit: int
    articles: list[ArticleResponse]

class StatsResponse(BaseModel):
    total_articles: int
    by_category: dict[str, int]
    by_source: dict[str, int]
    by_date: dict[str, int]
    avg_sentiment: float
    sentiment_distribution: dict[str, int]
    top_keywords: list[dict]
    top_entities: dict
    recent_searches: list[dict]

class ReportResponse(BaseModel):
    title: str
    query: str
    news_type: str
    generated_at: str
    articles_count: int
    content_markdown: str
```

---

### `api/routers/search.py`

**`POST /api/v1/search`** — body: `SearchRequest`, response: `SearchResponse`
- Validate query not empty
- Call `crawler_service.run_search()`
- Convert articles to `ArticleResponse` list
- Return `SearchResponse`
- Log search to console with loguru

**`GET /api/v1/search/history`** — response: list of SearchHistory dicts
- Return last 20 searches from DB ordered by searched_at desc

**`GET /api/v1/search/suggestions?q=`** — response: list of strings
- Return past search queries matching prefix from SearchHistory
- Limit 8 results

---

### `api/routers/articles.py`

**`GET /api/v1/articles`**:
- Query params: `page=1`, `limit=20`, `category`, `source`, `news_type`, `query`, `sentiment`, `days_back=7`
- Filter DB accordingly, return `ArticleListResponse`

**`GET /api/v1/articles/{id}`**:
- Return single `ArticleResponse` or 404

**`GET /api/v1/articles/recent`**:
- Query param: `hours=24`, `limit=20`
- Return articles scraped in last N hours

**`DELETE /api/v1/articles/{id}`**:
- Hard delete from DB, return `{"deleted": true}`

---

### `api/routers/analytics.py`

**`GET /api/v1/analytics/stats?days=7`**:
- Call `crawler_service.get_analytics(days)`
- Return `StatsResponse`

**`GET /api/v1/analytics/sentiment-trend?days=7`**:
- Return daily avg sentiment score for last N days
- `[{date: "2025-07-15", avg_sentiment: 0.12, count: 45}]`

**`GET /api/v1/analytics/top-sources?limit=10`**:
- Return top sources by article count
- `[{source: "techcrunch.com", count: 23, avg_sentiment: 0.18}]`

**`GET /api/v1/analytics/category-breakdown`**:
- Return articles per category with percentage
- `[{category: "Technology", count: 45, percentage: 32.1}]`

---

### `api/routers/reports.py`

**`POST /api/v1/reports/generate`** — body: `ReportRequest`, response: `ReportResponse`

The report generator should:
1. Query DB for articles matching `query` and `news_type` in last `days_back` days
2. If < 3 articles found, trigger a fresh search first
3. Build markdown report with this structure:

```markdown
# News Intelligence Report: {query}
**Generated:** {timestamp} | **Type:** {news_type} | **Articles Analysed:** {count}

---

## Executive Summary
{3-paragraph overview of the main themes found across all articles}

---

## Top Stories

### 1. {article title}
**Source:** {source} | **Published:** {date} | **Sentiment:** {label} ({score})
{article summary}
**Key Entities:** {persons, orgs, places}
**Read more:** {url}

[... repeat for top 5-8 articles ...]

---

## Category Breakdown
{table or list of categories with counts}

## Sentiment Analysis
- Overall sentiment: {avg_score} ({label})
- Positive articles: {count} ({pct}%)
- Negative articles: {count} ({pct}%)
- Neutral articles: {count} ({pct}%)

## Key Entities Mentioned
**People:** {list}
**Organizations:** {list}
**Locations:** {list}

## Trending Keywords
{top 15 keywords as comma-separated list}

---
*Report generated by Smart News Tracker*
```

4. Save report to `Report` table in DB
5. Return `ReportResponse`

**`GET /api/v1/reports`** — list all saved reports (id, title, query, generated_at, articles_count)

**`GET /api/v1/reports/{id}`** — return full report by id

---

### `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from config.settings import settings
from database.connection import create_tables
from api.routers import search, articles, analytics, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Smart News Tracker...")
    create_tables()
    logger.info("Database tables ready")
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart news tracker powered by Exa and Firecrawl",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(articles.router, prefix="/api/v1", tags=["Articles"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])

@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
```

---

### `.env.example`

```
EXA_API_KEY=your_exa_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
DATABASE_URL=sqlite:///./news_tracker.db
DEBUG=false
MAX_RESULTS_PER_SEARCH=15
MAX_FULL_FETCH_PER_SEARCH=10
```

---

### `requirements.txt`

Generate complete requirements.txt with exact pinned versions for:
fastapi, uvicorn[standard], pydantic, pydantic-settings, sqlalchemy,
aiosqlite, httpx, python-dotenv, textblob, spacy, sumy, scikit-learn,
pandas, python-multipart, loguru, apscheduler, vaderSentiment, nltk

Also add post-install note:
```
# After pip install, run:
# python -m spacy download en_core_web_sm
# python -m textblob.download_corpora
```

---

## HOW TO RUN

```bash
# 1. Install
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# 2. Configure
cp .env.example .env
# Edit .env with your EXA_API_KEY and FIRECRAWL_API_KEY

# 3. Run
uvicorn main:app --reload --port 8000

# 4. Test
# Open http://localhost:8000/docs
# POST /api/v1/search with {"query": "artificial intelligence", "news_type": "technology"}
```

---

## KEY RULES

- No truncation — every function must be fully implemented
- No placeholder comments like "# implement this"
- Every endpoint must return proper HTTP status codes (200, 404, 422, 500)
- All DB operations wrapped in try/except with rollback on error
- All external API calls (Exa, Firecrawl) wrapped in try/except with loguru error logging
- NLP service instantiated once at module level (not per request) — models are expensive to load
- Generate files in this exact order:
  1. requirements.txt
  2. .env.example  
  3. config/settings.py
  4. database/models.py
  5. database/connection.py
  6. services/exa_service.py
  7. services/firecrawl_service.py
  8. services/nlp_service.py
  9. services/crawler_service.py
  10. api/schemas.py
  11. api/routers/search.py
  12. api/routers/articles.py
  13. api/routers/analytics.py
  14. api/routers/reports.py
  15. main.py
