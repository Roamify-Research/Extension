import logging
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextStreamer, pipeline

logger = logging.getLogger(__name__)

# Define the prompt template
ALPACA_PROMPT = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""


class LlamaProcessing:
    """Handles text generation and summarization using Llama-based models."""

    def __init__(self, model_path: str):
        self.model_path = model_path
        logger.info(f"Initializing Llama model: {model_path}")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            
            # Determine best available device (auto will handle MPS on Mac)
            device_map = "auto"
            if torch.backends.mps.is_available():
                # Explicitly use MPS if available for better performance on Mac M-series
                logger.info("Using MPS device for Llama")
            
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path, 
                device_map=device_map,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            self.generator = pipeline(
                "text-generation", 
                model=self.model, 
                tokenizer=self.tokenizer
            )
        except Exception as e:
            logger.error(f"Failed to load Llama model from {model_path}: {e}")
            logger.warning("Llama functionality will be disabled.")
            self.model = None
            self.tokenizer = None

    def predict_summary(self, text: str) -> str:
        """Summarizes text using the Alpaca prompt format."""
        if not self.model or not self.tokenizer:
            return "Llama model not initialized."

        prompt = ALPACA_PROMPT.format(
            "Summarize the following Input briefly in about 2-3 lines starting with the name of the attraction.",
            text,
            "",
        )
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            result = self.model.generate(
                **inputs,
                max_new_tokens=256,
                repetition_penalty=1.2,  # Lowered from 2.0 to avoid weirdness
                streamer=TextStreamer(self.tokenizer),
            )

        return self.tokenizer.decode(result[0], skip_special_tokens=True)

    def update_summary(self, text: str) -> str:
        """Generates a concise summary based on provided key information."""
        if not self.model:
            return "Llama model not initialized."

        prompt = ALPACA_PROMPT.format(
            "Given the following text which includes key information about a tourist attraction, generate a concise summary in 100 words",
            text,
            "",
        )

        generated_texts = self.generator(
            prompt,
            max_new_tokens=256,
            pad_token_id=self.tokenizer.eos_token_id,
            temperature=0.7,
            top_p=0.9,
            num_beams=3,
            no_repeat_ngram_size=2,
            early_stopping=True,
        )
        return generated_texts[0]["generated_text"]

    def generate_itinerary(self, location: str, attractions: list, duration: str = "3 days") -> str:
        """Generates a travel itinerary."""
        if not self.model:
            return "Llama model not initialized."

        input_prompt = f"Generate a detailed itinerary for a {duration} trip to {location}, including the following attractions: {', '.join(attractions)}."
        
        inputs = self.tokenizer(input_prompt, return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            result = self.model.generate(
                **inputs, 
                max_new_tokens=1024, 
                repetition_penalty=1.2
            )
        return self.tokenizer.decode(result[0], skip_special_tokens=True)
