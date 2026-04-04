# Product Spec: AI Agent Marketplace MVP

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
    *   `manifest.json` (metadata, permissions, entry points)
    *   `README.md` (instructions, documentation)
    *   Source code/Binary
    *   `version` file
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
*   **Agent Package Standard**: Strict schema for `manifest.json` ensuring consistent metadata (name, version, permissions, author).
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
*   **Complex Payments**: No subscription billing or complex tax handling. Simple one-time payments or Free only for MVP.
*   **Auto-Updates**: No automatic pushing of updates to users' machines.
*   **Social Features**: No forums, complex comment threads, or social following.
*   **AI-Generated Agents**: No on-platform generation of agents.

## Success Metrics (MVP)
1.  **Inventory**: 50+ High-Quality Verified Agents available at launch.
2.  **User Acquisition**: 500+ Registered Buyers in the first month.
3.  **Throughput**: 1,000+ Successful Agent Downloads/Installs.
4.  **Safety**: 0 Reported Security Incidents from installed agents.
5.  **Conversion**: 10% of Visitors download at least one agent.
