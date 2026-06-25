# JSON Prettifier

Validates a JSON string and returns a nicely indented, key-sorted version.
Handy for cleaning up API responses or config files.

## Input
```json
{ "json_string": "{\"b\":1,\"a\":2}", "indent": 2 }
```

## Output
```json
{ "pretty": "{\n  \"a\": 2,\n  \"b\": 1\n}", "valid": true }
```
