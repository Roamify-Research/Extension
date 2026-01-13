import os
import sys
from dotenv import load_dotenv

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.utils.firecrawl_processing import FirecrawlProcessor

def test_firecrawl():
    load_dotenv()
    api_key = os.getenv("FIRECRAWL_API_KEY")
    
    if not api_key:
        print("❌ Error: FIRECRAWL_API_KEY not found in .env file.")
        print("Please add FIRECRAWL_API_KEY=your_key_here to your .env file.")
        return

    print(f"🔄 Initializing Firecrawl with API key: {api_key[:5]}...{api_key[-4:]}")
    processor = FirecrawlProcessor(api_key=api_key)
    
    # Test 1: Direct Scrape
    test_url = "https://traveltriangle.com/blog/places-to-visit-in-paris/"
    print(f"\n🧪 Test 1: Scraping {test_url}...")
    markdown = processor.scrape_url(test_url)
    
    if markdown:
        print("✅ Success! Extracted markdown content.")
        print(f"Content preview (first 200 chars):\n{markdown}...")
    else:
        print("❌ Failed to extract markdown.")

    # Test 2: Destination Search
    test_destination = "Tokyo"
    print(f"\n🧪 Test 2: Searching travel info for {test_destination}...")
    markdown_search = processor.search_travel_info(test_destination)
    
    if markdown_search:
        print(f"✅ Success! Extracted info for {test_destination}.")
        print(f"Content preview (first 200 chars):\n{markdown_search[:200]}...")
    else:
        print(f"❌ Failed to extract info for {test_destination}.")

if __name__ == "__main__":
    test_firecrawl()
