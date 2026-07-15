from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from database.connection import Base

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    url = Column(String(2000), unique=True, nullable=False, index=True)
    source = Column(String(200))
    author = Column(String(300), nullable=True)
    published_at = Column(DateTime, nullable=True)
    scraped_at = Column(DateTime, default=datetime.utcnow, index=True)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    category = Column(String(100), index=True)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String(20), nullable=True)
    keywords = Column(String(500), nullable=True)
    entities_json = Column(Text, nullable=True)
    search_query = Column(String(500), index=True)
    news_type = Column(String(100), index=True)
    word_count = Column(Integer, nullable=True)
    fetch_source = Column(String(20), default="exa")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "source": self.source,
            "author": self.author,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "scraped_at": self.scraped_at.isoformat() if self.scraped_at else None,
            "content": self.content,
            "summary": self.summary,
            "category": self.category,
            "sentiment_score": self.sentiment_score,
            "sentiment_label": self.sentiment_label,
            "keywords": self.keywords.split(",") if self.keywords else [],
            "entities": json.loads(self.entities_json) if self.entities_json else {},
            "search_query": self.search_query,
            "news_type": self.news_type,
            "word_count": self.word_count,
            "fetch_source": self.fetch_source,
        }

    def __repr__(self):
        return f"<Article id={self.id} title='{self.title[:20]}...'>"

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True)
    query = Column(String(500), nullable=False)
    news_type = Column(String(100))
    results_count = Column(Integer, default=0)
    searched_at = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "query": self.query,
            "news_type": self.news_type,
            "results_count": self.results_count,
            "searched_at": self.searched_at.isoformat() if self.searched_at else None,
            "status": self.status,
            "error_message": self.error_message,
        }

    def __repr__(self):
        return f"<SearchHistory id={self.id} query='{self.query}' status='{self.status}'>"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    title = Column(String(300))
    content_markdown = Column(Text)
    query = Column(String(500))
    news_type = Column(String(100))
    articles_count = Column(Integer)
    generated_at = Column(DateTime, default=datetime.utcnow)
    date_range_start = Column(DateTime, nullable=True)
    date_range_end = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content_markdown": self.content_markdown,
            "query": self.query,
            "news_type": self.news_type,
            "articles_count": self.articles_count,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "date_range_start": self.date_range_start.isoformat() if self.date_range_start else None,
            "date_range_end": self.date_range_end.isoformat() if self.date_range_end else None,
        }

    def __repr__(self):
        return f"<Report id={self.id} title='{self.title[:20]}...'>"
