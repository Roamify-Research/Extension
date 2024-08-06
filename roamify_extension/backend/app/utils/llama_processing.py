import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextStreamer, pipeline

# Define the prompt template
alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

class LlamaProcessing:
    def __init__(self, model_path):
        self.model_path = model_path
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            device_map="cuda:0"
        )
        self.generator = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)

    def predict_summary(self, text):
        prompt = alpaca_prompt.format(
            "Summarize the following Input briefly in about 2-3 lines starting with the name of the attraction.",  # instruction
            text,  # input
            ""  # output - leave this blank for generation!
        )
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        # Adjust the parameters
        result = self.model.generate(
            **inputs,
            max_new_tokens=256,  # Experiment with different values
            repetition_penalty=2.0,  # Ensure repetition_penalty is set here
            streamer=TextStreamer(self.tokenizer)
        )
        
        return self.tokenizer.decode(result[0], skip_special_tokens=True)
    
    def update_summary(self, text):

        prompt = alpaca_prompt.format(
            "Given the following text which includes key information about a tourist attraction, generate a concise summary in 100 words",  # Update with your specific instruction
            text,  # Input text to summarize
            ""  # Output placeholder, leave blank for generation
        )

        # Tokenize the prompt
        inputs = self.tokenizer(prompt, return_tensors="pt")

        # Generate text based on the prompt
        generated_texts = self.generator(prompt, max_length=256, pad_token_id=self.tokenizer.eos_token_id,
                                         temperature=0.7, top_p=0.9, top_k=50, num_beams=5, no_repeat_ngram_size=2,
                                         early_stopping=True)
        generated_text = generated_texts[0]['generated_text']
        print(generated_text)
        return generated_text
    
    def generate_itinerary(self):
        prompt = {
            "role": "Traveler",
            "location": "Paris",
            "duration": "3 days",
            "interest": "Art, History, Culture",
            "budget": "$500",
            "accommodation": "Hotel",
            "transport": "Public transport",
            "food": "Local cuisine",
            "attractions": [
                "Eiffel Tower",
                "Louvre Museum",
                "Notre Dame Cathedral",
                "Champs-Elysees",
                "Montmartre",
                "Seine River Cruise"
            ]
        }

        # Create a prompt for the LLaMA model
        input_prompt = f"Generate a detailed itinerary for a 3-day trip to Paris, including transportation, accommodation, and activities. The traveler is interested in Art, History, and Culture, and wants to visit the Eiffel Tower, Louvre Museum, Notre Dame Cathedral, Champs-Elysees, Montmartre, and Seine River Cruise. The budget is $500."
        # Generate the itinerary using the LLaMA model
        inputs = self.tokenizer(input_prompt, return_tensors="pt").to(self.model.device)
        result = self.model.generate(**inputs, max_new_tokens=8192, repetition_penalty=2.0)
        itinerary = self.tokenizer.decode(result[0], skip_special_tokens=True)

        return itinerary
