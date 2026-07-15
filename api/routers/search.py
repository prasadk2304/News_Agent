from fastapi import APIRouter, Depends
from typing import List
from loguru import logger
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import SearchHistory
from services.crawler_service import CrawlerService
from api.schemas import SearchRequest, SearchResponse

router = APIRouter(prefix="/search")

@router.post("", response_model=SearchResponse)
async def search_news(request: SearchRequest, db: Session = Depends(get_db)):
    logger.info(f"Received search request: {request.query} ({request.news_type})")
    crawler = CrawlerService(db)
    result = await crawler.run_search(
        query=request.query,
        news_type=request.news_type,
        num_results=request.num_results,
        use_firecrawl=request.use_firecrawl
    )
    return result

@router.get("/history")
def get_search_history(db: Session = Depends(get_db)):
    searches = db.query(SearchHistory).order_by(SearchHistory.searched_at.desc()).limit(20).all()
    return [s.to_dict() for s in searches]

@router.get("/suggestions", response_model=List[str])
def get_search_suggestions(q: str, db: Session = Depends(get_db)):
    if not q:
        return []
    searches = db.query(SearchHistory.query)\
                 .filter(SearchHistory.query.ilike(f"{q}%"))\
                 .distinct()\
                 .limit(8)\
                 .all()
    return [s[0] for s in searches]
