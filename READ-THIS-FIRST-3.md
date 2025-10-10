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

### Sections 5-10 can be found in READ-THIS-FIRST-2.md

11. Middleware & Error Handling
12. Styling: Tailwind CSS v4
13. ESLint & Code Quality
14. Shared Resources
15. Shared Sections Pattern

### Sections 16-20 can be found in READ-THIS-FIRST-4.md

## Overview

This is part 3 of the READ-THIS-FIRST document.

---

# 11. Middleware & Error Handling

## 11.1 Error Handling with Boom

```typescript
// src/lib/errors/handler.ts
import Boom from '@hapi/boom'
import { NextResponse } from 'next/server'

export function handleError(error: unknown) {
  console.error('[Error]', error)

  if (Boom.isBoom(error)) {
    return NextResponse.json(
      {
        error: error.message,
        statusCode: error.output.statusCode,
        details: error.data,
      },
      { status: error.output.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Usage in domain logic:**
```typescript
// src/domains/posts/logic.ts
import Boom from '@hapi/boom'

export const PostsLogic = {
  async getById(id: string): Promise<Post> {
    const post = await PostsDal.getById(id)
    if (!post) {
      throw Boom.notFound('Post not found')
    }
    return post
  },

  async create(data: CreatePostDto): Promise<Post> {
    if (!data.title || data.title.length < 3) {
      throw Boom.badRequest('Title must be at least 3 characters', { field: 'title' })
    }
    return PostsDal.create(data)
  },
}
```

## 11.2 Say Pattern for API Responses

The "say" pattern is a standardized response utility for Next.js 15 App Router API routes that ensures consistent HTTP response formatting across all domains. It provides a semantic, type-safe interface for creating `NextResponse` objects with predictable envelope structures.

### Object-Based API

The say pattern is implemented as a frozen object with methods, **not** as separate function exports:

```typescript
import { say } from '@/lib/responses/say';

// CORRECT
return say.ok(data, 'RESOURCE');
return say.created(newItem, 'ITEM');
return say.error(404, 'Not found');

// INCORRECT - Will not work
import { ok } from '@/lib/responses/say'; // No such export
```

### Core Methods

**Success responses:**
- `say.ok<T>(data: T, type: string, count?: number)` - 200 OK (GET, PUT, PATCH)
- `say.created<T>(data: T, type: string)` - 201 Created (POST)
- `say.noContent()` - 204 No Content (DELETE)
- `say.accepted<T>(data: T, type: string, message?: string)` - 202 Accepted (async operations)
- `say.partial<T>(data: T, type: string, count?: number)` - 206 Partial Content (range requests)

**Error responses:**
- `say.error(statusCode: number, message: string, errorId?: string)` - Any error status
- `say.specifically<T>(statusCode: number, body: T)` - Custom status/body
- `say.from(envelope: object)` - From envelope object (backwards compatibility)

### Usage in API Handlers

```typescript
// src/domains/posts/api.ts
import { NextRequest } from 'next/server';
import { say } from '@/lib/responses/say';
import { handleError } from '@/lib/errors/handler';
import logic from './logic';

export default {
  // List resources
  async list(req: NextRequest) {
    try {
      const result = await logic.list(params);
      return say.ok(result.data, 'POSTS', result.count);
    } catch (error) {
      return handleError(error, req);
    }
  },

  // Get single resource
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const result = await logic.get(id);
      return say.ok(result, 'POST');
    } catch (error) {
      return handleError(error, req);
    }
  },

  // Create resource
  async create(req: NextRequest) {
    try {
      const data = await req.json();
      const result = await logic.create(data, userId);
      return say.created(result, 'POST');
    } catch (error) {
      return handleError(error, req);
    }
  },

  // Delete resource
  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      await logic.delete(id);
      return say.noContent();
    } catch (error) {
      return handleError(error, req);
    }
  }
};
```

### Response Envelope Structure

**Success responses:**
```typescript
{
  statusCode: number;    // HTTP status code (200, 201, etc.)
  type: string;          // Resource type identifier (e.g., 'POST', 'POSTS')
  data: T;               // The actual data payload
  count?: number;        // Optional: Total count for list responses
  message?: string;      // Optional: Human-readable message (e.g., for 202 Accepted)
}
```

**Error responses:**
```typescript
{
  statusCode: number;    // HTTP error status code (400, 404, 500, etc.)
  error: {
    message: string;     // Human-readable error message
    id: string;          // Unique error identifier (UUID)
    timestamp: string;   // ISO 8601 timestamp
  };
  errors?: unknown;      // Optional: Additional error details (e.g., Clerk validation errors)
}
```

**Empty responses (204, 205, 304):** No body per HTTP specification.

### Resource Type Conventions

- **Uppercase with underscores**: `POST`, `BLOG_POST`, `USER_PROFILE`
- **Singular for single resources**: `POST` (not `POSTS`)
- **Plural for collections**: `POSTS` (not `POST`)
- **Descriptive for operations**: `SEARCH_RESULTS`, `UPLOAD_STATUS`

### Best Practices

**Do:**
- Always use say pattern for JSON API responses
- Use semantic methods (`say.created()` for POST, not `say.ok()`)
- Include count for paginated list responses
- Let handleError manage error responses

**Don't:**
- Don't wrap binary responses (file downloads) in say pattern
- Don't return 200 for resource creation - use `say.created()` with 201
- Don't manually construct error envelopes - use handleError and Boom
- Don't include count for single resource responses

## 11.3 Error Handling Pattern

### Overview

The UEV Community Platform uses a centralized error handling system built on `@hapi/boom` for structured, consistent error responses across all API endpoints. The pattern separates error creation (domain logic) from error handling (API layer), ensuring predictable error responses with proper logging and tracking.

### The Two-Layer Pattern

#### 1. Domain Logic Layer: Throw Boom Errors

Domain logic files (`logic.ts`) throw Boom errors when business rules are violated or resources aren't found:

```typescript
// src/domains/posts/logic.ts
import Boom from '@hapi/boom';

