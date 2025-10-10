# READ-THIS-FIRST.md

---

**📚 IMPORTANT: How to Read This Documentation**

These documents describe **architectural patterns and development conventions** - they are **NOT project requirements or feature specifications**.

**Throughout these documents:**
- **Code examples** use domains like "posts", "users", "assets", "events", "team", etc. → These are **illustrative examples only**
- **Focus on the PATTERNS** (file structure, data flow, error handling, authentication, API design, testing, etc.)
- **Do NOT focus on the specific domains** (posts, users, etc.) - these are just examples to demonstrate the patterns
- **Implement YOUR OWN domains** based on your application's actual requirements

**For AI agents:** When reading these documents, extract the architectural patterns, conventions, and best practices. Do NOT treat the example domains (posts, users, assets, etc.) as requirements to build. These domains are used extensively to demonstrate patterns - apply these patterns to whatever domains your project actually needs.

---

## Table of Contents

### Sections 11-15 can be found in READ-THIS-FIRST-3.md

16. Architectural Boundaries (CRITICAL)
17. Docker & Deployment
18. Local Development
19. Instrumentation Hooks
20. Model Context Protocol (MCP) Server (Optional)

## Overview

This is part 4 of the READ-THIS-FIRST document.

---

# 16. Architectural Boundaries (CRITICAL)

This section defines the **most important rules** in the UEV Architecture. Violating these boundaries will break the architecture and make the codebase unmaintainable.

## 16.1 Domain Isolation Rule

**Domains MUST NOT import other domains.**

❌ **FORBIDDEN:**
```typescript
// Example: "posts" and "users" are domains - not requirements
// src/domains/[domain]/logic.ts
import { OtherDomainLogic } from '@/domains/[other-domain]/logic' // ❌ NEVER
```

**Why?**
- Domains should be independent, testable in isolation
- Prevents tight coupling and circular dependencies
- Allows domains to be extracted to microservices later
- Maintains clear boundaries and responsibilities

## 16.2 Features Must Use APIs

**Features/sections MUST use APIs, never direct domain imports.**

❌ **FORBIDDEN:**
```typescript
// src/features/[feature]/hooks/useFeature.ts
import { DomainLogic } from '@/domains/[domain]/logic' // ❌ NEVER
```

✅ **CORRECT:**
```typescript
// src/features/[feature]/hooks/useFeature.ts
export function useFeature() {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function fetchItems() {
      const response = await fetch('/api/[domain]')  // ✅ Use API
      const data = await response.json()
      setItems(data)
    }
    fetchItems()
  }, [])

  return { items }
}
```

**Why?**
- Features are UI/presentation layer
- APIs provide clear contract between layers
- Allows features to work with any backend
- Enforces separation of concerns

## 16.3 The Proper Data Flow

**Layer-by-layer data flow:**

```
User Browser
    ↓
Feature Component (React)
    ↓
Feature Hook (API call via fetch)
    ↓
App Router API Route (thin wrapper)
    ↓
Domain API Handler (api.ts)
    ↓
Domain Logic (logic.ts)
    ↓
Domain DAL (dal.ts)
    ↓
Database (Mongoose/MongoDB)
```

**Each layer only talks to the layer directly below it.**

## 16.4 When Domains Need to Communicate

**Problem:** Domain A needs data from Domain B (e.g., items need related entity data).

**Solution 1: Client-side composition (recommended)**
```typescript
// Example: "posts" and "users" domains - not requirements
// src/features/[feature]/hooks/useFeature.ts
export function useFeature() {
  const [items, setItems] = useState([])
  const [relatedData, setRelatedData] = useState({})

  useEffect(() => {
    async function fetchData() {
      // Fetch primary data
      const itemsRes = await fetch('/api/[domain]')
      const itemsData = await itemsRes.json()

      // Extract unique IDs for related data
      const relatedIds = [...new Set(itemsData.map(i => i.relatedId))]

      // Fetch related data
      const relatedRes = await fetch(`/api/[other-domain]?ids=${relatedIds.join(',')}`)
      const relatedDataArr = await relatedRes.json()

      setItems(itemsData)
      setRelatedData(Object.fromEntries(relatedDataArr.map(r => [r.id, r])))
    }
    fetchData()
  }, [])

  return { items, relatedData }
}
```

**Solution 2: Server-side composition via API calls**
```typescript
// src/domains/[domain]/logic.ts
export const DomainLogic = {
  async getItemWithRelated(itemId: string) {
    const item = await DomainDal.getById(itemId)

    // Call other domain API (internal fetch)
    const response = await fetch(`http://localhost:3000/api/[other-domain]/${item.relatedId}`)
    const related = await response.json()

    return { ...item, related }
  },
}
```

**Solution 3: Event-driven architecture**
```typescript
// src/lib/events.ts
export const EventBus = {
  subscribers: {},
  subscribe(event: string, handler: Function) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = []
    }
    this.subscribers[event].push(handler)
  },
  emit(event: string, data: unknown) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(handler => handler(data))
    }
  },
}

