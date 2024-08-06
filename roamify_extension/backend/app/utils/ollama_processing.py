import requests


class ollama_processor:
    def __init__(self):
        self.url = "http://localhost:11434/api/generate"
        
        self.headers = {
            'Content-Type': 'application/json'
        }
    def ollama_processor(self, attractions, days):
        prompt = f"Generate an detailed itinerary for me for a {days} day trip and here are the suggested places I would like to cover:\n"
        count = 1
        for name, details in attractions.items():
            prompt += f"{count}: {name.title()}\n"
            prompt += f"Description: {details}\n\n"
        
            count+=1
        payload = {"model":"llama3.1", "prompt":prompt, "stream":False}
        response = requests.post(self.url, headers=self.headers, json=payload)
        print(response.json()['response'])
        return response.json()['response']
           