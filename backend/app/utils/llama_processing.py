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
                "repetition_penalty": 1.5,  # Adjusted repetition penalty
            },
            device_map="cuda:0" if torch.cuda.is_available() else "cpu",
            use_auth_token=True
        )

    def predict_summary(self, text):
        prompt = alpaca_prompt.format(
            "Summarize the following text briefly starting with the name of the attraction.",  # instruction
            text,  # input
            ""  # output - leave this blank for generation!
        )
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        text_streamer = TextStreamer(self.tokenizer)
        result = self.model.generate(
            **inputs,
            max_new_tokens=100,  # Adjusted max_new_tokens
            repetition_penalty=1.5,  # Ensure this is passed if necessary
            temperature=0.7,  # Control randomness
            top_p=0.9,  # Nucleus sampling
            top_k=50  # Top-k sampling
        )
        
        generated_text = self.tokenizer.decode(result[0], skip_special_tokens=True)
        
        return generated_text