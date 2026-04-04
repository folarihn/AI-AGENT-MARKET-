# Agent Package Specification (v1.0)

## 1. Package Structure
All agents must be packaged as a compressed archive (`.zip` or `.tar.gz`) with the following strict directory structure:

```
agent-name-v1.0.0/
├── agent.json          # [REQUIRED] The manifest file defining metadata and runtime behavior
├── README.md           # [REQUIRED] Documentation for users (installation, usage, troubleshooting)
├── LICENSE             # [REQUIRED] Full license text
├── src/                # [REQUIRED] Source code directory
│   ├── main.py         # (Example) Entry point script
│   └── ...
├── assets/             # [OPTIONAL] Images, icons, or static resources
│   └── icon.png        # Recommended: 512x512px PNG icon
└── requirements.txt    # [REQUIRED if Python] Dependency list
    OR
    package.json        # [REQUIRED if Node.js] Dependency list
    OR
    Dockerfile          # [REQUIRED if Docker] Container definition
```

### File Constraints
*   **Root Directory**: The archive must unzip into a single root directory named `{agent_name}-v{version}`.
*   **Max Package Size**: 50 MB (compressed). Larger assets should be downloaded at runtime or hosted externally (with permission).
*   **Allowed File Types**: `.json`, `.md`, `.txt`, `.py`, `.js`, `.ts`, `.go`, `.sh`, `.bat`, `.png`, `.jpg`, `.yaml`, `.yml`, `.dockerfile`.
*   **Blocked File Types**: `.exe`, `.dll`, `.so`, `.bin`, `.msi`, `.jar` (unless inside a Docker container), `.zip` (nested archives). *Binaries are strictly prohibited in the source package to ensure code reviewability.*

---

## 2. Manifest Schema (`agent.json`)
The `agent.json` file is the source of truth for the platform. It must be valid JSON.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | string | Unique identifier (slug-case), e.g., `code-review-buddy`. |
| `version` | string | Semantic Versioning (SemVer) compliant, e.g., `1.0.2`. |
| `display_name` | string | Human-readable name, e.g., "Code Review Buddy". |
| `description` | string | Short description (max 200 chars). |
| `category` | string | One of: `dev-tools`, `content-creation`, `data-research`. |
| `tags` | array | List of keywords (max 5). |
| `runtime` | string | One of: `python:3.10`, `node:18`, `docker`. |
| `commands` | object | Execution instructions. |
| `commands.install` | string | Command to install dependencies (e.g., `pip install -r requirements.txt`). |
| `commands.run` | string | Command to start the agent (e.g., `python src/main.py`). |
| `env_vars` | array | List of environment variables the user must provide. |
| `permissions` | object | Explicitly declared capabilities. |
| `supported_os` | array | List of: `windows`, `macos`, `linux`. |
| `pricing` | object | Pricing model. |
| `license` | string | SPDX identifier (e.g., `MIT`, `Apache-2.0`, `Proprietary`). |
| `safety` | object | Risk disclosures and limitations. |

### Permissions Object
*   `network`: `true` (any), `false` (none), or array of allowed domains `["github.com", "api.openai.com"]`.
*   `filesystem`: `read` (paths), `write` (paths). Use `$HOME` or `$PROJECT_ROOT` placeholders.
*   `browser`: `true` if it uses Puppeteer/Selenium/Playwright.
*   `clipboard`: `read`, `write`, `both`, or `none`.

---

## 3. Versioning & Update Rules
1.  **SemVer**: Must follow `MAJOR.MINOR.PATCH`.
    *   `MAJOR`: Breaking changes (e.g., changed env vars, different output format).
    *   `MINOR`: New features (backward compatible).
    *   `PATCH`: Bug fixes.
2.  **Immutability**: Once a version is published (e.g., `1.0.0`), it cannot be overwritten. Updates must be a new version number.
3.  **Deprecation**: Creators can mark versions as "deprecated" but cannot delete them if users have purchased them (unless for security reasons).

---

## 4. Example `agent.json`

```json
{
  "name": "code-review-buddy",
  "version": "1.0.0",
  "display_name": "Code Review Buddy",
  "description": "Analyzes GitHub Pull Requests for bugs and style issues using GPT-4.",
  "category": "dev-tools",
  "tags": ["github", "code-quality", "automation"],
  "runtime": "python:3.10",
  "commands": {
    "install": "pip install -r requirements.txt",
    "run": "python src/main.py --pr_url $PR_URL"
  },
  "env_vars": [
    {
      "key": "OPENAI_API_KEY",
      "description": "Required to analyze code logic.",
      "required": true
    },
    {
      "key": "GITHUB_TOKEN",
      "description": "Required to fetch PR diffs and post comments.",
      "required": true
    }
  ],
  "permissions": {
    "network": ["api.openai.com", "api.github.com"],
    "filesystem": {
      "read": ["$PROJECT_ROOT"],
      "write": ["$PROJECT_ROOT/review_logs/"]
    },
    "browser": false,
    "clipboard": "none"
  },
  "supported_os": ["windows", "macos", "linux"],
  "pricing": {
    "type": "free",
    "currency": "USD",
    "amount": 0
  },
  "license": "MIT",
  "safety": {
    "data_transmission": "Sends code snippets to OpenAI API.",
    "limitations": "Does not execute code. Review suggestions may contain hallucinations.",
    "human_in_the_loop": "Always review suggested code changes before applying."
  }
}
```
