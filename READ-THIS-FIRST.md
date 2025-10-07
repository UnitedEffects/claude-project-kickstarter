# READ-THIS-FIRST.md

## Table of Contents

1. Complete Folder Structure
2. Core Setup & Configuration
3. Development Workflow
4. Testing Infrastructure
5. Architecture: Feature-Based Layer
6. Architecture: Domain-Driven Layer
7. Architecture: App Router Layer
8. Database & Data Models
9. Authentication & Authorization
10. OpenAPI & API Patterns
11. Middleware & Error Handling
12. Styling: Tailwind CSS v4
13. ESLint & Code Quality
14. Shared Resources
15. Shared Sections Pattern
16. Architectural Boundaries (CRITICAL)
17. Docker & Deployment
18. Local Development
19. Instrumentation Hooks
20. Model Context Protocol (MCP) Server (Optional)

## Overview

**Purpose**: Scaffolding guide for Claude Code to initialize new Next.js 15+ TypeScript projects using UEV Architecture Patterns.

**Target**: Claude Code AI assistant (directive, not explanatory)

**Context**: This document describes architectural patterns extracted utilized by United Effects Ventures R&D. Projects will naturally diverge and evolve - these are starting patterns, not rigid requirements.

---

## What Claude Code Should Do

This document is for the AI assistant, most likely Claude Code - references to "you" are specific to the LLM Claude Code currently reading this.

You are reading this because the user has asked you to or has explicitly run an initialization script like /init.

Do the following in response:

1. **Read this document completely** - Understand all architectural patterns, conventions, and structure from all sections
2. **Create a Documentation/** directory and add the below documents which you should populate with data based on your understanding of this document.
   - **FEATURES.md** (Section 5 - feature architecture patterns, PageLoader, client components)
   - **DOMAINS.md** (Section 6 - domain-driven design patterns, file structure, API patterns)
   - **AUTH.md** (Section 9 - authentication patterns, middleware, route protection, reference implementation)
   - **DB.md** (Section 8 - database patterns, connection management, reference implementation)
   - **SECTIONS.md** (Section 15 - reusable section component patterns and conventions)
   - **DESIGN.md** (Section 12 - styling system if using Tailwind, otherwise basic design patterns)
   - **MCP.md** (Section 20) - If integrating Model Context Protocol
   - **LOCAL-BUILD.md** (Section 18) - Local production testing patterns
   - **PROGRESS.md** - Session history tracking (if applicable)
3. **Create CLAUDE.md** - Project-specific instructions derived from this document, adapted to reference implementations, and make references to the /Documetnation/*.md files as needed so you aren't being redundant.
5. **Now interview the user** - Ask what they want to build or if they have a document they'd like to point you to with an overview. You could also suggest that they run the `project-kickoff` script (`node scripts/project-kickoff.js`) which will interactively create a package.json with essential project info. Ask questions until you have more context on their goals so you can apply the patterns of this document to them.
6. **Clarify stack choices** - Specify what stack this approach suggests for auth, database, styling (e.g., tailwind), etc., and get an ok from the user. Make adjustments if they want something different.
7. **Revise Claude.md and Build** - Make adjustments to the Documentation/*.md files and Claude.md - then scaffold the project following these patterns based on what you know.

### Here are some helpful todos to make sure you cover as you scaffold the project

- [ ] **Create base folder structure** (Section 1 - adapt based on project needs)
- [ ] **Initialize package manager** (yarn init or npm init based on user choice)
- [ ] **Install Next.js** with App Router and TypeScript
- [ ] **Install core dependencies** based on stack choices
- [ ] **Configure TypeScript** (Section 2 - tsconfig.json with strict mode, path aliases)
- [ ] **Configure Next.js** (Section 2 - next.config.js/mjs with appropriate settings)
- [ ] **Set up testing** (Section 4 - vitest.config.mts, setup files, test structure)
- [ ] **Configure ESLint** (Section 13 - pragmatic rules with targeted overrides)
- [ ] **Set up styling** (Section 12 - if Tailwind: globals.css with @theme, PostCSS config)
- [ ] **Create .env.example** (Section 2 - document all required environment variables)
- [ ] **Set up git workflow scripts** (Section 3 - commit.sh, push.sh with validation)
- [ ] **Wire scripts in package.json** (Section 2 & 3 - dev, build, test, lint, type-check, commit, push)
- [ ] **Create App Router structure** (Section 7 - layouts, middleware, basic routes)
- [ ] **Create first domain** (Section 6 - example domain showing full pattern)
- [ ] **Create first feature** (Section 5 - example feature consuming domain API)
- [ ] **Generate README.md** - Project-specific setup, architecture overview, and commands
- [ ] **Yarn Commit** - Use the yarn commit script for the first commit if approved by user
- [ ] **Validate everything** - Run dev server, tests, lint, type-check to ensure all systems work

---

## Important Notes

1. **Stack Specificity**: This guide is for **Next.js 15+ with TypeScript** projects only. Not applicable to other stacks, though it can be used as an architectural guide for other stacks.

2. **Reference Implementations**: This guide uses specific technologies as reference implementations:
   - **Auth**: Clerk (swappable - NextAuth.js, Auth0, Supabase Auth, custom JWT all viable)
   - **Database**: MongoDB + Mongoose (swappable - PostgreSQL + Prisma, Supabase, Drizzle, raw SQL all viable)
   - **Styling**: Tailwind CSS v4 (optional - any styling solution works)
   - **API**: OpenAPI-first with REST (adaptable - GraphQL, tRPC viable alternatives)

3. **Pattern Extraction**: When this guide shows Clerk auth patterns, extract the *architectural approach* (middleware, route protection, role-based access) and apply to your chosen solution.

4. **Project Divergence**: Projects naturally evolve beyond these patterns. This is expected and encouraged.

---

## Technology Stack

**Required (🟢 Essential):**
- Next.js 15+ (App Router)
- TypeScript (strict mode)
- React 19+
- Node.js 24.4.1+ (use nvm)
- Yarn 4+ package manager

**Recommended (🟡 Standard patterns):**
- Vitest + React Testing Library (testing)
- ESLint (code quality)
- MongoDB/Firestore via Mongoose (database, swappable)
- Clerk (authentication, swappable)
- Tailwind CSS v4 (styling, optional)

**Optional (🔵 Project-specific):**
- Model Context Protocol (MCP) integration
- Docker + Google Cloud Run (deployment)
- OpenAPI + Swagger (API documentation)
- LRU cache (API response caching)

---

## Architecture Philosophy

### What's Fixed
- **Layer separation**: App Router → Features → Domains → Database
- **Domain/Feature organization**: Clear boundaries, isolated concerns
- **TypeScript strict mode**: Type safety throughout
- **Testing approach**: TDD with unit + integration tests
- **Convention over configuration**: Standardized patterns

### What's Flexible
- Auth provider (Clerk, NextAuth, Auth0, custom)
- Database (MongoDB, PostgreSQL, Supabase, etc.)
- Styling approach (Tailwind, CSS Modules, styled-components, etc.)
- API patterns (REST, GraphQL, tRPC)
- Deployment target (Cloud Run, Vercel, AWS, self-hosted)

---

# 1. Complete Folder Structure

```
project-root/
├── .yarn/                          # Yarn 4 configuration
│   ├── releases/
│   └── plugins/
├── Documentation/                  # Project documentation (created during init)
│   ├── FEATURES.md                 # Feature architecture patterns
│   ├── DOMAINS.md                  # Domain-driven design patterns
│   ├── AUTH.md                     # Authentication implementation
│   ├── DB.md                       # Database patterns
│   ├── SECTIONS.md                 # Reusable section patterns
│   ├── DESIGN.md                   # Styling system
│   ├── MCP.md                      # Model Context Protocol integration
│   ├── LOCAL-BUILD.md              # Local production testing
│   └── PROGRESS.md                 # Session history tracking
├── mcp-server/                     # Optional: Custom MCP server
│   ├── index.js
│   ├── tools/
│   └── schemas/
├── public/                         # Static assets
│   ├── images/
│   └── favicon.ico
├── scripts/                        # Build and utility scripts
│   ├── build-standalone.sh         # Local production build helper
│   ├── compile-section-registry.ts # Section loader generator
│   ├── generate-section-loader.ts  # Section loader generator (legacy)
│   ├── commit.sh                   # Git commit with validation
│   └── push.sh                     # Git push with checks
└── src/
    ├── app/                        # Next.js App Router (thin wrappers only)
    │   ├── (public)/               # Optional: Public route group
    │   │   └── [feature]/          # Feature routes (e.g., about/, contact/)
    │   │       └── page.tsx
    │   ├── [feature]/              # Feature routes (e.g., admin/, dashboard/)
    │   │   └── page.tsx
    │   ├── api/                    # API routes (thin callers to domains)
    │   │   ├── health/
    │   │   │   └── route.ts        # Health check endpoint
    │   │   ├── [domain]/           # Domain API routes
    │   │   │   ├── route.ts        # GET, POST
    │   │   │   └── [id]/
    │   │   │       └── route.ts    # GET, PATCH, DELETE
    │   │   └── docs/               # Optional: OpenAPI docs endpoint
    │   │       └── route.ts
    │   ├── layout.tsx              # Root layout
    │   ├── globals.css             # Global styles (Tailwind imports)
    │   ├── providers.tsx           # Optional: Client providers wrapper
    │   └── error.tsx               # Global error boundary
    ├── domains/                    # Business logic layer (UI-agnostic)
    │   └── [domain]/               # Your domain directories
    │       ├── api.ts              # HTTP handlers (export functions for App Router)
    │       ├── logic.ts            # Business logic (validation, orchestration)
    │       ├── dal.ts              # Data access layer (database queries)
    │       ├── models.ts           # Database schemas + TypeScript types
    │       ├── schema.ts           # OpenAPI schemas (request/response DTOs)
    │       ├── __tests__/          # Domain tests
    │       │   ├── logic.test.ts
    │       │   └── dal.test.ts
    │       └── index.ts            # Public exports
    ├── features/                   # UI/presentation layer
    │   └── [feature]/              # Your feature directories
    │       ├── components/         # React components (server + client)
    │       │   └── FeaturePage.tsx
    │       ├── hooks/              # Client-side hooks (use client)
    │       │   └── useFeature.ts
    │       ├── controllers/        # Server-side data fetching
    │       │   └── controller.ts
    │       ├── utils/              # Feature-specific utilities
    │       │   └── helpers.ts
    │       ├── __tests__/          # Feature tests
    │       │   ├── components.test.tsx
    │       │   └── hooks.test.ts
    │       └── index.ts            # Public exports
    ├── shared/                     # ONLY if used by 2+ features/domains
    │   ├── components/             # Shared UI components
    │   │   └── PageLoader.tsx      # Loading state component (required pattern)
    │   ├── hooks/                  # Shared hooks
    │   ├── controllers/            # Shared data controllers
    │   ├── schemas/                # Shared OpenAPI schemas
    │   │   └── api.ts              # CommonObjectMeta, JsonPatchDocument, Error
    │   ├── types/                  # Shared TypeScript types
    │   │   └── common.ts           # JsonPatchOp, ListOptions, PaginationInfo
    │   ├── utils/                  # Shared utilities
    │   │   ├── odata.ts            # OData query parameter extraction and parsing
    │   │   └── site-metadata.ts    # Site metadata generation for root layout
    │   ├── sections/               # Reusable page sections (see SECTIONS.md)
    │   └── __tests__/              # Shared component tests
    ├── lib/                        # External library configs & utilities
    │   ├── auth/                   # Auth utilities (route wrappers, middleware)
    │   │   └── index.ts            # withAuth, withRole, withPublic patterns
    │   ├── api/                    # API utilities
    │   │   └── cache-wrapper.ts    # Optional: LRU cache for responses
    │   ├── db.ts                   # Database connection
    │   ├── errors/                 # Error handling
    │   │   └── index.ts            # Error handler utilities
    │   ├── responses/              # Response utilities
    │   │   └── say.ts              # Consistent response helpers
    │   ├── openapi/                # OpenAPI configuration
    │   │   └── spec.ts             # Central OpenAPI spec aggregator
    │   └── __tests__/              # Library utility tests
    ├── types/                      # Global TypeScript types
    │   └── index.ts
    ├── instrumentation.ts          # Optional: Next.js instrumentation hooks
    └── middleware.ts               # Next.js middleware (auth, headers, etc.)

# Root-level config files
├── CLAUDE.md                       # Project-specific Claude Code instructions
├── .mcp.json                       # Optional: MCP server configuration
├── .env.example                    # Environment variable template
├── .env.local                      # Development environment (gitignored)
├── .env.production.local           # Local production testing (gitignored)
├── .gitignore
├── .eslintrc.json                  # ESLint configuration
├── package.json                    # Package manifest with scripts
├── yarn.lock                       # Yarn lockfile
├── .yarnrc.yml                     # Yarn 4 configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.mjs                 # Next.js configuration
├── vitest.config.mts               # Vitest configuration (.mts for ESM)
├── postcss.config.mjs              # PostCSS for Tailwind (if using)
├── commit.sh                       # Git commit script (chmod +x)
├── push.sh                         # Git push script (chmod +x)
├── Dockerfile                      # Optional: Multi-stage Docker build
├── docker-compose.yml              # Optional: Local database
└── README.md                       # Project documentation
```

---

# 2. Core Setup & Configuration

## 2.1 Package.json

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:standalone": "./scripts/build-standalone.sh",
    "clean": "rm -rf .next",
    "start": "node .next/standalone/server.js",
    "start:local": "dotenv -e .env.production.local -- node .next/standalone/server.js",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "commit": "./scripts/commit.sh",
    "push": "./scripts/push.sh"
  },
  "dependencies": {
    "next": "^15.4.7",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "mongoose": "^8.16.5",
    "@clerk/nextjs": "^6.27.1",
    "@hapi/boom": "^10.0.1",
    "lru-cache": "^11.1.0",
    "fast-json-patch": "^3.1.1",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^24.1.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "typescript": "^5.8.3",
    "@vitejs/plugin-react": "^4.7.0",
    "@vitest/ui": "^3.2.4",
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.4",
    "eslint": "^9.32.0",
    "eslint-config-next": "^15.4.4",
    "tailwindcss": "^4.1.11",
    "@tailwindcss/postcss": "^4.1.11",
    "postcss": "^8.5.6",
    "dotenv-cli": "^10.0.0"
  },
  "packageManager": "yarn@4.9.4"
}
```

## 2.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 2.3 Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['storage.googleapis.com', 'localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    instrumentationHook: true,
  },
}

module.exports = nextConfig
```

## 2.4 Environment Variables

```bash
# .env.example
# Node Environment
NODE_ENV=development

# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Application URLs
NEXT_PUBLIC_POST_HOST=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 2.5 Node Version Management

```bash
# .nvmrc
24.4.1
```

**Usage:**
```bash
nvm use
```

---

# 3. Development Workflow

## 3.1 Git Workflow Scripts

### Commit Script (commit.sh)

```bash
#!/bin/bash
# Runs tests, lint, and type-check before committing

set -e

if [ -z "$1" ]; then
  echo "Error: Commit message required"
  echo "Usage: ./commit.sh \"your commit message\""
  exit 1
fi

echo "Running tests..."
yarn test --run

echo "Running lint..."
yarn lint

echo "Running type-check..."
yarn type-check

echo "All checks passed! Committing..."
git add .
git commit -m "$1"

echo "✅ Committed successfully"
```

### Push Script (push.sh)

```bash
#!/bin/bash
# Prevents direct pushes to main, runs checks

set -e

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ Cannot push directly to $BRANCH"
  echo "Create a feature branch instead:"
  echo "  git checkout -b feature/your-feature"
  exit 1
fi

echo "Running final checks before push..."
yarn test --run
yarn lint
yarn type-check

echo "Pushing to origin/$BRANCH..."
git push -u origin "$BRANCH"

echo "✅ Pushed successfully"
```

**Make executable:**
```bash
chmod +x scripts/commit.sh scripts/push.sh
```

## 3.2 Package Management Rules

**CRITICAL**: Always use `yarn`, NEVER use `npm`.

```bash
# ✅ Correct
yarn add package-name
yarn remove package-name
yarn install

# ❌ Wrong
npm install package-name
npm uninstall package-name
npm install
```

## 3.3 Custom Scripts

### Standalone Build Script (build-standalone.sh)

```bash
#!/bin/bash
# Builds Next.js standalone output and copies static files

set -e

echo "Building Next.js with standalone output..."
yarn build

echo "Copying public directory to standalone..."
cp -r public .next/standalone/

echo "Copying static files to standalone..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

echo "✅ Standalone build complete!"
echo "Run with: yarn start:local"
```

## 3.4 Development Commands

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Test production build locally
yarn clean && yarn build:standalone && yarn start:local

# Run tests
yarn test              # Run once
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage

# Code quality
yarn lint              # ESLint
yarn type-check        # TypeScript

# Git workflow
yarn commit "message"  # Commit with validation
yarn push             # Push with validation
```

---

# 4. Testing Infrastructure

## 4.1 Vitest Configuration

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/lib/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/lib/test/',
        '**/*.config.*',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## 4.2 Vitest Setup File