// Domain A subscribes to Domain B events
EventBus.subscribe('domainB.updated', async (data) => {
  await DomainADal.updateRelatedInfo(data.id, {
    relatedName: data.name
  })
})
```

**Solution 4: Cross-domain imports (exception, use with caution)**

In well thought out exceptions, domain A can import from domain B and vice versa. However, doing so acknowledges that you've **effectively merged these domains** in any future modeling.

```typescript
// Example: "users" and "posts" domains - not requirements
// src/domains/[domain]/logic.ts
import { OtherDomainLogic } from '@/domains/[other-domain]/logic' // ⚠️ Exception: carefully considered

export async function getItemWithRelated(itemId: string) {
  const item = await DomainDal.getById(itemId)
  const related = await OtherDomainLogic.getById(item.relatedId)
  return { ...item, related }
}
```

**When this might be acceptable:**
- The domains are tightly coupled by nature (e.g., Orders & OrderItems)
- Performance is critical and HTTP overhead is unacceptable
- The domains will always be deployed together
- You're willing to accept that they cannot be separated later

**Critical considerations:**
- ⚠️ **You cannot extract these domains to separate services later**
- ⚠️ **They must be tested together**
- ⚠️ **Changes to one domain may break the other**
- ⚠️ **Circular dependencies become possible (and dangerous)**

**This should NOT be done without careful consideration, but it is a viable path if needed.** Document the decision and reasoning in code comments:

```typescript
// ARCHITECTURAL DECISION: Domain A and Domain B are tightly coupled
// because every Domain A query requires Domain B data for display.
// HTTP overhead was measured at 50ms per request, unacceptable for UX.
// Decision approved by: [Team], Date: [YYYY-MM-DD]
import { OtherDomainLogic } from '@/domains/[other-domain]/logic'
```

---

## 16.5 Import Rules Summary

**Allowed imports:**

```typescript
// ✅ Features can import:
import { Button } from '@/shared/components/Button'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { formatDate } from '@/shared/utils/formatDate'
import { SharedSection } from '@/shared/sections/SharedSection'

// ✅ Domains can import:
import { commonSchemas } from '@/shared/schemas/api'
import { JsonPatchOp } from '@/shared/types/common'
import { say } from '@/lib/responses/say'
import { handleError } from '@/lib/errors/handler'
import connectDB from '@/lib/db'

// ✅ Within same domain:
import { DomainLogic } from './logic'
import { DomainDal } from './dal'
import { Entity, EntityDocument } from './models'
```

**Forbidden imports:**

```typescript
// ❌ Features CANNOT import domains:
import { DomainLogic } from '@/domains/[domain]/logic' // ❌

// ❌ Domains CANNOT import other domains:
import { OtherDomainLogic } from '@/domains/[other-domain]/logic' // ❌

// ❌ Sections CANNOT import domains:
import { getData } from '@/domains/[domain]/logic' // ❌

// ❌ App Router pages CANNOT import domains:
// src/app/page.tsx
import { DomainLogic } from '@/domains/[domain]/logic' // ❌
```

**Special case - API routes CAN import domain API handlers:**

```typescript
// ✅ API routes MUST import domain API handlers:
// src/app/api/[domain]/route.ts
import { domainApi } from '@/domains/[domain]/api' // ✅ CORRECT

export const GET = domainApi.list
export const POST = domainApi.create

// ❌ But API routes CANNOT import logic/dal directly:
import { getAllItems } from '@/domains/[domain]/logic' // ❌
import { DomainDal } from '@/domains/[domain]/dal' // ❌
```

**Setup ESLint to enforce:**

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["@/domains/*"],
            "message": "Features/Sections must use API routes, not direct domain imports"
          }
        ]
      }
    ]
  },
  "overrides": [
    {
      "files": ["src/app/api/**/*.ts"],
      "rules": {
        "no-restricted-imports": "off"
      }
    }
  ]
}
```

---
# 17. Docker & Deployment

## 17.1 Multi-Stage Dockerfile

**Two-stage build for optimized production images:**

```dockerfile
# Dockerfile
# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Enable corepack and set Yarn to 4.9.4
RUN corepack enable && corepack prepare yarn@4.9.4 --activate

# Copy package files and Yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy source code
COPY . .

# Build arguments for NEXT_PUBLIC variables (embedded at build time)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_POST_HOST
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_POST_HOST=$NEXT_PUBLIC_POST_HOST
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build the application
RUN yarn build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Enable corepack and set Yarn to 4.9.4
RUN corepack enable && corepack prepare yarn@4.9.4 --activate

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose the port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {if (r.statusCode !== 200) throw new Error()})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
```

## 17.2 Corepack and Yarn 4.9.4 Setup

**Why Corepack:**
- Node.js 16.9+ includes Corepack for managing package managers
- Ensures consistent Yarn version across all environments
- No need to install Yarn globally

**Setup in Dockerfile:**
```dockerfile
# Enable Corepack
RUN corepack enable

# Prepare specific Yarn version
RUN corepack prepare yarn@4.9.4 --activate
```

