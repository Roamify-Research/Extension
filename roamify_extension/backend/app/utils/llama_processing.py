import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextStreamer

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
            config={
                "repetition_penalty": 2.0,
            }
        )

    def predict_summary(self, text):
        prompt = alpaca_prompt.format(
            "Give a brief description:",  # instruction
            text,  # input
            ""  # output - leave this blank for generation!
        )
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        text_streamer = TextStreamer(self.tokenizer)
        result = self.model.generate(**inputs, max_new_tokens=64, streamer=text_streamer)

        return self.tokenizer.decode(result[0], skip_special_tokens=True)

