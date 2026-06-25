"""Validate and pretty-print a JSON string."""
import json


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    raw = data.get('json_string', '')
    indent = int(data.get('indent', 2) or 2)
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        print(json.dumps({'pretty': json.dumps(parsed, indent=indent, sort_keys=True), 'valid': True}))
    except Exception as exc:
        print(json.dumps({'pretty': '', 'valid': False, 'error': str(exc)}))


if __name__ == '__main__':
    main()
