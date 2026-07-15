import asyncio
import httpx
from loguru import logger
from config.settings import settings

class FirecrawlService:
    def __init__(self):
        self.api_key = settings.FIRECRAWL_API_KEY
        self.base_url = settings.FIRECRAWL_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
    async def scrape_url(self, url: str) -> dict:
        endpoint = f"{self.base_url}/v1/scrape"
        payload = {
            "url": url,
            "formats": ["markdown", "metadata"],
            "onlyMainContent": True,
            "timeout": 30000
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(endpoint, headers=self.headers, json=payload, timeout=settings.REQUEST_TIMEOUT + 5)
                response.raise_for_status()
                data = response.json()
                
                # Extract relevant fields
                result = data.get("data", {})
                metadata = result.get("metadata", {})
                
                return {
                    "content": result.get("markdown", ""),
                    "title": metadata.get("title", ""),
                    "description": metadata.get("description", ""),
                    "url": metadata.get("url", url),
                    "published_date": metadata.get("published_date", "")
                }
            except Exception as e:
                logger.error(f"Firecrawl scrape_url failed for {url}: {str(e)}")
                return {}

    async def scrape_multiple(self, urls: list[str]) -> list[dict]:
        semaphore = asyncio.Semaphore(3)
        
        async def scrape_with_sem(url):
            async with semaphore:
                return await self.scrape_url(url)
                
        tasks = [scrape_with_sem(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_results = []
        for r in results:
            if isinstance(r, dict) and r:
                valid_results.append(r)
        return valid_results

    async def crawl_site(self, url: str, limit: int = 5) -> list[dict]:
        endpoint = f"{self.base_url}/v1/crawl"
        payload = {
            "url": url,
            "limit": limit
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(endpoint, headers=self.headers, json=payload, timeout=settings.REQUEST_TIMEOUT)
                response.raise_for_status()
                data = response.json()
                
                job_id = data.get("jobId")
                if not job_id:
                    return []
                
                # Poll status
                poll_url = f"{self.base_url}/v1/crawl/{job_id}"
                for _ in range(12):  # Max 60 seconds (12 * 5s)
                    await asyncio.sleep(5)
                    poll_resp = await client.get(poll_url, headers=self.headers, timeout=settings.REQUEST_TIMEOUT)
                    poll_resp.raise_for_status()
                    poll_data = poll_resp.json()
                    
                    status = poll_data.get("status")
                    if status == "completed":
                        # Process results
                        results = []
                        for item in poll_data.get("data", []):
                            metadata = item.get("metadata", {})
                            results.append({
                                "content": item.get("markdown", ""),
                                "title": metadata.get("title", ""),
                                "url": metadata.get("url", ""),
                                "published_date": metadata.get("published_date", "")
                            })
                        return results
                    elif status in ["failed", "cancelled"]:
                        logger.error(f"Firecrawl crawl_site job {status} for {url}")
                        return []
                        
                return []
            except Exception as e:
                logger.error(f"Firecrawl crawl_site failed for {url}: {str(e)}")
                return []