export default {
  async get(id: string) {
    const post = await dal.findById(id);

    if (!post) {
      throw Boom.notFound('Post not found');
    }

    return post;
  },

  async create(data: CreatePostDto, userId: string) {
    // Validation
    if (!data.title || !data.content || !data.type) {
      throw Boom.badRequest('Type, title, and content are required');
    }

    // Business rule enforcement
    const existing = await dal.findBySlug(data.slug);
    if (existing) {
      throw Boom.conflict('A post with this slug already exists');
    }

    return await dal.create({ ...data, createdBy: userId });
  },

  async patch(id: string, patches: JsonPatchOp[], userId: string) {
    const post = await dal.findById(id);

    if (!post) {
      throw Boom.notFound('Post not found');
    }

    // Validate patch operations
    for (const patch of patches) {
      const pathSegments = patch.path.split('/').filter(Boolean);
      const protectedFields = ['_id', 'id', 'createdAt', 'updatedAt', 'modifiedBy'];

      if (protectedFields.includes(pathSegments[0])) {
        throw Boom.badRequest(`Cannot modify protected field: ${pathSegments[0]}`);
      }
    }

    // Apply patches and save...
  }
};
```

#### 2. API Handler Layer: Use handleError

API handlers (`api.ts`) catch all errors and pass them to `handleError(error, req)`:

```typescript
// src/domains/posts/api.ts
import { NextRequest } from 'next/server';
import logic from './logic';
import { say } from '@/lib/responses/say';
import { handleError } from '@/lib/errors/handler';

export default {
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const result = await logic.get(id);
      return say.ok(result, 'POST');
    } catch (error) {
      return handleError(error, req);
    }
  },

  async create(req: NextRequest) {
    try {
      const auth = await getAuthContext();
      const data = await req.json();
      const userId = auth.userId || 'system';

      const result = await logic.create(data, userId);
      return say.created(result, 'POST');
    } catch (error) {
      return handleError(error, req);
    }
  },

  async patch(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const auth = await getAuthContext();
      const patches = await req.json();
      const { id } = await params;
      const userId = auth.userId || 'system';

      const result = await logic.patch(id, patches, userId);
      return say.ok(result, 'POST');
    } catch (error) {
      return handleError(error, req);
    }
  }
};
```

### The handleError Function

Located at `/src/lib/errors/handler.ts`, this centralized handler provides:

1. **Automatic Boom conversion** - Non-Boom errors become 500 Internal Server Error
2. **Structured logging** - Error ID, request ID, timestamp, path, stack traces
3. **Smart log levels** - 404s use `console.info`, others use `console.error`
4. **Production-safe** - Stack traces hidden for 404s in production
5. **Consistent responses** - All errors follow the same format

### Implementation

```typescript
// src/lib/errors/handler.ts
import Boom from '@hapi/boom';
import { NextRequest } from 'next/server';
import { say } from '@/lib/responses/say';

export function handleError(error: any, req: NextRequest) {
  const errorId = crypto.randomUUID();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Convert to Boom error if not already
  const boomError = Boom.isBoom(error) ? error : Boom.internal('Internal Server Error');

  // Log error details
  const is404 = boomError.output.statusCode === 404;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // In production, don't log stack traces for 404s
  const logData = {
    errorId,
    requestId,
    message: boomError.message,
    statusCode: boomError.output.statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    ...((!is404 || isDevelopment) && { stack: error.stack }),
    data: boomError.data // Log any attached data
  };

  // Use appropriate log level
  if (is404) {
    console.info(logData);
  } else {
    console.error(logData);
  }

  // Check if this is a Clerk error with structured data
  if (boomError.data && boomError.data.errors) {
    // Return the Clerk error structure directly for better frontend handling
    return say.specifically(boomError.output.statusCode, {
      error: {
        message: boomError.message,
        id: errorId,
        timestamp: new Date().toISOString()
      },
      // Include Clerk's error structure for frontend parsing
      errors: boomError.data.errors
    });
  }

  // Return standardized error response
  return say.error(
    boomError.output.statusCode,
    boomError.message,
    errorId
  );
}
```

### Error Response Structure

All API errors return a consistent JSON structure:

```json
{
  "statusCode": 404,
  "error": {
    "message": "Post not found",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "timestamp": "2025-10-09T14:23:45.678Z"
  }
}
```

#### Response Fields

- `statusCode` - HTTP status code (400, 404, 409, 500, etc.)
- `error.message` - Human-readable error message
- `error.id` - Unique error identifier for tracking/support
- `error.timestamp` - ISO 8601 timestamp of when error occurred

### Common Boom Error Methods

Use these in domain logic to throw appropriate errors:

| Method | Status | Use Case | Example |
|--------|--------|----------|---------|
| `Boom.badRequest()` | 400 | Invalid input, missing required fields | `Boom.badRequest('Title is required')` |
| `Boom.unauthorized()` | 401 | Missing or invalid authentication | `Boom.unauthorized('Token expired')` |
| `Boom.forbidden()` | 403 | Insufficient permissions | `Boom.forbidden('Admin access required')` |
| `Boom.notFound()` | 404 | Resource doesn't exist | `Boom.notFound('Post not found')` |
| `Boom.conflict()` | 409 | Duplicate resource, constraint violation | `Boom.conflict('Slug already exists')` |
| `Boom.internal()` | 500 | Unexpected server error | `Boom.internal('Database connection failed')` |
| `Boom.badGateway()` | 502 | External service failure | `Boom.badGateway('Cloud storage unavailable')` |

#### Examples from Codebase

```typescript
// Validation errors (400)
throw Boom.badRequest('Type, title, and content are required');
throw Boom.badRequest('Limit cannot exceed 100');
throw Boom.badRequest('Cannot modify protected field: createdAt');

// Authentication errors (401)
throw Boom.unauthorized('Authentication required');
throw Boom.unauthorized('Invalid token');

// Permission errors (403)
throw Boom.forbidden('Insufficient permissions');

// Not found errors (404)
throw Boom.notFound('Post not found');
throw Boom.notFound('Asset not found');
throw Boom.notFound('Site config not found');

// Conflict errors (409)
throw Boom.conflict('A post with this slug already exists');
throw Boom.conflict('A post with similar title already exists');

