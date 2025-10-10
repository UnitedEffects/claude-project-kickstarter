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

### Sections 1-7 can be found in READ-THIS-FIRST-1.md

8. Database & Data Models
9. Authentication & Authorization
10. OpenAPI & API Patterns

### Sections 11-15 can be found in READ-THIS-FIRST-3.md

## Overview

This is part 2 of the READ-THIS-FIRST document.

---

# 8. Database & Data Models

**IMPORTANT**: This section demonstrates database patterns using **Mongoose + MongoDB/Firestore** as a reference implementation. If the user wants a different database solution (PostgreSQL + Prisma, Supabase, Drizzle, raw SQL, etc.), use the patterns shown here as a guide:

- **Connection management**: Implement caching and pooling similar to the Mongoose example
- **Schema patterns**: Apply the same validation, typing, and field conventions
- **Data access layer**: Maintain the same separation between logic and data access
- **Type safety**: Use TypeScript interfaces/types with your chosen ORM/query builder

The architectural principles (connection caching, schema validation, DAL pattern, UUID keys, timestamps) apply universally.

## 8.1 Connection Management with Caching

```typescript
// src/lib/db.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('Connected to MongoDB')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
```

**Key patterns:**
- Global caching prevents multiple connections in serverless
- Connection pooling (maxPoolSize, minPoolSize)
- Retry logic with timeouts
- Lazy initialization (only connects when needed)

## 8.2 Connection Pooling and Retry Logic

```typescript
const opts = {
  bufferCommands: false,           // Fail fast if not connected
  maxPoolSize: 50,                 // Max concurrent connections
  minPoolSize: 10,                 // Min connections in pool
  serverSelectionTimeoutMS: 10000, // 10s to select server
  socketTimeoutMS: 45000,          // 45s socket timeout
  retryWrites: true,               // Retry failed writes
  retryReads: true,                // Retry failed reads
}
```

## 8.3 Mongoose Schema Patterns

**Note**: This example uses a "posts" domain with fields like `title`, `slug`, `content`, `authorId`, `status`, and `tags` to demonstrate schema patterns. This is NOT a requirement to build a posts/blog system - it's illustrating the architectural patterns. Replace with your actual domain entities.

```typescript
// src/domains/posts/models.ts
import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  authorId: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  modifiedBy: string
}

export interface PostDocument extends Omit<Post, 'id'>, Document {
  _id: string
}

const PostSchema = new Schema<PostDocument>({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  tags: [{ type: String, lowercase: true }],
  createdBy: { type: String, required: true },
  modifiedBy: { type: String, required: true },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    },
  },
})

// Indexes
PostSchema.index({ slug: 1 })
PostSchema.index({ authorId: 1, status: 1 })
PostSchema.index({ tags: 1 })

export const PostModel = mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema)
```

**Key patterns:**
- UUID primary keys (`_id: String, default: uuidv4`)
- Transform `_id` to `id` in JSON responses
- Timestamps (createdAt, updatedAt) automatic
- System fields (createdBy, modifiedBy)
- Enums for constrained values
- Indexes for common queries
- Trim and lowercase for strings

## 8.4 UUID Primary Keys

```typescript
_id: { type: String, default: uuidv4 }
```

**Benefits:**
- Globally unique across collections
- No auto-increment issues in distributed systems
- Can generate IDs client-side if needed
- Compatible with external systems

## 8.5 _id to id Transform

```typescript
toJSON: {
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
}
```

**Why?**
- MongoDB uses `_id` internally
- APIs expose `id` (cleaner, more standard)
- Removes `__v` (Mongoose version key)
- Automatic on all `.toJSON()` calls

## 8.6 Timestamps and System Fields

```typescript
// Automatic timestamps
{
  timestamps: true  // Adds createdAt, updatedAt
}

// Manual system fields
{
  createdBy: { type: String, required: true },
  modifiedBy: { type: String, required: true },
}
```

**Population pattern:**
```typescript
// src/domains/posts/api.ts
async function createHandler(req: NextRequest) {
  try {
    const auth = await getAuthContext()
    const userId = auth.userId || 'system'
    const body = await req.json()

    const post = await PostsLogic.create({
      ...body,
      createdBy: userId,
      modifiedBy: userId,
    })

    return say.created(post, 'POST')
  } catch (error) {
    return handleError(error, req)
  }
}
```

## 8.7 Enum Patterns and Validation

```typescript
status: {
  type: String,
  enum: ['draft', 'published', 'archived'],
  default: 'draft',
}
```

**TypeScript type:**
```typescript
export type PostStatus = 'draft' | 'published' | 'archived'

export interface Post {
  status: PostStatus
  // ...
}
```

---

# 9. Authentication & Authorization

**IMPORTANT**: This section demonstrates authentication patterns using **Clerk** as a reference implementation. If the user wants a different auth solution (NextAuth.js, Auth0, Supabase Auth, custom JWT, etc.), use the patterns shown here as a guide:

- **Middleware setup**: Apply similar route protection logic
- **Route wrappers**: Implement equivalent auth checking functions
- **Role-based access**: Adapt role extraction and verification
- **Session management**: Use your provider's session/token patterns
- **Auth headers**: Maintain consistent header injection for APIs

The architectural principles (middleware protection, route wrappers, role-based access, bearer tokens for APIs) apply universally.

