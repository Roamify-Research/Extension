from app.utils.nlp_process import NLPProcessor
from app.utils.t5_processing import T5Processor
from app.utils.llama_processing import LlamaProcessing
from app.utils.bert_processing import BERTProcessor
from app.utils.ollama_processing import ollama_processor
from app.utils.firecrawl_processing import FirecrawlProcessor


class Pipeline:
    def __init__(self):
        self.nlp_processor = NLPProcessor()
        self.t5_processor = T5Processor()
        self.ollama_processor = ollama_processor()
        self.llama_processor = LlamaProcessing("RoamifyRedefined/Llama3-summarization")
        self.bert_processor = BERTProcessor()
        self.firecrawl_processor = FirecrawlProcessor()

    def pipeline_processing_t5(self, document):
        count = 1
        processed_document = self.nlp_processor.process_web_text(document)
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
        processed_document = self.nlp_processor.process_web_text(document)
        print("Keys: ", processed_document.keys())
        print("Attractions: ", len(processed_document))
        for key, text in processed_document.items():
            result = self.t5_processor.predict(text)
            print(f"Attraction {count}: {key}\n\n")
            print(f"Old: {processed_document[key]}\n")
            print(f"New: {result}")

            if self.llama_processor.model:
                result_updated = self.llama_processor.update_summary(result)
                print(f"Llama modified: {result_updated}")
                processed_document[key] = result_updated
            else:
                processed_document[key] = result
            print("\n\n")
            count += 1
        return processed_document

    def pipeline_processing_llama(self, document, days):
        processed_document = self.nlp_processor.process_web_text(document)
        result = {}
        count = 1
        for key, text in processed_document.items():
            if self.llama_processor.model:
                processed_document[key] = self.llama_processor.predict_summary(text)
            else:
                processed_document[key] = text[:200] + "..." # Fallback
                
            print(f"Attraction {count}: {key}")
            print(processed_document[key])
            words_text = text.split(" ")
            
            name = self.bert_processor.answer_question(
                "What is the name of the attraction?", " ".join(words_text[:5])
            )
            entry_fee = self.bert_processor.answer_question(
                "What is the entry fee?", text[:500]
            )
            for word in entry_fee.split():
                if word.isdigit():
                    entry_fee = "INR " + word
                    break
            opening_hours = self.bert_processor.answer_question(
                "What are the opening hours?", text[:500]
            )

            ans = ""
            for word in opening_hours.split():
                if word.lower() == "am":
                    ans += word.upper() + " "

                elif word.lower() == "pment":
                    ans += "PM"

            count += 1

            processed_document[key] += f".Entry Fee:\n{entry_fee}.Opening Hours:\n{ans}"
            words = name.split(" ")
            if words:
                words.pop()

            name = " ".join(words)
            result[name] = processed_document[key]
        return result

    def t5_ollama_processing(self, document, days, historical, amusement, natural, destination=None, url=None, urls=None):
        # If document (text) is not provided, try to fetch it using Firecrawl
        if not document or len(document.strip()) < 50:
            gathered_text = ""
            
            # Handle list of URLs (Multi-tab support)
            if urls and isinstance(urls, list):
                print(f"Scraping multiple tabs: {len(urls)} URLs")
                for u in urls:
                    content = self.firecrawl_processor.scrape_url(u)
                    if content:
                        gathered_text += f"\n\n--- Source: {u} ---\n\n" + content
            
            # Handle single URL
            elif url:
                gathered_text = self.firecrawl_processor.scrape_url(url)
            
            # Handle destination search
            elif destination:
                gathered_text = self.firecrawl_processor.search_travel_info(destination)
            
            document = gathered_text
            
            if not document:
                print("Warning: Could not fetch document via Firecrawl. Proceeding with empty text.")
                document = ""

        count = 1
        processed_document = self.nlp_processor.process_web_text(document)
        for key, text in processed_document.items():
            result = self.t5_processor.predict(text)
            print(f"Attraction {count}: {key}\n\n")
            print(f"Old: {processed_document[key]}\n")
            print(f"New: {result}")
            print("\n\n")
            count += 1
            processed_document[key] = result

        itenary_text = self.ollama_processor.ollama_attraction(
            processed_document, days, historical, amusement, natural
        )
        return self.nlp_processor.parse_itinerary(itenary_text)

    def ollama_processing(self, destination_name, days):
        itenary_text = self.ollama_processor.ollama_processor(destination_name, days)
        return self.nlp_processor.parse_itinerary(itenary_text)
