from app.utils.nlp_process import NLP_Processor
from app.utils.t5_processing import T5Processor
from app.utils.llama_processing import LlamaProcessing

class Pipeline:
    def __init__(self):
        self.nlp_processor = NLP_Processor()
        self.t5_processor = T5Processor()
        self.llama_processor = LlamaProcessing("RoamifyRedefined/finetuned-summarization-llama3")

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
    
    def pipeline_processing_llama(self, document):
        processed_document = self.nlp_processor.NLP_Processing(document)
        count = 1
        for key, text in processed_document.items():
            processed_document[key] = self.llama_processor.predict_summary(text)
            print(f"Attraction {count}: {key}")
            print(processed_document[key])
            print("\n\n")
            count += 1
        return processed_document