import requests


class ollama_processor:
    def __init__(self):
        self.url = "http://localhost:11434/api/generate"

        self.headers = {"Content-Type": "application/json"}

    def ollama_attraction(
        self, attractions: dict, days, historical=3, amusement=3, natural=3, cultural=3, destination=None
    ):
        # prompt = f"Generate an detailed itinerary for me for a {days} day trip and the user has rated {historical} for historical places  here are the suggested places I would like to cover:\n"

        # Updated Prompt with Role Playing and Stricter Filtering Instructions
        print(f"DEBUG: ollama_attraction received destination: '{destination}'")
        dest_str = f" to {destination}" if destination else ""
        
        prompt = (
            f"You are an expert travel agent creating a perfect travel itinerary. "
            f"I need a {days}-day detailed itinerary for a trip{dest_str}. "
            f"User Preferences (scale 1-10): Historical: {historical}, Amusement: {amusement}, Natural: {natural}.\n"
            f"Cultural Preference (scale 1-5): {cultural}\n\n"
            f"Instructions:\n"
            f"1. Use the suggested places below to build the itinerary.\n"
            f"2. IMPORTANT: The provided list contains scraped data. You MUST IGNORE any junk information such as:\n"
            f"   - Person names (e.g., 'Ollie', 'Kanika')\n"
            f"   - Company names or slogans (e.g., 'TravelTriangle', 'Book Now')\n"
            f"   - Website navigation text (e.g., 'Click here', 'Read More')\n"
            f"3. Only include valid tourist attractions (museums, parks, forts, temples, etc.).\n"
            f"4. If a suggested place seems invalid or irrelevant, DISCARD it.\n"
            f"5. Structure the response day by day.\n"
            f"Suggested Places from the scraped text:\n"
        )
        
        count = 1
        for name, details in attractions.items():
            prompt += f"{count}. {name.title()}\n"
            prompt += f"   Context: {details[:500]}...\n\n" # Truncate heavily to save context window
            count += 1

        print(f"DEBUG: Final Prompt being sent to Ollama:\n{prompt}")
        payload = {"model": "llama3.1:latest", "prompt": prompt, "stream": False}
        try:
            response = requests.post(self.url, headers=self.headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            if "response" in result:
                return result["response"]
            else:
                error_msg = result.get("error", "Unknown error from Ollama")
                print(f"Ollama Error: {error_msg}")
                return f"Error generating itinerary: {error_msg}"
                
        except Exception as e:
            print(f"Request Error: {e}")
            return f"Error connecting to Ollama: {str(e)}"

    def ollama_processor(self, destination_name: str, days):
        prompt = f"Generate an detailed itinerary for me for a {days} day trip to {destination_name}:\n"

        payload = {"model": "llama3.1:latest", "prompt": prompt, "stream": False}
        try:
            response = requests.post(self.url, headers=self.headers, json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "Error: No response from model")
        except Exception as e:
            return f"Error: {str(e)}"
