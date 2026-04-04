# Security & Trust Policy: AI Agent Marketplace (MVP)

## 1. Marketplace Security & Trust Policy (For Creators)

All creators submitting agents to the marketplace must adhere to the following strict guidelines. Violation will result in immediate delisting and a permanent ban.

1.  **Transparency is Mandatory**: The `agent.json` manifest must accurately reflect the agent's behavior. If your agent makes network calls, accesses the filesystem, or reads the clipboard, these permissions **must** be declared.
2.  **No Obfuscation**: All source code must be readable. Minified code (unless standard library dependencies), binary blobs, or encrypted payloads are strictly prohibited.
3.  **No Malicious Activity**: Agents must not:
    *   Exfiltrate user data (keys, files, passwords) without explicit user consent and visible disclosure.
    *   Install persistent backdoors, keyloggers, or crypto miners.
    *   Modify system files outside the declared scope.
4.  **No Hardcoded Secrets**: Do not include your own API keys, passwords, or tokens in the code. Use environment variables.
5.  **Respect User Privacy**: Only collect data necessary for the agent's function. Do not store PII (Personally Identifiable Information) unless critical and disclosed.
6.  **Dependency Safety**: You are responsible for the supply chain of your agent. Ensure all dependencies are pinned to secure versions and free from known vulnerabilities.

---

## 2. Admin Review Checklist

Admins must verify every submission against this checklist before approval.

### Code Audit
*   [ ] **Manifest Integrity**: Does `agent.json` permission requests match the code's actual imports and calls (e.g., `requests`, `fs`, `os`)?
*   [ ] **No Obfuscation**: Is the code readable? Are there suspicious base64 strings or `eval()` calls?
*   [ ] **Data Handling**: Where is data sent? Are external domains legitimate (e.g., `api.openai.com` vs. `malicious-site.xyz`)?
*   [ ] **File Operations**: Does the agent only read/write to allowed paths (e.g., project root)?
*   [ ] **Quality Check**: Does the code look like a serious attempt (comments, structure) or a low-effort spam script?

### Functional Verification
*   [ ] **Install**: Does `install` command work in a clean environment?
*   [ ] **Run**: Does `run` command start the agent successfully?
*   [ ] **Docs**: Does `README.md` clearly explain how to configure and use the agent?

### Safety
*   [ ] **Risk Warnings**: Are appropriate warnings present for high-risk actions (e.g., "This agent deletes files")?

---

## 3. Automatic Rejection Rules (Blocklist)

The submission system will automatically reject packages that contain:

1.  **Banned File Types**: `.exe`, `.dll`, `.so`, `.bin`, `.msi`, `.bat` (unless trivial wrappers), `.cmd`, `.vbs`, `.jar` (outside docker).
2.  **Suspicious Patterns**:
    *   Usage of `eval()`, `exec()`, or dynamic code loading from strings.
    *   Hardcoded IP addresses (except `127.0.0.1` or `0.0.0.0`).
    *   Imports of known hacking/penetration testing libraries (unless explicitly a security tool).
3.  **Credential Leaks**: Presence of strings matching patterns for AWS keys, OpenAI keys, GitHub tokens, or private SSH keys.
4.  **Empty/Invalid Manifest**: Missing `agent.json` or schema validation failure.
5.  **Large Files**: Any single file > 10MB (except Docker images) or total package > 50MB.

---

## 4. Minimum Scanning Pipeline (MVP)

Every uploaded package goes through this automated pipeline before Admin Review:

1.  **Malware Scan**:
    *   **Tool**: ClamAV (or equivalent cloud scanner).
    *   **Action**: Scan entire archive content. If positive -> **REJECT**.
2.  **Secrets Scan**:
    *   **Tool**: TruffleHog or Gitleaks.
    *   **Action**: Scan for high-entropy strings and known key patterns. If found -> **REJECT** with "Remove secrets" message.
3.  **Dependency Scan**:
    *   **Tool**: OWASP Dependency-Check or Snyk (CLI).
    *   **Action**: Check `requirements.txt` / `package.json` for CVEs with CVSS score > 7.0 (High/Critical). If found -> **WARN** (Creator must fix or justify).
4.  **File Integrity & Allowlist**:
    *   **Script**: Custom script to verify file extensions against the "Allowed Types" list.
    *   **Action**: If banned file found -> **REJECT**.

---

## 5. Trust Badges

Badges displayed on the Agent Listing to signal trust level:

1.  **🛡️ Security Scanned**:
    *   **Criteria**: Passed all automated pipeline checks (Malware, Secrets, Dependencies).
    *   **Meaning**: "This code has been automatically checked for common threats."
2.  **✅ Verified Purchase Reviews** (Future Feature):
    *   **Criteria**: Only users who actually bought/downloaded the agent can leave a review.
    *   **Meaning**: "Reviews are from real users."
3.  **⭐ Verified Creator**:
    *   **Criteria**: Creator has undergone identity verification (ID check or corporate email verification).
    *   **Meaning**: "We know who this developer is."

---

## 6. Special Rules for Trading/Financial Agents

Trading agents carry the highest risk of financial loss.

### Required Disclosures (Template)
**Location**: Top of `README.md` and `agent.json` (safety section).

> **⚠️ HIGH RISK WARNING: FINANCIAL LOSS**
>
> This agent performs automated trading or financial analysis.
> *   **NO GUARANTEE**: Past performance is not indicative of future results.
> *   **NOT FINANCIAL ADVICE**: This software is a tool, not a registered financial advisor.
> *   **USER RESPONSIBILITY**: You are solely responsible for any financial losses incurred by using this agent.
> *   **BUGS HAPPEN**: Software bugs may cause unintended trades or loss of funds.

### Banned Behaviors
1.  **Guaranteed Returns**: Claims of "guaranteed profit," "risk-free," or "passive income" are strictly banned.
2.  **Custodial Wallets**: Agents must NOT ask for private keys to user wallets. They must only use API keys with "Trade Only" (Non-Withdrawal) permissions.
3.  **Hidden Fees**: Agents cannot take a "cut" of profits via hidden code mechanisms. All fees must be platform-level and transparent.
4.  **Pump & Dump**: Agents designed to manipulate market prices or coordinate buying attacks are illegal and banned.
