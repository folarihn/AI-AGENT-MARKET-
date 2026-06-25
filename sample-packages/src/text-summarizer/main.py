"""Extractive text summarizer. Reads input.json -> prints {summary, sentence_count}."""
import json
import re


def summarize(text: str, max_sentences: int = 3) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s for s in sentences if s]
    if len(sentences) <= max_sentences:
        return ' '.join(sentences)

    words = re.findall(r'[a-z]+', text.lower())
    stop = {'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it', 'for', 'on', 'with', 'as', 'are', 'was'}
    freq = {}
    for w in words:
        if w not in stop:
            freq[w] = freq.get(w, 0) + 1

    def score(sentence: str) -> float:
        ws = re.findall(r'[a-z]+', sentence.lower())
        return sum(freq.get(w, 0) for w in ws) / (len(ws) or 1)

    ranked = sorted(sentences, key=score, reverse=True)[:max_sentences]
    ordered = [s for s in sentences if s in ranked]
    return ' '.join(ordered)


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    text = str(data.get('text', ''))
    max_sentences = int(data.get('max_sentences', 3) or 3)
    summary = summarize(text, max_sentences)
    print(json.dumps({'summary': summary, 'sentence_count': summary.count('.')}))


if __name__ == '__main__':
    main()
