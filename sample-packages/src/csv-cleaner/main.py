"""Clean a CSV string: trim, drop empties, dedupe, snake_case headers."""
import csv
import io
import json
import re


def snake(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r'[^a-z0-9]+', '_', name)
    return name.strip('_')


def clean(raw: str) -> dict:
    reader = list(csv.reader(io.StringIO(raw)))
    if not reader:
        return {'cleaned_csv': '', 'rows_in': 0, 'rows_out': 0, 'duplicates_removed': 0}
    header = [snake(h) for h in reader[0]]
    seen = set()
    out_rows = []
    dupes = 0
    for row in reader[1:]:
        cells = [c.strip() for c in row]
        if not any(cells):
            continue
        key = tuple(cells)
        if key in seen:
            dupes += 1
            continue
        seen.add(key)
        out_rows.append(cells)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    writer.writerows(out_rows)
    return {
        'cleaned_csv': buf.getvalue().strip(),
        'rows_in': len(reader) - 1,
        'rows_out': len(out_rows),
        'duplicates_removed': dupes,
    }


def main() -> None:
    try:
        data = json.load(open('input.json'))
    except Exception:
        data = {}
    print(json.dumps(clean(str(data.get('csv', '')))))


if __name__ == '__main__':
    main()
