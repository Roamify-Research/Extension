import logging
import re
from typing import List

import nltk
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

logger = logging.getLogger(__name__)


class T5Processor:
    """Handles text summarization using a fine-tuned T5 model."""

    def __init__(self, model_name: str = "Roamify/finetuned-summarization_t5"):
        logger.info(f"Initializing T5 model: {model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Determine best available device
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")
            
        logger.info(f"T5 model using device: {self.device}")
        
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(self.device)

    def predict_summary(self, document: str) -> str:
        """Generates a summary for the given document."""
        inputs = self.tokenizer(
            [document], 
            truncation=True, 
            padding="longest", 
            return_tensors="pt"
        ).to(self.device)

        # Generation parameters
        gen_kwargs = {
            "max_length": 256,
            "min_length": 128,
            "length_penalty": 2.0,
            "num_beams": 4,
            "early_stopping": True
        }

        with torch.no_grad():
            output_tokens = self.model.generate(**inputs, **gen_kwargs)

        predicted_summary = self.tokenizer.decode(
            output_tokens[0], 
            skip_special_tokens=True
        )

        # Clean up output
        text = re.sub(r"\s+", " ", predicted_summary).strip()
        sentences = nltk.sent_tokenize(text)
        return " ".join(sentences)

    def predict(self, context: str) -> str:
        """Convenience method for summarization task."""
        return self.predict_summary("summarize: " + context)
