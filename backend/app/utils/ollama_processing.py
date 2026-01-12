import requests


class ollama_processor:
    def __init__(self):
        self.url = "http://localhost:11434/api/generate"

        self.headers = {"Content-Type": "application/json"}

    def ollama_attraction(
        self, attractions: dict, days, historical, amusement, natural, destination=None
    ):
        # prompt = f"Generate an detailed itinerary for me for a {days} day trip and the user has rated {historical} for historical places  here are the suggested places I would like to cover:\n"

        print(f"DEBUG: ollama_attraction received destination: '{destination}'")
        dest_str = f" to {destination}" if destination else ""
        prompt = f"Generate an detailed itinerary for me for a {days} day trip{dest_str} and these are the user preferences I have: Historical {historical}, Amusement {amusement}, Natural {natural} places and here are the suggested places I would like to cover:\n"
        count = 1
        for name, details in attractions.items():
            prompt += f"{count}: {name.title()}\n"
            prompt += f"Description: {details}\n\n"

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