// Gateway errors (502)
throw Boom.badGateway(`Failed to upload file to cloud storage: ${error.message}`);
```

### Complete Error Handling Workflow

#### Step 1: Domain Logic Validates and Throws

```typescript
// src/domains/posts/logic.ts
export default {
  async get(id: string) {
    const post = await dal.findById(id);

    if (!post) {
      throw Boom.notFound('Post not found');  // ← Throw Boom error
    }

    return post;
  }
};
```

#### Step 2: API Handler Catches and Delegates

```typescript
// src/domains/posts/api.ts
export default {
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const result = await logic.get(id);
      return say.ok(result, 'POST');
    } catch (error) {
      return handleError(error, req);  // ← Pass to handleError
    }
  }
};
```

#### Step 3: handleError Processes and Responds

```typescript
// src/lib/errors/handler.ts
export function handleError(error: any, req: NextRequest) {
  const errorId = crypto.randomUUID();
  const boomError = Boom.isBoom(error) ? error : Boom.internal('Internal Server Error');

  // Log with appropriate level
  console.error({
    errorId,
    message: boomError.message,
    statusCode: boomError.output.statusCode,
    // ... more logging fields
  });

  // Return standardized response
  return say.error(
    boomError.output.statusCode,
    boomError.message,
    errorId
  );
}
```

#### Step 4: Client Receives Structured Error

```json
{
  "statusCode": 404,
  "error": {
    "message": "Post not found",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "timestamp": "2025-10-09T14:23:45.678Z"
  }
}
```

### Benefits of This Pattern

#### 1. Consistency
All API errors follow the same structure, making frontend error handling predictable:

```typescript
// Frontend can always expect this structure
const response = await fetch('/api/posts/123');
if (!response.ok) {
  const { error } = await response.json();
  console.error(`Error ${error.id}: ${error.message}`);
  // Show error to user, report to monitoring, etc.
}
```

#### 2. Centralized Logging
All errors are logged in the same format with request tracking:

```json
{
  "errorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requestId": "req_987654321",
  "message": "Post not found",
  "statusCode": 404,
  "timestamp": "2025-10-09T14:23:45.678Z",
  "path": "http://localhost:3000/api/posts/123",
  "stack": "Error: Post not found\n    at logic.get..."
}
```

#### 3. Error Tracking
Unique error IDs enable tracking across logs and support tickets:
- User reports: "I got error `a1b2c3d4-e5f6-7890-abcd-ef1234567890`"
- Support can search logs for that exact error
- Full request context available for debugging

#### 4. Production Safety
Stack traces hidden for 404s in production, exposed in development:
- Development: Full stack traces for all errors
- Production: Stack traces only for 5xx errors, not 404s

#### 5. Type Safety
TypeScript ensures proper error handling:

```typescript
// This pattern is enforced across all API handlers
try {
  const result = await logic.doSomething();
  return say.ok(result, 'TYPE');
} catch (error) {
  return handleError(error, req);  // Required - TypeScript won't compile without it
}
```

### Integration Points

#### Authentication Middleware
Auth errors use the same pattern:

```typescript
// src/lib/auth/route-wrappers.ts
if (!token) {
  throw Boom.unauthorized('Bearer token required');
}

if (!isValid) {
  throw Boom.unauthorized('Invalid token');
}

if (!hasRole) {
  throw Boom.forbidden('Insufficient permissions');
}
```

#### Validation Middleware
OData parsing errors:

```typescript
// src/shared/utils/odata.ts
try {
  return parseODataQuery(params);
} catch (error) {
  throw Boom.badRequest('Invalid OData query parameters', params);
}
```

#### Domain-Specific Errors
Each domain throws appropriate errors:

```typescript
// Assets domain
throw Boom.badRequest('Limit cannot exceed 100');
throw Boom.notFound('Asset not found');
throw Boom.badGateway('Failed to upload file to cloud storage');

// Site domain
throw Boom.badRequest('Missing required fields: title, description');
throw Boom.notFound('Site config not found');
throw Boom.badRequest('Cannot modify protected field: createdAt');

// Posts domain
throw Boom.conflict('A post with this slug already exists');
throw Boom.badRequest('Type, title, and content are required');
```

### Special Cases

#### Clerk Errors with Structured Data
For external service errors (like Clerk) that include additional error details:

```typescript
// handleError checks for boomError.data.errors
if (boomError.data && boomError.data.errors) {
  return say.specifically(boomError.output.statusCode, {
    error: {
      message: boomError.message,
      id: errorId,
      timestamp: new Date().toISOString()
    },
    errors: boomError.data.errors  // Include service-specific errors
  });
}
```

#### Non-Boom Errors
Any non-Boom error becomes a 500 Internal Server Error:

```typescript
// If someone throws a regular Error
throw new Error('Something went wrong');

// handleError converts it
const boomError = Boom.isBoom(error) ? error : Boom.internal('Internal Server Error');
// Status code: 500
```

### Testing Error Handling

#### Unit Tests for Domain Logic

```typescript
// src/domains/posts/__tests__/logic.test.ts
import { describe, it, expect, vi } from 'vitest';
import Boom from '@hapi/boom';
import logic from '../logic';

describe('posts logic', () => {
  describe('get', () => {
    it('throws 404 when post not found', async () => {
      vi.mocked(dal.findById).mockResolvedValue(null);

      await expect(logic.get('invalid-id')).rejects.toThrow(
        Boom.notFound('Post not found')
      );
    });
  });

  describe('create', () => {
    it('throws 400 for missing required fields', async () => {
      await expect(
        logic.create({ title: 'No Content' } as any, 'user123')
      ).rejects.toThrow(
        Boom.badRequest('Type, title, and content are required')
      );
    });

    it('throws 409 for duplicate slug', async () => {
      vi.mocked(dal.findBySlug).mockResolvedValue({ id: 'existing' });

      await expect(
        logic.create({
          type: 'blog',
          title: 'Test',
          content: 'Content',
          slug: 'duplicate'
        }, 'user123')
      ).rejects.toThrow(
        Boom.conflict('A post with this slug already exists')
      );
    });
  });
});
```

#### Integration Tests for API Handlers

```typescript
// src/domains/posts/__tests__/api.test.ts
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import api from '../api';

describe('posts API', () => {
  it('returns 404 error structure when post not found', async () => {
    vi.mocked(logic.get).mockRejectedValue(Boom.notFound('Post not found'));

    const req = new NextRequest('http://localhost/api/posts/invalid');
    const response = await api.get(req, { params: Promise.resolve({ id: 'invalid' }) });

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      statusCode: 404,
      error: {
        message: 'Post not found',
        id: expect.any(String),
        timestamp: expect.any(String)
      }
    });
  });
});
```

### Migration from Manual Boom Checking

#### Old Pattern (Manual Checking)

```typescript
// DON'T DO THIS
export default {
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const result = await logic.get(id);
      return say.ok(result, 'POST');
    } catch (error) {
      if (Boom.isBoom(error)) {
        return say.error(error.output.statusCode, error.message);
      }
      return say.error(500, 'Internal Server Error');
    }
  }
};
```

#### New Pattern (Centralized Handling)

```typescript
// DO THIS
export default {
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const result = await logic.get(id);
      return say.ok(result, 'POST');
    } catch (error) {
      return handleError(error, req);  // ✓ Centralized, logged, tracked
    }
  }
};
```

### Best Practices

#### 1. Always Use handleError in API Handlers
```typescript
// ✓ Correct
catch (error) {
  return handleError(error, req);
}

// ✗ Wrong - manual error handling
catch (error) {
  if (Boom.isBoom(error)) {
    return say.error(error.output.statusCode, error.message);
  }
  return say.error(500, 'Internal Server Error');
}
```

#### 2. Throw Boom Errors in Domain Logic
```typescript
// ✓ Correct
if (!post) {
  throw Boom.notFound('Post not found');
}

