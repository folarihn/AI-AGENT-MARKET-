# Launch Strategy: AI Agent Marketplace MVP

## 1. Developer Productivity & DevOps
**Why:** Developers are early adopters, understand the value of automation, and are willing to pay for tools that save engineering hours.
**Risk Profile:** Medium (Code execution risks, but users are technical).

### Agent Ideas
1.  **Code Review Buddy**
    *   **What it does:** Analyzes GitHub Pull Requests for common bugs, style violations, and complexity issues. Suggests specific fixes.
    *   **Target Buyer:** Senior Devs, Tech Leads.
    *   **Risk Level:** Medium (Read/Write code access).
    *   **Integrations:** GitHub/GitLab API.

2.  **Docu-Gen**
    *   **What it does:** Scans a codebase and generates comprehensive Markdown documentation, including function signatures and usage examples.
    *   **Target Buyer:** Open Source Maintainers, Enterprise Dev Teams.
    *   **Risk Level:** Low (Read-only).
    *   **Integrations:** Local filesystem or Git repo.

3.  **Unit Test Architect**
    *   **What it does:** Takes a source file and generates a complete unit test suite with edge case coverage (e.g., Jest, PyTest).
    *   **Target Buyer:** QA Engineers, Backend Devs.
    *   **Risk Level:** Low (Generates text/files).
    *   **Integrations:** None (Input: Code, Output: Code).

4.  **Log Sentinel**
    *   **What it does:** Parses raw server logs to identify error patterns, root causes, and suggests remediation steps.
    *   **Target Buyer:** DevOps Engineers, SysAdmins.
    *   **Risk Level:** Low (Analysis only).
    *   **Integrations:** Log files or ElasticSearch/Splunk export.

5.  **SQL Query Optimizer**
    *   **What it does:** Analyzes slow SQL queries and schema definitions to suggest indexes and query rewrites for performance.
    *   **Target Buyer:** Backend Engineers, DBAs.
    *   **Risk Level:** Low (Suggestions only).
    *   **Integrations:** None (Paste SQL).

6.  **Security Scanner AI**
    *   **What it does:** Scans dependencies (package.json/requirements.txt) and code patterns for known vulnerabilities (OWASP Top 10).
    *   **Target Buyer:** DevSecOps, CTOs.
    *   **Risk Level:** Medium (High trust required for accuracy).
    *   **Integrations:** Local filesystem.

7.  **Dockerizer**
    *   **What it does:** Inspects a project structure and generates an optimized, multi-stage Dockerfile and docker-compose.yml.
    *   **Target Buyer:** Full Stack Devs.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

8.  **API Client Generator**
    *   **What it does:** Takes an OpenAPI/Swagger spec and generates a fully typed client SDK in TypeScript, Python, or Go.
    *   **Target Buyer:** API Developers.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

### Category Rules
*   **Allowed:** Static analysis, code generation, read-only repository access.
*   **Banned:** Agents that auto-commit to `main` without review, agents that deploy infrastructure without confirmation (for MVP).
*   **Disclosures:** Must disclose if code is sent to an external LLM API (privacy risk). Must disclose if the agent retains any code snippets.

---

## 2. Content Creation & Marketing
**Why:** High volume of repetitive tasks; businesses need to scale content production cheaply. Tangible, immediate output.
**Risk Profile:** Low (Mostly text generation).

### Agent Ideas
1.  **SEO Blogsmith**
    *   **What it does:** Takes a keyword and generates a 1500-word SEO-optimized article with H-tags, meta descriptions, and internal link suggestions.
    *   **Target Buyer:** Content Marketers, SEO Agencies.
    *   **Risk Level:** Low.
    *   **Integrations:** None (Optional: WordPress).

2.  **Social Repurposer**
    *   **What it does:** Takes a long-form blog post or video transcript and turns it into a week's worth of Tweets, LinkedIn posts, and Instagram captions.
    *   **Target Buyer:** Social Media Managers, Founders.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

3.  **Ad Copy Variant Generator**
    *   **What it does:** Generates 50 variations of Facebook/Google ad copy based on product description and target audience.
    *   **Target Buyer:** Performance Marketers.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

4.  **Newsletter Curator**
    *   **What it does:** Scrapes specific industry news sites and summarizes top stories into a "Weekly Digest" format.
    *   **Target Buyer:** Newsletter Operators, Thought Leaders.
    *   **Risk Level:** Medium (Web scraping legality).
    *   **Integrations:** Web Scraping (headless browser).