```typescript
// src/lib/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_POST_HOST = 'http://localhost:3000'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

## 4.3 Test Directory Structure

```
src/
├── domains/
│   └── [domain]/
│       └── __tests__/
│           ├── logic.test.ts
│           └── dal.test.ts
└── features/
    └── [feature]/
        └── __tests__/
            ├── FeaturePage.test.tsx
            └── hooks.test.ts
```

**DO NOT** create `src/app/__tests__/` - tests belong in their respective domains or features.

## 4.4 Testing Library Setup

**Testing approach:**
- **Unit tests**: Domain logic, DAL functions, hooks
- **Integration tests**: API routes, full feature flows
- **Component tests**: React components with user interactions

**Example test** (using "posts" domain as illustration - not a requirement to build):
```typescript
// src/domains/[domain]/logic.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { DomainLogic } from './logic'

describe('DomainLogic', () => {
  beforeEach(async () => {
    // Setup test database
  })

  it('should create a record', async () => {
    const record = await DomainLogic.create({
      name: 'Test Record',
      data: 'Test data',
      userId: 'user123'
    })

    expect(record.name).toBe('Test Record')
    expect(record.id).toBeTruthy()
  })
})
```

## 4.5 TDD Approach & Puppeteer Validation

**Workflow:**

1. **Large features**: Write failing tests → Build to pass → Refactor
2. **Small changes**: Build → Write tests immediately after
3. **All features**: Validate with Puppeteer after implementation

**Puppeteer validation** (via MCP plugin):
```typescript
// After building feature, validate with Puppeteer
// 1. Navigate to page
await puppeteer_navigate({ url: 'http://localhost:3000/your-feature' })

