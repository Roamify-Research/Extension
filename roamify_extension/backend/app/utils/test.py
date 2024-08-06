import transformers
import torch
import json

model_id = "meta-llama/Meta-Llama-3-8B-Instruct"
hf_token = "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"  # Your Hugging Face token

# Load the text generation pipeline with specified settings
pipe = transformers.pipeline(
    "text-generation",
    model=model_id,
    tokenizer=model_id,
    model_kwargs={"torch_dtype": torch.bfloat16},
    device_map="cuda:0",  # Let the library handle device mapping automatically
    token=hf_token  # Ensure authentication for loading the model
)

def return_output(text):
    prompt = [
        {
            "role" : "user",
            "content": f"Generate an detailed itinerary for me for a 5 day trip to Delhi and here are the suggested places I would like to cover:- {text}"
        }
    ]

    # Generate text based on the prompt
    generated_texts = pipe(prompt, max_length=256, pad_token_id=pipe.tokenizer.eos_token_id,
                            temperature=0.7, top_p=0.9, top_k=50, num_beams=5, no_repeat_ngram_size=2,
                            early_stopping=True)
    generated_text = generated_texts[0]['generated_text']
    print(generated_text)

    return generated_text