// ✗ Wrong - non-Boom error
if (!post) {
  throw new Error('Post not found');  // Will become generic 500
}
```

#### 3. Use Descriptive Error Messages
```typescript
// ✓ Correct - specific, actionable
throw Boom.badRequest('Type, title, and content are required');
throw Boom.conflict('A post with slug "getting-started" already exists');

// ✗ Wrong - vague, unhelpful
throw Boom.badRequest('Invalid data');
throw Boom.conflict('Duplicate');
```

#### 4. Choose Appropriate Status Codes
```typescript
// ✓ Correct
throw Boom.badRequest('Invalid email format');        // 400 - client error
throw Boom.unauthorized('Token expired');             // 401 - auth required
throw Boom.forbidden('Only admins can delete posts'); // 403 - insufficient perms
throw Boom.notFound('User not found');                // 404 - doesn't exist
throw Boom.conflict('Email already registered');      // 409 - constraint violation
throw Boom.internal('Database connection failed');    // 500 - server error

// ✗ Wrong
throw Boom.internal('User not found');                // Should be 404
throw Boom.badRequest('Database error');              // Should be 500
```

#### 5. Don't Swallow Errors
```typescript
// ✓ Correct
try {
  await logic.doSomething();
} catch (error) {
  return handleError(error, req);  // Propagate with tracking
}

// ✗ Wrong
try {
  await logic.doSomething();
} catch (error) {
  return say.ok(null, 'TYPE');  // Swallows error!
}
```

### Summary

The error handling pattern provides:
- **Separation of concerns**: Domain logic throws, API layer handles
- **Consistency**: All errors have the same structure
- **Observability**: Centralized logging with tracking IDs
- **Type safety**: TypeScript enforces the pattern
- **Production ready**: Smart logging, stack trace control
- **Developer friendly**: Simple to use, easy to test

Always follow the two-layer pattern:
1. **Domain logic**: `throw Boom.appropriateError('descriptive message')`
2. **API handlers**: `catch (error) { return handleError(error, req); }`


## 11.4 Response Caching with LRU Cache (Optional)

**Optional performance optimization for GET requests:**

```typescript
// src/lib/api/cache-wrapper.ts
import { LRUCache } from 'lru-cache'
import { NextRequest, NextResponse } from 'next/server'

// Cache configuration per route pattern (in milliseconds)
const CACHE_CONFIG: Record<string, number> = {
  '/api/posts': 300000,      // 5 minutes
  '/api/users': 600000,      // 10 minutes
  '/api/static-data': 1800000, // 30 minutes
}

// Single cache instance shared across all routes
export const cache = new LRUCache<string, { data: unknown; timestamp: number }>({
  max: 500,                  // Maximum 500 items in cache
  ttl: 1000 * 60 * 5,        // Default TTL: 5 minutes
  updateAgeOnGet: false,     // Don't refresh TTL on access
  allowStale: true,          // Allow stale data while fetching
})

/**
 * Wrapper to cache GET requests
 */
export function withCache<T extends (...args: any[]) => any>(
  handler: T,
  options?: { ttl?: number }
): T {
  return (async (...args: any[]) => {
    const [req] = args

    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(...args)
    }

    // Check for cache bypass header
    if (req.headers.get('x-no-cache') === 'true') {
      const response = await handler(...args)
      return NextResponse.json(await response.clone().json(), {
        headers: { 'X-Cache': 'BYPASS' }
      })
    }

    // Generate cache key from URL
    const cacheKey = req.url

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Date.now() - cached.timestamp),
        }
      })
    }

    // Call handler
    const response = await handler(...args)

    // Cache successful responses
    if (response.ok) {
      const data = await response.clone().json()
      const pathname = new URL(req.url).pathname
      const ttl = options?.ttl || CACHE_CONFIG[pathname] || 300000

      cache.set(cacheKey, { data, timestamp: Date.now() }, { ttl })

      return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS', 'X-Cache-TTL': String(ttl) }
      })
    }

    return response
  }) as T
}

/**
 * Invalidate cache for specific pattern
 */
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}
```

**Usage in API routes:**

```typescript
// src/domains/[domain]/api.ts
import { withCache } from '@/lib/api/cache-wrapper'
import { withPublic } from '@/lib/auth'

async function listHandler(req: NextRequest) {
  const result = await DomainLogic.list()
  return say.ok(result.data, 'ITEMS', result.count)
}

// Wrap with cache (5 minute TTL)
export const domainApi = {
  list: withCache(withPublic(listHandler)),
  // Or with custom TTL
  // list: withCache(withPublic(listHandler), { ttl: 600000 }), // 10 minutes
}
```

**Cache invalidation on mutations:**

```typescript
import { invalidateCache } from '@/lib/api/cache-wrapper'

async function createHandler(req: NextRequest) {
  const item = await DomainLogic.create(data)

  // Clear cache for this domain
  invalidateCache('/api/domain')

  return say.created(item, 'ITEM')
}
```

**Clear cache on server startup (instrumentation.ts):**

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Clear cache to pick up env variable changes
    const { cache } = await import('./lib/api/cache-wrapper')
    cache.clear()
    console.log('[Instrumentation] Cleared API cache')
  }
}
```

**Why use caching?**
- Reduces database queries for frequently accessed data
- Improves response times
- Configurable TTL per route
- Optional - only use for performance optimization

**When NOT to cache:**
- User-specific data that changes frequently
- Real-time data requirements
- Small datasets with fast queries
- Data with complex authorization rules

---
## 11.5 OpenAPI Specification Endpoint

### Overview

The OpenAPI spec endpoint (`/api/openapi/spec`) is a **special infrastructure endpoint** that returns raw OpenAPI specification JSON. Unlike domain endpoints, it does NOT use the say pattern because it must return a pure OpenAPI spec for standards compliance and tool compatibility.

### Critical Rules

1. **NO say pattern** - Infrastructure endpoints return raw data
2. **Development-only** - Returns 404 in production
3. **Pure spec format** - Must be valid OpenAPI 3.0 JSON (not wrapped in envelope)
4. **Direct Response.json()** - Use native Response.json(), not NextResponse

### Implementation

#### Spec Endpoint Structure

```typescript
// src/app/api/openapi/spec/route.ts
import { getOpenAPISpec } from '@/lib/openapi/spec';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  const spec = getOpenAPISpec();

  // IMPORTANT: Use Response.json() directly, NOT say pattern
  return Response.json(spec);
}
```

#### Swagger UI Endpoint