// 2. Take screenshot
await puppeteer_screenshot({ name: 'feature-page' })

// 3. Test interactions
await puppeteer_click({ selector: 'button[aria-label="Submit"]' })
await puppeteer_fill({ selector: 'input[name="email"]', value: 'test@example.com' })

// 4. Verify elements
await puppeteer_evaluate({
  script: 'document.querySelector("h1").textContent'
})
```

---

# 5. Architecture: Feature-Based Layer

Features contain **UI and presentation logic**. They orchestrate domains but never contain business logic.

## 5.1 Feature Directory Structure

```
src/features/[feature]/
├── components/          # React components
│   ├── FeaturePage.tsx  # Main component (server component)
│   ├── ClientComponent.tsx   # Client component
│   └── Section.tsx
├── hooks/               # Client-side hooks (must use 'use client')
│   ├── useFeature.ts
│   └── useFeatureAction.ts
├── controllers/         # Server-side data fetching
│   └── controller.ts
├── utils/               # Feature-specific utilities
│   └── helpers.ts
├── __tests__/           # Feature tests
│   ├── FeaturePage.test.tsx
│   └── hooks.test.ts
└── index.ts             # Public exports
```

## 5.2 Feature Subdirectories

**components/**: React components (server or client)
- Server components by default
- Client components marked with `'use client'`
- No direct domain imports allowed

**hooks/**: Client-side React hooks
- Always `'use client'`
- Call APIs via fetch, never import domain logic
- Handle loading states, errors, local state

**controllers/**: Server-side data fetching
- Fetch from domain APIs (internal fetch)
- Transform data for UI consumption
- Handle errors, return consistent shapes

**utils/**: Feature-specific utilities
- Formatters, validators, helpers
- Only used within this feature

**models/**: Feature-specific types
- UI state types, form types
- Distinct from domain types

## 5.3 Feature Exports (index.ts)

```typescript
// src/features/[feature]/index.ts
export { FeaturePage } from './components/FeaturePage'
export { useFeature } from './hooks/useFeature'
export { controller } from './controllers/controller'
```

## 5.4 Feature-to-Domain Communication

**✅ CORRECT - Features use APIs:**
```typescript
// src/features/[feature]/hooks/useFeature.ts
// Example: "posts" is a domain, not a requirement
'use client'

