from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import nltk
import re


class T5Processor:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained(
            "Roamify/finetuned-summarization_t5"
        )
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            "Roamify/finetuned-summarization_t5"
        )

    def predict_summary(self, document):
        device = self.model.device
        tokenized = self.tokenizer(
            [document], truncation=True, padding="longest", return_tensors="pt"
        )
        tokenized = {k: v.to(device) for k, v in tokenized.items()}

        # Increase max_length and add min_length
        max_length = 256  # Increase the max_length as desired
        min_length = 128  # Ensure the minimum length of the output

        # Set length_penalty to encourage longer generation
        length_penalty = 2.0
        num_beams = 4  # Use beam search to improve output quality

        tokenized_result = self.model.generate(
            **tokenized,
            max_length=max_length,
            min_length=min_length,
            length_penalty=length_penalty,
            num_beams=num_beams,
            early_stopping=True
        )

        tokenized_result = tokenized_result.to("cuda")
        predicted_summary = self.tokenizer.decode(
            tokenized_result[0], skip_special_tokens=True
        )

        text = re.sub(r"\s+", " ", predicted_summary)  # Remove extra whitespaces
        sentences = nltk.sent_tokenize(text)  # Sentence tokenization
        text = " ".join(sentences)
        return text

    def predict(self, context):
        return self.predict_summary("summarize: " + context)