```typescript
// src/app/api/openapi/route.ts
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const htmlPath = path.join(process.cwd(), 'src/app/api/openapi/swagger.html');
    const html = await fs.readFile(htmlPath, 'utf-8');

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch {
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

#### Swagger UI HTML

```html
<!-- src/app/api/openapi/swagger.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UEV Marketing API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/openapi/spec",  // Fetches the spec endpoint
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>
```

### Why NOT Use Say Pattern?

#### The Problem with Say Pattern

The say pattern wraps responses in an envelope:

```typescript
// Domain endpoint (CORRECT usage)
return say.ok(data, 'posts', count);

// Response:
{
  "statusCode": 200,
  "type": "posts",
  "data": [...],
  "count": 10
}
```

This envelope is perfect for domain endpoints because:
- Provides consistent structure across all API responses
- Includes metadata (type, count, statusCode)
- Makes client consumption predictable
- Supports error handling patterns

#### Why OpenAPI Spec is Different

The spec endpoint must return a pure OpenAPI specification:

```typescript
// OpenAPI spec endpoint (CORRECT - NO say pattern)
return Response.json(spec);

// Response:
{
  "openapi": "3.0.0",
  "info": { ... },
  "paths": { ... },
  "components": { ... }
}
```

If we used say pattern:

```typescript
// WRONG - Breaks OpenAPI tools!
return say.ok(spec, 'openapi-spec');

// Response (INVALID OpenAPI):
{
  "statusCode": 200,
  "type": "openapi-spec",
  "data": {
    "openapi": "3.0.0",
    "info": { ... }
  }
}
```

This breaks because:
- Swagger UI expects root-level `openapi` field
- OpenAPI validators expect standard structure
- Code generators (Postman, Insomnia) fail to parse
- Violates OpenAPI 3.0 specification

### When to Use Response.json() vs Say Pattern

#### Use Response.json() Directly (Infrastructure Endpoints)

Infrastructure endpoints that must comply with external standards:

```typescript
// OpenAPI specification
GET /api/openapi/spec → Raw OpenAPI JSON

// Health check endpoints
GET /api/health → { status: "ok", uptime: 12345 }

// Metrics endpoints
GET /api/metrics → { requests: 100, errors: 2 }

// Webhook callbacks (external systems expect specific format)
POST /api/integrations/luma/webhooks → { received: true }
```

**Characteristics:**
- External standards compliance required
- Tool compatibility critical
- No business logic
- System/infrastructure purpose

### Use Say Pattern (Domain Endpoints)

All domain endpoints with business logic:

```typescript
// Posts domain
GET /api/posts → say.ok(posts, 'posts', count)
POST /api/posts → say.created(post, 'post')
PATCH /api/posts/:id → say.ok(post, 'post')
DELETE /api/posts/:id → say.noContent()

// Site domain
GET /api/site/home → say.ok(config, 'home-config')

// Assets domain
GET /api/assets → say.ok(assets, 'assets', count)
```

**Characteristics:**
- Business logic operations
- Client needs consistent envelope
- Type safety and metadata important
- Error handling required

### Benefits of Raw Spec Format

#### 1. Standards Compliance

OpenAPI specification is an industry standard (formerly Swagger). Tools expect exact format:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "UEV Community API",
    "version": "1.0.0"
  },
  "paths": { ... }
}
```

Any deviation breaks the standard.

### 2. Tool Compatibility

Works seamlessly with:
- **Swagger UI** - Interactive API explorer (see `/api/openapi`)
- **Postman** - Import collections from spec
- **Insomnia** - API testing with spec import
- **OpenAPI Generator** - Generate client SDKs
- **Redoc** - Alternative documentation renderer
- **OpenAPI Validator** - Schema validation tools

### 3. Developer Experience

Developers can:
- Import spec into any OpenAPI-compatible tool
- Generate type-safe clients automatically
- Validate API contracts in CI/CD
- Use standard tooling without custom adapters

### 4. Standards Evolution

OpenAPI specification evolves (3.0 → 3.1 → future versions). Staying compliant ensures:
- Easy upgrades to new versions
- Compatibility with emerging tools
- No vendor lock-in or custom formats

### Development-Only Access Pattern

#### Security Reasoning

The spec endpoint exposes API structure, which could help attackers:
- Discover all available endpoints
- Understand authentication schemes
- Learn request/response formats
- Map attack surface

### Implementation

```typescript
export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  const spec = getOpenAPISpec();
  return Response.json(spec);
}
```

#### Production Alternatives

For production API documentation:
1. **Separate docs site** - Host static docs elsewhere
2. **Authentication** - Require API key for spec access
3. **Public subset** - Expose only public endpoints
4. **External hosting** - Use services like readme.io or stoplight.io

### Spec Generation Implementation

#### Centralized Spec Builder

```typescript
// src/lib/openapi/spec.ts
import { postSchemas, postPaths } from '@/domains/posts/schema';
import { siteSchemas, sitePaths } from '@/domains/site/schema';
import { assetSchemas, assetPaths } from '@/domains/assets/schema';
import { userSchemas, userPaths } from '@/domains/users/schema';
import { eventSchemas, eventPaths } from '@/domains/events/schema';
import { pageDataSchemas, pageDataPaths } from '@/domains/page-data/schema';
import { integrationSchemas, integrationPaths } from '@/domains/integrations/schema';
import { landingPageSchemas, landingPagePaths } from '@/domains/landing-page/schema';
import { commonSchemas } from '@/shared/schemas/api';

export function getOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'UEV Community API',
      version: '1.0.0',
      description: 'API for United Effects Ventures community platform',
      contact: {
        name: 'UEV Development Team',
        email: 'dev@ue.ventures'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://ue.community'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    tags: [
      { name: 'Posts', description: 'Blog post operations' },
      { name: 'Site', description: 'Site configuration' },
      { name: 'Assets', description: 'File and media management' },
      { name: 'Users', description: 'User management and roles' },
      { name: 'Events', description: 'Event integration' },
      { name: 'Page Data', description: 'Dynamic page data management' },
      { name: 'Integrations', description: 'Webhook integrations and event processing' },
      { name: 'Landing Pages', description: 'Dynamic landing page builder' }
    ],
    paths: {
      // Aggregate all domain paths
      ...postPaths,
      ...sitePaths,
      ...assetPaths,
      ...userPaths,
      ...eventPaths,
      ...pageDataPaths,
      ...integrationPaths,
      ...landingPagePaths
    },
    components: {
      schemas: {
        // Common schemas first (referenced by domains)
        ...commonSchemas,
        // Domain-specific schemas
        ...postSchemas,
        ...siteSchemas,
        ...assetSchemas,
        ...userSchemas,
        ...eventSchemas,
        ...pageDataSchemas,
        ...integrationSchemas,
        ...landingPageSchemas
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: `JWT token from Clerk authentication.