export function useFeature() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchItems() {
      const response = await fetch('/api/[domain]')
      const data = await response.json()
      setItems(data)
      setLoading(false)
    }
    fetchItems()
  }, [])

  return { items, loading }
}
```

**❌ FORBIDDEN - Direct domain imports:**
```typescript
// ❌ NEVER DO THIS
import { DomainLogic } from '@/domains/[domain]/logic'
```

## 5.5 Client Components with Hooks Pattern

**Server Component (default):**
```typescript
// src/features/[feature]/components/FeaturePage.tsx
import { controller } from '../controllers/controller'
import { ClientComponent } from './ClientComponent'

export async function FeaturePage() {
  const data = await controller.getData()

  return (
    <div>
      <ClientComponent data={data} />
    </div>
  )
}
```

**Client Component:**
```typescript
// src/features/[feature]/components/ClientComponent.tsx
'use client'

import { useFeature } from '../hooks/useFeature'

export function ClientComponent({ data }) {
  const { handleAction, loading } = useFeature()

  return (
    <section>
      <h1>{data.title}</h1>
      <button onClick={handleAction} disabled={loading}>
        Submit
      </button>
    </section>
  )
}
```

## 5.6 PageLoader Pattern (Prevent FOUC)

**REQUIRED pattern for all pages:**

```typescript
// src/features/[feature]/components/FeaturePage.tsx
'use client'

import { useState, useEffect } from 'react'
import { PageLoader } from '@/shared/components/PageLoader'
import { useFeaturePage } from '../hooks/useFeaturePage'

export function FeaturePage() {
  const [isLoading, setIsLoading] = useState(true)
  const { data, loading: dataLoading } = useFeaturePage()

  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false)
    }
  }, [dataLoading])

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      {/* Page content */}
    </div>
  )
}
```

**PageLoader component:**
```typescript
// src/shared/components/PageLoader.tsx
export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
}
```

---

# 6. Architecture: Domain-Driven Layer

Domains contain **business logic and data access**. They are UI-agnostic and testable in isolation.

**Note**: The following examples use "posts" as an illustrative domain with fields like `title`, `slug`, `content`, `authorId`, and `published`. This is NOT a requirement to build a posts system - it's simply demonstrating the domain architecture pattern. Replace with your actual domain entities.

## 6.1 Domain Directory Structure

```
src/domains/[domain]/
├── api.ts               # HTTP handlers (exported for App Router)
├── logic.ts             # Business logic (validation, orchestration)
├── dal.ts               # Data access layer (database queries)
├── models.ts            # Database schemas + TypeScript types
├── schema.ts            # OpenAPI schemas (request/response DTOs)
├── __tests__/           # Domain tests
│   ├── logic.test.ts
│   ├── dal.test.ts
│   └── api.test.ts
└── index.ts             # Public exports
```

## 6.2 Domain File Architecture

### api.ts - HTTP Handlers

```typescript
// Example using "posts" domain - not a requirement
// src/domains/[domain]/api.ts
import { NextRequest } from 'next/server'
import { withAuth, withRole } from '@/lib/auth'
import { say, sayError } from '@/lib/responses/say'
import { PostsLogic } from './logic'

async function listHandler(req: NextRequest) {
  try {
    const posts = await PostsLogic.getAll()
    return say(posts)
  } catch (error) {
    return sayError(error.message, 500)
  }
}

async function createHandler(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const body = await req.json()

  try {
    const post = await PostsLogic.create({ ...body, authorId: userId })
    return say(post, 201)
  } catch (error) {
    return sayError(error.message, 400)
  }
}

// Export handlers for App Router
export const postsApi = {
  list: withAuth(listHandler),
  create: withRole(['admin'], createHandler),
}
```

### logic.ts - Business Logic

```typescript
// src/domains/posts/logic.ts
import { PostsDal } from './dal'
import { Post } from './models'

export const PostsLogic = {
  async getAll(): Promise<Post[]> {
    return PostsDal.getAll()
  },

  async create(data: CreatePostDto): Promise<Post> {
    // Validation
    if (!data.title || data.title.length < 3) {
      throw new Error('Title must be at least 3 characters')
    }

    // Generate slug
    const slug = data.title.toLowerCase().replace(/\s+/g, '-')

    // Create post
    return PostsDal.create({ ...data, slug })
  },

  async getBySlug(slug: string): Promise<Post | null> {
    return PostsDal.getBySlug(slug)
  },
}
```

### dal.ts - Data Access Layer

```typescript
// src/domains/posts/dal.ts
import { PostModel, Post } from './models'
import connectDB from '@/lib/db'