## 9.1 Clerk Middleware Setup

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/blog(.*)',
  '/api/health',
  '/api/openapi',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Public routes - allow all
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Protected routes - require auth
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Admin routes - require admin role
  if (isAdminRoute(req)) {
    const roles = (sessionClaims?.metadata as any)?.roles || []
    if (!roles.includes('admin') && !roles.includes('community_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
  }

  // Inject user ID header for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', userId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

## 9.2 Route Protection Patterns

**Define route groups:**
```typescript
const PROTECTED_ROUTES = [
  '/dashboard(.*)',
  '/settings(.*)',
  '/api/posts',
]

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/blog(.*)',
  '/api/health',
]

const ADMIN_ROUTES = [
  '/admin(.*)',
  '/api/admin(.*)',
]
```

## 9.3 Authentication Context in Domain APIs

### The Challenge

Domain API handlers need access to authenticated user information to:
- Track who created or modified records (`createdBy`, `modifiedBy` fields)
- Implement user-scoped authorization logic
- Provide audit trails and activity logging
- Support role-based access control

However, domain APIs should remain testable and not directly depend on Next.js request objects or Clerk SDK calls.

### The Solution: getAuthContext()

The platform provides a centralized `getAuthContext()` helper function that extracts authentication information from request headers. These headers are automatically injected by the Clerk middleware for protected routes.

**Key Benefits:**
1. **Testability** - Easy to mock in tests without complex setup
2. **Consistency** - Single source of truth for auth context extraction
3. **Type Safety** - Returns a strongly-typed `AuthContext` interface
4. **Simplicity** - Clean API that hides Next.js async context complexity
5. **Decoupling** - Domain logic doesn't depend on HTTP layer details

### Core Implementation

```typescript
// src/lib/auth/index.ts
import { headers } from 'next/headers'

export interface AuthContext {
  userId: string | null      // Clerk user ID
  sessionId: string | null   // Clerk session ID
  role: string | null        // User role (e.g., 'community_admin')
}

/**
 * Extract authentication context from request headers
 * These headers are set by the middleware for API routes
 */
export async function getAuthContext(): Promise<AuthContext> {
  const headersList = await headers()

  return {
    userId: headersList.get('x-user-id'),
    sessionId: headersList.get('x-session-id'),
    role: headersList.get('x-user-role'),
  }
}
```

### How Middleware Injects Headers

The Clerk middleware automatically processes authentication for all requests and injects custom headers:

```typescript
// src/middleware.ts (simplified)
import { clerkMiddleware } from '@clerk/nextjs/server'
import { addAuthHeaders } from '@/lib/auth/middleware-helpers'

export default clerkMiddleware(async (auth, req) => {
  const authState = await auth()

  if (authState.userId) {
    // Extract role from Clerk session claims
    const role = getRoleFromSessionClaims(authState.sessionClaims)

    // Inject headers that will be available to route handlers
    addAuthHeaders(req, {
      userId: authState.userId,
      sessionId: authState.sessionId,
      role: role || null
    })
  }
})
```

**Headers Injected:**
- `x-user-id` - The authenticated user's Clerk ID
- `x-session-id` - The current Clerk session ID
- `x-user-role` - The user's role from metadata (e.g., 'community_admin')

These headers are available to all route handlers via the `getAuthContext()` helper.

### Basic Usage Pattern

**Standard API Handler:**

```typescript
// src/domains/posts/api.ts
import { NextRequest } from 'next/server'
import logic from './logic'
import { say } from '@/lib/responses/say'
import { handleError } from '@/lib/errors/handler'
import { getAuthContext } from '@/lib/auth'

export default {
  async create(req: NextRequest) {
    try {
      // Get auth context from headers (set by middleware)
      const auth = await getAuthContext()
      const data = await req.json()

      // Extract userId with system fallback
      const userId = auth.userId || 'system'

      // Pass to business logic layer
      const result = await logic.create(data, userId)
      return say.created(result, 'POST')
    } catch (error) {
      return handleError(error, req)
    }
  },

  async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const auth = await getAuthContext()
      const data = await req.json()
      const { id } = await params

      const userId = auth.userId || 'system'

      const result = await logic.update(id, data, userId)
      return say.ok(result, 'POST')
    } catch (error) {
      return handleError(error, req)
    }
  }
}
```

**Why the 'system' Fallback?**
- Public endpoints may not have authenticated users
- Background jobs or system processes may create/modify records
- Provides graceful degradation instead of null errors
- Clear audit trail when system (vs user) makes changes

### Helper Functions for Common Patterns

The auth library provides several helper functions for different scenarios:

#### 1. requireAuth() - Enforce Authentication

Use when endpoint absolutely requires authentication:

```typescript
import { requireAuth } from '@/lib/auth'

async create(req: NextRequest) {
  try {
    // Throws Boom.unauthorized if not authenticated
    const auth = await requireAuth()

    // auth.userId is guaranteed to be non-null here
    const data = await req.json()
    const result = await logic.create(data, auth.userId)
    return say.created(result, 'POST')
  } catch (error) {
    return handleError(error, req)
  }
}
```

**Implementation:**

```typescript
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext()

  if (!auth.userId) {
    throw Boom.unauthorized('Authentication required')
  }

  return auth
}
```

#### 2. requireRole() - Enforce Role-Based Access

Use for admin-only or role-specific endpoints:

```typescript
import { requireRole } from '@/lib/auth'

async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Throws Boom.forbidden if user lacks required role
    const auth = await requireRole(['community_admin'])

    const { id } = await params
    await logic.delete(id)
    return say.noContent()
  } catch (error) {
    return handleError(error, req)
  }
}
```

**Implementation:**

```typescript
export async function requireRole(allowedRoles: string[]): Promise<AuthContext> {
  const auth = await requireAuth()

  if (!auth.role || !allowedRoles.includes(auth.role)) {
    throw Boom.forbidden('Insufficient permissions')
  }

  return auth
}
```

#### 3. getOptionalAuthContext() - Enhanced Optional Auth

Use for endpoints with different behavior for authenticated vs anonymous users:

```typescript
import { getOptionalAuthContext } from '@/lib/auth'

async list(req: NextRequest) {
  try {
    const auth = await getOptionalAuthContext()

    // Personalize results for authenticated users
    const options = {
      includePrivate: auth.isAuthenticated,
      includeOwned: auth.isAuthenticated,
      ownerId: auth.userId
    }

    const result = await logic.list(options)
    return say.ok(result.data, 'POSTS', result.count)
  } catch (error) {
    return handleError(error, req)
  }
}
```

**Implementation:**

```typescript
export async function getOptionalAuthContext() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const sessionId = headersList.get('x-session-id')
  const role = headersList.get('x-user-role')

  return {
    userId: userId || undefined,
    sessionId: sessionId || undefined,
    role: role || undefined,
    isAdmin: role === 'community_admin',
    isAuthenticated: !!userId
  }
}
```

#### 4. hasRole() & isAuthenticated() - Boolean Checks

Use for conditional logic without throwing errors:

```typescript
import { hasRole, isAuthenticated } from '@/lib/auth'

async list(req: NextRequest) {
  try {
    const isAdmin = await hasRole(['community_admin'])
    const isAuth = await isAuthenticated()

    const options = {
      includeDrafts: isAdmin,
      includeOwned: isAuth
    }

    const result = await logic.list(options)
    return say.ok(result.data, 'POSTS', result.count)
  } catch (error) {
    return handleError(error, req)
  }
}
```

**Implementations:**

```typescript
export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  const auth = await getAuthContext()
  return auth.role ? allowedRoles.includes(auth.role) : false
}

export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuthContext()
  return !!auth.userId
}
```

### Complete Domain API Example

Here's a full domain API showcasing different patterns:

```typescript
// src/domains/articles/api.ts
import { NextRequest } from 'next/server'
import logic from './logic'
import { say } from '@/lib/responses/say'
import { handleError } from '@/lib/errors/handler'
import {
  getAuthContext,
  requireAuth,
  requireRole,
  getOptionalAuthContext
} from '@/lib/auth'
import { extractODataParams } from '@/shared/utils/odata'

export default {
  // Public endpoint with optional personalization
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const odataParams = extractODataParams(searchParams)

      // Get auth info without requiring authentication
      const auth = await getOptionalAuthContext()

      // Pass auth context for personalized filtering
      const result = await logic.list(odataParams, {
        userId: auth.userId,
        includePrivate: auth.isAdmin
      })

      return say.ok(result.data, 'ARTICLES', result.count)
    } catch (error) {
      return handleError(error, req)
    }
  },

  // Public endpoint
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params
      const result = await logic.get(id)
      return say.ok(result, 'ARTICLE')
    } catch (error) {
      return handleError(error, req)
    }
  },

  // Protected endpoint - requires authentication
  async create(req: NextRequest) {
    try {
      // Enforce authentication (throws if not authenticated)
      const auth = await requireAuth()
      const data = await req.json()

      // userId is guaranteed non-null
      const result = await logic.create(data, auth.userId)
      return say.created(result, 'ARTICLE')
    } catch (error) {
      return handleError(error, req)
    }
  },

  // Protected endpoint - optional fallback for system
  async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const auth = await getAuthContext()
      const data = await req.json()
      const { id } = await params

      // Use system fallback (could be called by background job)
      const userId = auth.userId || 'system'

      const result = await logic.update(id, data, userId)
      return say.ok(result, 'ARTICLE')
    } catch (error) {
      return handleError(error, req)
    }
  },

  // Admin-only endpoint
  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      // Enforce admin role (throws if unauthorized)
      await requireRole(['community_admin'])

      const { id } = await params
      await logic.delete(id)
      return say.noContent()
    } catch (error) {
      return handleError(error, req)
    }
  }
}
```

### Usage in Business Logic Layer

Domain logic functions accept userId as a parameter rather than extracting it directly:

```typescript
// src/domains/posts/logic.ts
import { CreatePostInput, UpdatePostInput } from './models'
import dal from './dal'

export default {
  async create(data: CreatePostInput, userId: string) {
    // Validate input
    if (!data.title || !data.content) {
      throw new Error('Title and content are required')
    }

    // Create with user tracking
    const post = await dal.create({
      ...data,
      createdBy: userId,
      modifiedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return post
  },

  async update(id: string, data: UpdatePostInput, userId: string) {
    // Update with user tracking
    const post = await dal.update(id, {
      ...data,
      modifiedBy: userId,
      updatedAt: new Date()
    })

    return post
  }
}
```

**Why This Pattern?**
- Logic layer remains pure and testable
- Easy to mock userId in tests
- Clear separation: API layer handles HTTP, logic layer handles business rules
- DAL layer handles database operations

### Testing Authentication Context

**Mocking in Tests:**

```typescript
// src/domains/posts/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import api from '../api'
import * as auth from '@/lib/auth'

describe('Posts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use authenticated user ID when creating post', async () => {
    // Mock getAuthContext to return test user
    vi.spyOn(auth, 'getAuthContext').mockResolvedValue({
      userId: 'user_test123',
      sessionId: 'session_test456',
      role: 'community_admin'
    })

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Test content'
      })
    })

    const response = await api.create(req)
    const data = await response.json()

    expect(data.result.createdBy).toBe('user_test123')
  })

  it('should use system fallback when user not authenticated', async () => {
    // Mock getAuthContext to return null userId
    vi.spyOn(auth, 'getAuthContext').mockResolvedValue({
      userId: null,
      sessionId: null,
      role: null
    })

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'System Post',
        content: 'Created by system'
      })
    })

    const response = await api.create(req)
    const data = await response.json()

    expect(data.result.createdBy).toBe('system')
  })

  it('should throw when requireAuth called without authentication', async () => {
    vi.spyOn(auth, 'requireAuth').mockRejectedValue(
      new Error('Authentication required')
    )

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' })
    })

    const response = await api.create(req)

    expect(response.status).toBe(401)
  })
})
```

## 9.4 Direct Clerk Access vs Middleware Headers

### Two Methods of Authentication Access

The platform provides two distinct methods for accessing authentication information, each suited for different contexts:

1. **getAuthContext()** - Reads from middleware-injected headers (API routes)
2. **getAuthContextDirect()** - Calls Clerk SDK directly (Server Components, Server Actions)

### Method 1: getAuthContext() - For API Routes

**When to Use:**
- Inside Route Handlers (`/app/api/**/*.ts`)
- Inside Domain API handlers (`/domains/*/api.ts`)
- When middleware has already processed the request

**How It Works:**

```typescript
import { getAuthContext } from '@/lib/auth'

async function handler(req: NextRequest) {
  // Reads from x-user-id, x-session-id, x-user-role headers
  const auth = await getAuthContext()

  console.log(auth.userId)     // 'user_2abc123def' or null
  console.log(auth.sessionId)  // 'sess_xyz789' or null
  console.log(auth.role)       // 'community_admin' or null
}
```

**Advantages:**
- Fast (no external API calls)
- Consistent with middleware processing
- Easy to test (mock header values)
- Works with route protection middleware

**Limitations:**
- Only available in route handlers
- Requires middleware to run first
- Headers could theoretically be spoofed (but middleware controls them)

### Method 2: getAuthContextDirect() - For Server Components

**When to Use:**
- Inside Server Components (`/app/**/page.tsx`, `layout.tsx`)
- Inside Server Actions
- When you need fresh auth state
- Outside of route handlers

**How It Works:**

```typescript
import { getAuthContextDirect } from '@/lib/auth'

export default async function DashboardPage() {
  // Calls Clerk SDK directly, bypasses headers
  const auth = await getAuthContextDirect()

  if (!auth.userId) {
    return <SignInPrompt />
  }

  return <Dashboard userId={auth.userId} />
}
```

**Implementation:**

```typescript
import { auth } from '@clerk/nextjs/server'
import { getRoleFromSessionClaims } from './types'

export async function getAuthContextDirect(): Promise<AuthContext> {
  const authState = await auth()

  return {
    userId: authState.userId,
    sessionId: authState.sessionId,
    role: getRoleFromSessionClaims(authState.sessionClaims) ?? null,
  }
}
```

**Advantages:**
- Works anywhere in Server Components
- Always fresh from Clerk
- No dependency on middleware
- Official Clerk SDK approach

**Limitations:**
- Slightly slower (calls Clerk servers)
- Not available in client components
- Harder to mock in tests

### Comparison Matrix

| Feature | getAuthContext() | getAuthContextDirect() |
|---------|------------------|------------------------|
| **Use In** | Route Handlers | Server Components |
| **Source** | Request Headers | Clerk SDK |
| **Speed** | Fast (local) | Slower (API call) |
| **Testability** | Easy (mock headers) | Moderate (mock Clerk) |
| **Middleware Required** | Yes | No |
| **Freshness** | Request-scoped | Always fresh |
| **Client Components** | No | No |

### Real-World Examples

#### Example 1: API Route with Header-Based Auth

```typescript
// src/app/api/posts/route.ts
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { say } from '@/lib/responses/say'

export async function POST(req: NextRequest) {
  // Method 1: Read from middleware headers
  const auth = await getAuthContext()

  const data = await req.json()
  const userId = auth.userId || 'system'

  // Create post with user tracking
  const post = await createPost(data, userId)

  return say.created(post, 'POST')
}
```

#### Example 2: Server Component with Direct Clerk Access

```typescript
// src/app/dashboard/page.tsx
import { getAuthContextDirect } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Method 2: Call Clerk directly
  const auth = await getAuthContextDirect()

  if (!auth.userId) {
    redirect('/sign-in')
  }

  // Fetch user-specific data
  const posts = await getUserPosts(auth.userId)

  return (
    <div>
      <h1>Your Dashboard</h1>
      <PostsList posts={posts} />
    </div>
  )
}
```

#### Example 3: Server Action with Role Check

```typescript
// src/app/admin/actions.ts
'use server'

import { getAuthContextDirect } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import Boom from '@hapi/boom'

export async function deleteUser(userId: string) {
  // Method 2: Get fresh auth state
  const auth = await getAuthContextDirect()

  // Check for admin role
  if (auth.role !== 'community_admin') {
    throw Boom.forbidden('Admin access required')
  }

  // Perform deletion
  await performUserDeletion(userId)

  // Revalidate admin page
  revalidatePath('/admin/users')
}
```

#### Example 4: Mixed Usage in Domain

```typescript
// src/domains/articles/api.ts
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/auth'

export default {
  // In route handler: use getAuthContext()
  async create(req: NextRequest) {
    const auth = await getAuthContext()  // Method 1
    const data = await req.json()

    return await logic.create(data, auth.userId || 'system')
  }
}

// src/app/articles/[id]/page.tsx
import { getAuthContextDirect } from '@/lib/auth'

export default async function ArticlePage({ params }: Props) {
  const auth = await getAuthContextDirect()  // Method 2
  const { id } = await params

  const article = await getArticle(id)
  const canEdit = article.authorId === auth.userId || auth.role === 'community_admin'

  return <Article data={article} canEdit={canEdit} />
}
```

### Best Practices

#### 1. Choose the Right Method

```typescript
// ✅ GOOD: Route Handler uses getAuthContext()
export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  // ...
}

// ✅ GOOD: Server Component uses getAuthContextDirect()
export default async function Page() {
  const auth = await getAuthContextDirect()
  // ...
}

// ❌ BAD: Server Component trying to use route handler method
export default async function Page() {
  const auth = await getAuthContext()  // Won't have headers!
  // ...
}
```

#### 2. Centralize Role Extraction

Both methods use the same role extraction logic:

```typescript
// src/lib/auth/types.ts
export interface SessionClaimsWithMetadata {
  metadata?: {
    role?: string
  }
}

export function getRoleFromSessionClaims(
  sessionClaims?: SessionClaimsWithMetadata
): string | null {
  if (!sessionClaims?.metadata?.role) {
    return null
  }

  return sessionClaims.metadata.role
}
```

This ensures consistent role handling regardless of access method.

#### 3. Use Helper Functions

Both methods work with the same helper functions:

```typescript
// Works with getAuthContext() in route handlers
async function handler(req: NextRequest) {
  const auth = await requireAuth()  // Uses getAuthContext internally
  // ...
}

// Also works with getAuthContextDirect() in components
async function serverAction() {
  const hasAdminRole = await hasRole(['community_admin'])  // Can use either method
  // ...
}
```

#### 4. Testing Both Methods

```typescript
// Test route handler (Method 1)
it('should authenticate via headers', async () => {
  vi.spyOn(auth, 'getAuthContext').mockResolvedValue({
    userId: 'user_123',
    sessionId: 'sess_456',
    role: 'community_admin'
  })

  // Test route handler...
})

// Test server component (Method 2)
it('should authenticate via Clerk SDK', async () => {
  vi.spyOn(auth, 'getAuthContextDirect').mockResolvedValue({
    userId: 'user_123',
    sessionId: 'sess_456',
    role: 'community_admin'
  })

  // Test component...
})
```

### Security Considerations

#### Header Injection Security

**Q: Can't users spoof the x-user-id header?**

**A:** No, because:

1. **Middleware Controls Headers**: The Clerk middleware sets these headers after validating the session token
2. **Server-Only**: Headers are processed server-side; clients never see or set them
3. **Request Cloning**: Next.js middleware clones the request when modifying headers
4. **Validation Chain**: Clerk validates the JWT session token before any headers are set

```typescript
// Simplified middleware flow
export default clerkMiddleware(async (auth, req) => {
  // 1. Clerk validates session token from cookie
  const authState = await auth()

  // 2. Only if valid, extract user info
  if (authState.userId) {
    // 3. Add headers to server-side request clone
    addAuthHeaders(req, {
      userId: authState.userId,
      sessionId: authState.sessionId,
      role: getRoleFromSessionClaims(authState.sessionClaims)
    })
  }

  // 4. Modified request proceeds to handler
})
```

Client requests cannot bypass this validation chain.

#### When to Use Direct vs Headers

**Use getAuthContext() (headers) when:**
- You're in a route handler
- Performance matters (no extra API calls)
- You want consistent test mocking
- Middleware protection is already applied

**Use getAuthContextDirect() (Clerk SDK) when:**
- You're in a Server Component or Server Action
- You need absolute freshness (session could have changed)
- You're outside the middleware request flow
- You want official Clerk SDK guarantees

### Summary

**Two distinct patterns for two distinct contexts:**

1. **Route Handlers**: Use `getAuthContext()` to read middleware-injected headers
   - Fast, testable, works with route protection
   - Source: `x-user-id`, `x-session-id`, `x-user-role` headers

2. **Server Components**: Use `getAuthContextDirect()` to call Clerk SDK
   - Fresh, works anywhere, official Clerk approach
   - Source: `auth()` from `@clerk/nextjs/server`

Both methods return the same `AuthContext` interface and work with the same helper functions (`requireAuth`, `requireRole`, `hasRole`, etc.).

Choose the right tool for the right context, and you'll have robust, secure, testable authentication throughout your application.

## 9.5 Route Wrappers

**CRITICAL ARCHITECTURE PRINCIPLE:** Domain APIs are authentication-agnostic. Route wrappers are applied at the App Router level (`src/app/api/*/route.ts`), NOT in domain API files (`src/domains/*/api.ts`).

This separation maintains clean architecture:
- **Domain Layer** - Business logic, no authentication concerns
- **App Router Layer** - Route protection via wrappers
- **Middleware** - Injects authentication headers that domains can optionally access

### How It Works

#### 1. Domain APIs Stay Clean

Domain API handlers receive `NextRequest` and return `Response`. They do NOT apply wrappers:

```typescript
// src/domains/posts/api.ts
import { NextRequest } from 'next/server';
import logic from './logic';
import { say } from '@/lib/responses/say';
import { handleError } from '@/lib/errors/handler';
import { getAuthContext } from '@/lib/auth';

export default {
  // Public handler - no authentication required
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const result = await logic.list(searchParams);
      return say.ok(result.data, 'POSTS', result.count);
    } catch (error) {
      return handleError(error, req);
    }
  },

  // Protected handler - accesses auth context from headers
  async create(req: NextRequest) {
    try {
      // Auth context injected by wrapper at App Router level
      const auth = await getAuthContext();
      const data = await req.json();

      // Use authenticated user ID
      const userId = auth.userId || 'system';

      const result = await logic.create(data, userId);
      return say.created(result, 'POST');
    } catch (error) {
      return handleError(error, req);
    }
  }
};
```

**Key Points:**
- Domain APIs are pure business logic
- No `withAuth`, `withRole`, or `withPublic` in domain files
- Authentication context accessed via `getAuthContext()` when needed
- Domains remain testable without authentication dependencies

#### 2. App Router Applies Wrappers

Route files in `src/app/api` import domain APIs and apply wrappers declaratively:

```typescript
// src/app/api/posts/route.ts
import { api } from '@/domains/posts';
import { withPublic, withRole } from '@/lib/auth';

// Public route - no authentication required
export const GET = withPublic(api.list);

// Protected route - requires community_admin role
export const POST = withRole(['community_admin'], api.create);
```

This pattern:
- Declares protection requirements at the route level
- Keeps domain logic independent of authentication
- Makes authorization requirements visible and auditable
- Allows different routes to apply different protection levels

#### 3. Available Wrappers

**`withPublic(handler)`** - Explicitly marks routes as public (pass-through for clarity):

```typescript
// src/app/api/posts/route.ts
export const GET = withPublic(api.list);
```

**`withAuth(handler)`** - Requires valid authentication (bearer tokens):

```typescript
// src/app/api/profile/route.ts
export const GET = withAuth(api.getProfile);
```

Behavior:
- Requires `Authorization: Bearer <token>` header
- Validates token with Clerk
- Injects `x-user-id`, `x-session-id`, `x-user-role` headers
- Returns 401 if token missing or invalid

**`withRole(roles, handler)`** - Requires authentication AND specific role:

```typescript
// src/app/api/users/route.ts
export const GET = withRole(['community_admin'], api.list);
export const POST = withRole(['community_admin'], api.create);
```

Behavior:
- First validates authentication (same as `withAuth`)
- Then checks if user's role is in allowed roles array
- Returns 403 if role check fails

**`withOptionalAPIAuth(handler)`** - Allows both authenticated and anonymous access:

```typescript
// src/app/api/assets/route.ts
export const GET = withOptionalAPIAuth(api.list);
```

Behavior:
- If `Authorization: Bearer <token>` present, validates and injects headers
- If no bearer token or invalid token, continues without headers
- Domain logic uses `getOptionalAuthContext()` to determine behavior

Example in domain:

```typescript
// src/domains/assets/api.ts
async list(req: NextRequest) {
  const auth = await getOptionalAuthContext(req);

  // Filter based on authentication status
  if (!auth.isAuthenticated) {
    // Only show public assets
    odataParams.$filter = 'isPublic eq true';
  }
  // Authenticated users see all assets

  const result = await logic.list(odataParams);
  return say.ok(result.data, 'ASSETS', result.count);
}
```

### Complete Example: Mixed Access Pattern

```typescript
// src/app/api/posts/route.ts
import { api } from '@/domains/posts';
import { withPublic, withRole } from '@/lib/auth';
import { withCache, withInvalidation } from '@/lib/api/cache-wrapper';

// Anyone can list posts
export const GET = withCache(withPublic(api.list));

// Only admins can create posts
export const POST = withInvalidation(
  withRole(['community_admin'], api.create),
  '/api/posts'
);
```

```typescript
// src/domains/posts/api.ts
export default {
  async list(req: NextRequest) {
    // No auth needed - public endpoint
    const result = await logic.list(params);
    return say.ok(result.data, 'POSTS', result.count);
  },

  async create(req: NextRequest) {
    // Auth context available from withRole wrapper
    const auth = await getAuthContext();
    const userId = auth.userId || 'system';

    const data = await req.json();
    const result = await logic.create(data, userId);
    return say.created(result, 'POST');
  }
};
```

### Authentication Context Flow

```
Request → Middleware → App Router (Wrapper) → Domain API

1. Request arrives with bearer token
2. Middleware allows request through
3. Route wrapper (withAuth/withRole) validates token
4. Wrapper injects headers: x-user-id, x-session-id, x-user-role
5. Domain API accesses context via getAuthContext()
6. Business logic uses authentication info
```

### Benefits of This Architecture

**Clean Separation:**
- Domain APIs are pure business logic, no auth dependencies
- Easier to test (no authentication infrastructure needed)
- Reusable across different auth schemes

**Visible Authorization:**
- Route files document who can access what
- Clear at a glance: `withPublic`, `withAuth`, `withRole(['admin'])`

**Flexible Protection:**
- Same domain handler, different protection per route
- Compose wrappers with other middleware (caching, rate limiting)

**Future-Proof:**
- Add new protection schemes without changing domains
- Swap authentication providers without domain changes

See SPEC-route-wrappers.md for comprehensive examples including nested routes, optional auth patterns, wrapper composition, and testing strategies.

## 9.6 Bearer Token vs Session Cookie Patterns

**API routes** (use bearer tokens):
```typescript
// Client sends Authorization header
fetch('/api/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
```

**UI routes** (use session cookies):
- Clerk automatically manages session cookies
- No manual token handling needed
- Middleware reads session from cookie

**Why different patterns?**
- APIs: Stateless, token-based (mobile apps, external clients)
- UI: Session-based (browser, automatic cookie handling)

## 9.7 Role Extraction from Session Claims

```typescript
// Middleware extracts roles
const roles = (sessionClaims?.metadata as any)?.roles || []

// Inject roles header for API routes
if (req.nextUrl.pathname.startsWith('/api')) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', userId)
  requestHeaders.set('x-user-roles', roles.join(','))
  return NextResponse.next({ request: { headers: requestHeaders } })
}
```

**Clerk configuration** (in Dashboard):
- Session token must include `metadata` in claims
- User metadata structure: `{ roles: ['admin', 'user'] }`

---

# 10. OpenAPI & API Patterns

## 10.1 OpenAPI-First Development

**Process:**
1. Define schemas in domain `schema.ts`
2. Export schemas and paths
3. Aggregate in `lib/openapi/spec.ts`
4. Implement API handlers matching schemas
5. Validate requests/responses against schemas

## 10.2 Schema Definitions in domain/schema.ts

```typescript
// src/domains/posts/schema.ts
export const postSchemas = {
  Post: {
    allOf: [
      { $ref: '#/components/schemas/CommonObjectMeta' },
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' },
          authorId: { type: 'string' },
          published: { type: 'boolean' },
        },
        required: ['title', 'slug', 'content', 'authorId'],
      },
    ],
  },
  CreatePostRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 10 },
      published: { type: 'boolean', default: false },
    },
    required: ['title', 'content'],
  },
  UpdatePostRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 10 },
      published: { type: 'boolean' },
    },
  },
}

export const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List all posts',
      parameters: [
        {
          name: '$filter',
          in: 'query',
          schema: { type: 'string' },
          description: 'OData filter expression',
        },
        {
          name: '$orderby',
          in: 'query',
          schema: { type: 'string' },
          description: 'OData orderby expression',
        },
        {
          name: '$skip',
          in: 'query',
          schema: { type: 'integer', default: 0 },
        },
        {
          name: '$top',
          in: 'query',
          schema: { type: 'integer', default: 20 },
        },
      ],
      responses: {
        200: {
          description: 'List of posts with pagination',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Post' },
                  },
                  pagination: { $ref: '#/components/schemas/PaginationInfo' },
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a new post',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreatePostRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Post created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
  '/api/posts/{id}': {
    get: {
      tags: ['Posts'],
      summary: 'Get post by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Post found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
        404: {
          description: 'Post not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    patch: {
      tags: ['Posts'],
      summary: 'Update post',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JsonPatchDocument' },
          },
        },
      },
      responses: {
        200: {
          description: 'Post updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    delete: {
      tags: ['Posts'],
      summary: 'Delete post',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        204: { description: 'Post deleted successfully' },
        404: {
          description: 'Post not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
}
```

## 10.3 Shared Schemas (CommonObjectMeta, JsonPatchDocument, Error)

```typescript
// src/shared/schemas/api.ts
export const commonSchemas = {
  CommonObjectMeta: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      createdBy: { type: 'string' },
      modifiedBy: { type: 'string' },
    },
    required: ['id', 'createdAt', 'updatedAt'],
  },
  PaginationInfo: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      skip: { type: 'integer' },
      top: { type: 'integer' },
      hasMore: { type: 'boolean' },
    },
    required: ['total', 'skip', 'top', 'hasMore'],
  },
  JsonPatchDocument: {
    type: 'array',
    additionalProperties: false,
    description: 'Array of JSON Patch operations (RFC 6902). Details at http://jsonpatch.com/',
    items: {
      type: 'object',
      additionalProperties: false,
      description: 'Reference the update model for the full paths to update',
      oneOf: [
        // Operations with object value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'object',
              description: 'The object to set the property at the above path to'
            }
          }
        },
        // Operations with string value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'string',
              description: 'The string to set the property at the above path to'
            }
          }
        },
        // Operations with boolean value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'boolean',
              description: 'The boolean to set the property at the above path to'
            }
          }
        },
        // Operations with integer value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'integer',
              description: 'The integer to set the property at the above path to'
            }
          }
        },
        // Operations with number value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'number',
              description: 'The number to set the property at the above path to'
            }
          }
        },
        // Operations with array value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'array',
              description: 'The array to set the property at the above path to'
            }
          }
        },
        // Operations with null value
        {
          required: ['op', 'path', 'value'],
          properties: {
            op: { type: 'string', enum: ['replace', 'add', 'test'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/-'
            },
            value: {
              type: 'null',
              description: 'Set the property at the above path to null'
            }
          }
        },
        // Remove operation (no value required)
        {
          required: ['op', 'path'],
          properties: {
            op: { type: 'string', enum: ['remove'] },
            path: {
              type: 'string',
              description: 'A path to the property in the data model. For example /name/firstName or /emails/0'
            }
          }
        },
        // Copy/Move operations (require 'from' instead of 'value')
        {
          required: ['op', 'from', 'path'],
          properties: {
            op: { type: 'string', enum: ['copy', 'move'] },
            from: {
              type: 'string',
              description: 'Path to copy or move from'
            },
            path: {
              type: 'string',
              description: 'Path to copy or move to'
            }
          }
        }
      ]
    }
  },
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      statusCode: { type: 'integer' },
      details: { type: 'object' },
    },
    required: ['error'],
  },
}
```

## 10.3a Wiring Schemas into Central OpenAPI Spec

```typescript
// Example using "posts" and "users" domains - replace with your domains
// src/lib/openapi/spec.ts
import { domainSchemas, domainPaths } from '@/domains/[domain]/schema'
import { otherSchemas, otherPaths } from '@/domains/[other-domain]/schema'
import { commonSchemas } from '@/shared/schemas/api'

export function getOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://api.example.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    tags: [
      { name: 'Domain 1', description: 'Domain 1 operations' },
      { name: 'Domain 2', description: 'Domain 2 operations' },
    ],
    paths: {
      ...domainPaths,
      ...otherPaths,
    },
    components: {
      schemas: {
        ...commonSchemas,      // Common schemas first (so they can be referenced)
        ...domainSchemas,
        ...otherSchemas,
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from authentication provider',
        },
      },
    },
  }
}
```

**Serve OpenAPI spec:**
```typescript
// src/app/api/openapi/route.ts
import { NextRequest } from 'next/server'
import { getOpenAPISpec } from '@/lib/openapi/spec'

export async function GET(_req: NextRequest) {
  const spec = getOpenAPISpec()
  return Response.json(spec, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

**Serve Swagger UI:**
```typescript
// src/app/api-docs/page.tsx
'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen">
      <SwaggerUI url="/api/openapi" />
    </div>
  )
}
```

## 10.4 Component Schema References and allOf Composition

```typescript
Post: {
  allOf: [
    { $ref: '#/components/schemas/CommonObjectMeta' },  // Include common fields
    {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  ],
}
```

**Result:** Post includes id, createdAt, updatedAt, createdBy, modifiedBy + title, content

## 10.5 Request/Response DTO Patterns

**Create DTO** (excludes system fields):
```typescript
CreatePostRequest: {
  type: 'object',
  properties: {
    title: { type: 'string' },
    content: { type: 'string' },
  },
  required: ['title', 'content'],
}
```

**Update DTO** (all fields optional):
```typescript
UpdatePostRequest: {
  type: 'object',
  properties: {
    title: { type: 'string' },
    content: { type: 'string' },
    published: { type: 'boolean' },
  },
}
```

**Response DTO** (full entity with system fields):
```typescript
Post: {
  allOf: [
    { $ref: '#/components/schemas/CommonObjectMeta' },
    { /* entity fields */ },
  ],
}
```

## 10.6 JSON Patch Implementation Patterns

```typescript
// src/domains/posts/logic.ts
import { applyPatch, Operation } from 'fast-json-patch'

const PROTECTED_FIELDS = ['_id', 'id', 'createdAt', 'updatedAt', 'createdBy']

export const PostsLogic = {
  async patch(id: string, patches: Operation[], userId: string): Promise<Post> {
    // Validate patches don't modify protected fields
    for (const patch of patches) {
      const field = patch.path.split('/')[1]
      if (PROTECTED_FIELDS.includes(field)) {
        throw new Error(`Cannot modify protected field: ${field}`)
      }
    }

    // Get current document
    const post = await PostsDal.getById(id)
    if (!post) {
      throw Boom.notFound('Post not found')
    }

    // Apply patches
    const patched = applyPatch(post, patches, true, false).newDocument

    // Update modifiedBy
    patched.modifiedBy = userId

    // Save with $set to prevent field overwrites
    return PostsDal.update(id, { $set: patched })
  },
}
```

## 10.7 Protected Field Validation

```typescript
const PROTECTED_FIELDS = ['_id', 'id', 'createdAt', 'updatedAt', 'createdBy', 'modifiedBy']

function validatePatches(patches: Operation[]) {
  for (const patch of patches) {
    const field = patch.path.split('/')[1]
    if (PROTECTED_FIELDS.includes(field)) {
      throw Boom.badRequest(`Cannot modify protected field: ${field}`)
    }
  }
}
```

## 10.8 OData Query Support

OData query parameters provide standardized filtering, sorting, and pagination for list endpoints. The pattern separates concerns across three layers: **API extracts**, **Logic parses and validates**, **DAL executes**.

### Key Pattern

**Pass raw OData parameters from API → Logic, parse in Logic layer, execute in DAL.**

```
API Layer (api.ts)
  └─> Extract OData params from URL using extractODataParams()
  └─> Pass entire IODataParams object to logic layer
      │
      └─> Logic Layer (logic.ts)
          └─> Parse OData params using parseOdataQuery()
          └─> Apply business rules to parsed query
          └─> Pass parsed query to DAL
          └─> Return { data, count } structure
              │
              └─> API Layer (api.ts)
                  └─> Return with say.ok(result.data, 'TYPE', result.count)
```

### IODataParams Interface

```typescript
// src/shared/utils/odata.ts

export interface IODataParams {
  $filter?: string          // OData filter expression
  $select?: string          // Fields to return (comma-separated)
  $skip?: string | number   // Number of results to skip
  $top?: string | number    // Max results to return
  $orderby?: string         // Sort expression
  $search?: string          // Full-text search term (custom, not standard OData)
}
```

### API Layer: Extract Parameters

```typescript
// src/shared/utils/odata.ts

/**
 * Extract OData parameters from URLSearchParams
 */
export function extractODataParams(searchParams: URLSearchParams): IODataParams {
  const params: IODataParams = {}

  const $filter = searchParams.get('$filter')
  const $select = searchParams.get('$select')
  const $skip = searchParams.get('$skip')
  const $top = searchParams.get('$top')
  const $orderby = searchParams.get('$orderby')
  const $search = searchParams.get('$search')

  if ($filter) params.$filter = $filter
  if ($select) params.$select = $select
  if ($skip) params.$skip = $skip
  if ($top) params.$top = $top
  if ($orderby) params.$orderby = $orderby
  if ($search) params.$search = $search

  return params
}
```

**Usage:**

```typescript
// src/domains/posts/api.ts
import { NextRequest } from 'next/server'
import logic from './logic'
import { say } from '@/lib/responses/say'
import { handleError } from '@/lib/errors/handler'
import { extractODataParams } from '@/shared/utils/odata'

export default {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)

      // Extract OData parameters from URL
      const odataParams = extractODataParams(searchParams)

      // Pass entire params object to logic layer
      const result = await logic.list(odataParams)

      // Return with count for pagination
      return say.ok(result.data, 'POSTS', result.count)
    } catch (error) {
      return handleError(error, req)
    }
  }
}
```

**Key points:**
- API layer extracts parameters but doesn't parse them
- Pass entire `odataParams` object to logic layer
- Use `say.ok(result.data, 'TYPE', result.count)` for paginated responses

### Logic Layer: Parse and Validate

```typescript
// src/shared/utils/odata.ts
import { createQuery } from 'odata-v4-mongodb'
import Boom from '@hapi/boom'

