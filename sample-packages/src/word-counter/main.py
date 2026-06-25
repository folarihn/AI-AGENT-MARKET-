"""Word/character/sentence counter with reading-time estimate."""
import json
import re


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    text = str(data.get('text', ''))
    words = re.findall(r"[A-Za-z0-9']+", text)
    sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
    result = {
        'words': len(words),
        'characters': len(text),
        'sentences': len(sentences),
        'reading_time_minutes': round(len(words) / 200, 2),
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
