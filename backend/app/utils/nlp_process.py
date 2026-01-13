import json
import logging
import re
from typing import Dict, List

import nltk
import spacy
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NLPProcessor:
    """Processes text to extract and clean tourist attraction data."""

    def __init__(self, spacy_model: str = "en_core_web_lg"):
        # Explicitly check for NLTK resources to avoid silent hangs
        required_resources = [
            ("corpora/stopwords", "stopwords"),
            ("tokenizers/punkt", "punkt"),
            ("tokenizers/punkt_tab", "punkt_tab")
        ]
        
        for resource_path, download_name in required_resources:
            try:
                # Check if NLTK can find the resource
                nltk.data.find(resource_path)
            except (LookupError, OSError):
                # If not found, check if it's already working (sometimes detection fails but usage works)
                try:
                    if download_name == "stopwords":
                        from nltk.corpus import stopwords as _
                    elif "punkt" in download_name:
                        from nltk.tokenize import word_tokenize as _
                    logger.info(f"Resource {download_name} is already available via environment.")
                    continue
                except (ImportError, LookupError):
                    logger.info(f"Resource {download_name} not found. Attempting download...")
                    try:
                        nltk.download(download_name)
                    except Exception as e:
                        logger.error(f"Failed to download {download_name}: {e}")
                        logger.info("Proceeding anyway; the app might still work if paths are set manually.")

        logger.info("NLP resources initialization complete.")
        self.stop_words = set(stopwords.words("english"))

        # Load SpaCy model
        logger.info(f"Loading SpaCy model '{spacy_model}' (this can take 15-30 seconds)...")
        try:
            self.nlp = spacy.load(spacy_model)
            logger.info("SpaCy model loaded successfully.")
        except OSError:
            logger.error(f"SpaCy model {spacy_model} not found.")
            logger.info(f"TIP: Run 'python -m spacy download {spacy_model}' manually.")
            raise

    def process_web_text(self, text: str) -> Dict[str, str]:
        """
        Main entry point for processing web-scraped text.
        Returns a dictionary mapping attraction names to cleaned descriptions.
        """
        if not text:
            return {}

        doc = self.nlp(text)
        attractions = self._extract_attractions(doc)
        cleaned_data = self._clean_attractions(attractions)
        return cleaned_data

    def _extract_attractions(self, doc: spacy.tokens.Doc) -> Dict[str, str]:
        """
        Extracts attractions by prioritizing Named Entities (LOC, FAC, ORG).
        Prevents junk titles (ads, slogans) by ensuring a relevant entity exists.
        """
        attractions = {}
        current_name = None
        
        # Patterns
        number_pattern = re.compile(r"^(\d+)[\.\)]?\s*(.*)")
        header_pattern = re.compile(r"^#{1,3}\s+(.*)|^\*\*(.*)\*\*$")
        source_pattern = re.compile(r"--- (Source|Search Results): .* ---")
        
        VALID_ENTITIES = {"FAC", "ORG", "LOC", "GPE", "WORK_OF_ART"} # Removed PERSON to avoid junk like names
        
        for sent in doc.sents:
            text = sent.text.strip()
            if not text:
                continue

            # 0. Reset on Source Marker
            if source_pattern.search(text):
                current_name = None
                continue

            potential_title = None

            # 1. Check for Numbered List
            num_match = number_pattern.match(text)
            if num_match:
                potential_title = num_match.group(2).strip()

            # 2. Check for Headers
            if not potential_title:
                header_match = header_pattern.match(text)
                if header_match:
                    potential_title = (header_match.group(1) or header_match.group(2)).strip()
            
            # 3. Check for Short Prominent Lines (NER Candidate)
            if not potential_title and len(text.split()) < 10 and text[0].isupper():
                potential_title = text

            # 4. Validate Title with NER
            if potential_title:
                # Filter URL slugs or fragmented links
                if "http" in potential_title.lower() or "www." in potential_title.lower() or "source:" in potential_title.lower():
                     logger.debug(f"Skipping URL/Link title: {potential_title}")
                     continue

                # Filter specific junk terms common on travel sites
                is_junk = any(x in potential_title.lower() for x in [
                    "book now", "package", "call", "click here", "read more", "tripadvisor", 
                    "viator", "expedia", "tour", "guide", "faq", "question", "blog", 
                    "newsletter", "subscribe", "contact us", "privacy policy"
                ])
                
                if is_junk:
                    logger.debug(f"Skipping junk term title: {potential_title}")
                    continue

                # Analyze sentence entities
                relevant_entities = [ent.text for ent in sent.ents if ent.label_ in VALID_ENTITIES]
                
                if relevant_entities:
                    # HEURISTIC: Use the first/most prominent entity as the Attraction Name
                    entity_name = relevant_entities[0]
                    
                    # Extra check: Ensure entity isn't just a junk word
                    if entity_name.lower() in ["tripadvisor", "viator", "google", "facebook", "twitter"]:
                        continue

                    current_name = entity_name
                    
                    if current_name not in attractions:
                        attractions[current_name] = ""
                    logger.debug(f"Extracted Entity-based attraction: {current_name}")
                    continue
                
                # If it was a numbered list but NO entity, it might be junk
                if num_match and not relevant_entities:
                   logger.debug(f"Skipping junk numbered item: {potential_title}")
                   continue

            # 5. Append to Description
            if current_name:
                attractions[current_name] += text + " "
        
        logger.info(f"Extracted {len(attractions)} attractions using NER-first approach.")
        return attractions

    def _clean_attractions(self, attraction_data: Dict[str, str]) -> Dict[str, str]:
        """Cleans descriptions."""
        cleaned_attractions = {}
        
        for name, raw_desc in attraction_data.items():
            # Name is already an entity, so just strip
            clean_name = name.strip()
            
            # Clean Description
            doc = self.nlp(raw_desc)
            clean_desc_sentences = []
            
            for sent in doc.sents:
                s_text = sent.text.strip()
                # Filter noise lines
                if any(nw in s_text.lower() for nw in ["image source", "photo credit", "read full review", "book now"]):
                    continue
                clean_desc_sentences.append(s_text)
            
            full_desc = " ".join(clean_desc_sentences).strip()
            
            if clean_name and full_desc:
                cleaned_attractions[clean_name] = full_desc

        return cleaned_attractions

    def parse_itinerary(self, itinerary_text: str) -> Dict[str, List[str]]:
        """Parses a raw itinerary string into a structured dictionary by day."""
        # Regex to find "**Day X: ...**" blocks
        day_pattern = re.compile(
            r"(\*\*Day \d+:.*?\*\*)\n\n(.*?)(?=\n\n\*\*Day \d+:|\Z)", re.DOTALL
        )
        matches = day_pattern.findall(itinerary_text)

        structured_itinerary = {}
        for heading, content in matches:
            day_key = heading.strip("*").strip()
            
            # Clean each line in the content
            lines = []
            for line in content.split("\n"):
                cleaned_line = line.strip().replace("*", "").strip()
                if cleaned_line:
                    lines.append(cleaned_line)
            
            structured_itinerary[day_key] = lines

        return structured_itinerary
