from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tokenizer = AutoTokenizer.from_pretrained("Roamify/finetuned-summarization_t5")
model = AutoModelForSeq2SeqLM.from_pretrained("Roamify/finetuned-summarization_t5")

def predict_summary(document):
    device = model.device
    tokenized = tokenizer([document], truncation=True, padding='longest', return_tensors='pt')
    tokenized = {k: v.to(device) for k, v in tokenized.items()}
    tokenized_result = model.generate(**tokenized, max_length=128)
    tokenized_result = tokenized_result.to('cpu')
    predicted_summary = tokenizer.decode(tokenized_result[0], skip_special_tokens=True)
    return predicted_summary

input_text = "summarize: Lal Bagh Botanical Gardens AmanDshutterbug for Wikimedia Commons This botanical garden is one of the most alluring places to visit in Bangalore and perhaps all of India Built by Haider Ali the garden was later modified by Tipu Sultan The garden comprises a glass house which was inspired by the London Crystal Palace Wonderfully spread across a huge land of 240 acres the garden has a large variety of 1800 species of plants trees and herbs Location Mavalli BangaloreTimings Monday to Sunday 6 00 AM to 7 00 PMEntry Fee INR 20 for Indians INR 15 for children Suggested Read Camping Near Bangalore"

# Generate and print the summary
summary = predict_summary(input_text)
print(summary)