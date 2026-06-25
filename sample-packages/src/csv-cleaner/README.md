# CSV Cleaner

Tidies up messy CSV exports: trims whitespace, drops blank rows, removes
duplicate rows, and converts headers to `snake_case`.

## Input
```json
{ "csv": "First Name, Email\n Sam , sam@x.com\nSam,sam@x.com\n" }
```

## Output
```json
{ "cleaned_csv": "first_name,email\nSam,sam@x.com", "rows_in": 2, "rows_out": 1, "duplicates_removed": 1 }
```
