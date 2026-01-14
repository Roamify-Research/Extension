from flask import Blueprint, request, jsonify, make_response
from app.utils.pipeline_processing import Pipeline
import re

# Create a Blueprint
process_bp = Blueprint("process", __name__)

# Pipeline Processing
pipeline_processor = Pipeline()


@process_bp.route("/process", methods=["POST", "OPTIONS", "GET"])
def process_text():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response

    if request.method == "POST":
        data = request.get_json()
        print(data)

        days = data.get("day", 3)
        destination = data.get("destination", "")
        url = data.get("url", "")
        urls = data.get("urls", []) # Support for multi-tab scraping
        
        # User preferences
        historical = data.get("historical", 3)
        amusement = data.get("amusement", 3)
        natural = data.get("natural", 3)
        cultural = data.get("cultural", 3)

        if "text" not in data or not data["text"]:
            # If text is not provided, use the modern Firecrawl + T5 flow
            formatted_data = pipeline_processor.t5_ollama_processing(
                None, days, historical, amusement, natural, cultural,
                destination=destination, url=url, urls=urls
            )
            return jsonify(formatted_data)

        text = data["text"]
        # Process the provided text
        formatted_data = pipeline_processor.t5_ollama_processing(
            text, days, historical, amusement, natural, cultural,
            destination=destination, url=url, urls=urls
        )
        return jsonify(formatted_data)

    elif request.method == "GET":
        return "This is the process endpoint"


# Ensure to include this Blueprint in your main Flask app
# app.register_blueprint(process_bp, url_prefix='/your_url_prefix')
