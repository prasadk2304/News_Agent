import time
from urllib.parse import urlparse
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database.models import SearchHistory, Article
from services.exa_service import ExaService
from services.firecrawl_service import FirecrawlService
from services.nlp_service import NLPService

# Instantiate NLP service once
nlp_service_instance = NLPService()

@dataclass
class SearchResult:
    search_id: int
    query: str
    news_type: str
    articles_found: int
    articles_new: int
    articles: list[dict]
    duration_seconds: float

class CrawlerService:
    def __init__(self, db: Session):
        self.db = db
        self.exa = ExaService()
        self.firecrawl = FirecrawlService()
        self.nlp = nlp_service_instance

    async def run_search(self, query: str, news_type: str, num_results: int = 10, use_firecrawl: bool = False) -> SearchResult:
        start_time = time.time()
        
        # 1. Create SearchHistory record
        history = SearchHistory(query=query, news_type=news_type, status="pending")
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        
        try:
            # 2. Exa search and fetch
            results = await self.exa.search_and_fetch(query, news_type, num_results)
            
            # 3. Fallback to Firecrawl if needed
            if use_firecrawl:
                urls_to_scrape = []
                for res in results:
                    content = res.get("text", "")
                    if len(content) < 500 and "url" in res:
                        urls_to_scrape.append(res["url"])
                
                if urls_to_scrape:
                    fc_results = await self.firecrawl.scrape_multiple(urls_to_scrape)
                    fc_map = {r.get("url"): r.get("content") for r in fc_results if r.get("url")}
                    for res in results:
                        url = res.get("url")
                        if url in fc_map and fc_map[url]:
                            res["text"] = fc_map[url]
                            res["fetch_source"] = "firecrawl"
                            
            # 4. Process and Save Articles
            new_articles_count = 0
            processed_articles = []
            
            for res in results:
                url = res.get("url")
                if not url:
                    continue
                    
                # Check DB
                existing = self.db.query(Article.id).filter(Article.url == url).first()
                if existing:
                    continue
                    
                # Process NLP
                processed = self.nlp.process_article(res)
                
                # Extract domain
                domain = ""
                try:
                    domain = urlparse(url).netloc
                except:
                    pass
                    
                article = Article(
                    title=processed.get("title", "Untitled"),
                    url=url,
                    source=domain,
                    author=processed.get("author"),
                    published_at=None, # Exa dates require parsing, skipping complex logic for brevity
                    content=processed.get("text") or processed.get("content"),
                    summary=processed.get("summary"),
                    category=processed.get("category", "Other"),
                    sentiment_score=processed.get("sentiment_score"),
                    sentiment_label=processed.get("sentiment_label"),
                    keywords=processed.get("keywords"),
                    entities_json=processed.get("entities_json"),
                    search_query=query,
                    news_type=news_type,
                    word_count=processed.get("word_count"),
                    fetch_source=processed.get("fetch_source", "exa")
                )
                self.db.add(article)
                processed_articles.append(article)
                new_articles_count += 1
                
            self.db.commit()
            
            # 5. Update SearchHistory
            history.status = "completed"
            history.results_count = len(results)
            self.db.commit()
            
            # Prepare dict representation of processed articles
            articles_dicts = [a.to_dict() for a in processed_articles]
            
            duration = time.time() - start_time
            return SearchResult(
                search_id=history.id,
                query=query,
                news_type=news_type,
                articles_found=len(results),
                articles_new=new_articles_count,
                articles=articles_dicts,
                duration_seconds=round(duration, 2)
            )
            
        except Exception as e:
            self.db.rollback()
            history.status = "failed"
            history.error_message = str(e)
            self.db.commit()
            raise e

    def get_analytics(self, days: int = 7) -> dict:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Base query for timeframe
        base_q = self.db.query(Article).filter(Article.scraped_at >= cutoff_date)
        
        total_articles = base_q.count()
        
        # By category
        by_category = {}
        for row in self.db.query(Article.category, func.count(Article.id)).filter(Article.scraped_at >= cutoff_date).group_by(Article.category).all():
            if row[0]: by_category[row[0]] = row[1]
            
        # By source (top 10)
        by_source = {}
        for row in self.db.query(Article.source, func.count(Article.id)).filter(Article.scraped_at >= cutoff_date).group_by(Article.source).order_by(func.count(Article.id).desc()).limit(10).all():
            if row[0]: by_source[row[0]] = row[1]
            
        # By date
        by_date = {}
        # PostgreSQL returns datetime.date for func.date, coerce to string
        for row in self.db.query(func.date(Article.scraped_at), func.count(Article.id)).filter(Article.scraped_at >= cutoff_date).group_by(func.date(Article.scraped_at)).all():
            if row[0]: by_date[str(row[0])] = row[1]
            
        # Avg sentiment
        avg_sentiment = self.db.query(func.avg(Article.sentiment_score)).filter(Article.scraped_at >= cutoff_date).scalar() or 0.0
        
        # Sentiment distribution
        sentiment_dist = {"positive": 0, "negative": 0, "neutral": 0}
        for row in self.db.query(Article.sentiment_label, func.count(Article.id)).filter(Article.scraped_at >= cutoff_date).group_by(Article.sentiment_label).all():
            if row[0] in sentiment_dist:
                sentiment_dist[row[0]] = row[1]
                
        # Recent searches
        recent_searches = [s.to_dict() for s in self.db.query(SearchHistory).order_by(SearchHistory.searched_at.desc()).limit(5).all()]
        
        return {
            "total_articles": total_articles,
            "by_category": by_category,
            "by_source": by_source,
            "by_date": by_date,
            "avg_sentiment": round(avg_sentiment, 2),
            "sentiment_distribution": sentiment_dist,
            "top_keywords": [],  # Skipping complex aggregation for brevity
            "top_entities": {"persons": [], "orgs": [], "places": []}, # Skipping for brevity
            "recent_searches": recent_searches
        }