**Local setup:**
```bash
# Enable corepack (once per machine)
corepack enable

# Project will use version from package.json packageManager field
# "packageManager": "yarn@4.9.4"
```

## 17.3 Build Arguments for NEXT_PUBLIC Variables

**NEXT_PUBLIC variables are embedded at build time:**

```dockerfile
# Declare build arguments
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_POST_HOST
ARG NEXT_PUBLIC_SITE_URL

# Set as environment variables for Next.js build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_POST_HOST=$NEXT_PUBLIC_POST_HOST
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build the app (variables are embedded in bundle)
RUN yarn build
```

**Provide at build time:**
```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx \
  --build-arg NEXT_PUBLIC_POST_HOST=https://api.example.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
  -t myapp .
```

**Why?**
- `NEXT_PUBLIC_*` variables are replaced in code at build time
- Cannot be changed at runtime
- Different from server-only env vars (MONGODB_URI, API keys) which are runtime

## 17.4 Standalone Output Configuration

**Next.js standalone mode for optimized Docker images:**

```typescript
// next.config.js
const nextConfig = {
  output: 'standalone',
  // ... other config
}

export default nextConfig
```

**What it does:**
- Outputs minimal `.next/standalone` directory
- Includes only necessary files for production
- Dramatically reduces image size
- Automatically traces dependencies

**Copy pattern in Dockerfile:**
```dockerfile
# Copy the standalone output
COPY --from=builder /app/.next/standalone ./

# Copy static files (required, not included in standalone)
COPY --from=builder /app/.next/static ./.next/static

# Copy public directory (required for static assets)
COPY --from=builder /app/public ./public
```

## 17.5 Non-Root User Setup

**Security best practice - run as non-root user:**

```dockerfile
# Create a non-root user with specific UID/GID
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy files with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs
```

**Why?**
- Security: Limits damage if container is compromised
- Best practice for production containers
- Required by some platforms (Cloud Run, Kubernetes)

# 17.6 Health Check Implementation - Technical Specification

## Overview

The health check endpoint is a **special infrastructure endpoint** designed for container orchestration, load balancers, and monitoring systems. Unlike domain API endpoints, it intentionally does NOT use the say response pattern to ensure maximum simplicity, minimal overhead, and fast response times.

### Purpose

1. **Container Health Monitoring**: Docker, Kubernetes, and Cloud Run use this endpoint to verify container responsiveness
2. **Load Balancer Probes**: ALBs, NLBs, and other load balancers need fast, reliable health checks
3. **Service Discovery**: Container orchestration platforms use health checks to determine service availability
4. **Uptime Monitoring**: External monitoring services (Datadog, New Relic, etc.) poll this endpoint
5. **Zero Dependencies**: Must work even if application logic, database, or other services are degraded

### Location

`/src/app/api/health/route.ts`

---

## Architecture Pattern

### Simple Response.json() Pattern (NOT Say Pattern)

The health endpoint uses `Response.json()` directly instead of the say pattern:

```typescript
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }, {
    status: 200
  });
}
```

### Why NOT Use the Say Pattern?

The health endpoint is fundamentally different from domain API endpoints:

| Aspect | Domain APIs | Health Endpoint |
|--------|-------------|-----------------|
| **Purpose** | Business logic operations | Infrastructure monitoring |
| **Response Structure** | Standardized envelope with type, data, count | Minimal status object |
| **Performance** | Acceptable latency (50-500ms) | Critical speed (<10ms) |
| **Dependencies** | May call database, external services | Zero dependencies |
| **Error Handling** | Rich error context with IDs, tracking | Binary healthy/unhealthy |
| **Consumers** | Frontend, API clients, integrations | Containers, load balancers, monitors |
| **Pattern** | `say.ok(data, type)` | `Response.json({ status })` |

**Key Principle**: Infrastructure endpoints prioritize **speed and simplicity** over **consistency and structure**.

---

## Response Structure

### Minimal Healthy Response

```typescript
{
  status: 'healthy',
  timestamp: '2025-10-09T12:34:56.789Z'
}
```

**Status Code**: 200 OK

**Fields**:
- `status`: Always `'healthy'` for successful responses
- `timestamp`: ISO 8601 timestamp of the health check (useful for debugging stale responses)

### Why Minimal?

1. **Fast Serialization**: Smaller JSON payload serializes faster
2. **Network Efficiency**: Minimal bytes over the wire
3. **Parse Speed**: Container health checks parse responses quickly
4. **Clarity**: Simple true/false health indicator

---

## Docker Integration

### HEALTHCHECK Configuration

```dockerfile
# Health check for Cloud Run (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {if (r.statusCode !== 200) throw new Error()})" || exit 1
```

### Parameters Explained

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `--interval` | 30s | Check every 30 seconds during normal operation |
| `--timeout` | 3s | Fail if health check takes longer than 3 seconds |
| `--start-period` | 5s | Grace period during container startup (health failures ignored) |
| `--retries` | 3 | Mark unhealthy after 3 consecutive failures |

### Health Check Logic

