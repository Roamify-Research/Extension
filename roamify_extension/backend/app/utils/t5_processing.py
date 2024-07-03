from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

class T5Processor:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("t5-small")
        self.model = AutoModelForSeq2SeqLM.from_pretrained("t5-small")

    def predict_summary(self, document):
        device = self.model.device
        tokenized = self.tokenizer([document], truncation=True, padding='longest', return_tensors='pt')
        tokenized = {k: v.to(device) for k, v in tokenized.items()}
        tokenized_result = self.model.generate(**tokenized, max_length=128)
        tokenized_result = tokenized_result.to('cpu')
        predicted_summary = self.tokenizer.decode(tokenized_result[0], skip_special_tokens=True)
        return predicted_summary

    def predict(self, context):
        return self.predict_summary("summarize: " + context)