import logging
import os
from firecrawl import FirecrawlApp
from typing import Optional, List

logger = logging.getLogger(__name__)

class FirecrawlProcessor:
    """Handles data gathering using the Firecrawl API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        if not self.api_key:
            logger.warning("FIRECRAWL_API_KEY not found in environment. Firecrawl will not work.")
            self.app = None
        else:
            self.app = FirecrawlApp(api_key=self.api_key)
            logger.info("Firecrawl initialized successfully.")

    def scrape_url(self, url: str) -> Optional[str]:
        """Scrapes a URL and returns the content in markdown format."""
        if not self.app:
            logger.error("Firecrawl app not initialized.")
            return None

        try:
            logger.info(f"Scraping URL with Firecrawl: {url}")
            result = self.app.scrape(url, formats=['markdown'])
            
            # Debugging: Log the type and structure of the result
            logger.info(f"Firecrawl result type: {type(result)}")
            
            # In v1 (latest sdk usually), result is a dict with 'markdown' key
            if isinstance(result, dict):
                content = result.get('markdown')
                if content:
                    logger.info(f"Successfully scraped {len(content)} characters.")
                    return content
                else:
                    logger.warning(f"Firecrawl dict result missing 'markdown' key or empty. Keys: {result.keys()}")
            
            # In some SDK versions, it might be a Document object
            elif hasattr(result, 'markdown'):
                content = getattr(result, 'markdown')
                if content:
                    logger.info(f"Successfully scraped {len(content)} characters (object).")
                    return content
                else:
                    logger.warning("Firecrawl object result has empty 'markdown' attribute.")
            
            else:
                logger.error(f"Unexpected Firecrawl result format: {result}")
            
            return None
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {e}")
            return None

    def search_travel_info(self, destination: str) -> Optional[str]:
        """Searches for travel information for a destination and returns top result in markdown."""
        if not self.app:
            return None

        try:
            query = f"top places to visit in {destination} travel guide"
            logger.info(f"Searching travel info for: {destination}")
            # Firecrawl's crawl or search functionality can be used here.
            # For simplicity, we'll use search if available or just a direct scrape if we have a known good source like TravelTriangle.
            # TravelTriangle is already reliable in the current codebase logic.
            search_link = f"https://traveltriangle.com/blog/places-to-visit-in-{destination.lower()}/"
            return self.scrape_url(search_link)
        except Exception as e:
            logger.error(f"Error searching for {destination}: {e}")
            return None