```javascript
// Inline Node.js command for Docker HEALTHCHECK
node -e "
  require('http').get('http://localhost:8080/api/health', (r) => {
    if (r.statusCode !== 200) throw new Error()
  })
" || exit 1
```

**Breakdown**:
1. `require('http').get(...)`: Native Node.js HTTP client (no dependencies)
2. `http://localhost:8080`: Check locally (container checks itself)
3. `if (r.statusCode !== 200) throw new Error()`: Any non-200 response is unhealthy
4. `|| exit 1`: Exit with code 1 on failure (marks container unhealthy)

---

## When to Use Direct Response.json() vs Say Pattern

### Use `Response.json()` Directly

**Infrastructure endpoints**:
- `/api/health` - Health checks
- `/api/metrics` - Prometheus/monitoring metrics (if simple)
- `/api/ready` - Kubernetes readiness probes
- `/api/live` - Kubernetes liveness probes

**Binary/non-JSON responses**:
- File downloads
- Image/video streams
- WebSocket upgrades
- Server-Sent Events (SSE)

**Performance-critical paths**:
- High-frequency polling endpoints
- Real-time data streams
- Hot paths in critical user flows (rare)

### Use Say Pattern

**Domain API endpoints**:
- CRUD operations (`GET /api/posts`, `POST /api/users`)
- Business logic endpoints (`POST /api/payments/process`)
- Data aggregation (`GET /api/analytics/summary`)
- Search and filtering (`GET /api/posts?search=...`)

**Authenticated endpoints**:
- Any endpoint requiring `withAuth` or `withRole` wrappers
- User-specific data operations
- Admin/CRM functionality

**Endpoints with rich error handling**:
- Complex validation scenarios
- Multi-step operations with rollback
- External API integrations with error mapping

---

## Common Mistakes

### ❌ Using Say Pattern

```typescript
// WRONG: Adds unnecessary overhead
import { say } from '@/lib/responses/say';

export async function GET(_req: NextRequest) {
  return say.ok({ status: 'healthy' }, 'HEALTH');
}

// Response (too complex):
// {
//   statusCode: 200,
//   type: 'HEALTH',
//   data: { status: 'healthy' }
// }
```

**Why Wrong**:
- Extra JSON nesting (slower serialization)
- Unnecessary type field (health is not a domain resource)
- Pattern designed for domain APIs, not infrastructure

### ❌ Adding Database Checks

```typescript
// WRONG: Adds latency and dependency
import { connectDB } from '@/lib/db';

export async function GET(_req: NextRequest) {
  const db = await connectDB(); // 10-50ms overhead
  await db.connection.db.admin().ping(); // Another 5-20ms

  return Response.json({ status: 'healthy' });
}
```

**Why Wrong**:
- Database connection adds 15-70ms latency
- Database outage causes container to be marked unhealthy (container is fine, DB is down)
- Container restarts won't fix database issues (cascade failure)

---

## Best Practices

### Do's

1. **Keep it simple**: Minimal response structure, no dependencies
2. **Return quickly**: <10ms response time under normal conditions
3. **Always return 200**: Container health is binary (responds = healthy)
4. **Use separate endpoints**: `/api/health` (fast) vs `/api/health/detailed` (slow)
5. **Include timestamp**: Useful for debugging stale caches or proxy issues
6. **Use Response.json()**: Simpler than NextResponse for static responses
7. **Prefix unused params**: `_req` convention for intentionally unused parameters

### Don'ts

1. **Don't use say pattern**: Infrastructure endpoints are exempt
2. **Don't check database**: Separate concern from container health
3. **Don't add authentication**: Must be publicly accessible
4. **Don't return 500 on app errors**: Database down ≠ unhealthy container
5. **Don't add heavy diagnostics**: Use separate `/health/detailed` endpoint
6. **Don't make it async**: Pure synchronous response generation is fastest
7. **Don't block on I/O**: No database, no external services, no file system

---

## Summary

The health check endpoint is a **special infrastructure endpoint** that intentionally breaks the say pattern rule:

- **Purpose**: Container orchestration, load balancing, uptime monitoring
- **Pattern**: Direct `Response.json()` instead of `say.ok()`
- **Response**: Minimal `{ status, timestamp }` structure
- **Performance**: <10ms response time, zero dependencies
- **Status**: Always 200 (container responds = healthy)
- **Integration**: Docker HEALTHCHECK, Cloud Run probes, monitoring systems

**Key Principle**: Infrastructure endpoints prioritize **speed and simplicity** over **consistency and structure**.

For application-level health (database connectivity, external services), use separate endpoints like `/api/health/detailed` that still return 200 but include degraded status information.

## 17.7 docker-compose.yml for Local MongoDB

**Note**: docker-compose is a **backup option** for local database setup. For most development and testing, `yarn dev` with a cloud database (Firestore) or the standalone build script works fine. Use docker-compose when you need a fully local environment or want to test database-specific features.

**Local development database setup:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: myapp-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: myapp
    volumes:
      - mongodb_data:/data/db
    command: mongod --quiet --logpath /dev/null

