# Load model directly
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B")

# Define the prompt template
alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.
Instructions:
{}
Input:
{}
Response:
{}"""

def predict_summary(text):
    prompt = alpaca_prompt.format(
        "Summarize the following text briefly starting with the name of the attraction.", # instruction
        text, # input
        "" # output - leave this blank for generation!
    )
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    result = model.generate(**inputs, max_new_tokens=64)
    
    return tokenizer.decode(result[0], skip_special_tokens=True)

# Test the model
text = "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower."
print(predict_summary(text))