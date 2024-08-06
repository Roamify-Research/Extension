import nltk
import spacy
import json
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

class NLP_Processor:
    def __init__(self):
        nltk.download('stopwords')
        nltk.download('punkt')
        self.stopwords = set(stopwords.words('english'))

    def NLP_Processing(self, webscraped_text):
        self.text = webscraped_text
        spacy_processed_text = self.spacy_nlp()
        attractions = self.sentence_processing(spacy_processed_text)
        processed_data = self.word_tokenize(attractions)
        return processed_data


    def spacy_nlp(self):
        nlp = spacy.load("en_core_web_lg")
        doc = nlp(self.text)
        return doc
    
    def sentence_processing(self, spacy_text):
        sentences = [sent.text for sent in spacy_text.sents]
        sentences_processed = []
        current_index = 0
        attractions = {}
        for sentence in sentences:
            s = sentence.split("\n")
            for i in s:
                s_ = i.split(".")
                sentences_processed.extend(s_)

        for index in range(len(sentences_processed)):
            sentence = sentences_processed[index].strip()
            if sentence.isdigit():
                val = int(sentences_processed[index])
                if val == current_index + 1:
                    current_index += 1
                    attractions[current_index] = ""
            
            else:
                if current_index != 0:
                    attractions[current_index] += (sentence + " ")
        return attractions
    
    def word_tokenize(self, attraction_data):
        attractions = {}
        for id, attraction in attraction_data.items():
            
            words = word_tokenize(attraction)
            name = ""

            for i in range(len(words)):
                if words[i].lower() == "image":
                    break
                name += (words[i] + " ")

            words = [w for w in words if w.isalnum() and  w != ":" and w != "-" and w.lower() != "image" and w.lower() != "credit" and w.lower() != "source"]
            attractions[name] = " ".join(words)
        
        return attractions

# data = open("scraped.txt","r").read()

# nlp_processor = NLP_Processor()
# processed_data = nlp_processor.NLP_Processing(data)
# print("Keys: ", processed_data.keys())
# print("Attractions: ", len(processed_data))