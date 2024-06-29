from transformers import AutoModel, AutoTokenizer

model_name = "Roamify/llama-3-finetuned-model"
model = AutoModel.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

input_text = "summarize: The quick brown fox jumps over the lazy dog."
inputs = tokenizer(input_text, return_tensors="pt")
outputs = model(**inputs)

print(outputs)