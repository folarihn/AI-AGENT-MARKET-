# Text Summarizer

Condenses long text into a short summary using frequency-based extractive
ranking. No external services, no API keys, runs offline.

## Input
```json
{ "text": "Your long passage here...", "max_sentences": 3 }
```

## Output
```json
{ "summary": "The most important sentences.", "sentence_count": 3 }
```

## Run locally
```bash
echo '{"text":"...", "max_sentences":2}' > input.json
python3 main.py
```
