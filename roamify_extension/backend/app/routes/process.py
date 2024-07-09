from flask import Blueprint, request, jsonify, make_response
from app.utils.pipeline_processing import Pipeline

# Create a Blueprint
process_bp = Blueprint('process', __name__)

# Pipeline Processing
pipeline_processor = Pipeline()

# Load the NLP model

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

        # Process the text
        processed_data = pipeline_processor.pipeline_processing_llama(text)
        for name, details in processed_data.items():
            res = processed_data[name]
            index = res.find("### Response:\n") + len("### Response:\n")
            end_index = res.find('### Explanation:')
            result = res[index:end_index]
            sentences = result.split(".")
            sentences.pop()
            
            processed_data[name] = ".".join(sentences)
            processed_data[name] = res[index:]
            
        return processed_data

    elif request.method == 'GET':
        return 'This is the process endpoint'
