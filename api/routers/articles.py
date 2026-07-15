from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime, timedelta

from database.connection import get_db
from database.models import Article
from api.schemas import ArticleListResponse, ArticleResponse

router = APIRouter(prefix="/articles")

@router.get("", response_model=ArticleListResponse)
def get_articles(
    page: int = 1,
    limit: int = 20,
    category: str = None,
    source: str = None,
    news_type: str = None,
    query: str = None,
    sentiment: str = None,
    days_back: int = 7,
    db: Session = Depends(get_db)
):
    q = db.query(Article)
    
    cutoff = datetime.utcnow() - timedelta(days=days_back)
    q = q.filter(Article.scraped_at >= cutoff)
    
    if category: q = q.filter(Article.category == category)
    if source: q = q.filter(Article.source == source)
    if news_type: q = q.filter(Article.news_type == news_type)
    if sentiment: q = q.filter(Article.sentiment_label == sentiment)
    if query:
        q = q.filter(
            or_(
                Article.title.ilike(f"%{query}%"),
                Article.summary.ilike(f"%{query}%"),
                Article.content.ilike(f"%{query}%"),
                Article.keywords.ilike(f"%{query}%"),
                Article.search_query.ilike(f"%{query}%"),
                Article.category.ilike(f"%{query}%")
            )
        )
    
    total = q.count()
    offset = (page - 1) * limit
    articles = q.order_by(desc(Article.scraped_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "articles": [a.to_dict() for a in articles]
    }

@router.get("/recent", response_model=list[ArticleResponse])
def get_recent_articles(hours: int = 24, limit: int = 20, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    articles = db.query(Article).filter(Article.scraped_at >= cutoff).order_by(desc(Article.scraped_at)).limit(limit).all()
    return [a.to_dict() for a in articles]

@router.get("/{id}", response_model=ArticleResponse)
def get_article(id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article.to_dict()

@router.delete("/{id}")
def delete_article(id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.delete(article)
    db.commit()
    return {"deleted": True}