/**
 * Parse OData parameters and create MongoDB query
 */
export async function parseOdataQuery(params: IODataParams): Promise<any> {
  try {
    const queryParts: string[] = []

    if (params.$filter) queryParts.push(`$filter=${params.$filter}`)
    if (params.$select) queryParts.push(`$select=${params.$select}`)
    if (params.$skip) queryParts.push(`$skip=${params.$skip}`)
    if (params.$top) queryParts.push(`$top=${params.$top}`)
    if (params.$orderby) queryParts.push(`$orderby=${params.$orderby}`)

    if (queryParts.length === 0) return {}

    const query = queryParts.join('&').replace(/#/g, '%23').replace(/\//g, '%2F')
    return createQuery(query)
  } catch (error) {
    throw Boom.badRequest('Invalid OData query parameters', params)
  }
}
```

**Parsed query structure:**

```typescript
{
  query: { /* MongoDB filter object */ },
  sort: { /* MongoDB sort object */ },
  skip: 0,    // Number
  limit: 10,  // Number
  select: { /* MongoDB projection object */ }
}
```

**Usage in Logic layer:**

```typescript
// src/domains/posts/logic.ts
import dal from './dal'
import { IODataParams, parseOdataQuery } from '@/shared/utils/odata'
import Boom from '@hapi/boom'

export default {
  async list(params: IODataParams) {
    // Parse OData parameters into MongoDB query
    const query = await parseOdataQuery(params)

    // Apply business rules
    if (query.limit && query.limit > 100) {
      throw Boom.badRequest('Limit cannot exceed 100')
    }

    // Extract $search separately (custom, not standard OData)
    const searchTerm = params.$search

    // Pass parsed query to DAL
    const result = await dal.list(query, searchTerm)

    // Return structured result with data and count
    return {
      data: result.data,
      count: result.count
    }
  }
}
```

### DAL Layer: Execute Query

```typescript
// src/domains/posts/dal.ts
import { Post } from './models'

export default {
  async list(query: any, searchTerm?: string) {
    let mongoQuery = query.query || {}

    // Handle custom search term
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm.split(' ').join('|'), 'i')
      const searchCondition = {
        $or: [
          { title: searchRegex },
          { excerpt: searchRegex },
          { contentText: searchRegex }
        ]
      }

      // Merge with OData filters
      mongoQuery = Object.keys(mongoQuery).length > 0
        ? { $and: [mongoQuery, searchCondition] }
        : searchCondition
    }

    // Execute query and count in parallel
    const [data, total] = await Promise.all([
      Post.find(mongoQuery)
        .sort(query.sort || { publishedAt: -1 })
        .skip(query.skip || 0)
        .limit(query.limit || 10)
        .select(query.select || null),
      Post.countDocuments(mongoQuery)
    ])

    return { data, count: total }
  }
}
```

### OData Query Examples

**Filter by field:**
```bash
GET /api/posts?$filter=state eq 'published'
```

**Filter with AND:**
```bash
GET /api/posts?$filter=state eq 'published' and featured eq true
```

**Order by field:**
```bash
GET /api/posts?$orderby=publishedAt desc
```

**Pagination:**
```bash
GET /api/posts?$skip=20&$top=10
```

**Combined query:**
```bash
GET /api/posts?$filter=state eq 'published'&$orderby=publishedAt desc&$skip=0&$top=20&$search=typescript
```

**Select specific fields:**
```bash
GET /api/posts?$select=id,title,publishedAt
```

### Common Patterns

**Add authentication-based filtering:**

```typescript
// API Layer
async list(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const odataParams = extractODataParams(searchParams)

  // Check authentication
  const auth = await getOptionalAuthContext(req)

  // Add filter for non-authenticated users
  if (!auth.isAuthenticated) {
    odataParams.$filter = odataParams.$filter
      ? `(${odataParams.$filter}) and isPublic eq true`
      : 'isPublic eq true'
  }

  const result = await logic.list(odataParams)
  return say.ok(result.data, 'POSTS', result.count)
}
```

**Apply business rules in Logic:**

```typescript
async list(params: IODataParams) {
  const query = await parseOdataQuery(params)

  // Enforce maximum limit
  if (query.limit && query.limit > 100) {
    throw Boom.badRequest('Limit cannot exceed 100')
  }

  const result = await dal.list(query)
  return result
}
```

### Key Takeaways

1. **API Layer**: Use `extractODataParams()` to extract from URL
2. **Pass Object**: Send entire `IODataParams` to logic layer
3. **Logic Layer**: Use `parseOdataQuery()` to convert to MongoDB query
4. **Apply Rules**: Add validation and business logic in logic layer
5. **Return Structure**: Always return `{ data, count }` from logic
6. **Response Format**: Use `say.ok(result.data, 'TYPE', result.count)` in API
7. **Search Term**: Handle `$search` separately (custom, not standard OData)
8. **Error Handling**: Parse errors throw `Boom.badRequest`

See SPEC-odata.md for comprehensive examples including complete flow diagrams, error handling patterns, and testing strategies.

---

## Sections 11-15 can be found in READ-THIS-FIRST-3.md