from app.utils.nlp_process import NLP_Processor
from app.utils.t5_processing import T5Processor


class Pipeline:
    def __init__(self):
        self.nlp_processor = NLP_Processor()
        self.t5_processor = T5Processor()

    def pipeline_processing(self, document):
        processed_document = self.nlp_processor.NLP_Processing(document)
        for key, text in processed_document.items():
            processed_document[key] = self.t5_processor.predict(text)
        return processed_document
    