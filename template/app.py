from flask import Flask, request, jsonify
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import requests
from bs4 import BeautifulSoup
from flask_cors import CORS

nltk.download('punkt')
nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

@app.route('/itinerary', methods=['POST'])
def get_itinerary():
    data = request.get_json()
    query = data.get('query', '')
    print(data)
    print(query)
    
    # Simple NLP processing to extract place name
    stop_words = set(stopwords.words('english'))
    word_tokens = word_tokenize(query)
    filtered_query = [w for w in word_tokens if not w.lower() in stop_words]

    # Example place extraction (this can be more sophisticated)
    place = ' '.join(filtered_query)
    print(place)
    
    # Scrape data based on the place (this is a placeholder for actual scraping logic)
    itinerary = scrape_itinerary(place)
    
    return jsonify(itinerary=itinerary)

def scrape_itinerary(place):
    # Placeholder function for scraping logic
    # In real scenario, you would scrape relevant websites to build the itinerary
    example_itinerary = f"Here is a sample itinerary for {place}:\n1. Visit the central park\n2. Check out the museum\n3. Dinner at the best restaurant"
    return example_itinerary

if __name__ == '__main__':
    app.run(debug=True)
