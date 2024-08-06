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
        text = data['text']
        days = data['day']

        # Process the text
        processed_data = pipeline_processor.t5_ollama_processing(text, days)
        
        formatted_data = {}
        
        days = re.findall(r"\*\*Day (\d+):", processed_data)
        data = re.findall(r"\*\*Day \d+: (.+?)\*\*", processed_data, re.DOTALL)

        for i in range(len(days)):
            formatted_data[f"Day {days[i]}"] = data[i]

        return jsonify(formatted_data)

    elif request.method == 'GET':
        return 'This is the process endpoint'

# Ensure to include this Blueprint in your main Flask app
# app.register_blueprint(process_bp, url_prefix='/your_url_prefix')
