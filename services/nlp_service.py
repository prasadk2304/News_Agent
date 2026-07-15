import json
import re
from collections import Counter
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import TfidfVectorizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from nltk.tokenize import sent_tokenize
from loguru import logger
from config.settings import settings

def clean_scraped_text(text: str) -> str:
    if not text:
        return ""
    
    # 1. Remove markdown images: ![alt](url) or [ ! [alt](url) ]
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'\[\s*!\s*\[.*?\]\(.*?\)\s*.*?\]', '', text)
    
    # 2. Remove social media / navigation boilerplate explicitly
    boilerplate_words = ['linkedin', 'google news', 'watchlist', 'facebook', 'twitter', 'share', 'subscribe', 'cookie', 'newsletter', 'privacy policy']
    for word in boilerplate_words:
        text = re.sub(rf'\[[^\]]*?{word}[^\]]*?\]\(.*?\)', '', text, flags=re.IGNORECASE)
        
    # Remove remaining markdown link URLs: [Anchor text](https://...) -> Anchor text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    
    # 3. Remove raw URLs (https://...)
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    # 4. Remove leading hash markup (# 2 green data centres -> 2 green data centres)
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    
    # 5. Clean up extra whitespace and newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def is_clean_sentence(sentence: str) -> bool:
    s = sentence.strip()
    if len(s) < 30 or len(s.split()) < 5:
        return False
    if "http" in s or "www." in s or s.count('/') > 3:
        return False
    if any(stop in s.lower() for stop in ['all rights reserved', 'click here', 'read original', 'updated:', 'written by', 'google news follow', 'watchlist']):
        return False
    return True

class NLPService:
    def __init__(self):
        try:
            self.nlp = spacy.load(settings.SPACY_MODEL)
            self.sia = SentimentIntensityAnalyzer()
        except Exception as e:
            logger.error(f"Failed to load NLP models: {str(e)}. Run: python -m spacy download {settings.SPACY_MODEL}")
            raise

    def get_sentiment(self, text: str) -> dict:
        if not text:
            return {"score": 0.0, "label": "neutral", "positive": 0.0, "negative": 0.0, "neutral": 1.0}
            
        # Run VADER on first 1000 chars
        truncated_text = text[:1000]
        scores = self.sia.polarity_scores(truncated_text)
        
        compound = scores["compound"]
        if compound > 0.05:
            label = "positive"
        elif compound < -0.05:
            label = "negative"
        else:
            label = "neutral"
            
        return {
            "score": compound,
            "label": label,
            "positive": scores["pos"],
            "negative": scores["neg"],
            "neutral": scores["neu"]
        }

    def extract_entities(self, text: str) -> dict:
        if not text:
            return {"persons": [], "organizations": [], "locations": [], "dates": []}
            
        # Run spaCy on first 1500 chars
        doc = self.nlp(text[:1500])
        
        persons = set()
        orgs = set()
        locs = set()
        dates = set()
        
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                persons.add(ent.text)
            elif ent.label_ == "ORG":
                orgs.add(ent.text)
            elif ent.label_ in ["GPE", "LOC"]:
                locs.add(ent.text)
            elif ent.label_ == "DATE":
                dates.add(ent.text)
                
        return {
            "persons": list(persons),
            "organizations": list(orgs),
            "locations": list(locs),
            "dates": list(dates)
        }

    def extract_keywords(self, text: str, top_n: int = 8) -> list[str]:
        if not text or len(text.split()) < 20:
            # Fallback if too short
            words = [token.text.lower() for token in self.nlp(text) if token.is_alpha and not token.is_stop]
            return [w for w, c in Counter(words).most_common(top_n)]
            
        try:
            vectorizer = TfidfVectorizer(stop_words='english', max_features=50, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform([text])
            feature_names = vectorizer.get_feature_names_out()
            scores = zip(vectorizer.get_feature_names_out(), tfidf_matrix.toarray()[0])
            sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
            return [name for name, score in sorted_scores[:top_n]]
        except Exception as e:
            logger.warning(f"TF-IDF extraction failed, falling back: {str(e)}")
            words = [token.text.lower() for token in self.nlp(text) if token.is_alpha and not token.is_stop]
            return [w for w, c in Counter(words).most_common(top_n)]

    def summarize(self, text: str, sentences: int = 3) -> str:
        cleaned_text = clean_scraped_text(text)
        if not cleaned_text:
            return ""
            
        try:
            parser = PlaintextParser.from_string(cleaned_text, Tokenizer("english"))
            summarizer = LsaSummarizer()
            summary_sents = [str(sentence) for sentence in summarizer(parser.document, sentences * 3)]
            valid_sents = [s for s in summary_sents if is_clean_sentence(s)]
            if len(valid_sents) >= sentences:
                return " ".join(valid_sents[:sentences])
            elif valid_sents:
                return " ".join(valid_sents)
            else:
                return " ".join(summary_sents[:sentences])
        except Exception as e:
            logger.warning(f"Sumy summarization failed, falling back: {str(e)}")
            try:
                sents = [s for s in sent_tokenize(cleaned_text) if is_clean_sentence(s)]
                return " ".join(sents[:sentences])
            except:
                return cleaned_text[:500] + "..."

    def classify_category(self, title: str, content: str) -> str:
        text_to_search = (f"{title} {content[:200]}").lower()
        
        rules = {
            "Technology": ["software", "app", "code", "github", "startup", "api", "cloud"],
            "AI & Machine Learning": ["ai", "artificial intelligence", "machine learning", "llm", "gpt", "neural", "deep learning", "model"],
            "Business & Finance": ["market", "stock", "economy", "revenue", "investment", "startup", "funding", "ipo", "acquisition"],
            "Science": ["research", "study", "scientists", "discovery", "nasa", "space", "quantum", "biology"],
            "Health & Medicine": ["health", "medical", "hospital", "vaccine", "drug", "treatment", "disease", "clinical"],
            "Politics & World Affairs": ["government", "president", "election", "congress", "policy", "diplomat", "minister", "senate"],
            "Cybersecurity": ["hack", "breach", "malware", "ransomware", "vulnerability", "security", "phishing", "cyber"],
            "Environment": ["climate", "carbon", "renewable", "emission", "environment", "pollution", "solar", "wind energy"],
            "Sports": ["football", "basketball", "soccer", "cricket", "olympic", "championship", "athlete", "match", "score"],
            "Entertainment": ["movie", "music", "celebrity", "streaming", "netflix", "spotify", "film", "award"]
        }
        
        for category, keywords in rules.items():
            if any(keyword in text_to_search for keyword in keywords):
                return category
                
        return "Other"

    def process_article(self, article: dict) -> dict:
        content = article.get("text") or article.get("content") or ""
        if not content and article.get("highlights"):
            content = "\n\n".join(article.get("highlights"))
            
        content = clean_scraped_text(content)
        article["text"] = content
        article["content"] = content
        
        title = article.get("title") or ""
        
        if not content:
            return article
            
        sentiment_data = self.get_sentiment(content)
        entities = self.extract_entities(content)
        keywords = self.extract_keywords(content)
        summary = self.summarize(content)
        category = self.classify_category(title, content)
        word_count = len(content.split())
        
        article.update({
            "summary": summary,
            "sentiment_score": sentiment_data["score"],
            "sentiment_label": sentiment_data["label"],
            "keywords": ",".join(keywords),
            "entities_json": json.dumps(entities),
            "category": category,
            "word_count": word_count
        })
        
        return article
