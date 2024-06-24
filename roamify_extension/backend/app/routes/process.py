from flask import Blueprint, request, jsonify

# Create a Blueprint
process_bp = Blueprint('process', __name__)

# Load the NLP model

@process_bp.route('/process', methods=['POST'])
def process_text():
    # Get the JSON data from the request
    data = request.get_json()

    if 'text' not in data:
        return jsonify({"error": "No text provided"}), 400

    # Process the text using spaCy
    text = data['text']
    
    # Extract named entities as an example
    
    # Return the extracted entities as JSON response
    return jsonify({"entities": text})

@process_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})
