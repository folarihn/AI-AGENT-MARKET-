# Product Spec: AI Agent Marketplace MVP

## Read This First (What This Project Is)
This repository is a working **MVP of an “AI Agent Marketplace”**: a web app where creators can upload versioned “agent packages”, the platform scans them for basic security issues, admins review/approve them, and buyers can purchase agents and download packages if they have a license.

It is built to validate the end-to-end marketplace loop:
**Publish (Creator) → Scan/Review (Admin) → Discover (Buyer) → Purchase → Licensed Download**

### Why It Exists
The MVP is meant to prove:
- A consistent packaging standard (so agents are easier to distribute and install)
- A trust layer (security scanning + admin review) before anything is published
- A simple monetization path (one-time purchase) with license-gated downloads

### Current Level / What’s “MVP” About It
The current implementation is a functional prototype, but **not production-ready**:
- Data is stored in an **in-memory mock DB** (resets on server restart).
- Package storage is a **local filesystem mock** (simulating S3).
- Security scanning is **heuristic/mock** (regex-based secrets scan, allowlist checks, mock malware rule).
- Stripe Checkout is **mocked** end-to-end (a simulated checkout + simulated webhook fulfillment).
- Auth is **mock login** (role selection, stored client-side).

## Tech Stack (Current Codebase)
- **Framework**: Next.js (App Router) + React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Zip inspection**: JSZip
- **Payments SDK**: Stripe Node SDK (used, but Checkout is mocked for MVP)

## What’s Implemented (As Of Now)

### Public / Buyer
- Marketplace browsing and filtering
- Agent details page with pricing
- “Buy Now” flow (mock checkout)
- Licensed download enforcement

### Creator
- Upload UI for new agent package
- Package validation (required files, basic manifest validation)
- Package storage (mock S3/local)
- Automatic security scans triggered on upload

### Admin
- Review queue for pending submissions
- Visibility into scan results per submission
- Approve / Reject actions
- Audit logging for uploads, scans, approvals/rejections, and purchases

## How To Run (Local)
From the repo root:
```bash
cd marketplace-app
npm install
npm run dev -- -p 3001
```

## Key Pages (UI Routes)
- `/` Landing page
- `/login` Mock login (Buyer / Creator / Admin)
- `/marketplace` Browse published agents
- `/agent/[slug]` Agent detail page (Buy / Download logic lives here)
- `/dashboard/creator` Creator upload page
- `/dashboard/admin` Admin review queue
- `/checkout/success` Mock “Stripe return” page that triggers fulfillment

## Key Backend Routes (API)
- `POST /api/agents/upload` Creator upload endpoint:
  - Validates the zip contains `agent.json` and `README.md`
  - Runs the MVP scan pipeline
  - Stores the uploaded package
  - Creates a new agent record in the DB
  - Sets status to `PENDING_REVIEW` if scan passes, otherwise `REJECTED`
- `GET /api/admin/review?agentId=...` Fetches latest scan results for an agent
- `POST /api/admin/review` Admin approve/reject endpoint
- `POST /api/checkout` Creates a (mock) Stripe checkout session and a pending purchase record
- `POST /api/webhooks/stripe` Handles a (simulated) `checkout.session.completed` event:
  - Marks purchase completed
  - Creates a license record (user + agent)
- `GET /api/licenses/check?userId=...&agentId=...` Returns whether the user has a license
- `GET /api/agents/[id]/download?userId=...` Download endpoint enforcing license checks

## Data Model (MVP / Mock DB)
The “database” is an in-memory store with these key entities:
- **Agent**: listing metadata (name, slug, version, status, price, creator)
- **ScanResult**: latest scan output for a given agent/version
- **AuditLog**: upload + scan + review + purchase events
- **Purchase**: payment intent/session record (pending/completed/failed)
- **License**: the entitlement to download an agent package (user + agent)

## Status Model (What Exists In Code Today)
In the current implementation:
- `DRAFT` exists in types, but the upload flow currently creates agents as:
  - `PENDING_REVIEW` (scan PASS), or
  - `REJECTED` (scan FAIL; auto-reject)
- Admin can then move pending agents to `PUBLISHED` or `REJECTED`.

## MVP Promise
A secure, trusted platform for developers to distribute standardized AI agents and for users to safely discover and deploy them.

## Roles
*   **Buyer**: An individual or business looking to automate tasks using AI agents. Needs assurance of safety and functionality.
*   **Creator**: A developer or organization building AI agents. Needs a distribution channel and monetization (future) or reputation.
*   **Admin**: Platform operators ensuring quality, security, and compliance.