export const PostsDal = {
  async getAll(): Promise<Post[]> {
    await connectDB()
    return PostModel.find({ published: true }).sort({ createdAt: -1 })
  },

  async create(data: CreatePostData): Promise<Post> {
    await connectDB()
    const post = new PostModel(data)
    return post.save()
  },

  async getBySlug(slug: string): Promise<Post | null> {
    await connectDB()
    return PostModel.findOne({ slug })
  },

  async getById(id: string): Promise<Post | null> {
    await connectDB()
    return PostModel.findOne({ id })
  },
}
```

### models.ts - Mongoose Schemas

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
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PostDocument extends Omit<Post, 'id'>, Document {
  _id: string
}

const PostSchema = new Schema<PostDocument>({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  published: { type: Boolean, default: false },
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

export const PostModel = mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema)
```

### schema.ts - OpenAPI Schemas

```typescript
// src/domains/posts/schema.ts
import { commonSchemas } from '@/shared/schemas/api'

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
      title: { type: 'string', minLength: 3 },
      content: { type: 'string' },
      published: { type: 'boolean', default: false },
    },
    required: ['title', 'content'],
  },
}

export const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List all posts',
      responses: {
        200: {
          description: 'List of posts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Post' },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a post',
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
          description: 'Post created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
}
```

## 6.3 Domain Exports (index.ts)

```typescript
// src/domains/posts/index.ts
export { postsApi } from './api'
export { PostsLogic } from './logic'
export { PostsDal } from './dal'
export { PostModel } from './models'
export type { Post, PostDocument } from './models'
```

## 6.4 Single-Record Pattern

For app-wide configuration domains (e.g., site settings):

```typescript
// src/domains/site/dal.ts
export const SiteDal = {
  async get(): Promise<SiteConfig | null> {
    await connectDB()
    return SiteConfigModel.findOne({}) // Empty filter - only one document
  },

  async update(data: Partial<SiteConfig>): Promise<SiteConfig> {
    await connectDB()
    return SiteConfigModel.findOneAndUpdate(
      {},  // Empty filter
      { $set: data },
      { new: true, upsert: true }
    )
  },
}
```

## 6.5 Multi-Record Pattern with Pagination

```typescript
// src/domains/posts/logic.ts
export const PostsLogic = {
  async list(options: ListOptions): Promise<PaginatedResponse<Post>> {
    const { skip = 0, top = 20, filter, orderby, search } = options

    const posts = await PostsDal.list({ skip, top, filter, orderby, search })
    const total = await PostsDal.count({ filter, search })

    return {
      data: posts,
      pagination: {
        total,
        skip,
        top,
        hasMore: skip + posts.length < total,
      },
    }
  },
}
```

## 6.6 Data Access Layer Patterns

**Pattern: Connection per operation**
```typescript
export const PostsDal = {
  async getAll(): Promise<Post[]> {
    await connectDB()  // Establish connection (cached)
    return PostModel.find()
  },
}
```

**Pattern: Error handling**
```typescript
export const PostsDal = {
  async getById(id: string): Promise<Post> {
    await connectDB()
    const post = await PostModel.findOne({ id })
    if (!post) {
      throw Boom.notFound('Post not found')
    }
    return post
  },
}
```

---

# 7. Architecture: App Router Layer

App Router pages are **thin wrappers** (<5 lines) that import features or wire domain APIs.

## 7.1 App Router as Thin Wrapper

**✅ CORRECT - Page imports feature:**
```typescript
// src/app/page.tsx
import { HomePage } from '@/features/home'

export default function Page() {
  return <HomePage />
}
```

**❌ WRONG - Logic in page:**
```typescript
// src/app/page.tsx
export default async function Page() {
  // ❌ Business logic doesn't belong here
  const db = await connectDB()
  const posts = await db.collection('posts').find().toArray()
  return <div>{/* ... */}</div>
}
```

## 7.2 Route Groups

**Public routes** (no auth):
```
src/app/(public)/
├── page.tsx              # Home
├── about/
│   └── page.tsx
├── blog/
│   └── [slug]/
│       └── page.tsx
└── layout.tsx            # Public layout
```

**Protected routes** (require auth):
```
src/app/(protected)/
├── dashboard/
│   └── page.tsx
├── settings/
│   └── page.tsx
└── layout.tsx            # Auth wrapper layout
```

**Protected layout:**
```typescript
// src/app/(protected)/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
```

## 7.3 API Route Structure

**API routes MUST import domain API handlers:**

```typescript
// Example using "posts" domain - replace with your domain
// src/app/api/[domain]/route.ts
import { domainApi } from '@/domains/[domain]/api'

export const GET = domainApi.list
export const POST = domainApi.create
```

**Dynamic routes:**
```typescript
// src/app/api/[domain]/[id]/route.ts
import { domainApi } from '@/domains/[domain]/api'

export const GET = domainApi.getById
export const PATCH = domainApi.update
export const DELETE = domainApi.delete
```

**Next.js 15 params format:**
```typescript
// src/app/api/[domain]/[id]/route.ts
import { NextRequest } from 'next/server'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Await params Promise
  // ... use id
}

export const GET = withAuth(handler)
```

## 7.4 Dynamic Routes and Catch-All

**Dynamic segment:**
```
src/app/[feature]/[slug]/page.tsx
```

