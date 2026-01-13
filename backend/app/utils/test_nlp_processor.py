import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.utils.nlp_process import NLPProcessor

def test_nlp_processor():
    processor = NLPProcessor()
    
    # Test case 1: Basic attraction extraction
    test_text = """
    1. India Gate
    This is a famous war memorial in Delhi. Image source: Wikimedia.
    2. Lotus Temple
    A beautiful Bahá'í House of Worship. Credit: John Doe.
    """
    
    results = processor.process_web_text(test_text)
    print("Extraction Results:", results)
    
    assert "India Gate" in results
    assert "Lotus Temple" in results
    assert "Wikimedia" not in results["India Gate"]
    assert "image" not in results["India Gate"].lower()
    
    # Test case 2: Itinerary parsing
    test_itinerary = """
    Here's your plan:
    
    **Day 1: Arrival and Sightseeing**
    
    * Morning: Visit India Gate.
    * Evening: Relax at the hotel.
    
    **Day 2: Exploration**
    
    * Morning: Visit Red Fort.
    """
    
    itinerary = processor.parse_itinerary(test_itinerary)
    print("Parsed Itinerary:", itinerary)
    
    assert "Day 1: Arrival and Sightseeing" in itinerary
    assert len(itinerary["Day 1: Arrival and Sightseeing"]) == 2
    assert "Visit India Gate." == itinerary["Day 1: Arrival and Sightseeing"][0]

    print("All tests passed!")

if __name__ == "__main__":
    test_nlp_processor()