## User Flows

### Buyer
1.  **Browse**: Buyer visits the marketplace homepage and browses a curated list of agents or searches by category/keyword.
2.  **View Agent**: Buyer clicks on an agent card to view the Agent Detail Page (README, version, capabilities, risk warnings, reviews).
3.  **Purchase/Get**: Buyer clicks "Get Agent" (Free for MVP) or "Purchase" (if payments enabled).
4.  **Download**: Buyer downloads the signed "Agent Package" (zip/tar).
5.  **Install/Run**: Buyer follows instructions to install the agent locally or in a supported runtime environment using the manifest.

### Creator
1.  **Create Listing**: Creator logs in and starts a new agent submission draft.
2.  **Upload Package**: Creator uploads the standardized "Agent Package" containing:
    *   `agent.json` (metadata, permissions, entry points)
    *   `README.md` (instructions, documentation)
    *   Source code/Binary
    *   Optional additional files needed by the agent (subject to allowlist rules)
3.  **Submit for Review**: Creator fills out risk disclosures and submits the package for Admin review.
4.  **Publish**: Once approved, the agent becomes visible in the marketplace.

### Admin
1.  **Review Submission**: Admin receives notification of a new submission.
2.  **Security Scan & Audit**: Admin reviews the code/package for malicious patterns and verifies the manifest matches capabilities.
3.  **Approve/Reject**:
    *   **Approve**: Agent is cryptographically signed by the platform and published.
    *   **Reject**: Feedback is sent to the Creator with reasons (e.g., security violation, incomplete docs).
4.  **Delist**: Admin can immediately remove an agent if a vulnerability or abuse is reported.

## MVP Features

### Core Platform
*   **User Authentication**: Email/Password or OAuth (GitHub/Google) for all roles.
*   **Agent Package Standard**: Strict schema for `agent.json` ensuring consistent metadata (name, version, permissions, author).
*   **Search & Filter**: Basic keyword search and category filtering.

### Trust & Security
*   **Risk Disclosures**: Mandatory field for Creators to declare agent risks (e.g., "Accesses internet", "Reads file system").
*   **Verified Identity**: Creators must verify email/identity before posting.
*   **Manual Review Pipeline**: Queue system for Admins to approve agents before they go live.

### Agent Listing
*   **Detail Page**: Displays README, Version history, Permissions requested, and Risk Warnings prominently.
*   **Download**: Secure link to download the versioned package.

## Non-Goals (Out of Scope for MVP)
*   **In-platform Execution**: We will NOT run agents in the cloud. Agents are downloaded and run by the user.
*   **Complex Payments**: No subscription billing or complex tax handling. Simple one-time payments (MVP mock) or Free only.
*   **Auto-Updates**: No automatic pushing of updates to users' machines.
*   **Social Features**: No forums, complex comment threads, or social following.
*   **AI-Generated Agents**: No on-platform generation of agents.

## How The End-to-End Demo Works (Recommended Walkthrough)
1. Login as **Creator** at `/login`, go to `/dashboard/creator`, upload a zip with `agent.json` + `README.md`.
2. If the scan passes, the agent enters **Pending Review**.
3. Login as **Admin** at `/login`, go to `/dashboard/admin`, review scan results and approve.
4. Browse as **Buyer** at `/marketplace`, open the agent detail page.
5. Click **Buy Now** (paid agents) and complete the mock checkout.
6. After success, the agent detail page shows **Download**, and the download endpoint enforces the license.

## Known Gaps / Things To Improve Next
- **Purchase history UI**: Purchases and licenses are recorded, but there is no buyer “library” page showing history.
- **Real Stripe**: Checkout + webhook signature verification are mocked; production should use real Checkout Sessions + verified webhook signatures.
- **Real auth**: Replace mock role login with real authentication and server-side authorization checks.
- **Persistence**: Replace the in-memory DB with Postgres/Prisma (the architecture doc outlines a target schema).
- **Real storage**: Replace mock storage with S3-compatible object storage and presigned download URLs.
- **Scan hardening**: Expand scans (dependency scanning, sandboxing, better allowlist rules, artifact signing).

## Success Metrics (MVP)
1.  **Inventory**: 50+ High-Quality Verified Agents available at launch.
2.  **User Acquisition**: 500+ Registered Buyers in the first month.
3.  **Throughput**: 1,000+ Successful Agent Downloads/Installs.
4.  **Safety**: 0 Reported Security Incidents from installed agents.
5.  **Conversion**: 10% of Visitors download at least one agent.
