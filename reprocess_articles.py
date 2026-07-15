from database.connection import SessionLocal
from database.models import Article
from services.nlp_service import NLPService, clean_scraped_text

def main():
    db = SessionLocal()
    nlp = NLPService()
    articles = db.query(Article).all()
    print(f"Reprocessing {len(articles)} existing articles in database...")
    count = 0
    for a in articles:
        text = a.content or ""
        cleaned = clean_scraped_text(text)
        # Check if summary has boilerplate or needs cleaning
        if cleaned != text or not a.summary or any(w in (a.summary or "").lower() for w in ["linkedin", "google news follow", "watchlist"]):
            if cleaned:
                a.content = cleaned
                a.summary = nlp.summarize(cleaned)
            else:
                a.summary = nlp.summarize(a.title)
            count += 1
    db.commit()
    print(f"Successfully cleaned and re-summarized {count} articles!")
    db.close()

if __name__ == "__main__":
    main()