To get a token for testing:
1. Sign in at /sign-in
2. In dev mode: Check browser console for your token
3. In production: Visit /api/auth/session to get your token
4. Click "Authorize" button in Swagger UI
5. Enter the token value (just the token, without "Bearer" prefix)

Alternative methods:
- From browser DevTools: Check __session cookie value
- Programmatically: Use Clerk SDKs or REST API

Notes:
- Tokens expire after ~60 minutes, refresh by signing in again
- Admin endpoints require 'admin' or 'community_admin' role in user metadata`
        }
      }
    }
  };
}
```

#### Domain Schema Pattern

Each domain exports schemas and paths:

```typescript
// Example: src/domains/posts/schema.ts
export const postSchemas = {
  Post: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      // ... more fields
    }
  },
  CreatePost: {
    type: 'object',
    required: ['title', 'content'],
    properties: {
      title: { type: 'string' },
      content: { type: 'string' }
    }
  }
};

export const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List all posts',
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostList' }
            }
          }
        }
      }
    }
  }
};
```

### Swagger UI Integration

#### How It Works

1. **User visits** `/api/openapi`
2. **Swagger UI loads** from CDN (swagger-ui-dist)
3. **UI fetches spec** from `/api/openapi/spec`
4. **Renders interactive docs** with try-it-out functionality

### Key Features

```javascript
window.ui = SwaggerUIBundle({
  url: "/api/openapi/spec",        // Where to fetch spec
  dom_id: '#swagger-ui',            // DOM element to render
  presets: [
    SwaggerUIBundle.presets.apis,
    SwaggerUIStandalonePreset
  ],
  layout: "StandaloneLayout",       // Full-page layout
  deepLinking: true,                // URL fragments for navigation
  persistAuthorization: true        // Remember auth tokens
});
```

### Custom Styling

```css
.swagger-ui .topbar {
  display: none;  /* Hide default Swagger branding */
}
```

### Testing

#### Manual Testing

```bash
# Development
curl http://localhost:3000/api/openapi/spec | jq .

# Should return pure OpenAPI spec
{
  "openapi": "3.0.0",
  "info": { ... },
  "paths": { ... }
}

# Production (should fail)
curl https://ue.community/api/openapi/spec
# Returns: Not Found (404)
```

#### Automated Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('OpenAPI Spec Endpoint', () => {
  it('returns valid OpenAPI spec in development', async () => {
    process.env.NODE_ENV = 'development';

    const response = await GET();
    const spec = await response.json();

    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('UEV Community API');
    expect(spec.paths).toBeDefined();
  });

  it('returns 404 in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await GET();

    expect(response.status).toBe(404);
  });
});
```

### Common Mistakes

#### 1. Using Say Pattern

```typescript
// WRONG - Breaks OpenAPI tools
export async function GET() {
  const spec = getOpenAPISpec();
  return say.ok(spec, 'openapi-spec');  // ❌ Invalid OpenAPI
}

// RIGHT - Standards compliant
export async function GET() {
  const spec = getOpenAPISpec();
  return Response.json(spec);  // ✅ Valid OpenAPI
}
```

### 2. Missing Development Check

```typescript
// WRONG - Exposes API structure in production
export async function GET() {
  const spec = getOpenAPISpec();
  return Response.json(spec);  // ❌ Security risk
}

// RIGHT - Development only
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  const spec = getOpenAPISpec();
  return Response.json(spec);  // ✅ Safe
}
```

### 3. Wrapped Spec Format

```typescript
// WRONG - Extra wrapper layer
const spec = {
  spec: getOpenAPISpec()  // ❌ Nested structure
};

// RIGHT - Direct spec object
const spec = getOpenAPISpec();  // ✅ Root-level fields
```

### Summary

**Infrastructure vs Domain Endpoints:**

| Aspect | Infrastructure (spec, health) | Domain (posts, assets) |
|--------|------------------------------|------------------------|
| **Response Format** | Raw data (standards) | Say pattern (envelope) |
| **Purpose** | System/tooling | Business logic |
| **Example** | `Response.json(spec)` | `say.ok(data, 'posts')` |
| **Standards** | Must comply (OpenAPI) | Internal consistency |
| **Tools** | External (Swagger UI) | Internal clients |

**OpenAPI Spec Endpoint Checklist:**

- [ ] Returns pure OpenAPI 3.0 JSON (no envelope)
- [ ] Uses `Response.json()` directly (NOT say pattern)
- [ ] Development-only (404 in production)
- [ ] Aggregates all domain schemas and paths
- [ ] Works with Swagger UI at `/api/openapi`
- [ ] Includes security schemes and tags
- [ ] Server URLs match environment

**When to use direct Response.json():**

- OpenAPI specification endpoints
- Health check endpoints
- Metrics/monitoring endpoints
- Webhook callbacks (external format requirements)
- Any endpoint where external standards/tools dictate format

**When to use say pattern:**

- All domain endpoints (posts, assets, users, etc.)
- Business logic operations
- Internal API consistency required
- Client applications expect envelope format

The key principle: **Infrastructure serves tools and standards; domains serve business logic and clients.** Choose your response format accordingly.

---

## 11.6 File Upload Handling

**Generic pattern for handling multipart form data file uploads in Next.js API routes.**

### Upload Handler Implementation

```typescript
// src/domains/assets/api.ts (or any domain that handles uploads)
import { NextRequest } from 'next/server'
import Boom from '@hapi/boom'
import { say } from '@/lib/responses/say'
import { handleError } from '@/lib/errors/handler'
import { getAuthContext } from '@/lib/auth'

