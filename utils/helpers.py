import re

def clean_text(text: str) -> str:
    """Removes extra whitespace and newlines from text."""
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
