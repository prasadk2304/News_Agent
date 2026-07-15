import httpx
from loguru import logger
from config.settings import settings

EXA_SEARCH_URL = "https://api.exa.ai/search"
EXA_CONTENTS_URL = "https://api.exa.ai/contents"

class ExaService:
    def __init__(self):
        self.api_key = settings.EXA_API_KEY
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def search_news(self, query: str, news_type: str, num_results: int = 15) -> list[dict]:
        # Build semantic query
        if news_type == "breaking":
            semantic_query = f"breaking news {query} latest today"
        elif news_type == "analysis":
            semantic_query = f"in-depth analysis {query} expert opinion"
        elif news_type == "technology":
            semantic_query = f"technology news {query}"
        else:
            semantic_query = query

        payload = {
            "query": semantic_query,
            "numResults": num_results,
            "type": "auto",
            "contents": {
                "text": {"maxCharacters": 3000},
                "highlights": {"numSentences": 3, "highlightsPerUrl": 2}
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(EXA_SEARCH_URL, headers=self.headers, json=payload, timeout=settings.REQUEST_TIMEOUT)
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
            except Exception as e:
                logger.error(f"Exa search_news failed: {str(e)}")
                return []

    async def fetch_full_content(self, urls: list[str]) -> dict[str, str]:
        if not urls:
            return {}
            
        payload = {
            "ids": urls,
            "text": {"maxCharacters": 8000}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(EXA_CONTENTS_URL, headers=self.headers, json=payload, timeout=settings.REQUEST_TIMEOUT)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                
                content_map = {}
                for item in results:
                    url = item.get("id") or item.get("url")
                    text = item.get("text")
                    if url and text:
                        content_map[url] = text
                return content_map
            except Exception as e:
                logger.error(f"Exa fetch_full_content failed: {str(e)}")
                return {}

    async def search_and_fetch(self, query: str, news_type: str, num_results: int = 10) -> list[dict]:
        results = await self.search_news(query, news_type, num_results)
        if not results:
            return []

        # Take top max_full_fetch_per_search urls
        urls_to_fetch = [res["url"] for res in results[:settings.MAX_FULL_FETCH_PER_SEARCH] if "url" in res]
        
        full_content_map = await self.fetch_full_content(urls_to_fetch)
        
        for res in results:
            url = res.get("url")
            if url in full_content_map:
                res["text"] = full_content_map[url]
                
        return results