volumes:
  mongodb_data:
    driver: local
```

**Usage:**
```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker-compose logs -f mongodb
```

**Connection string for .env.local:**
```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
```

## 17.8 Google Cloud Run Deployment

**Cloud Run specific configuration:**

```dockerfile
# Use PORT environment variable from Cloud Run
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Expose the port
EXPOSE 8080
```

**Deployment commands:**
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/myapp

# Deploy to Cloud Run
gcloud run deploy myapp \
  --image gcr.io/PROJECT_ID/myapp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars MONGODB_URI="your-firestore-uri" \
  --set-env-vars CLERK_SECRET_KEY="your-secret" \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

**Cloud Run features:**
- Automatic HTTPS
- Autoscaling (0 to N instances)
- Pay-per-use pricing
- Built-in load balancing
- Automatic health checks

**Build-time secrets (NEXT_PUBLIC):**
```bash
# Use Cloud Build with build args
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _NEXT_PUBLIC_CLERK_KEY=pk_xxx
```

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${_NEXT_PUBLIC_CLERK_KEY}'
      - '-t'
      - 'gcr.io/$PROJECT_ID/myapp'
      - '.'
images:
  - 'gcr.io/$PROJECT_ID/myapp'
```

---

# 18. Local Development

## 18.1 Local MongoDB with docker-compose

**Start local database:**
```bash
# From project root
docker-compose up -d
```

**Verify connection:**
```bash
# Connect with mongo shell
docker exec -it myapp-mongodb mongosh -u admin -p password --authenticationDatabase admin
```

**Connection string:**
```bash
# .env.local
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
```

## 18.2 Connection Detection (Local vs Firestore)

**Automatic detection in db.ts:**

```typescript
// src/lib/db.ts
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI

  // Detect environment
  const isFirestore = MONGODB_URI.includes('firestore') ||
                     MONGODB_URI.includes('googleapis.com')
  const isLocal = MONGODB_URI.includes('localhost') ||
                 MONGODB_URI.includes('127.0.0.1') ||
                 MONGODB_URI.includes('mongodb:27017')

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: isLocal ? 1 : 2,
    retryWrites: !isFirestore, // MUST be false for Firestore
    ...(isFirestore && {
      compressors: 'none',
      directConnection: false,
    })
  }

  return mongoose.connect(MONGODB_URI, opts)
}
```

**Why detection matters:**
- Firestore doesn't support `retryWrites`
- Local MongoDB needs different pool settings
- Logging can be environment-specific

## 18.3 Local Build Testing with Standalone Mode

**Test production build locally:**

```bash
# Build the standalone output
yarn build:standalone

# Start the production server locally
yarn start:local
```

**Scripts in package.json:**
```json
{
  "scripts": {
    "build:standalone": "./scripts/build-standalone.sh",
    "start:local": "dotenv -e .env.production.local -- node .next/standalone/server.js"
  }
}
```

**build-standalone.sh:**
```bash
#!/bin/bash
yarn build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

**Why test standalone locally?**
- Verifies production build works
- Tests with production env vars
- Catches standalone-specific issues
- Faster than deploying to test

## 18.4 Environment Variable Management

**Development (.env.local):**
```bash
# .env.local (gitignored)
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_POST_HOST=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Production local testing (.env.production.local):**
```bash
# .env.production.local (gitignored)
NODE_ENV=production
MONGODB_URI=your-firestore-uri
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_POST_HOST=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Example file (.env.example):**
```bash
# .env.example (committed to repo)
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_POST_HOST=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Loading priority:**
1. `.env.production.local` (production mode, local overrides)
2. `.env.local` (local overrides, all environments)
3. `.env.production` / `.env.development` (environment-specific)
4. `.env` (defaults for all environments)

## 18.5 Dev Server Workflow

**Daily development flow:**

```bash
# 1. Start local MongoDB
docker-compose up -d

# 2. Start Next.js dev server
yarn dev

# 3. Run tests in watch mode (separate terminal)
yarn test:watch

# 4. Type-check (before committing)
yarn type-check

# 5. Lint (before committing)
yarn lint

# 6. Commit (runs all checks automatically)
yarn commit "feat: add new feature"

# 7. Push (runs checks + pushes)
yarn push
```

**Development tools:**
- Hot reload: Automatic on file changes
- Error overlay: In-browser error display
- React DevTools: Browser extension
- Puppeteer MCP: For visual validation

**Database workflow:**
```bash
# View MongoDB data
docker exec -it myapp-mongodb mongosh -u admin -p password --authenticationDatabase admin

# Reset database
docker-compose down -v && docker-compose up -d

# Backup local data
docker exec myapp-mongodb mongodump --out /backup

# Restore data
docker exec myapp-mongodb mongorestore /backup
```

---

# 19. Instrumentation Hooks

## 19.1 Next.js Instrumentation

**Server startup hook for initialization tasks:**

