from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database.connection import get_db
from database.models import Article
from services.crawler_service import CrawlerService
from api.schemas import StatsResponse

router = APIRouter(prefix="/analytics")

@router.get("/stats", response_model=StatsResponse)
def get_stats(days: int = 7, db: Session = Depends(get_db)):
    crawler = CrawlerService(db)
    return crawler.get_analytics(days)

@router.get("/sentiment-trend")
def get_sentiment_trend(days: int = 7, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    # SQLite grouping by date string
    trends = db.query(
        func.date(Article.scraped_at).label("date"),
        func.avg(Article.sentiment_score).label("avg_sentiment"),
        func.count(Article.id).label("count")
    ).filter(Article.scraped_at >= cutoff)\
     .group_by(func.date(Article.scraped_at))\
     .order_by("date").all()
     
    return [{"date": str(t.date), "avg_sentiment": round(t.avg_sentiment or 0, 2), "count": t.count} for t in trends if t.date]

@router.get("/top-sources")
def get_top_sources(limit: int = 10, db: Session = Depends(get_db)):
    sources = db.query(
        Article.source,
        func.count(Article.id).label("count"),
        func.avg(Article.sentiment_score).label("avg_sentiment")
    ).group_by(Article.source)\
     .order_by(func.count(Article.id).desc())\
     .limit(limit).all()
     
    return [{"source": s.source, "count": s.count, "avg_sentiment": round(s.avg_sentiment or 0, 2)} for s in sources if s.source]

@router.get("/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    total = db.query(Article).count()
    if total == 0:
        return []
        
    categories = db.query(
        Article.category,
        func.count(Article.id).label("count")
    ).group_by(Article.category).all()
    
    return [
        {
            "category": c.category,
            "count": c.count,
            "percentage": round((c.count / total) * 100, 1)
        }
        for c in categories if c.category
    ]
