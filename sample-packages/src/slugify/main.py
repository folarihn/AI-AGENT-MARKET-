"""Turn a string into a URL-safe slug."""
import json
import re
import unicodedata


def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    print(json.dumps({'slug': slugify(str(data.get('text', '')))}))


if __name__ == '__main__':
    main()
