# Professional Email Drafter

Give it the recipient, a few bullet points and a tone; get back a subject
line and a clean email body. Runs offline, fully deterministic.

## Input
```json
{
  "recipient": "Sam",
  "tone": "friendly",
  "sender": "Alex",
  "points": ["Reschedule Tuesday's call to Thursday", "Share the Q3 deck beforehand"]
}
```

## Output
```json
{ "subject": "Reschedule Tuesday's call to Thursday", "body": "Hi Sam,\n\n..." }
```

Tones: `formal`, `friendly`, `concise`.