export default {
  async upload(req: NextRequest) {
    try {
      // Get authenticated user
      const auth = await getAuthContext()
      const userId = auth.userId || 'system'

      // Parse multipart form data
      const formData = await req.formData()
      const file = formData.get('file') as File

      if (!file) {
        throw Boom.badRequest('No file provided')
      }

      // Extract required metadata from form data
      const title = formData.get('title') as string
      const description = formData.get('description') as string

      if (!title) throw Boom.badRequest('Title is required')
      if (!description) throw Boom.badRequest('Description is required')

      // Build metadata object
      const metadata = { title, description }

      // Optional fields
      const alt = formData.get('alt') as string
      if (alt) metadata.alt = alt

      // Handle tags (comma-separated string -> array)
      const tags = formData.get('tags') as string
      if (tags) {
        metadata.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      // Handle boolean fields (FormData sends strings)
      const isPublic = formData.get('isPublic') as string
      if (isPublic !== null && isPublic !== undefined) {
        metadata.isPublic = isPublic === 'true' || isPublic === '1'
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // Process file (save to storage, database, etc.)
      const result = await logic.upload(
        buffer,
        file.name,
        file.type || 'application/octet-stream',
        metadata,
        userId
      )

      return say.created(result, 'ASSET')
    } catch (error) {
      return handleError(error, req)
    }
  }
}
```

### OpenAPI Schema for File Upload

```typescript
// src/domains/assets/schema.ts
export const assetPaths = {
  '/api/assets': {
    post: {
      tags: ['Assets'],
      summary: 'Upload a new file',
      description: 'Upload a file with metadata',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file', 'title', 'description'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'File to upload'
                },
                title: {
                  type: 'string',
                  description: 'Asset title (required)'
                },
                description: {
                  type: 'string',
                  description: 'Asset description (required)'
                },
                alt: {
                  type: 'string',
                  description: 'Alt text for accessibility (optional)'
                },
                tags: {
                  type: 'string',
                  description: 'Comma-separated tags (optional)'
                },
                isPublic: {
                  type: 'boolean',
                  description: 'Public visibility (optional, default: true)'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'File uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: { type: 'integer', example: 201 },
                  type: { type: 'string', example: 'ASSET' },
                  data: { $ref: '#/components/schemas/Asset' }
                }
              }
            }
          }
        },
        400: { description: 'Invalid request or missing file' },
        401: { description: 'Unauthorized' }
      }
    }
  }
}
```

### App Router Route Handler

```typescript
// src/app/api/assets/route.ts
import api from '@/domains/assets/api'
import { withRole } from '@/lib/auth'

export const POST = withRole(api.upload, ['community_admin'])
```

### Key Patterns

**FormData Parsing:**
```typescript
const formData = await req.formData()
const file = formData.get('file') as File
const textField = formData.get('fieldName') as string
```

**File to Buffer Conversion:**
```typescript
const buffer = Buffer.from(await file.arrayBuffer())
```

**Boolean Field Handling:**
```typescript
// FormData sends strings, not booleans
const isPublic = formData.get('isPublic') as string
const boolValue = isPublic === 'true' || isPublic === '1'
```

**Array Field Handling:**
```typescript
// Comma-separated string -> array
const tags = formData.get('tags') as string
const tagArray = tags?.split(',').map(t => t.trim()).filter(Boolean) || []
```

**File Information:**
```typescript
file.name         // Original filename
file.type         // MIME type (e.g., 'image/png')
file.size         // Size in bytes
await file.text() // Read as text
await file.arrayBuffer() // Read as binary
```

### Testing with curl

```bash
# Upload a file with metadata
curl -X POST http://localhost:3000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.png" \
  -F "title=My Image" \
  -F "description=A beautiful image" \
  -F "alt=Image description for accessibility" \
  -F "tags=photo,landscape,nature" \
  -F "isPublic=true"
```

**Common Use Cases:**
- Image uploads (profile pictures, gallery images)
- Document uploads (PDFs, spreadsheets)
- CSV imports
- File attachments for records

**Security Considerations:**
- Always validate file types (check MIME type and extension)
- Enforce file size limits
- Scan for malware if handling user uploads
- Use authenticated endpoints (withAuth or withRole)
- Store files outside web root or use signed URLs

---

# 12. Styling: Tailwind CSS v4

**IMPORTANT**: Tailwind CSS v4 is a reference implementation. Projects can use any styling solution (CSS Modules, styled-components, Emotion, vanilla CSS, etc.). If using a different approach, skip this section.

## 12.1 Tailwind v4 Setup

```css
/* src/app/globals.css */
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

/* Configure Tailwind v4 theme */
@theme {
  /* Custom colors */
  --color-primary: #154abd;
  --color-secondary: #62dbdd;
  --color-accent: #ff1b8d;
  --color-success: #10b981;
  --color-error: #ef4444;
}
```

**PostCSS configuration:**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**No tailwind.config.js needed** - Tailwind v4 uses `@theme` block in CSS.

## 12.2 PostCSS Configuration

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

## 12.3 @theme Block for Custom Colors

```css
@theme {
  --color-primary: #154abd;
  --color-secondary: #62dbdd;
  --color-accent: #ff1b8d;
  --color-dark: #000000;
  --color-light: #f8f9fa;
}
```

**Usage in components:**
```tsx
<div className="bg-primary text-white">Primary color</div>
<div className="bg-secondary text-dark">Secondary color</div>
```

## 12.4 Reusable Button Classes

```css
/* src/app/globals.css */
.btn-primary {
  @apply inline-block bg-primary text-white border-2 border-primary px-6 py-2 font-semibold hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-xl;
}

.btn-secondary {
  @apply inline-block bg-transparent text-primary border-2 border-primary px-6 py-2 font-semibold hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-xl;
}

.btn-tertiary {
  @apply inline-flex items-center px-6 py-2 text-primary font-semibold hover:text-primary/80 transition-all duration-200;
}
```

**Usage:**
```tsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<button className="btn-tertiary">Tertiary Button</button>
```

## 12.5 Custom Animations

```css
/* src/app/globals.css */

/* Spin animation */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Scroll animation */
@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll-left {
  animation: scroll-left 30s linear infinite;
  will-change: transform;
}

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in;
}
```

## 12.6 NO CSS Modules Policy

**❌ DO NOT create CSS modules:**
```typescript
// ❌ WRONG
import styles from './Button.module.css'
```

**✅ Use Tailwind classes:**
```typescript
// ✅ CORRECT
<button className="px-4 py-2 bg-primary text-white rounded-lg">
  Click me
</button>
```

## 12.7 Icon Standards

**Primary icons** (@heroicons/react):
```typescript
import { ChevronRightIcon, UserIcon, HomeIcon } from '@heroicons/react/24/outline'

export function MyComponent() {
  return (
    <div>
      <HomeIcon className="w-6 h-6 text-primary" />
      <UserIcon className="w-5 h-5" />
    </div>
  )
}
```

**Social icons** (react-icons):
```typescript
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa6'

export function SocialLinks() {
  return (
    <div className="flex gap-4">
      <FaTwitter className="w-6 h-6" />
      <FaGithub className="w-6 h-6" />
      <FaLinkedin className="w-6 h-6" />
    </div>
  )
}
```

**❌ Never use emoji icons:**
```typescript
// ❌ WRONG
<span>📧</span>
<span>🏠</span>

