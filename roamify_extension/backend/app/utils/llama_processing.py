from unsloth import FastLanguageModel
import torch
from transformers import TextStreamer


alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

class LlamaProcessing:
    def __init__(self, model_path):
        max_seq_length = 2048
        dtype = None
        load_in_4bit = True

        access_token = "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"
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name = "RoamifyRedefined/finetuned-summarization-llama3",
            max_seq_length = max_seq_length,
            dtype = dtype,
            load_in_4bit = load_in_4bit,
            token = access_token,
            # device_map = "auto" # Optionally, let Transformers automatically decide the device mapping
        )

    def predict_summary(self, text):
        inputs = self.tokenizer(
        [
            alpaca_prompt.format(
                "Summarize the following text briefly starting with the name of the attraction.", # instruction
                text, # input
                "", # output - leave this blank for generation!
            )
        ], return_tensors = "pt").to("cuda")
        text_streamer = TextStreamer(self.tokenizer)
        result = self.model.generate(**inputs, streamer = text_streamer, max_new_tokens = 128)
        return result


LlamaProcessing = LlamaProcessing("RoamifyRedefined/finetuned-summarization-llama3")
LlamaProcessing.predict_summary("The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower.")