```typescript
export default async function DetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ... fetch data by slug
}
```

**Catch-all route:**
```
src/app/docs/[...slug]/page.tsx
```

```typescript
export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const path = slug.join('/')
  // ... fetch doc by path
}
```

## 7.5 Layout and Metadata

**Site-wide metadata utilities:**

```typescript
// src/shared/utils/site-metadata.ts
import { Metadata, Viewport } from 'next'
import siteLogic from '@/domains/site/logic'

/**
 * Generates site-wide metadata from the site domain configuration.
 * Falls back to environment variables if database is unavailable.
 * Used by the root layout for default metadata across all pages.
 */
export async function generateSiteMetadata(): Promise<Metadata> {
  try {
    const metadata = await siteLogic.getMetadata()
    const { themeColor: _themeColor, ...cleanMetadata } = metadata as any
    return cleanMetadata
  } catch {
    return {}  // Fallback to empty if site domain unavailable
  }
}

/**
 * Generates site-wide viewport configuration from the site domain.
 */
export async function generateSiteViewport(): Promise<Viewport> {
  try {
    const metadata = await siteLogic.getMetadata() as any
    return {
      ...(metadata?.themeColor && { themeColor: metadata.themeColor }),
      width: 'device-width',
      initialScale: 1,
    }
  } catch {
    return {
      width: 'device-width',
      initialScale: 1,
    }
  }
}
```

**Root layout with dynamic metadata:**

```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { generateSiteMetadata, generateSiteViewport } from '@/shared/utils/site-metadata'
import './globals.css'

// Generate metadata from site domain (or use static metadata)
export const metadata = await generateSiteMetadata()
export const viewport = await generateSiteViewport()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**Dynamic metadata:**

**Note**: This example uses a "blog" feature with "posts" API to demonstrate metadata generation - not a requirement to build a blog system.

```typescript
// src/app/blog/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await fetch(`/api/posts/${slug}`).then(r => r.json())

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

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
  const userId = req.headers.get('x-user-id')!  // From auth middleware
  const body = await req.json()

  const post = await PostsLogic.create({
    ...body,
    createdBy: userId,
    modifiedBy: userId,
  })

  return say(post, 201)
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

## 9.3 Auth Header Injection for APIs

```typescript
// Middleware injects x-user-id header
if (req.nextUrl.pathname.startsWith('/api')) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', userId)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}
```

**Usage in API handlers:**
```typescript
// src/domains/posts/api.ts
async function createHandler(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!  // Guaranteed by middleware
  // ... use userId
}
```

## 9.4 Auth Context Utilities

**Helper functions to extract auth info from injected headers:**

```typescript
// src/lib/auth/index.ts
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import Boom from '@hapi/boom'

export interface AuthContext {
  userId: string | null
  sessionId: string | null
  role: string | null
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

/**
 * Get auth context directly from Clerk (useful for pages/components)
 * This bypasses the middleware headers and gets fresh data
 */
export async function getAuthContextDirect(): Promise<AuthContext> {
  const authState = await auth()

  return {
    userId: authState.userId,
    sessionId: authState.sessionId,
    role: getRoleFromSessionClaims(authState.sessionClaims) ?? null,
  }
}

/**
 * Require authentication or throw an error
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext()

  if (!auth.userId) {
    throw Boom.unauthorized('Authentication required')
  }

  return auth
}

/**
 * Get optional auth context without requiring authentication
 * Useful for endpoints with different behavior for authenticated vs anonymous users
 */
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

**Usage in domain logic:**

```typescript
// src/domains/[domain]/logic.ts
import { getAuthContext, requireAuth } from '@/lib/auth'

export const DomainLogic = {
  async create(data: CreateDto) {
    const { userId } = await requireAuth()  // Throws if not authenticated

    return DomainDal.create({
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    })
  },

  async list() {
    const auth = await getOptionalAuthContext()

    // Different behavior based on auth state
    if (auth.isAuthenticated) {
      return DomainDal.listAll()
    } else {
      return DomainDal.listPublic()
    }
  }
}
```

## 9.5 Route Wrappers

```typescript
// src/lib/auth/route-wrappers.ts
import { NextRequest } from 'next/server'
import { sayError } from '@/lib/responses/say'

export function withAuth<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const [req] = args as [NextRequest]
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return sayError('Unauthorized', 401)
    }

    return handler(...args)
  }) as T
}

export function withRole<T extends (...args: any[]) => any>(
  roles: string[],
  handler: T
): T {
  return (async (...args: any[]) => {
    const [req] = args as [NextRequest]
    const userId = req.headers.get('x-user-id')
    const userRoles = req.headers.get('x-user-roles')?.split(',') || []

    if (!userId) {
      return sayError('Unauthorized', 401)
    }

    const hasRole = roles.some(role => userRoles.includes(role))
    if (!hasRole) {
      return sayError('Forbidden: Insufficient permissions', 403)
    }

    return handler(...args)
  }) as T
}

export function withPublic<T extends (...args: any[]) => any>(handler: T): T {
  return handler  // No auth check
}

