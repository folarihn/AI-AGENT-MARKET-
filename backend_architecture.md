# Backend Architecture: AI Agent Marketplace (MVP)

## 1. Database Schema (Prisma / PostgreSQL)

This schema defines the core entities for the marketplace. It uses strict relationships to enforce data integrity.

```prisma
// Enums
enum UserRole {
  BUYER
  CREATOR
  ADMIN
}

enum AgentStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  REJECTED
  BANNED
}

enum ScanStatus {
  PENDING
  PASS
  FAIL
  WARNING
}

// Models

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(BUYER)
  isVerified    Boolean   @default(false)
  createdAt     DateTime  @default(now())

  // Relations
  agents        Agent[]   @relation("CreatedAgents")
  purchases     Purchase[]
  reviews       Review[]
  auditLogs     AuditLog[]
  modActions    ModerationAction[]
}

model Agent {
  id            String    @id @default(uuid())
  creatorId     String
  name          String    // Internal name
  slug          String    @unique // URL-friendly ID (e.g., "code-review-buddy")
  displayName   String
  description   String    @db.Text
  category      String    // "dev-tools", "content", "data"
  tags          String[]
  status        AgentStatus @default(DRAFT)
  price         Decimal   @default(0.00)
  currency      String    @default("USD")
  
  // Metadata from latest approved version
  currentVersionId String? @unique
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  creator       User      @relation("CreatedAgents", fields: [creatorId], references: [id])
  versions      AgentVersion[]
  purchases     Purchase[]
  reviews       Review[]
  modActions    ModerationAction[]
}

model AgentVersion {
  id            String    @id @default(uuid())
  agentId       String
  versionString String    // "1.0.0"
  changeLog     String?
  manifest      Json      // The full agent.json content
  isPublished   Boolean   @default(false)
  createdAt     DateTime  @default(now())

  // Relations
  agent         Agent     @relation(fields: [agentId], references: [id])
  package       Package?
  scanResults   ScanResult[]
  
  @@unique([agentId, versionString]) // Prevent duplicate versions
}

model Package {
  id            String    @id @default(uuid())
  versionId     String    @unique
  url           String    // S3/Blob storage URL
  filename      String
  sizeBytes     Int
  checksum      String    // SHA-256 hash
  mimeType      String    // "application/zip" or "application/gzip"

  // Relations
  version       AgentVersion @relation(fields: [versionId], references: [id])
}

model ScanResult {
  id            String    @id @default(uuid())
  versionId     String
  scannerType   String    // "malware", "secrets", "dependency"
  status        ScanStatus
  details       Json?     // Structured output from scanner
  scannedAt     DateTime  @default(now())

  // Relations
  version       AgentVersion @relation(fields: [versionId], references: [id])
}

model Purchase {
  id            String    @id @default(uuid())
  userId        String
  agentId       String
  amount        Decimal
  currency      String
  licenseKey    String?   // Generated license key if applicable
  purchasedAt   DateTime  @default(now())

  // Relations
  user          User      @relation(fields: [userId], references: [id])
  agent         Agent     @relation(fields: [agentId], references: [id])
  
  @@unique([userId, agentId]) // Prevent double purchase of same item
}

model Review {
  id            String    @id @default(uuid())
  agentId       String
  userId        String
  rating        Int       // 1-5
  text          String?   @db.Text
  createdAt     DateTime  @default(now())

  // Relations
  agent         Agent     @relation(fields: [agentId], references: [id])
  user          User      @relation(fields: [userId], references: [id])

  @@unique([userId, agentId]) // One review per agent per user
}

model ModerationAction {
  id            String    @id @default(uuid())
  adminId       String
  agentId       String
  action        String    // "APPROVE", "REJECT", "BAN", "DELIST"
  reason        String?
  createdAt     DateTime  @default(now())

  // Relations
  admin         User      @relation(fields: [adminId], references: [id])
  agent         Agent     @relation(fields: [agentId], references: [id])
}

model AuditLog {
  id            String    @id @default(uuid())
  userId        String?   // Nullable for system actions
  action        String    // "LOGIN", "UPLOAD_AGENT", "PURCHASE"
  resourceType  String    // "Agent", "User", "Order"
  resourceId    String?
  ipAddress     String?
  userAgent     String?
  metadata      Json?
  createdAt     DateTime  @default(now())

  // Relations
  user          User?     @relation(fields: [userId], references: [id])
}
```

---

## 2. API Endpoints (REST)

### Authentication
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Create new account. |
| `/api/auth/login` | POST | Public | Get JWT token. |
| `/api/auth/me` | GET | Auth | Get current user profile. |

### Agents (Public/Buyer)
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/agents` | GET | Public | List published agents (supports filtering). |
| `/api/agents/:slug` | GET | Public | Get agent details, latest version, and reviews. |
| `/api/agents/:slug/reviews` | GET | Public | Get reviews for an agent. |
| `/api/agents/:slug/reviews` | POST | Buyer | Submit a review (verified purchase check required). |

### Creator Actions
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/creator/agents` | GET | Creator | List my agents (all statuses). |
| `/api/creator/agents` | POST | Creator | Create a new agent draft. |
| `/api/creator/agents/:id` | PUT | Creator | Update agent metadata (name, description). |
| `/api/creator/agents/:id/versions` | POST | Creator | Upload a new version (multipart/form-data: zip + json). Triggers scans. |
| `/api/creator/agents/:id/submit` | POST | Creator | Submit current draft version for review. |

### Admin Actions
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/admin/queue` | GET | Admin | List agents with status `PENDING_REVIEW`. |
| `/api/admin/agents/:id/approve` | POST | Admin | Publish the pending version. |
| `/api/admin/agents/:id/reject` | POST | Admin | Reject submission with reason. |
| `/api/admin/users/:id/ban` | POST | Admin | Ban a user/creator. |

### Purchases & Library
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/purchases` | POST | Buyer | Buy an agent (creates Purchase record). |
| `/api/library` | GET | Buyer | List purchased agents. |
| `/api/library/:id/download` | GET | Buyer | Get signed download URL for the package. |

---

## 3. Permissions Matrix

| Action | Public | Buyer | Creator | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Published Agents** | ✅ | ✅ | ✅ | ✅ |
| **Search Agents** | ✅ | ✅ | ✅ | ✅ |
| **View Agent Details** | ✅ | ✅ | ✅ | ✅ |
| **Buy Agent** | ❌ | ✅ | ✅ | ✅ |
| **Download Agent** | ❌ | ✅ (Owned) | ✅ (Own) | ✅ |
| **Review Agent** | ❌ | ✅ (Owned) | ❌ | ❌ |
| **Create Agent** | ❌ | ❌ | ✅ | ✅ |
| **Edit Own Agent** | ❌ | ❌ | ✅ | ✅ |
| **Delete Own Agent** | ❌ | ❌ | ❌ (Request only) | ✅ |
| **Upload Package** | ❌ | ❌ | ✅ | ✅ |
| **View Audit Logs** | ❌ | ❌ | ❌ | ✅ |
| **Approve/Reject** | ❌ | ❌ | ❌ | ✅ |
| **Ban User** | ❌ | ❌ | ❌ | ✅ |

### Key Security Notes
1.  **Ownership Check**: Middleware must verify `agent.creatorId === user.id` for all Creator routes.
2.  **Verified Purchase**: Middleware must check `Purchase` table exists for `(userId, agentId)` before allowing Review or Download.
3.  **Immutability**: Once an `AgentVersion` is `PUBLISHED`, it cannot be modified, only a new version can be created.