5.  **Video Script Writer**
    *   **What it does:** Converts a topic or article into a scene-by-scene video script with visual cues for YouTube/TikTok.
    *   **Target Buyer:** YouTubers, Video Marketers.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

6.  **Cold Outreach Personalizer**
    *   **What it does:** Analyzes a prospect's LinkedIn profile (text paste) and generates a hyper-personalized cold email opener.
    *   **Target Buyer:** Sales SDRs, Freelancers.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

7.  **Case Study Drafter**
    *   **What it does:** Takes raw customer interview notes/transcripts and structures them into a compelling "Challenge -> Solution -> Result" case study.
    *   **Target Buyer:** B2B Marketers.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

8.  **Midjourney Prompt Engineer**
    *   **What it does:** Takes a vague image idea and expands it into a highly detailed prompt optimized for Midjourney v6 or DALL-E 3.
    *   **Target Buyer:** Designers, Content Creators.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

### Category Rules
*   **Allowed:** Text generation, formatting, public web scraping (with respect to robots.txt).
*   **Banned:** Agents that generate hate speech, fake news, or deepfakes. Agents that bypass paywalls.
*   **Disclosures:** Must label output as AI-generated where legally required. Must disclose if scraping data.

---

## 3. Data Research & Business Intelligence
**Why:** Businesses are drowning in data. Agents that synthesize information save massive amounts of executive time.
**Risk Profile:** Medium (Accuracy is critical; potential for hallucinations).

### Agent Ideas
1.  **Competitor Monitor**
    *   **What it does:** Visits competitor pricing pages and blogs to generate a comparison report on feature changes.
    *   **Target Buyer:** Product Managers, Founders.
    *   **Risk Level:** Medium (Scraping).
    *   **Integrations:** Web Scraping.

2.  **Financial Report Summarizer**
    *   **What it does:** Reads PDF 10-K/10-Q reports and extracts key financial ratios, risk factors, and management guidance.
    *   **Target Buyer:** Investors, Financial Analysts.
    *   **Risk Level:** High (Financial advice risk).
    *   **Integrations:** PDF Reader.

3.  **Meeting Minutes AI**
    *   **What it does:** Processes raw meeting transcripts (VTT/SRT) to extract action items, owners, and deadlines into a structured table.
    *   **Target Buyer:** Project Managers, Executive Assistants.
    *   **Risk Level:** Low.
    *   **Integrations:** None.

4.  **Lead List Enricher**
    *   **What it does:** Takes a list of company domains and finds their headquarters, employee count, and latest funding round (via public search).
    *   **Target Buyer:** Sales Ops.
    *   **Risk Level:** Medium (Data privacy/accuracy).
    *   **Integrations:** Search API (e.g., Google/Bing).

5.  **Academic Paper Synthesizer**
    *   **What it does:** Summarizes complex academic papers into "EL15" (Explain Like I'm 15) concepts and key findings.
    *   **Target Buyer:** Researchers, Students.
    *   **Risk Level:** Low.
    *   **Integrations:** PDF Reader.

6.  **Resume Screener**
    *   **What it does:** Matches a stack of resumes against a job description, highlighting top candidates and missing skills.
    *   **Target Buyer:** Recruiters, HR.
    *   **Risk Level:** High (Bias risk, PII handling).
    *   **Integrations:** PDF/Docx Reader.

7.  **Market Trend Spotter**
    *   **What it does:** Scans news headlines for specific keywords over the last month to identify rising or falling trends.
    *   **Target Buyer:** Strategists, Marketers.
    *   **Risk Level:** Medium.
    *   **Integrations:** News API/Search.

8.  **RFP/Grant Drafter**
    *   **What it does:** Analyzes a Request for Proposal (RFP) document and drafts a compliant initial response based on company boilerplate.
    *   **Target Buyer:** GovTech Sales, Non-profits.
    *   **Risk Level:** Medium.
    *   **Integrations:** PDF Reader.

### Category Rules
*   **Allowed:** Summarization, extraction, public data aggregation.
*   **Banned:** Agents that scrape private/login-gated data without authorization. Agents that claim to give certified financial or legal advice.
*   **Disclosures:** **CRITICAL:** Must include disclaimer: "AI can hallucinate. Verify all data." Agents handling PII (resumes) must disclose data handling practices.
