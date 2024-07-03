from app.utils.nlp_process import NLP_Processor
from app.utils.t5_processing import T5Processor
from app.utils.llama_processing import LlamaProcessor

class Pipeline:
    def __init__(self):
        self.nlp_processor = NLP_Processor()
        self.t5_processor = T5Processor()
        self.llama_processor = LlamaProcessor()

    def pipeline_processing_t5(self, document):
        processed_document = self.nlp_processor.NLP_Processing(document)
        for key, text in processed_document.items():
            processed_document[key] = self.t5_processor.predict(text)
        return processed_document
    
    def pipeline_processing_llama(self, document):
        processed_document = self.nlp_processor.NLP_Processing(document)
        for key, text in processed_document.items():
            processed_document[key] = self.llama_processor.predict_summary(text)
        return processed_document