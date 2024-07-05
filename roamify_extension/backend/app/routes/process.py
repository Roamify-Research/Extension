from flask import Blueprint, request, jsonify
from app.utils.pipeline_processing import Pipeline

# Create a Blueprint
process_bp = Blueprint('process', __name__)

# Pipeline Processing
pipeline_processor = Pipeline()

# Load the NLP model

@process_bp.route('/process', methods=['POST', 'GET'])
def process_text():
    if request.method == 'POST':
        data = request.get_json()
        text = data['text']

        # Process the text
        processed_data = pipeline_processor.pipeline_processing_llama(text)
        print(processed_data)
        return processed_data

    elif request.method == 'GET':
        return 'This is the process endpoint'