```typescript
// src/instrumentation.ts
/**
 * Next.js Instrumentation Hook
 * This file runs once when the Node.js server starts up.
 *
 * Use for initialization tasks that should run before the first request.
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Server starting...')

    // Example: Initialize monitoring/observability
    // const monitoring = await import('./services/monitoring')
    // await monitoring.initialize()

    // Example: Start background services after app initialization
    setTimeout(async () => {
      try {
        // Start queue processors, cron jobs, etc.
        const { BackgroundService } = await import('./services/background')
        await BackgroundService.start()
        console.log('[Instrumentation] Background services started')
      } catch (error) {
        console.error('[Instrumentation] Failed to start services:', error)
      }
    }, 5000) // 5 second delay to ensure app is fully initialized
  }
}
```

**Primary use cases:**
- Initialize monitoring/observability tools (DataDog, Sentry, etc.)
- Start background job processors or message queue consumers
- Connect to external services that need one-time setup
- Register signal handlers for graceful shutdown
- Preload heavy dependencies or warm up caches

**Secondary use cases** (less common):
- Clear module-level caches if needed on server restart
- Set up global error handlers
- Initialize feature flags or configuration services

**Configuration (next.config.js):**
```typescript
const nextConfig = {
  // Enable instrumentation
  experimental: {
    instrumentationHook: true,
  },
}
```

**Important notes:**
- Runs once per server instance
- Runs before first request
- Only in Node.js runtime (not Edge)
- Use for one-time setup, not per-request logic
- Dynamic imports prevent bundling issues

---
# 20. Model Context Protocol (MCP) Server (Optional)

**Optional but highly recommended for accelerating development with AI assistants.**

## 20.1 What is MCP and Why Build a Custom Server

**Model Context Protocol (MCP)** is a standard protocol that allows AI assistants like Claude Code to access external tools and data sources. While Claude Code has built-in MCP servers (sequential-thinking, context7, puppeteer), building a **custom MCP server for your project** unlocks powerful development workflows.

### Why Build a Custom MCP Server?

**1. Accelerate Development with AI-Assisted Data Entry**

During development, you often need:
- Test data for new features
- Sample content for UI implementation
- Database records for testing edge cases
- Image assets for design validation

Instead of manually creating this data, a custom MCP server lets Claude Code:
- Populate databases while you focus on architecture
- Generate test data during trial-and-error implementation
- Set up realistic content for demos and presentations
- Handle repetitive data entry tasks automatically

**2. Extend Claude Code's Native Capabilities**

Add tools Claude Code doesn't have built-in:
- AI image generation (via Replicate, DALL-E, etc.)
- Background removal and image processing
- Custom API integrations specific to your domain
- Specialized data transformations or validations

**3. Leverage Your Domain Architecture**

Because your domains follow consistent patterns (`api.ts`, `logic.ts`, `dal.ts`), wrapping them as MCP tools is trivially easy:
- Same structure across all domains
- Consistent function signatures
- Predictable error handling
- Easy to maintain and extend

**This is the same philosophy that makes features and sections easy to build** - once domains are defined with consistent patterns, building on top of them (whether MCP tools, features, or API routes) becomes rapid and straightforward.

### When to Build an MCP Server

**Build one if you:**
- Frequently need test/demo data during development
- Want AI to handle content population while you code
- Need custom tools (image generation, data processing, etc.)
- Have domains with reusable logic worth exposing

**Skip it if you:**
- Only need basic CRUD operations via HTTP APIs
- Prefer manual data entry
- Don't use AI assistants for development
- Project is purely read-only (no content management)

---

## 20.2 MCP Configuration (.mcp.json)

Configure available MCP servers in `.mcp.json` at project root:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "my-project-cms": {
      "command": "npx",
      "args": ["tsx", "mcp-server/index.js"],
      "env": {}
    }
  }
}
```

**Standard MCP Servers** (available via npx):
- `sequential-thinking` - Enhanced reasoning for complex problems
- `context7` - Up-to-date library documentation
- `puppeteer` - Browser automation for testing and screenshots

**Custom MCP Server**:
- `my-project-cms` - Your domain logic exposed as MCP tools
- Uses `tsx` to run TypeScript/JavaScript directly
- Points to `mcp-server/index.js` entry point

---

## 20.3 Custom MCP Server Structure

```
mcp-server/
  index.js              # Server entry point and setup
  tools/
    domain-a.js         # Tools for Domain A (e.g., posts, users, etc.)
    domain-b.js         # Tools for Domain B
    external-api.js     # External integrations (image generation, etc.)
  validate.js           # Test script for local validation
```

### Server Entry Point

```javascript
// mcp-server/index.js
#!/usr/bin/env node

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const { domainATools } = require('./tools/domain-a.js');
const { domainBTools } = require('./tools/domain-b.js');

// Simple auth validation
const MCP_TOKEN = process.env.MCP_AUTH_TOKEN;
const REQUIRED_TOKEN = process.env.REQUIRED_MCP_TOKEN;

class CustomMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'my-project-cms',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // System context for MCP operations
    this.systemContext = {
      userId: 'mcp-system',
      userEmail: 'mcp@system.local',
      role: 'admin',
    };

    this.setupHandlers();
    this.validateAuth();
  }

  validateAuth() {
    if (MCP_TOKEN !== REQUIRED_TOKEN) {
      console.error('Invalid MCP token. Set MCP_AUTH_TOKEN in .env.local');
      process.exit(1);
    }
    console.error('MCP server authenticated successfully');
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'test_ping',
          description: 'Test MCP server connectivity',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Optional message to echo back'
              }
            }
          }
        },
        ...domainATools.list(),
        ...domainBTools.list(),
      ],
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Test tool
      if (name === 'test_ping') {
        return {
          content: [
            {
              type: 'text',
              text: `pong! ${args.message || 'MCP server is working'}. Time: ${new Date().toISOString()}`
            }
          ]
        };
      }

      // Route to domain tools
      if (name.startsWith('domain_a_')) {
        return await domainATools.execute(name, args, this.systemContext);
      }

      if (name.startsWith('domain_b_')) {
        return await domainBTools.execute(name, args, this.systemContext);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server running on stdio');
  }
}

// Start server
const server = new CustomMCPServer();
server.run().catch(console.error);
```

---

## 20.4 MCP Tools for Domain Access

**The key insight: Your domains already follow consistent patterns. Wrapping them as MCP tools is straightforward.**

### Domain Tool Structure

```javascript
// mcp-server/tools/posts.js
const path = require('path');

// Import domain logic directly (not via HTTP)
// This bypasses API overhead and gives direct access to business logic
let postsLogic;

async function loadDomain() {
  if (!postsLogic) {
    // Dynamic import to handle ES modules
    const module = await import(path.resolve(__dirname, '../../src/domains/posts/logic.js'));
    postsLogic = module.default;
  }
  return postsLogic;
}

