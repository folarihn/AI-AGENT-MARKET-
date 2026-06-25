"""Draft a professional email from bullet points. Reads input.json."""
import json

GREETING = {
    'formal': 'Dear {name},',
    'friendly': 'Hi {name},',
    'concise': 'Hello {name},',
}
SIGNOFF = {
    'formal': 'Kind regards,',
    'friendly': 'Cheers,',
    'concise': 'Thanks,',
}


def draft(recipient: str, points, tone: str, sender: str) -> dict:
    tone = tone if tone in GREETING else 'friendly'
    name = recipient or 'there'
    lines = [GREETING[tone].format(name=name), '']
    if tone == 'concise':
        lines.append('Quick note:')
    else:
        lines.append('I hope you are well. I wanted to reach out regarding the following:')
    lines.append('')
    for p in points:
        lines.append(f'- {p}')
    lines.append('')
    lines.append('Let me know if you have any questions.')
    lines.append('')
    lines.append(SIGNOFF[tone])
    lines.append(sender or 'Me')
    subject = points[0][:60] if points else 'Quick note'
    return {'subject': subject, 'body': '\n'.join(lines)}


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    points = data.get('points') or []
    if isinstance(points, str):
        points = [p.strip() for p in points.split('\n') if p.strip()]
    result = draft(str(data.get('recipient', '')), points, str(data.get('tone', 'friendly')), str(data.get('sender', '')))
    print(json.dumps(result))


if __name__ == '__main__':
    main()
