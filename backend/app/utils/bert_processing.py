import logging
from typing import List

import torch
from transformers import BertForQuestionAnswering, BertTokenizer

logger = logging.getLogger(__name__)


class BERTProcessor:
    """Handles question answering using a BERT model."""

    def __init__(self, model_name: str = "bert-large-uncased-whole-word-masking-finetuned-squad"):
        logger.info(f"Initializing BERT model: {model_name}")
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        
        # Determine best available device
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")
            
        logger.info(f"BERT model using device: {self.device}")
        self.model = BertForQuestionAnswering.from_pretrained(model_name).to(self.device)

    def answer_question(self, question: str, context: str) -> str:
        """Extracts an answer to the question from the provided context."""
        encoding = self.tokenizer.encode_plus(
            text=question, 
            text_pair=context, 
            add_special_tokens=True,
            return_tensors="pt"
        ).to(self.device)
        
        input_ids = encoding["input_ids"]
        token_type_ids = encoding["token_type_ids"]

        with torch.no_grad():
            outputs = self.model(input_ids=input_ids, token_type_ids=token_type_ids)
            
        start_scores = outputs.start_logits
        end_scores = outputs.end_logits

        start_index = torch.argmax(start_scores)
        end_index = torch.argmax(end_scores)

        # Convert tokens back to string
        tokens = self.tokenizer.convert_ids_to_tokens(input_ids[0])
        answer_tokens = tokens[start_index : end_index + 1]
        
        # Handle subword tokens (##)
        answer = ""
        for word in answer_tokens:
            if word.startswith("##"):
                answer += word[2:]
            else:
                answer += " " + word
        
        return answer.strip()
