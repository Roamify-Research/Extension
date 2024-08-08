from flask import Blueprint, request, jsonify, make_response
from app.utils.pipeline_processing import Pipeline
import re

# Create a Blueprint
process_bp = Blueprint('process', __name__)

# Pipeline Processing
pipeline_processor = Pipeline()

@process_bp.route('/process', methods=['POST', 'OPTIONS','GET'])
def process_text():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response
    
    if request.method == 'POST':
        data = request.get_json()

        if 'text' not in data:
            days = data['day']
            destination_name = ""
            formatted_data = pipeline_processor.ollama_processing(destination_name, days)
            return jsonify(formatted_data)
            
        text = data['text']
        days = data['day']
        # User preferences
        historical = data['historical']
        amusement = data['amusement']
        natural = data['natural']
        # Process the text
        formatted_data = pipeline_processor.t5_ollama_processing(text, days, historical, amusement, natural)
        return jsonify(formatted_data)

    elif request.method == 'GET':
        return 'This is the process endpoint'

# Ensure to include this Blueprint in your main Flask app
# app.register_blueprint(process_bp, url_prefix='/your_url_prefix')
