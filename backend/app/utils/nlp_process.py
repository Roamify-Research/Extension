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

    def _extract_attractions(self, doc: spacy.tokens.Doc) -> Dict[int, str]:
        """Segments sentences and identifies attraction blocks based on numbering."""
        attractions = {}
        current_index = 0

        # Pattern to detect leading numbers like "1.", "1)", or just "1" at start of line
        number_pattern = re.compile(r"^(\d+)[\.\)]?\s*")

        for sent in doc.sents:
            sentence_text = sent.text.strip()
            if not sentence_text:
                continue

            match = number_pattern.match(sentence_text)
            if match:
                val = int(match.group(1))
                # Check if it follows the sequence
                if val == current_index + 1:
                    current_index = val
                    # Remove the number prefix from the content
                    content = number_pattern.sub("", sentence_text)
                    attractions[current_index] = content + " "
                    continue

            if current_index > 0:
                attractions[current_index] += sentence_text + " "

        return attractions

    def _clean_attractions(self, attraction_data: Dict[int, str]) -> Dict[str, str]:
        """Cleans attraction names and descriptions, removing noise words."""
        cleaned_attractions = {}
        noise_words = {"image", "credit", "source", "photo"}

        for _, raw_text in attraction_data.items():
            words = word_tokenize(raw_text)
            if not words:
                continue

            # Extract name: usually the first few words until a specific marker or "image"
            name_parts = []
            description_start_idx = 0
            for i, word in enumerate(words):
                if word.lower() in noise_words or word in {":", "-"}:
                    description_start_idx = i + 1
                    break
                name_parts.append(word)
                description_start_idx = i + 1

            name = " ".join(name_parts).strip()

            # Clean description
            description_words = [
                w
                for w in words[description_start_idx:]
                if w.isalnum() and w.lower() not in noise_words
            ]
            description = " ".join(description_words).strip()

            if name:
                cleaned_attractions[name] = description

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
