# Daily Standup Generator

Converts quick notes into a tidy standup update with Yesterday / Today /
Blockers sections, ready to paste into Slack.

## Input
```json
{
  "yesterday": ["Shipped login fix", "Reviewed 2 PRs"],
  "today": ["Start payments work"],
  "blockers": []
}
```

## Output
```json
{ "standup": "*Yesterday*\n  - Shipped login fix\n  ...\n\n*Blockers*\n  - None" }
```
