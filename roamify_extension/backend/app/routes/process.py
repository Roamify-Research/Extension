from flask import Blueprint, request, jsonify
from app.utils.nlp_process import NLP_Processor

# Create a Blueprint
process_bp = Blueprint('process', __name__)

# Load the NLP model

@process_bp.route('/process', methods=['POST', 'GET'])
def process_text():
    if request.method == 'POST':
        data = request.get_json()
        text = data['text']

        # Process the text
        nlp_processor = NLP_Processor(text)
        processed_text = nlp_processor.NLP_Processing()
        print(processed_text)

        return jsonify({'processed_text': processed_text})
    elif request.method == 'GET':
        return 'This is the process endpoint'
