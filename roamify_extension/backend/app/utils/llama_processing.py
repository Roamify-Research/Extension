from unsloth import FastLanguageModel
import torch
from transformers import TextStreamer

# %%capture
# import torch
# major_version, minor_version = torch.cuda.get_device_capability()
# # Must install separately since Colab has torch 2.2.1, which breaks packages
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# if major_version >= 8:
#     # Use this for new   GPUs like Ampere, Hopper GPUs (RTX 30xx, RTX 40xx, A100, H100, L40)
#     !pip install --no-deps packaging ninja einops flash-attn xformers trl peft accelerate bitsandbytes
# else:
#     # Use this for older GPUs (V100, Tesla T4, RTX 20xx)
#     !pip install --no-deps xformers trl peft accelerate bitsandbytes
# pass
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
        FastLanguageModel.for_inference(self.model)
        inputs = self.tokenizer(
        [
            alpaca_prompt.format(
                "Summarize the following text briefly starting with the name of the attraction.", # instruction
                "Bangalore Palace Winit deshpande for Wikimedia Commons Built by Chamaraja Wodeyar in the year 1887 Bangalore Palace is an inspired design by England s Windsor Castle and is one of the best tourist places in Bangalore The evocative palace comprises fortified arches towers architecture and green lawns along with sophisticated wood carvings in the interior It is where the royal family still resides at the present This architectural creation is nothing less than an epitome The palace has earned foundations that have been attributed to the Wodeyars of Mysore Location Vasanth Nagar BengaluruTimings Sunday to Monday from 10 00 AM to 5 00 PMEntry Fee INR 230 for Indians INR 460 for foreigners Must Read New Year Party In Bangalore", # input
                "", # output - leave this blank for generation!
            )
        ], return_tensors = "pt").to("cuda")

        text_streamer = TextStreamer(self.tokenizer)
        result = self.model.generate(**inputs, streamer = text_streamer, max_new_tokens = 64)
        return result


LlamaProcessing = LlamaProcessing("RoamifyRedefined/finetuned-summarization-llama3")
LlamaProcessing.predict_summary("The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower.")