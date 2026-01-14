from flask import Blueprint, request, jsonify, make_response
from app.utils.ollama_processing import ollama_processor
from app.utils.nlp_process import NLPProcessor
import re

# Create a Blueprint
chat_bp = Blueprint("chat", __name__)

# Initialize processors
ollama = ollama_processor()
nlp_processor = NLPProcessor()


def parse_modified_itinerary(text: str) -> dict:
    """
    Parse modified itinerary text with flexible format support.
    Handles both markdown (**Day X:**) and plain text (Day X:) formats.
    """
    result = {}
    current_day = None
    current_activities = []
    
    lines = text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check for day headers (various formats)
        # Matches: "Day 1:", "**Day 1:**", "Day 1: Theme", "## Day 1" etc.
        day_match = re.match(r'^[\*#]*\s*(Day\s+\d+)[:\s]*(.*?)[\*]*$', line, re.IGNORECASE)
        
        if day_match:
            # Save previous day if exists
            if current_day and current_activities:
                result[current_day] = current_activities
            
            day_num = day_match.group(1).strip()
            theme = day_match.group(2).strip().strip('*').strip(':').strip()
            current_day = f"{day_num}: {theme}" if theme else day_num
            current_activities = []
            
        elif current_day:
            # This is an activity line
            # Remove bullets, asterisks, dashes
            activity = re.sub(r'^[\-\*•]\s*', '', line).strip()
            activity = activity.replace('**', '').replace('*', '').strip()
            
            if activity and len(activity) > 3:  # Filter out very short lines
                current_activities.append(activity)
    
    # Don't forget the last day
    if current_day and current_activities:
        result[current_day] = current_activities
    
    return result


@chat_bp.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    """Handle chat messages about the itinerary using Ollama."""
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response
    
    try:
        data = request.get_json()
        
        message = data.get("message", "")
        itinerary = data.get("itinerary", {})
        history = data.get("history", [])
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        if not itinerary:
            return jsonify({"error": "Itinerary context is required"}), 400
        
        # Get response from Ollama
        response_text = ollama.chat(message, itinerary, history)
        
        return jsonify({
            "response": response_text
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/modify-itinerary", methods=["POST", "OPTIONS"])
def modify_itinerary():
    """Regenerate itinerary based on chat feedback using Ollama."""
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response
    
    try:
        data = request.get_json()
        
        history = data.get("history", [])
        original_itinerary = data.get("original_itinerary", {})
        preferences = data.get("preferences", {})
        
        if not history:
            return jsonify({"error": "Chat history is required to modify itinerary"}), 400
        
        if not original_itinerary:
            return jsonify({"error": "Original itinerary is required"}), 400
        
        # Get modified itinerary text from Ollama
        modified_text = ollama.modify_itinerary(history, original_itinerary, preferences)
        print(f"DEBUG: Ollama modify response length: {len(modified_text)}")
        print(f"DEBUG: Ollama modify response preview: {modified_text[:500]}...")
        
        # Try standard parser first
        modified_itinerary = nlp_processor.parse_itinerary(modified_text)
        
        # If standard parser returns empty, use our flexible parser
        if not modified_itinerary:
            print("DEBUG: Standard parser returned empty, using fallback parser")
            modified_itinerary = parse_modified_itinerary(modified_text)
        
        print(f"DEBUG: Parsed itinerary has {len(modified_itinerary)} days")
        
        # If still empty, return original with error note
        if not modified_itinerary:
            print("DEBUG: Both parsers failed, returning original itinerary")
            return jsonify({
                "itinerary": original_itinerary,
                "error": "Could not parse modified itinerary, returning original"
            })
        
        return jsonify({
            "itinerary": modified_itinerary
        })
        
    except Exception as e:
        print(f"Modify itinerary error: {e}")
        return jsonify({"error": str(e)}), 500
