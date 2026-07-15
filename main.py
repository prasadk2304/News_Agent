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