// Tool definitions
const tools = {
  list() {
    return [
      {
        name: 'posts_list',
        description: 'List posts with OData filtering',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'OData filter expression (e.g., "published eq true")'
            },
            orderby: {
              type: 'string',
              description: 'OData orderby expression (e.g., "createdAt desc")'
            },
            skip: {
              type: 'number',
              description: 'Number of results to skip'
            },
            top: {
              type: 'number',
              description: 'Maximum results to return'
            }
          }
        }
      },
      {
        name: 'posts_get',
        description: 'Get a specific post by ID',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Post ID (UUID)'
            }
          }
        }
      },
      {
        name: 'posts_create',
        description: 'Create a new post',
        inputSchema: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', description: 'Post title' },
            slug: { type: 'string', description: 'URL slug (auto-generated if omitted)' },
            content: { type: 'string', description: 'Post content (HTML or Markdown)' },
            published: { type: 'boolean', description: 'Publish immediately (default: false)' },
            authorId: { type: 'string', description: 'Author user ID' }
          }
        }
      },
      {
        name: 'posts_patch',
        description: 'Update post using JSON Patch operations',
        inputSchema: {
          type: 'object',
          required: ['id', 'patches'],
          properties: {
            id: { type: 'string', description: 'Post ID' },
            patches: {
              type: 'array',
              description: 'JSON Patch operations array',
              items: {
                type: 'object',
                required: ['op', 'path'],
                properties: {
                  op: { type: 'string', enum: ['add', 'replace', 'remove', 'test'] },
                  path: { type: 'string' },
                  value: {}
                }
              }
            }
          }
        }
      },
      {
        name: 'posts_delete',
        description: 'Delete a post by ID',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Post ID to delete' }
          }
        }
      }
    ];
  },

  async execute(toolName, args, systemContext) {
    const logic = await loadDomain();
    const { userId } = systemContext;

    try {
      switch (toolName) {
        case 'posts_list': {
          const odataParams = {
            $filter: args.filter,
            $orderby: args.orderby,
            $skip: args.skip,
            $top: args.top
          };
          const result = await logic.list(odataParams);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        }

        case 'posts_get': {
          const post = await logic.get(args.id);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(post, null, 2)
            }]
          };
        }

        case 'posts_create': {
          const newPost = await logic.create(args, userId);
          return {
            content: [{
              type: 'text',
              text: `Post created successfully!\n\n${JSON.stringify(newPost, null, 2)}`
            }]
          };
        }

        case 'posts_patch': {
          const updated = await logic.patch(args.id, args.patches, userId);
          return {
            content: [{
              type: 'text',
              text: `Post updated successfully!\n\n${JSON.stringify(updated, null, 2)}`
            }]
          };
        }

        case 'posts_delete': {
          await logic.delete(args.id);
          return {
            content: [{
              type: 'text',
              text: `Post ${args.id} deleted successfully.`
            }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}\n\nStack: ${error.stack}`
        }],
        isError: true
      };
    }
  }
};

module.exports = { postsTools: tools };
```

### Why This Pattern Works

**1. Direct Domain Access**
- Imports domain `logic.js` directly (not via HTTP)
- Bypasses API layer overhead
- Same function signatures as HTTP handlers

**2. Consistent Structure Across All Domains**
- Every domain has `list`, `get`, `create`, `patch`, `delete`
- Same OData query patterns
- Same JSON Patch operations
- Predictable error handling

**3. Tool Naming Convention**
- `{domain}_{operation}` (e.g., `posts_list`, `users_create`)
- Easy to understand and discover
- Groups related operations by prefix

**4. Rapid Development**
- Copy tool template for new domain
- Replace domain name and import path
- Add domain-specific fields to schemas
- Done in minutes

### External API Integration Example

```javascript
// mcp-server/tools/image-generation.js
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const tools = {
  list() {
    return [
      {
        name: 'generate_image',
        description: 'Generate AI image using Replicate models',
        inputSchema: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of image to generate'
            },
            model: {
              type: 'string',
              enum: ['flux-dev', 'sdxl', 'stable-diffusion-3'],
              description: 'AI model to use (default: flux-dev)'
            },
            width: {
              type: 'number',
              description: 'Image width in pixels (default: 1024)'
            },
            height: {
              type: 'number',
              description: 'Image height in pixels (default: 1024)'
            }
          }
        }
      },
      {
        name: 'remove_background',
        description: 'Remove background from image',
        inputSchema: {
          type: 'object',
          required: ['image_path'],
          properties: {
            image_path: {
              type: 'string',
              description: 'Path to image file'
            }
          }
        }
      }
    ];
  },

  async execute(toolName, args) {
    if (toolName === 'generate_image') {
      const output = await replicate.run(
        "black-forest-labs/flux-dev",
        {
          input: {
            prompt: args.prompt,
            width: args.width || 1024,
            height: args.height || 1024
          }
        }
      );

      return {
        content: [{
          type: 'text',
          text: `Image generated successfully!\nURL: ${output[0]}`
        }]
      };
    }

    // Handle other tools...
  }
};

module.exports = tools;
```

---

## 20.5 Authentication Token Setup and Validation

**Security pattern: Simple token-based authentication for MCP server access.**

### Environment Variables

```bash
# .env.local
MCP_AUTH_TOKEN=your-secure-random-token-here
REQUIRED_MCP_TOKEN=your-secure-random-token-here

# Generate secure token:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Both tokens must match** for the MCP server to start. This prevents unauthorized access to your domain logic.

### Validation Implementation

```javascript
// In mcp-server/index.js constructor
validateAuth() {
  if (MCP_TOKEN !== REQUIRED_TOKEN) {
    console.error('Invalid MCP token. Set MCP_AUTH_TOKEN environment variable.');
    process.exit(1);
  }
  console.error('MCP server authenticated successfully');
}
```

### System Context Pattern

```javascript
// Provide consistent system user context for all operations
this.systemContext = {
  userId: 'mcp-system',
  userEmail: 'mcp@system.local',
  role: 'admin',
};

// Pass to domain logic functions
const result = await logic.create(data, systemContext.userId);
```

**Why this matters:**
- Domain logic expects `userId` for `createdBy` and `modifiedBy` fields
- MCP operations need admin-level access
- Audit trail shows operations came from MCP system

### Testing Your MCP Server

```javascript
// mcp-server/validate.js
const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('Testing MCP server...');

  const mcp = spawn('npx', ['tsx', 'mcp-server/index.js']);

  // Send list_tools request
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  }) + '\n');

  // Send test_ping request
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'test_ping',
      arguments: { message: 'Hello MCP!' }
    }
  }) + '\n');

  mcp.stdout.on('data', (data) => {
    console.log('Response:', data.toString());
  });

  mcp.stderr.on('data', (data) => {
    console.error('Server log:', data.toString());
  });

  setTimeout(() => {
    mcp.kill();
    console.log('Test complete');
  }, 2000);
}

testMCPServer().catch(console.error);
```

Run test: `node mcp-server/validate.js`

---

## Benefits of This Approach

**1. Development Velocity**
- AI handles data entry while you code architecture
- Test data generated on-demand
- No context switching between coding and data setup

**2. Extended Capabilities**
- Add tools Claude Code doesn't have natively
- Integrate any external API (image generation, data processing, etc.)
- Custom workflows specific to your domain

**3. Leverages Your Architecture**
- Same domain patterns used everywhere (features, API routes, MCP tools)
- Consistent structure makes new tools trivial to add
- Maintainable and predictable

**4. Optional But Powerful**
- Skip if you don't need it
- Add gradually as workflows emerge
- No impact on production architecture

---

## Common Use Cases

**During Development:**
- Generate test users, posts, products
- Populate databases for UI testing
- Create realistic demo data

**Content Management:**
- AI-assisted blog post creation
- Bulk content updates
- SEO metadata generation

**Asset Management:**
- Generate hero images for pages
- Process and optimize uploaded images
- Batch image transformations

**Data Migration:**
- Transform legacy data
- Validate imported records
- Clean up inconsistent data

---

**Next Steps:**
1. Create `mcp-server/` directory
2. Set up authentication tokens
3. Build tool wrappers for your domains (start with one)
4. Add external integrations as needed (image generation, etc.)
5. Test with `test_ping` and simple operations
6. Expand to more domains as workflows emerge