// ✅ CORRECT
<EnvelopeIcon className="w-6 h-6" />
<HomeIcon className="w-6 h-6" />
```

---

# 13. ESLint & Code Quality

## 13.1 ESLint Configuration with Next.js

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ]
  },
  "overrides": [
    {
      "files": ["**/__tests__/**/*.ts", "**/__tests__/**/*.tsx", "**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    },
    {
      "files": ["**/dal.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    },
    {
      "files": ["**/models.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

## 13.2 TypeScript Rules

**Pragmatic approach:**
- `no-explicit-any`: warn (not error)
- Allow `any` in test files (mock data, fixtures)
- Allow `any` in DAL files (OData query objects)
- Allow `any` in model files (Mongoose transforms)

## 13.3 Override Patterns for Test Files, DAL, Models

See `.eslintrc.json` above for override patterns.

**When to allow `any`:**
- Test files: Mock data, complex fixtures
- DAL files: MongoDB query objects from OData parser
- Models: Mongoose toJSON transforms, global type augmentations

## 13.4 Pragmatic TypeScript Approach

**Prefer `unknown` over `any` where possible:**
```typescript
// ✅ Better
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}

// ❌ Avoid
function processData(data: any) {
  // No type safety
}
```

**Use type assertions sparingly:**
```typescript
// ✅ OK when you know the type
const user = data as User

// ❌ Avoid double assertions
const user = data as unknown as User
```

**Unused variables pattern:**
```typescript
// ✅ Prefix with underscore to suppress warnings
const { data: _data, ...rest } = obj

// ✅ Named function parameters you don't use
function handler(_req: NextRequest, { params }: Context) {
  // Only using params, not req
}
```

---

# 14. Shared Resources

## 14.1 Shared Directory Structure

```
src/shared/
├── components/             # Shared UI components
│   ├── Button.tsx
│   ├── PageLoader.tsx
│   ├── ErrorBoundary.tsx
│   └── Card.tsx
├── hooks/                  # Shared hooks
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   └── useLocalStorage.ts
├── controllers/            # Shared data controllers (optional)
│   └── BaseAPIController.ts
├── schemas/                # Shared OpenAPI schemas
│   └── api.ts              # CommonObjectMeta, JsonPatchDocument, Error
├── types/                  # Shared TypeScript types
│   ├── common.ts           # JsonPatchOp, ListOptions, PaginationInfo
│   └── api.ts              # API-related types
├── utils/                  # Shared utilities
│   ├── formatDate.ts
│   ├── validators.ts
│   └── slugify.ts
└── sections/               # Reusable page sections (optional pattern, see Section 15)
    ├── HeroSection.tsx
    ├── FeatureSection.tsx
    └── CTASection.tsx
```

## 14.2 When to Share vs Keep in Feature (2+ Rule)

**Share when:**
- Used by 2+ features or domains
- Generic utility (formatDate, debounce, etc.)
- Common UI component (Button, Card, Modal)
- API patterns (schemas, types, controllers)

**Keep in feature when:**
- Used by only 1 feature
- Feature-specific logic
- Not generic enough to reuse

**Example decision tree:**
```
Is component/util used by 2+ features?
├─ Yes → Move to /shared
└─ No  → Keep in feature

Is component likely to be reused?
├─ Yes → Consider moving to /shared proactively
└─ No  → Keep in feature
```

---

# 15. Shared Sections Pattern

**Note**: This section demonstrates the shared sections pattern using examples like `TeamSection`, `TestimonialSection`, and `NewsletterSection`. These are illustrative examples showing the architectural pattern - NOT requirements to build these specific sections. Apply the pattern to whatever reusable page sections make sense for your application.

Shared sections are reusable page components that combine UI, data fetching, and consistent styling. They allow rapid page composition from tested, production-ready building blocks.

## 15.1 What Are Reusable Sections

**Sections are:**
- Self-contained page components (hero, team, testimonials, newsletter, etc.)
- Include their own data fetching logic
- Have consistent props interfaces
- Follow responsive design patterns
- Tested and production-ready

**Example sections you might build:**
- `TeamSection` - Display team members with photos/bios
- `TestimonialSection` - Rotating customer testimonials
- `NewsletterSection` - Email signup form
- `HeroSection` - Page header with CTA
- `CTASection` - Call-to-action block
- `LogoSection` - Partner/client logos

## 15.2 Section Composition Patterns

```typescript
// src/shared/sections/TeamSection.tsx
'use client'

import { useEffect, useState } from 'react'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  imageUrl: string
}

interface TeamSectionProps {
  title?: string
  subtitle?: string
  backgroundColor?: 'white' | 'gray' | 'blue'
}

export function TeamSection({
  title = 'Our Team',
  subtitle = 'Meet the people behind our success',
  backgroundColor = 'white',
}: TeamSectionProps) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeam() {
      const response = await fetch('/api/team')
      const data = await response.json()
      setTeam(data)
      setLoading(false)
    }
    fetchTeam()
  }, [])

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>
  }

  const bgClass = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
  }[backgroundColor]

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <div key={member.id} className="text-center">
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{member.role}</p>
              <p className="text-sm text-gray-700">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

## 15.3 How Features Consume Sections

```typescript
// src/features/about/components/AboutPage.tsx
import { TeamSection } from '@/shared/sections/TeamSection'
import { TestimonialSection } from '@/shared/sections/TestimonialSection'
import { NewsletterSection } from '@/shared/sections/NewsletterSection'

export function AboutPage() {
  return (
    <div>
      <section className="py-20 bg-blue-600 text-white text-center">
        <h1 className="text-5xl font-bold mb-4">About Us</h1>
        <p className="text-xl">Learn about our mission and team</p>
      </section>

      <TeamSection
        title="Leadership Team"
        subtitle="The visionaries behind our platform"
        backgroundColor="gray"
      />

      <TestimonialSection
        title="What Our Clients Say"
        backgroundColor="white"
      />

      <NewsletterSection
        title="Stay Updated"
        backgroundColor="blue"
      />
    </div>
  )
}
```

## 15.4 Section Conventions

**Props interface:**
- `title?: string` - Section heading (optional, with default)
- `subtitle?: string` - Section subheading (optional)
- `backgroundColor?: 'white' | 'gray' | 'blue'` - Background color (optional)
- Any section-specific props

**Styling:**
- Container: `container mx-auto px-4`
- Padding: `py-20` (top/bottom)
- Responsive: Mobile-first grid (`grid-cols-1 md:grid-cols-3`)
- Consistent spacing: `mb-4`, `mb-8`, `mb-12`

**Data fetching:**
- Client-side fetch in `useEffect`
- Loading state with spinner/skeleton
- Error handling with fallback UI

**Responsive:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3+ columns

---

## Sections 16-20 can be found in READ-THIS-FIRST-4.md