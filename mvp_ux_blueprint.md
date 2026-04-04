# MVP UX/UI Blueprint: AI Agent Marketplace

## 1. Landing Page (`/`)
**Goal:** Establish trust and explain what an "Agent Marketplace" is in 5 seconds.

### Sections
1.  **Hero**: "Safe, Verified AI Agents for your Workflow."
    *   CTA: "Browse Agents" (Primary), "Submit an Agent" (Secondary).
    *   Trust Signal: "All agents are manually reviewed and security scanned."
2.  **Featured Agents**: Horizontal carousel of 3 top-rated agents.
3.  **Categories**: Grid of 3 core sectors (Dev Tools, Content, Data).
4.  **How it Works**: 3-step graphic: "Download -> Inspect -> Run Locally".
5.  **Footer**: Links to Security Policy, Terms, Docs.

### Key Components
*   `AgentCard` (Preview): Icon, Name, Star Rating, "Verified" badge.
*   `TrustBanner`: Row of logos/icons (ClamAV, Open Source, etc.).

---

## 2. Browse Marketplace (`/marketplace`)
**Goal:** Help users find a specific tool quickly.

### Sections
1.  **Sidebar Filters**:
    *   Category (Dev, Content, Data).
    *   Price (Free, Paid).
    *   Runtime (Python, Node, Docker).
    *   Sort By (Newest, Popular, Trusted).
2.  **Agent Grid**: Infinite scroll or paginated list of agent cards.
3.  **Search Bar**: Top-center, large.

### Trust Elements
*   **Card Badges**: `🛡️ Scanned`, `⭐ Top Rated`.
*   **Creator Verification**: Checkmark next to creator name on card.

### Empty States
*   **No Results**: "No agents found matching 'xyz'. Try a different category." + "Request an Agent" link (mailto for MVP).

---

## 3. Agent Detail Page (`/agent/:slug`)
**Goal:** Give the buyer 100% confidence to download/purchase.

### Sections
1.  **Header**: Icon, Title, Version, Creator (with verified badge), Last Updated date.
2.  **Action Column (Right/Sticky)**:
    *   Price / "Free".
    *   **Big CTA**: "Get Agent" / "Buy Now".
    *   **Trust Summary**:
        *   ✅ Malware Free (Last scan: Today).
        *   ✅ No Secrets Found.
        *   ⚠️ Permission: Network Access.
3.  **Main Content (Tabs)**:
    *   **Overview**: README.md content (rendered Markdown).
    *   **Permissions**: Detailed list of what the agent can do (Network domains, File paths).
    *   **Reviews**: User star ratings and text reviews.
    *   **Files**: Tree view of the package structure (filenames only, not content).

### Key Components
*   `PermissionBox`: Red/Yellow/Green indicators for risk levels.
*   `InstallCommand`: Copy-pasteable CLI command `pip install ...`.
*   `RiskWarning`: Dismissible alert if agent deals with money/private data.

---

## 4. Checkout Success (`/checkout/success`)
**Goal:** Immediate gratification and instruction.

### Sections
1.  **Success Banner**: "Purchase Successful! You own [Agent Name]."
2.  **Download Box**: Large "Download .zip" button.
3.  **Quick Start**:
    *   "Step 1: Unzip the file."
    *   "Step 2: Run `pip install -r requirements.txt`."
    *   "Step 3: Run `python main.py`."
4.  **API Key Reminder**: "Don't forget you need an OpenAI API Key for this agent."

---

## 5. My Library (`/library`)
**Goal:** Manage purchased agents and updates.

### Sections
1.  **Purchased List**: Table or List view of owned agents.
2.  **Version Column**: "Installed: v1.0" | "Latest: v1.2" (Update Available button).
3.  **Redownload**: Action button to get the zip again.

### Empty States
*   **No Purchases**: "You haven't bought any agents yet." + "Browse Marketplace" button.

---

## 6. Creator Dashboard (`/dashboard/creator`)
**Goal:** Streamline the submission process.

### Sections
1.  **My Agents**: List of submitted agents with status (Draft, Pending Review, Published, Rejected).
2.  **Upload New Agent**:
    *   **Step 1**: Upload `.zip`.
    *   **Step 2**: Auto-validation (Client-side check for `agent.json`).
    *   **Step 3**: Edit Metadata (Description, Pricing, Tags).
    *   **Step 4**: Submit for Review.
3.  **Analytics (MVP)**: Simple view counter, Download counter.

### Key Components
*   `StatusBadge`: Yellow (Pending), Green (Published), Red (Rejected).
*   `UploadZone`: Drag & drop area with file type validation.

### Empty States
*   **No Agents**: "Start monetizing your code. Submit your first agent."

---

## 7. Admin Dashboard (`/dashboard/admin`)
**Goal:** Rapidly review and process the queue.

### Sections
1.  **Review Queue**: List of agents waiting for approval (sorted by oldest).
2.  **Review Interface (Detail View)**:
    *   **Manifest Viewer**: Raw JSON view.
    *   **Code Preview**: Basic file browser to spot check code.
    *   **Scan Results**: Pass/Fail output from the auto-pipeline.
    *   **Action Buttons**: "Approve & Publish", "Reject (with reason)", "Ban Creator".
3.  **Search Users**: Find a user/creator to manage permissions.

### Key Components
*   `DiffViewer`: (Nice to have) Show changes if updating a version.
*   `RejectModal`: Pre-filled reasons (Malware, Bad Manifest, Policy Violation).
