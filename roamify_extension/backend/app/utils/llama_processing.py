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

        self.model = FastLanguageModel.get_peft_model(
            self.model,
            r = 16, # Choose any number > 0 ! Suggested 8, 16, 32, 64, 128
            target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                            "gate_proj", "up_proj", "down_proj",],
            lora_alpha = 16,
            lora_dropout = 0, # Supports any, but = 0 is optimized
            bias = "none",    # Supports any, but = "none" is optimized
            # [NEW] "unsloth" uses 30% less VRAM, fits 2x larger batch sizes!
            use_gradient_checkpointing = "unsloth", # True or "unsloth" for very long context
            random_state = 3407,
            use_rslora = False,  # We support rank stabilized LoRA
            loftq_config = None, # And LoftQ
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