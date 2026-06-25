"""Format rough notes into a daily standup update."""
import json


def as_list(value):
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [line.strip('- ').strip() for line in value.split('\n') if line.strip()]
    return []


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    yesterday = as_list(data.get('yesterday'))
    today = as_list(data.get('today'))
    blockers = as_list(data.get('blockers'))

    def section(title, items, empty):
        body = '\n'.join(f'  - {i}' for i in items) if items else f'  - {empty}'
        return f'*{title}*\n{body}'

    update = '\n\n'.join([
        section('Yesterday', yesterday, 'Nothing logged'),
        section('Today', today, 'Nothing planned yet'),
        section('Blockers', blockers, 'None'),
    ])
    print(json.dumps({'standup': update}))


if __name__ == '__main__':
    main()
