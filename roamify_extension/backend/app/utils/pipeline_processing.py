from app.utils.nlp_process import NLP_Processor
from app.utils.t5_processing import T5Processor
from app.utils.llama_processing import LlamaProcessing
from app.utils.bert_processing import BERT_Processer
from app.utils.ollama_processing import ollama_processor

class Pipeline:
    def __init__(self):
        self.nlp_processor = NLP_Processor()
        self.t5_processor = T5Processor()
        self.ollama_processor = ollama_processor()
        self.llama_processor = LlamaProcessing("RoamifyRedefined/Llama3-summarization")
        # self.bert_processor = BERT_Processer()

    def pipeline_processing_t5(self, document):
        count = 1
        processed_document = self.nlp_processor.NLP_Processing(document)
        for key, text in processed_document.items():
            result = self.t5_processor.predict(text)
            print(f"Attraction {count}: {key}\n\n")
            print(f"Old: {processed_document[key]}\n")
            print(f"New: {result}")
            print("\n\n")
            count += 1
            processed_document[key] = result
        return processed_document
    
    def pipeline_processing_llama_t5(self, document):
        count = 1
        processed_document = self.nlp_processor.NLP_Processing(document)
        print("Keys: ", processed_document.keys())
        print("Attractions: ", len(processed_document))
        for key, text in processed_document.items():
            result = self.t5_processor.predict(text)
            print(f"Attraction {count}: {key}\n\n")
            print(f"Old: {processed_document[key]}\n")
            print(f"New: {result}")
            
            result_updated = self.llama_processor.update_summary(result)
            print(f"Llama modified: {result_updated}")
            print("\n\n")
            count += 1
            processed_document[key] = result_updated
        return processed_document
        
    def pipeline_processing_llama(self, document, days):
        processed_document = self.nlp_processor.NLP_Processing(document)
        result = {}
        count = 1
        for key, text in processed_document.items():
            processed_document[key] = self.llama_processor.predict_summary(text)
            print(f"Attraction {count}: {key}")
            print(processed_document[key])
            words_text = text.split(" ")
            name = self.bert_processor.answer_question("What is the name of the attraction?", " ".join(words_text[:5]))
            entry_fee = self.bert_processor.answer_question("What is the entry fee?", text[:500])
            for word in entry_fee.split():
                if word.isdigit():
                    entry_fee = "INR " + word
                    break
            opening_hours = self.bert_processor.answer_question("What are the opening hours?", text[:500])
            
            ans = ""
            for word in opening_hours.split():
                if word.lower() == "am":
                    ans += word.upper() + " "
                    
                elif word.lower() == "pment":
                    ans += "PM"
            
            count += 1
            
            processed_document[key] += f".Entry Fee:\n{entry_fee}.Opening Hours:\n{ans}"
            words = name.split(" ")
            words.pop()
            
            name = " ".join(words)
            result[name] = processed_document[key]
        return result
    
    def t5_ollama_processing(self, document, days):
        count = 1
        processed_document = self.nlp_processor.NLP_Processing(document)
        for key, text in processed_document.items():
            result = self.t5_processor.predict(text)
            print(f"Attraction {count}: {key}\n\n")
            print(f"Old: {processed_document[key]}\n")
            print(f"New: {result}")
            print("\n\n")
            count += 1
            processed_document[key] = result
        
        return self.ollama_processor.ollama_processor(processed_document, days)
        