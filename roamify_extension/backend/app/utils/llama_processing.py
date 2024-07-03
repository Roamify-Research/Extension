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
        self.model = AutoModelForCausalLM.from_pretrained(model_path)

    def predict_summary(self, text):
        prompt = alpaca_prompt.format(
            "Summarize the following text briefly starting with the name of the attraction.",  # instruction
            text,  # input
            ""  # output - leave this blank for generation!
        )
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        text_streamer = TextStreamer(self.tokenizer)
        result = self.model.generate(**inputs, max_new_tokens=64, streamer=text_streamer)

        return self.tokenizer.decode(result[0], skip_special_tokens=True)

# Initialize the processing class with your model path from Hugging Face
model_path = "RoamifyRedefined/finetuned-summarization-llama3"
llama_processing = LlamaProcessing(model_path)
output = llama_processing.predict_summary("Bangalore Palace Winit deshpande for Wikimedia Commons Built by Chamaraja Wodeyar in the year 1887 Bangalore Palace is an inspired design by England s Windsor Castle and is one of the best tourist places in Bangalore The evocative palace comprises fortified arches towers architecture and green lawns along with sophisticated wood carvings in the interior It is where the royal family still resides at the present This architectural creation is nothing less than an epitome The palace has earned foundations that have been attributed to the Wodeyars of Mysore Location Vasanth Nagar BengaluruTimings Sunday to Monday from 10 00 AM to 5 00 PMEntry Fee INR 230 for Indians INR 460 for foreigners Must Read New Year Party In Bangalore")
print(output)
