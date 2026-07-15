from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any

class SearchRequest(BaseModel):
    query: str
    news_type: str = "general"
    num_results: int = 10
    use_firecrawl: bool = False
    
    @field_validator('num_results')
    def clamp_results(cls, v):
        return max(1, min(50, v))

class ReportRequest(BaseModel):
    query: str
    news_type: str = "general"
    days_back: int = 1
    include_summary: bool = True
    include_entities: bool = True
    include_sentiment: bool = True

class ArticleResponse(BaseModel):
    id: int
    title: str
    url: str
    source: str
    author: Optional[str] = None
    published_at: Optional[str] = None
    scraped_at: str
    summary: Optional[str] = None
    category: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    keywords: List[str]
    entities: Dict[str, Any]
    word_count: Optional[int] = None
    fetch_source: str
    search_query: Optional[str] = None
    news_type: Optional[str] = None

class SearchResponse(BaseModel):
    search_id: int
    query: str
    news_type: str
    articles_found: int
    articles_new: int
    duration_seconds: float
    articles: List[ArticleResponse]

class ArticleListResponse(BaseModel):
    total: int
    page: int
    limit: int
    articles: List[ArticleResponse]

class StatsResponse(BaseModel):
    total_articles: int
    by_category: Dict[str, int]
    by_source: Dict[str, int]
    by_date: Dict[str, int]
    avg_sentiment: float
    sentiment_distribution: Dict[str, int]
    top_keywords: List[Dict[str, Any]]
    top_entities: Dict[str, Any]
    recent_searches: List[Dict[str, Any]]

class ReportResponse(BaseModel):
    title: str
    query: str
    news_type: str
    generated_at: str
    articles_count: int
    content_markdown: str