export function withOptionalAPIAuth<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: any[]) => {
    // Allow both authenticated and unauthenticated requests
    // Handler can check for x-user-id to provide different responses
    return handler(...args)
  }) as T
}
```

**Usage:**
```typescript
// src/domains/posts/api.ts
export const postsApi = {
  list: withAuth(listHandler),              // Requires auth
  create: withRole(['admin'], createHandler), // Requires admin role
  getPublic: withPublic(getPublicHandler),   // Public endpoint
}
```

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

**OData utilities:**

```typescript
// src/shared/utils/odata.ts
import { createQuery } from 'odata-v4-mongodb'
import Boom from '@hapi/boom'

export interface IODataParams {
  $filter?: string
  $select?: string
  $skip?: string | number
  $top?: string | number
  $orderby?: string
  $search?: string
}

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

**Usage in API routes:**

```typescript
// src/domains/[domain]/api.ts
import { extractODataParams } from '@/shared/utils/odata'

async function listHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const odataParams = extractODataParams(searchParams)

  const skip = parseInt(odataParams.$skip as string || '0')
  const top = parseInt(odataParams.$top as string || '20')

  const items = await DomainLogic.list({
    filter: odataParams.$filter,
    orderby: odataParams.$orderby,
    skip,
    top
  })
  return say(items)
}
```

**Example queries:**
```bash
# Filter by author
GET /api/posts?$filter=authorId eq 'user123'

# Order by date descending
GET /api/posts?$orderby=createdAt desc

# Pagination
GET /api/posts?$skip=20&$top=20

# Combined
GET /api/posts?$filter=published eq true&$orderby=createdAt desc&$top=10
```

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

## 11.2 Say Pattern for Error Responses

```typescript
// src/lib/responses/say.ts
import { NextResponse } from 'next/server'

export function say(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function sayError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}

export function saySuccess(message: string, data?: unknown) {
  return NextResponse.json(
    {
      success: true,
      message,
      ...(data && { data }),
    },
    { status: 200 }
  )
}
```

**Usage in API handlers:**
```typescript
// src/domains/posts/api.ts
async function listHandler(req: NextRequest) {
  try {
    const posts = await PostsLogic.getAll()
    return say(posts)
  } catch (error) {
    if (Boom.isBoom(error)) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Internal server error', 500)
  }
}
```

## 11.3 Global Error Handler Setup

**API error handling (using handleError in routes):**

```typescript
// src/domains/[domain]/api.ts
import { handleError } from '@/lib/errors/handler'
import { say } from '@/lib/responses/say'

async function listHandler(req: NextRequest) {
  try {
    const items = await DomainLogic.getAll()
    return say(items)
  } catch (error) {
    return handleError(error)  // ✅ Catches Boom errors and generic errors
  }
}

export const domainApi = {
  list: withPublic(listHandler),
  // ... other handlers
}
```

**Client-side error boundary:**

```typescript
// src/app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

## 11.4 API Response Utilities

```typescript
// src/lib/responses/say.ts
export function say(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function sayError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

export function saySuccess(message: string, data?: unknown) {
  return NextResponse.json({ success: true, message, data }, { status: 200 })
}

export function sayNotFound(resource: string) {
  return sayError(`${resource} not found`, 404)
}

export function sayForbidden(message = 'Forbidden') {
  return sayError(message, 403)
}

export function sayUnauthorized(message = 'Unauthorized') {
  return sayError(message, 401)
}
```

## 11.5 Response Caching with LRU Cache (Optional)

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
  const items = await DomainLogic.getAll()
  return say(items)
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

  return say(item)
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
## 11.6 OpenAPI Documentation Endpoint

**Any REST API should provide OpenAPI documentation for developers to understand and test endpoints.**

**Prerequisites**: Complete Section 10.3a to create `src/lib/openapi/spec.ts` with `getOpenAPISpec()` function that assembles your domain schemas.

### Serving the OpenAPI Spec

```typescript
// src/app/api/openapi/spec/route.ts
import { getOpenAPISpec } from '@/lib/openapi/spec'

export async function GET() {
  // Optional: disable in production for security
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 })
  }

  const spec = getOpenAPISpec()
  return Response.json(spec)
}
```

```typescript
// src/app/api/openapi/route.ts
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  // Optional: disable in production
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const htmlPath = path.join(process.cwd(), 'src/app/api/openapi/swagger.html')
    const html = await fs.readFile(htmlPath, 'utf-8')

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
```

### Swagger UI HTML

```html
<!-- src/app/api/openapi/swagger.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/openapi/spec",
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

**Access the documentation:**
- Swagger UI: `http://localhost:3000/api/openapi`
- JSON spec: `http://localhost:3000/api/openapi/spec`

**Benefits:**
- Interactive API testing directly from documentation
- Auto-generated from domain schemas (single source of truth)
- Shows all endpoints, parameters, request/response schemas
- Built-in authentication testing with bearer tokens

---

## 11.7 File Upload Handling

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

## 17.6 Health Check Implementation

**Container health check for orchestrators:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {if (r.statusCode !== 200) throw new Error()})" || exit 1
```

**Health check endpoint:**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
```

**Options explained:**
- `--interval=30s`: Check every 30 seconds
- `--timeout=3s`: Fail if check takes > 3 seconds
- `--start-period=5s`: Grace period on startup
- `--retries=3`: Mark unhealthy after 3 failures

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

