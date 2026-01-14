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

    def chat(self, message: str, itinerary: dict, chat_history: list) -> str:
        """
        Handle a chat message about the itinerary using Ollama.
        
        Args:
            message: The user's message
            itinerary: Current itinerary dict
            chat_history: List of previous messages [{"role": "user"|"assistant", "content": "..."}]
            
        Returns:
            AI response string
        """
        # Format itinerary for context
        itinerary_text = ""
        for day, activities in itinerary.items():
            itinerary_text += f"\n{day}:\n"
            for activity in activities:
                itinerary_text += f"  - {activity}\n"
        
        # Format chat history (last 6 messages for context)
        history_text = ""
        for msg in chat_history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"
        
        prompt = f"""You are Roamify's friendly travel assistant chatbot. You're helping a user with their travel itinerary.

Current Itinerary:
{itinerary_text}

Previous conversation:
{history_text}

User's message: {message}

Respond helpfully and conversationally. If they're asking about the itinerary, refer to specific details. If they want changes, acknowledge what they want and tell them to click "Modify Itinerary" to apply the changes. Keep responses concise but friendly (2-3 sentences max).

Your response:"""

        payload = {"model": "llama3.1:latest", "prompt": prompt, "stream": False}
        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "Sorry, I couldn't generate a response.")
        except Exception as e:
            print(f"Ollama chat error: {e}")
            return f"Sorry, I encountered an error: {str(e)}"

    def modify_itinerary(self, chat_history: list, original_itinerary: dict, preferences: dict) -> str:
        """
        Generate a modified itinerary based on chat feedback.
        
        Args:
            chat_history: List of chat messages
            original_itinerary: Current itinerary dict  
            preferences: Original generation preferences
            
        Returns:
            Modified itinerary text (to be parsed later)
        """
        # Extract user feedback from chat
        user_messages = [msg["content"] for msg in chat_history if msg["role"] == "user"]
        feedback_text = "\n".join([f"- {msg}" for msg in user_messages])
        
        # Format original itinerary
        itinerary_text = ""
        for day, activities in original_itinerary.items():
            itinerary_text += f"\n{day}:\n"
            for activity in activities:
                itinerary_text += f"  - {activity}\n"
        
        destination = preferences.get("destination", "the destination")
        days = preferences.get("day", 3)
        historical = preferences.get("historical", 3)
        amusement = preferences.get("amusement", 3)
        natural = preferences.get("natural", 3)
        cultural = preferences.get("cultural", 3)
        
        prompt = f"""You are an expert travel agent. Modify this {days}-day itinerary for {destination} based on user feedback.

User Preferences: Historical: {historical}/5, Amusement: {amusement}/5, Natural: {natural}/5, Cultural: {cultural}/5

Original itinerary:
{itinerary_text}

User's requested changes:
{feedback_text}

Generate a MODIFIED itinerary that incorporates the user's feedback. Keep the same day-by-day format:

Day 1: [Theme]
- Morning: Activity
- Afternoon: Activity
- Evening: Activity

Day 2: [Theme]
...

Modified itinerary:"""

        payload = {"model": "llama3.1:latest", "prompt": prompt, "stream": False}
        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "Error: No response from model")
        except Exception as e:
            print(f"Ollama modify error: {e}")
            return f"Error: {str(e)}"
