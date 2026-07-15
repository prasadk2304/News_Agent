from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart News Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./news_tracker.db"

    # Exa API
    EXA_API_KEY: str = ""
    EXA_BASE_URL: str = "https://api.exa.ai"

    # Firecrawl API
    FIRECRAWL_API_KEY: str = ""
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
